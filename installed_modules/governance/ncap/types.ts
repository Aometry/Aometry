/**
 * NCAP (Negative Consent Approval Protocol) Type Definitions
 * Based on Source Party Constitution Rule 49 and Schedule B
 */

/**
 * NCAP Submission Status
 * Tracks the lifecycle state of an NCAP submission
 */
export enum NcapStatus {
  PENDING = 'pending',           // Active, awaiting votes/timer expiration
  APPROVED = 'approved',         // Authorized via timer expiration, gantry completion, or supermajority
  BLOCKED = 'blocked',           // Blocked via objection gantry expiration or instant dismissal
  ESCALATED = 'escalated',       // Escalated to Committee for decision
  WITHDRAWN = 'withdrawn'        // Withdrawn by proposer before completion
}

/**
 * NCAP Gantry State
 * Represents the current gantry period state per Rule 49(5)
 */
export enum GantryState {
  NONE = 'none',                              // No gantry active
  NATURAL_APPROVAL = 'natural_approval',      // Timer naturally reached 25% remaining
  VOTED_APPROVAL = 'voted_approval',          // Approvals reduced timer to floor (50%)
  OBJECTION = 'objection'                     // Objections extended timer to ceiling (200%)
}

/**
 * Vote Type
 * Per Rule 49(4), members can APPROVE or OBJECT
 */
export enum VoteType {
  APPROVE = 'approve',
  OBJECT = 'object'
}

/**
 * Approver Pool Type
 * Defines who can vote on an NCAP submission
 */
export interface ApproverPool {
  type: 'working_group' | 'committee' | 'state_branch' | 'custom';
  name: string;              // Name of the group (e.g., "Communications Working Group")
  memberIds: string[];       // Discord user IDs of members in approver pool
}

/**
 * NCAP Vote Record
 * Individual vote cast on an NCAP submission
 */
export interface NcapVote {
  id: number;
  postId: string;            // NCAP submission ID
  userId: string;            // Discord user ID
  userName: string;          // Discord username for display
  voteType: VoteType;
  timestamp: Date;
}

/**
 * Dynamic Timer Calculation Result
 * Per Rule 49(3), timer adjusts based on vote participation
 */
export interface TimerCalculation {
  initialTimerMinutes: number;       // Original timer duration T
  approvalRate: number;              // (approve votes) / (pool size)
  objectionRate: number;             // (object votes) / (pool size)
  timerModifier: number;             // 1 - (0.5 × approval_rate) + (1.0 × objection_rate)
  currentTimerMinutes: number;       // initial_timer × timer_modifier
  floor: number;                     // T / 2 (minimum timer)
  ceiling: number;                   // 2T (maximum timer)
  clampedTimerMinutes: number;       // Current timer clamped to floor/ceiling
  gantryState: GantryState;
  gantryExpiresAt: Date | null;     // When gantry period ends (if active)
}

/**
 * NCAP Submission
 * Complete record of an NCAP authorization request
 */
export interface NcapSubmission {
  // Identity
  id: string;                        // Unique ID (e.g., "NCAP-2025-001")
  
  // Core submission data per Rule 49(2)(b)
  title: string;                     // Short description
  description: string;               // Detailed explanation
  category: string;                  // Category for default timer selection
  
  // Proposer (cannot vote on own submission per Rule 49(4)(d))
  proposerId: string;                // Discord user ID
  proposerName: string;              // Discord username
  
  // Approver pool per Rule 49(2)(c)
  approverPool: ApproverPool;
  
  // Timer configuration
  initialTimerMinutes: number;       // T per Rule 49(2)(b)(iv)
  urgency: 'urgent' | 'standard' | 'significant' | 'major';
  
  // Financial (if applicable) per Rule 50
  spendingAmount?: number;           // Amount in AUD
  budgetCategory?: string;
  
  // Supporting information
  rationale?: string;                // Root Axiom alignment explanation
  links?: string[];                  // Related documents/context
  
  // Status and timing
  status: NcapStatus;
  submittedAt: Date;
  expiresAt: Date | null;            // When timer/gantry expires
  resolvedAt: Date | null;           // When decision was finalized
  
  // Voting state
  approveVotes: NcapVote[];
  objectVotes: NcapVote[];
  
  // Current timer calculation
  timerCalculation: TimerCalculation;
  
  // Resolution
  outcome?: 'approved' | 'blocked' | 'escalated' | 'withdrawn';
  outcomeReason?: string;
  escalationCommitteeDecision?: string;
  
  // Discord integration
  channelId: string;                 // Where NCAP message is posted
  messageId: string;                 // Discord message ID
  threadId?: string;                 // Discussion thread (optional)
}

/**
 * NCAP Submission Request
 * Data needed to create a new NCAP submission
 */
