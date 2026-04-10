/**
 * NCAP Timer Calculation Engine
 * Implements dynamic timer calculation per Constitution Rule 49(3)
 * 
 * Formula from Rule 49(3)(a):
 * approval_rate = (number of APPROVE votes) / (approver pool size)
 * objection_rate = (number of OBJECT votes) / (approver pool size)
 * timer_modifier = 1 - (0.5 × approval_rate) + (1.0 × objection_rate)
 * current_timer = initial_timer_T × timer_modifier
 */

import {
  NcapSubmission,
  NcapVote,
  VoteType,
  GantryState,
  TimerCalculation,
  TIMER_CONSTANTS,
  InstantResolution
} from './types';

/**
 * Calculate dynamic timer based on current vote state
 * Per Rule 49(3)
 */
export function calculateDynamicTimer(
  initialTimerMinutes: number,
  approveVotes: NcapVote[],
  objectVotes: NcapVote[],
  approverPoolSize: number
): TimerCalculation {
  // Calculate participation rates
  const approvalCount = approveVotes.length;
  const objectionCount = objectVotes.length;
  
  const approvalRate = approverPoolSize > 0 ? approvalCount / approverPoolSize : 0;
  const objectionRate = approverPoolSize > 0 ? objectionCount / approverPoolSize : 0;
  
  // Calculate timer modifier per Rule 49(3)(a)
  const timerModifier = 1 
    - (TIMER_CONSTANTS.APPROVAL_COEFFICIENT * approvalRate)
    + (TIMER_CONSTANTS.OBJECTION_COEFFICIENT * objectionRate);
  
  // Apply modifier to initial timer
  const currentTimerMinutes = initialTimerMinutes * timerModifier;
  
  // Calculate floor and ceiling per Rule 49(3)(b)
  const floor = initialTimerMinutes * TIMER_CONSTANTS.FLOOR_MULTIPLIER;
  const ceiling = initialTimerMinutes * TIMER_CONSTANTS.CEILING_MULTIPLIER;
  
  // Clamp timer to bounds
  let clampedTimerMinutes = currentTimerMinutes;
  let gantryState = GantryState.NONE;
  let gantryExpiresAt: Date | null = null;
  
  // Check for floor (Approved Gantry trigger) per Rule 49(3)(b)(i)
  if (currentTimerMinutes <= floor) {
    clampedTimerMinutes = floor;
    gantryState = GantryState.VOTED_APPROVAL;
    // Gantry duration = remaining time at floor
    gantryExpiresAt = new Date(Date.now() + floor * 60 * 1000);
  }
  
  // Check for ceiling (Objection Gantry trigger) per Rule 49(3)(b)(ii)
  else if (currentTimerMinutes >= ceiling) {
    clampedTimerMinutes = ceiling;
    gantryState = GantryState.OBJECTION;
    // Objection Gantry duration = 0.25 × T per Rule 49(5)(a)(iii)
    const objectionGantryDuration = initialTimerMinutes * TIMER_CONSTANTS.NATURAL_GANTRY_THRESHOLD;
    gantryExpiresAt = new Date(Date.now() + objectionGantryDuration * 60 * 1000);
  }
  
  // Check for natural gantry (approaching expiration) per Rule 49(5)(a)(i)
  else if (clampedTimerMinutes <= initialTimerMinutes * TIMER_CONSTANTS.NATURAL_GANTRY_THRESHOLD) {
    gantryState = GantryState.NATURAL_APPROVAL;
    // Natural gantry duration = remaining time (typically 0.25 × T)
    gantryExpiresAt = new Date(Date.now() + clampedTimerMinutes * 60 * 1000);
  }
  
  return {
    initialTimerMinutes,
    approvalRate,
    objectionRate,
    timerModifier,
    currentTimerMinutes,
    floor,
    ceiling,
    clampedTimerMinutes,
    gantryState,
    gantryExpiresAt
  };
}

/**
 * Check if supermajority bypass is triggered
 * Per Rule 49(5)(e): >= 75% approval triggers immediate approval
 */
export function checkSupermajorityBypass(
  approveVotes: NcapVote[],
  approverPoolSize: number
): boolean {
  if (approverPoolSize === 0) return false;
  
  const approvalRate = approveVotes.length / approverPoolSize;
  return approvalRate >= TIMER_CONSTANTS.SUPERMAJORITY_THRESHOLD;
}

/**
 * Check for instant resolution triggers during gantry periods
 * Per Rule 49(5)(c-d)
 */
export function checkInstantResolution(
  gantryState: GantryState,
  newVoteType: VoteType,
  approveVotes: NcapVote[],
  objectVotes: NcapVote[],
  approverPoolSize: number
): InstantResolution | null {
  // Supermajority Bypass per Rule 49(5)(e) - can trigger at any time
  if (checkSupermajorityBypass(approveVotes, approverPoolSize)) {
    return {
      type: 'supermajority_bypass',
      triggeredAt: new Date(),
      triggeredBy: approveVotes[approveVotes.length - 1]?.userId || 'unknown',
      finalVoteCount: {
        approves: approveVotes.length,
        objects: objectVotes.length,
        poolSize: approverPoolSize
      }
    };
  }
  
  // Approved Gantry instant completion per Rule 49(5)(c)
  if ((gantryState === GantryState.NATURAL_APPROVAL || gantryState === GantryState.VOTED_APPROVAL) 
      && newVoteType === VoteType.APPROVE) {
    return {
      type: 'approval_gantry_approve',
      triggeredAt: new Date(),
      triggeredBy: approveVotes[approveVotes.length - 1]?.userId || 'unknown',
      finalVoteCount: {
        approves: approveVotes.length,
        objects: objectVotes.length,
        poolSize: approverPoolSize
      }
    };
  }
  
  // Objection Gantry instant dismissal per Rule 49(5)(d)
  if (gantryState === GantryState.OBJECTION && newVoteType === VoteType.OBJECT) {
    return {
      type: 'objection_gantry_object',
      triggeredAt: new Date(),
      triggeredBy: objectVotes[objectVotes.length - 1]?.userId || 'unknown',
      finalVoteCount: {
        approves: approveVotes.length,
        objects: objectVotes.length,
        poolSize: approverPoolSize
      }
    };
  }
  
  return null;
}

