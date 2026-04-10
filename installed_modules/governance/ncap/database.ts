/**
 * NCAP Database Manager
 * Handles all database operations for NCAP system
 * Per Constitution Rules 49, 76(1)(v), and 21A (documentation requirements)
 */

import Database from 'better-sqlite3';
import {
  NcapSubmission,
  NcapVote,
  NcapAuditLog,
  NcapStatus,
  GantryState,
  VoteType,
  ApproverPool,
  TimerCalculation,
  NcapSubmissionRequest
} from './types';
import { calculateDynamicTimer } from './calculator';

export class NcapDatabaseManager {
  private db: Database.Database;

  constructor(db: Database.Database) {
  // Static fallback instance
  private static instance: Database.Database | null = null;

  // Set the global database (called from bot)
  public static setGlobalDatabase(db: Database.Database): void {
    NcapDatabaseManager.instance = db;
  }

  constructor(db?: Database.Database) {
    if (db) {
      this.db = db;
    } else if (NcapDatabaseManager.instance) {
      this.db = NcapDatabaseManager.instance;
    } else {
      // Fallback for testing
      this.db = new Database(':memory:');
    }
    this.initializeTables();
  }

  /**
   * Initialize NCAP database tables
   * Per Rule 76(3)(b) - complete data model
   */
  private initializeTables(): void {
    // Main NCAP submissions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ncap_submissions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        proposer_id TEXT NOT NULL,
        proposer_name TEXT NOT NULL,
        
        -- Approver pool (stored as JSON)
        approver_pool_type TEXT NOT NULL,
        approver_pool_name TEXT NOT NULL,
        approver_pool_member_ids TEXT NOT NULL,
        
        -- Timer configuration
        initial_timer_minutes INTEGER NOT NULL,
        urgency TEXT NOT NULL,
        
        -- Financial (optional)
        spending_amount REAL,
        budget_category TEXT,
        
        -- Supporting information
        rationale TEXT,
        links TEXT,
        
        -- Status and timing
        status TEXT NOT NULL DEFAULT 'pending',
        submitted_at INTEGER NOT NULL,
        expires_at INTEGER,
        resolved_at INTEGER,
        
        -- Current timer state (stored as JSON)
        timer_calculation TEXT NOT NULL,
        
        -- Resolution
        outcome TEXT,
        outcome_reason TEXT,
        escalation_committee_decision TEXT,
        
        -- Discord integration
        channel_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        thread_id TEXT,
        
        -- Metadata
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Votes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ncap_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        vote_type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        
        FOREIGN KEY (post_id) REFERENCES ncap_submissions(id),
        UNIQUE(post_id, user_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_ncap_votes_post_id ON ncap_votes(post_id);
      CREATE INDEX IF NOT EXISTS idx_ncap_votes_user_id ON ncap_votes(user_id);
    `);

    // Audit log table per Rule 76(1)(v)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ncap_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        actor_id TEXT,
        actor_name TEXT,
        timestamp INTEGER NOT NULL,
        details TEXT,
        previous_state TEXT,
        new_state TEXT,
        
        FOREIGN KEY (post_id) REFERENCES ncap_submissions(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_ncap_audit_post_id ON ncap_audit_log(post_id);
      CREATE INDEX IF NOT EXISTS idx_ncap_audit_timestamp ON ncap_audit_log(timestamp);
      CREATE INDEX IF NOT EXISTS idx_ncap_audit_event_type ON ncap_audit_log(event_type);
    `);

    // Financial transactions table per Rule 50
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ncap_financial_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id TEXT NOT NULL,
        amount REAL NOT NULL,
        budget_category TEXT NOT NULL,
        receipt_url TEXT,
        transaction_date INTEGER,
        notes TEXT,
        
        FOREIGN KEY (post_id) REFERENCES ncap_submissions(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_ncap_financial_post_id ON ncap_financial_transactions(post_id);
    `);
  }

  /**
   * Generate unique NCAP ID
   * Format: NCAP-YYYY-NNN per constitution examples
   */
  generateNcapId(): string {
    const year = new Date().getFullYear();
    
    const stmt = this.db.prepare(`
      SELECT id FROM ncap_submissions 
      WHERE id LIKE ? 
      ORDER BY id DESC 
      LIMIT 1
    `);
    
    const lastSubmission = stmt.get(`NCAP-${year}-%`) as { id: string } | undefined;
    
    let nextNum = 1;
    if (lastSubmission) {
      const match = lastSubmission.id.match(/NCAP-\d{4}-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    
    return `NCAP-${year}-${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Create new NCAP submission
   */
  createSubmission(request: NcapSubmissionRequest): NcapSubmission {
    const id = this.generateNcapId();
    const now = Date.now();
    
    // Calculate initial timer state
    const timerCalculation = calculateDynamicTimer(
      request.initialTimerMinutes,
      [], // No votes yet
      [],
      request.approverPool.memberIds.length
    );
    
    const submission: NcapSubmission = {
      id,
      title: request.title,
      description: request.description,
      category: request.category,
      proposerId: request.proposerId,
      proposerName: request.proposerName,
      approverPool: request.approverPool,
      initialTimerMinutes: request.initialTimerMinutes,
      urgency: request.urgency,
      spendingAmount: request.spendingAmount,
      budgetCategory: request.budgetCategory,
      rationale: request.rationale,
      links: request.links,
      status: NcapStatus.PENDING,
      submittedAt: new Date(now),
      expiresAt: new Date(now + request.initialTimerMinutes * 60000),
      resolvedAt: null,
      approveVotes: [],
      objectVotes: [],
      timerCalculation,
      channelId: request.channelId,
      messageId: '', // Will be updated after Discord message is posted
      outcome: undefined,
      outcomeReason: undefined,
      escalationCommitteeDecision: undefined
    };
    
    // Insert into database
    const stmt = this.db.prepare(`
      INSERT INTO ncap_submissions (
        id, title, description, category, proposer_id, proposer_name,
        approver_pool_type, approver_pool_name, approver_pool_member_ids,
        initial_timer_minutes, urgency,
        spending_amount, budget_category, rationale, links,
        status, submitted_at, expires_at,
        timer_calculation, channel_id, message_id
      ) VALUES (
        @id, @title, @description, @category, @proposer_id, @proposer_name,
        @approver_pool_type, @approver_pool_name, @approver_pool_member_ids,
        @initial_timer_minutes, @urgency,
        @spending_amount, @budget_category, @rationale, @links,
        @status, @submitted_at, @expires_at,
        @timer_calculation, @channel_id, @message_id
      )
    `);
    
    stmt.run({
      id: submission.id,
      title: submission.title,
      description: submission.description,
      category: submission.category,
      proposer_id: submission.proposerId,
      proposer_name: submission.proposerName,
      approver_pool_type: submission.approverPool.type,
      approver_pool_name: submission.approverPool.name,
      approver_pool_member_ids: JSON.stringify(submission.approverPool.memberIds),
      initial_timer_minutes: submission.initialTimerMinutes,
      urgency: submission.urgency,
      spending_amount: submission.spendingAmount || null,
      budget_category: submission.budgetCategory || null,
      rationale: submission.rationale || null,
      links: submission.links ? JSON.stringify(submission.links) : null,
      status: submission.status,
      submitted_at: submission.submittedAt.getTime(),
      expires_at: submission.expiresAt?.getTime() || null,
      timer_calculation: JSON.stringify(submission.timerCalculation),
      channel_id: submission.channelId,
      message_id: submission.messageId
    });
    
    // Create audit log entry
    this.addAuditLog({
      postId: submission.id,
      eventType: 'submission',
      actorId: submission.proposerId,
      actorName: submission.proposerName,
      timestamp: new Date(),
      details: {
        category: submission.category,
        urgency: submission.urgency,
        initialTimerMinutes: submission.initialTimerMinutes,
        approverPoolSize: submission.approverPool.memberIds.length
      },
      previousState: null,
      newState: submission
    });
    
    return submission;
  }

  /**
   * Get submission by ID
   */
  getSubmission(id: string): NcapSubmission | null {
    const stmt = this.db.prepare('SELECT * FROM ncap_submissions WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return this.rowToSubmission(row);
  }

  /**
   * Get all active (pending) submissions
   */
  getActiveSubmissions(): NcapSubmission[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ncap_submissions 
      WHERE status = 'pending' 
      ORDER BY submitted_at DESC
    `);
    
    const rows = stmt.all() as any[];
    return rows.map(row => this.rowToSubmission(row));
  }

  /**
   * Update submission
   */
  updateSubmission(submission: NcapSubmission): void {
    const stmt = this.db.prepare(`
      UPDATE ncap_submissions SET
        status = @status,
        expires_at = @expires_at,
        resolved_at = @resolved_at,
        timer_calculation = @timer_calculation,
        outcome = @outcome,
        outcome_reason = @outcome_reason,
        escalation_committee_decision = @escalation_committee_decision,
        message_id = @message_id,
        thread_id = @thread_id,
        updated_at = @updated_at
      WHERE id = @id
    `);
    
    stmt.run({
      id: submission.id,
      status: submission.status,
      expires_at: submission.expiresAt?.getTime() || null,
      resolved_at: submission.resolvedAt?.getTime() || null,
      timer_calculation: JSON.stringify(submission.timerCalculation),
      outcome: submission.outcome || null,
      outcome_reason: submission.outcomeReason || null,
      escalation_committee_decision: submission.escalationCommitteeDecision || null,
      message_id: submission.messageId,
      thread_id: submission.threadId || null,
      updated_at: Date.now()
    });
  }

  /**
   * Add vote to submission
   */
  addVote(vote: NcapVote): void {
    const stmt = this.db.prepare(`
      INSERT INTO ncap_votes (post_id, user_id, user_name, vote_type, timestamp)
      VALUES (@post_id, @user_id, @user_name, @vote_type, @timestamp)
    `);
    
    stmt.run({
      post_id: vote.postId,
      user_id: vote.userId,
      user_name: vote.userName,
      vote_type: vote.voteType,
      timestamp: vote.timestamp.getTime()
    });
  }

  /**
   * Get votes for submission
   */
  getVotes(postId: string): { approves: NcapVote[]; objects: NcapVote[] } {
    const stmt = this.db.prepare('SELECT * FROM ncap_votes WHERE post_id = ? ORDER BY timestamp ASC');
    const rows = stmt.all(postId) as any[];
    
    const approves: NcapVote[] = [];
    const objects: NcapVote[] = [];
    
    for (const row of rows) {
      const vote: NcapVote = {
        id: row.id,
        postId: row.post_id,
        userId: row.user_id,
        userName: row.user_name,
        voteType: row.vote_type as VoteType,
        timestamp: new Date(row.timestamp)
      };
      
      if (vote.voteType === VoteType.APPROVE) {
        approves.push(vote);
      } else {
        objects.push(vote);
      }
    }
    
    return { approves, objects };
  }

  /**
   * Add audit log entry per Rule 76(1)(v)
   */
  addAuditLog(log: Omit<NcapAuditLog, 'id'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO ncap_audit_log (
        post_id, event_type, actor_id, actor_name, timestamp,
        details, previous_state, new_state
      ) VALUES (
        @post_id, @event_type, @actor_id, @actor_name, @timestamp,
        @details, @previous_state, @new_state
      )
    `);
    
    stmt.run({
      post_id: log.postId,
      event_type: log.eventType,
      actor_id: log.actorId || null,
      actor_name: log.actorName || null,
      timestamp: log.timestamp.getTime(),
      details: JSON.stringify(log.details),
      previous_state: log.previousState ? JSON.stringify(log.previousState) : null,
      new_state: log.newState ? JSON.stringify(log.newState) : null
    });
  }

  /**
   * Get audit log for submission
   */
  getAuditLog(postId: string): NcapAuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ncap_audit_log 
      WHERE post_id = ? 
      ORDER BY timestamp ASC
    `);
    
    const rows = stmt.all(postId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      postId: row.post_id,
      eventType: row.event_type,
      actorId: row.actor_id,
      actorName: row.actor_name,
      timestamp: new Date(row.timestamp),
      details: JSON.parse(row.details),
      previousState: row.previous_state ? JSON.parse(row.previous_state) : undefined,
      newState: row.new_state ? JSON.parse(row.new_state) : undefined
    }));
  }

  /**
   * Convert database row to NcapSubmission object
   */
  private rowToSubmission(row: any): NcapSubmission {
    // Get votes for this submission
    const { approves, objects } = this.getVotes(row.id);
    
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      proposerId: row.proposer_id,
      proposerName: row.proposer_name,
      approverPool: {
        type: row.approver_pool_type,
        name: row.approver_pool_name,
        memberIds: JSON.parse(row.approver_pool_member_ids)
      },
      initialTimerMinutes: row.initial_timer_minutes,
      urgency: row.urgency,
      spendingAmount: row.spending_amount,
      budgetCategory: row.budget_category,
      rationale: row.rationale,
      links: row.links ? JSON.parse(row.links) : undefined,
      status: row.status as NcapStatus,
      submittedAt: new Date(row.submitted_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
      approveVotes: approves,
      objectVotes: objects,
      timerCalculation: JSON.parse(row.timer_calculation) as TimerCalculation,
      outcome: row.outcome,
      outcomeReason: row.outcome_reason,
      escalationCommitteeDecision: row.escalation_committee_decision,
      channelId: row.channel_id,
      messageId: row.message_id,
      threadId: row.thread_id
    };
  }

  /**
   * Search submissions by various criteria
   */
  searchSubmissions(criteria: {
    status?: NcapStatus;
    category?: string;
    proposerId?: string;
    startDate?: Date;
    endDate?: Date;
    spendingMin?: number;
    spendingMax?: number;
  }): NcapSubmission[] {
    let query = 'SELECT * FROM ncap_submissions WHERE 1=1';
    const params: any = {};
    
    if (criteria.status) {
      query += ' AND status = @status';
      params.status = criteria.status;
    }
    
    if (criteria.category) {
      query += ' AND category = @category';
      params.category = criteria.category;
    }
    
    if (criteria.proposerId) {
      query += ' AND proposer_id = @proposer_id';
      params.proposer_id = criteria.proposerId;
    }
    
    if (criteria.startDate) {
      query += ' AND submitted_at >= @start_date';
      params.start_date = criteria.startDate.getTime();
    }
    
    if (criteria.endDate) {
      query += ' AND submitted_at <= @end_date';
      params.end_date = criteria.endDate.getTime();
    }
    
    if (criteria.spendingMin !== undefined) {
      query += ' AND spending_amount >= @spending_min';
      params.spending_min = criteria.spendingMin;
    }
    
    if (criteria.spendingMax !== undefined) {
      query += ' AND spending_amount <= @spending_max';
      params.spending_max = criteria.spendingMax;
    }
    
    query += ' ORDER BY submitted_at DESC';
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(params) as any[];
    
    return rows.map(row => this.rowToSubmission(row));
  }
}