export interface NcapSubmissionRequest {
  title: string;
  description: string;
  category: string;
  proposerId: string;
  proposerName: string;
  approverPool: ApproverPool;
  initialTimerMinutes: number;
  urgency: 'urgent' | 'standard' | 'significant' | 'major';
  spendingAmount?: number;
  budgetCategory?: string;
  rationale?: string;
  links?: string[];
  channelId: string;
}

/**
 * NCAP Category Configuration
 * Default settings for NCAP categories per Rule 51
 */
export interface NcapCategory {
  name: string;
  description: string;
  defaultTimerMinutes: number;
  approverPoolType: 'working_group' | 'committee' | 'state_branch';
  defaultApproverPool?: string;      // Name of default approver pool
  spendingLimit?: number;            // Maximum spending allowed via NCAP for this category
}

/**
 * NCAP Audit Log Entry
 * Complete audit trail per Rule 76(1)(v)
 */
export interface NcapAuditLog {
  id: number;
  postId: string;
  eventType: 'submission' | 'vote' | 'timer_update' | 'gantry_entry' | 
             'instant_resolution' | 'expiration' | 'escalation' | 'withdrawal';
  actorId?: string;                  // Discord user ID (if applicable)
  actorName?: string;                // Discord username (if applicable)
  timestamp: Date;
  details: Record<string, any>;      // Event-specific data (JSON)
  previousState?: any;               // State before event
  newState?: any;                    // State after event
}

/**
 * Default NCAP Categories per Rule 51(1)
 */
export const DEFAULT_NCAP_CATEGORIES: NcapCategory[] = [
  {
    name: 'Communications (Urgent)',
    description: 'Social media posts, press releases, public statements',
    defaultTimerMinutes: 240,         // 4 hours
    approverPoolType: 'working_group',
    defaultApproverPool: 'Communications'
  },
  {
    name: 'Communications (Routine)',
    description: 'Standard communications activities',
    defaultTimerMinutes: 720,         // 12 hours
    approverPoolType: 'working_group',
    defaultApproverPool: 'Communications'
  },
  {
    name: 'Operations (Routine)',
    description: 'Minor expenditures, administrative tasks',
    defaultTimerMinutes: 1440,        // 24 hours
    approverPoolType: 'working_group'
  },
  {
    name: 'Policy (Significant)',
    description: 'Policy drafts, position papers, strategic documents',
    defaultTimerMinutes: 2880,        // 48 hours
    approverPoolType: 'working_group',
    defaultApproverPool: 'Policy'
  },
  {
    name: 'Financial (Routine)',
    description: 'Small expenditures within delegated authority',
    defaultTimerMinutes: 1440,        // 24 hours
    approverPoolType: 'working_group',
    spendingLimit: 1000               // $1000 AUD
  },
  {
    name: 'Financial (Significant)',
    description: 'Larger expenditures requiring more deliberation',
    defaultTimerMinutes: 2880,        // 48 hours
    approverPoolType: 'committee',
    spendingLimit: 5000               // $5000 AUD
  },
  {
    name: 'Governance (Major)',
    description: 'Process changes, significant organizational decisions',
    defaultTimerMinutes: 4320,        // 72 hours
    approverPoolType: 'committee'
  }
];

/**
 * Timer Configuration Constants
 * Based on Rule 49(3) and Rule 51(2)
 */
export const TIMER_CONSTANTS = {
  // Modifier coefficients per Rule 49(3)
  APPROVAL_COEFFICIENT: 0.5,
  OBJECTION_COEFFICIENT: 1.0,
  
  // Floor and ceiling per Rule 49(3)(b)
  FLOOR_MULTIPLIER: 0.5,             // Timer floor = T / 2
  CEILING_MULTIPLIER: 2.0,           // Timer ceiling = 2T
  
  // Gantry thresholds per Rule 49(5)
  NATURAL_GANTRY_THRESHOLD: 0.25,    // Trigger at 25% remaining
  SUPERMAJORITY_THRESHOLD: 0.75,     // 75% approval triggers instant approval
  
  // Update interval (how often timer service checks)
  UPDATE_INTERVAL_MS: 60 * 1000,     // 1 minute
  
  // Notification thresholds
  REMINDER_THRESHOLDS: [
    60,      // 1 hour
    240,     // 4 hours
    1440     // 24 hours
  ]
};

/**
 * Helper type for financial NCAP submissions
 */
export interface FinancialNcapSubmission extends NcapSubmission {
  spendingAmount: number;
  budgetCategory: string;
  receiptUrl?: string;
  transactionDate?: Date;
}

/**
 * Instant Resolution Triggers per Rule 49(5)(c-e)
 */
export interface InstantResolution {
  type: 'supermajority_bypass' | 'approval_gantry_approve' | 'objection_gantry_object';
  triggeredAt: Date;
  triggeredBy: string;               // User ID who cast the triggering vote
  finalVoteCount: {
    approves: number;
    objects: number;
    poolSize: number;
  };
}