/**
 * Calculate time remaining until expiration
 */
export function getTimeRemaining(submission: NcapSubmission): number {
  if (!submission.expiresAt) return 0;
  
  const now = Date.now();
  const expiresAt = new Date(submission.expiresAt).getTime();
  const remainingMs = expiresAt - now;
  
  return Math.max(0, Math.floor(remainingMs / 60000)); // Convert to minutes
}

/**
 * Update submission timer based on current time and vote state
 * This is called by the timer service periodically
 */
export function updateSubmissionTimer(submission: NcapSubmission): NcapSubmission {
  const now = Date.now();
  const submittedAt = new Date(submission.submittedAt).getTime();
  const elapsedMinutes = Math.floor((now - submittedAt) / 60000);
  
  // Recalculate dynamic timer
  const timerCalc = calculateDynamicTimer(
    submission.initialTimerMinutes,
    submission.approveVotes,
    submission.objectVotes,
    submission.approverPool.memberIds.length
  );
  
  // Calculate new expiration time
  // Expiration = submission time + clamped timer duration
  const expiresAt = new Date(submittedAt + timerCalc.clampedTimerMinutes * 60000);
  
  return {
    ...submission,
    timerCalculation: timerCalc,
    expiresAt
  };
}

/**
 * Add a vote to submission and recalculate timer
 * Enforces vote rules per Rule 49(4)
 */
export function addVote(
  submission: NcapSubmission,
  userId: string,
  userName: string,
  voteType: VoteType
): { submission: NcapSubmission; error?: string; instantResolution?: InstantResolution } {
  // Rule 49(4)(d): Proposer cannot vote on own submission
  if (userId === submission.proposerId) {
    return { submission, error: 'Proposer cannot vote on their own NCAP submission' };
  }
  
  // Check if user is in approver pool
  if (!submission.approverPool.memberIds.includes(userId)) {
    return { submission, error: 'Only approver pool members can vote on this submission' };
  }
  
  // Rule 49(4)(c): Cannot change vote after casting
  const hasApproveVote = submission.approveVotes.some(v => v.userId === userId);
  const hasObjectVote = submission.objectVotes.some(v => v.userId === userId);
  
  if (hasApproveVote || hasObjectVote) {
    return { submission, error: 'Cannot change vote after casting' };
  }
  
  // Create vote record
  const vote: NcapVote = {
    id: submission.approveVotes.length + submission.objectVotes.length + 1,
    postId: submission.id,
    userId,
    userName,
    voteType,
    timestamp: new Date()
  };
  
  // Add vote to appropriate array
  let updatedSubmission: NcapSubmission;
  if (voteType === VoteType.APPROVE) {
    updatedSubmission = {
      ...submission,
      approveVotes: [...submission.approveVotes, vote]
    };
  } else {
    updatedSubmission = {
      ...submission,
      objectVotes: [...submission.objectVotes, vote]
    };
  }
  
  // Check for instant resolution BEFORE recalculating timer
  const instantResolution = checkInstantResolution(
    submission.timerCalculation.gantryState,
    voteType,
    updatedSubmission.approveVotes,
    updatedSubmission.objectVotes,
    submission.approverPool.memberIds.length
  );
  
  // Recalculate timer with new vote
  updatedSubmission = updateSubmissionTimer(updatedSubmission);
  
  return {
    submission: updatedSubmission,
    instantResolution: instantResolution || undefined
  };
}

/**
 * Format timer duration for display
 */
export function formatTimerDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
}

/**
 * Format timer calculation for debugging/audit log
 */
export function formatTimerCalculation(calc: TimerCalculation): string {
  return `Timer: ${formatTimerDuration(calc.clampedTimerMinutes)} | ` +
    `Approval: ${(calc.approvalRate * 100).toFixed(1)}% | ` +
    `Objection: ${(calc.objectionRate * 100).toFixed(1)}% | ` +
    `Modifier: ${calc.timerModifier.toFixed(2)}x | ` +
    `Gantry: ${calc.gantryState}`;
}

/**
 * Generate progress bar visualization for timer
 */
export function generateTimerProgressBar(
  current: number,
  initial: number,
  floor: number,
  ceiling: number,
  gantryState: GantryState
): string {
  const barLength = 20;
  const floorPos = Math.floor((floor / initial) * barLength);
  const currentPos = Math.floor(Math.max(0, Math.min(1, current / ceiling)) * barLength);
  
  let bar = '';
  for (let i = 0; i < barLength; i++) {
    if (i < currentPos) {
      if (gantryState === GantryState.OBJECTION) {
        bar += '🔴'; // Red for objection
      } else if (gantryState !== GantryState.NONE) {
        bar += '🟡'; // Yellow for gantry
      } else {
        bar += '🟢'; // Green for normal
      }
    } else if (i === floorPos) {
      bar += '⬇️'; // Mark floor position
    } else {
      bar += '⬜';
    }
  }
  
  return bar;
}
