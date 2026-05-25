# 🛠️ AOMETRY EXTENSION SPEC: FUSION GOVERNANCE MODULE

**Version:** 2.0  
**Stack:** TypeScript / Node.js  
**Repository:** Fusion Political Party GitHub (Private/Internal)  
**Last Updated:** December 2025

---

## 1. SYSTEM ARCHITECTURE

The extension functions as **"Governance Middleware"** that routes interactions from Discord through specific constitutional logic gates. The bot operates autonomously in designated authorization channels, enforcing constitutional thresholds while maintaining complete audit trails.

**Core Design Principle:** Zero human messages in authorization channels. All EC interaction occurs via emoji reactions to bot-generated posts.

---

## 2. CHANNEL TOPOLOGY

### **Input Channels (Human-Writable)**

**`#comms-drafts`**

- Purpose: Content development and bot command submission
- Access: All content creators
- Bot Commands: `/ncap-submit`, `/ncap-status`

**`#comms-cmte`** (Optional)

- Purpose: EC pre-deliberation space
- Access: EC members only
- Bot Commands: `/ncap-pending`, `/motion-propose`

### **Authorization Channels (Bot-Only)**

**`#auth-socmed`**

- Purpose: Social media content authorization via NCAP
- Access: EC read-only, bot posts exclusively
- Interaction: Emoji reactions only (✅ 🛑)
- Enforcement: Bot auto-deletes any human messages

**`#auth-general`**

- Purpose: Non-social media comms authorization via NCAP
- Access: EC read-only, bot posts exclusively
- Interaction: Emoji reactions only (✅ 🛑)
- Enforcement: Bot auto-deletes any human messages

**`#motions`** (New)

- Purpose: Standard Committee motions via positive consent
- Access: EC read-only, bot posts exclusively
- Interaction: Emoji reactions only (✅ ❌ 🤷)
- Enforcement: Bot auto-deletes any human messages

### **Output Channels (Bot Publishing)**

**`#exec-meta` ("The Menu")**

- Purpose: Public-facing ratification log
- Bot Posts: Formatted minutes of all concluded votes
- Format: Motion text, result, voter breakdown, timestamp

### **Exception Spaces (Discussion Permitted)**

**Objection Hearing Threads**

- Created automatically by bot when 🛑 reaction occurs
- Human messages permitted for substantive debate
- Timer-bound (15 minutes for NCAP objections)
- Auto-closes when hearing concludes

---

## 3. LOGIC GATE TIERING

The bot enforces the following constitutional thresholds based on motion classification.

| Motion Category         | Logic Model                          | Success Threshold       | Constitutional Basis | Channel                         |
| ----------------------- | ------------------------------------ | ----------------------- | -------------------- | ------------------------------- |
| **Operational (Comms)** | NCAP Pure Tug-of-War                 | Time-based (2h-8h)      | Rule 43 (Delegation) | `#auth-socmed`, `#auth-general` |
| **Standard Motion**     | Positive Consent                     | 60% of Present EC       | Rule 66(3)           | `#motions`                      |
| **Out-of-Session**      | Positive Consent + Absolute Majority | 60% + Absolute Majority | Rule 67(2)           | `#motions`                      |
| **Preferences**         | Supermajority                        | 80% of Total EC         | Rule 106(1)(c)       | `#motions`                      |

---

## 4. NCAP "PURE TUG-OF-WAR" MODULE

**Purpose:** High-velocity communications authorization via negative consent (silence = approval).

**Scope:** Routine social media posts, blog articles, press releases, email newsletters, event announcements.

**Exclusions:** Strategic decisions, policy changes, budget allocations, legal/compliance matters.

---

### **4.1 SUBMISSION WORKFLOW**

**Command:** `/ncap-submit [channel] [urgency] [content]`

**Parameters:**

- `channel`: `socmed` | `general`
- `urgency`: `standard` (4h) | `urgent` (2h) | `complex` (6h)
- `content`: Text content + optional media attachments

**Example:**

```
/ncap-submit socmed standard

Content: We're launching our Reclaim Our Economy campaign this Saturday!
Join us at Federation Square, 10am. More info: [link]

Media: [image attachment]
```

**Bot Response in `#comms-drafts`:**

```
✅ Submitted to #auth-socmed
Authorization ID: NCAP-2025-047
Timer: 4 hours (14:30 → 18:30 AEDT)
Track status: [link to auth post]
```

---

### **4.2 AUTHORIZATION POST FORMAT**

**Bot creates post in appropriate auth channel:**

```
🔔 NCAP-2025-047: Facebook Post
⏱️ Timer: 4:00:00 remaining
🎯 Target: 18:30 AEDT
📊 Status: Pending Authorization

[CONTENT PREVIEW]

We're launching our Reclaim Our Economy campaign this Saturday!
Join us at Federation Square, 10am. More info: [link]

[IMAGE PREVIEW if attached]

React to vote:
✅ Approve (halves timer)
🛑 Object (triggers hearing)

Posted by: @EthanCornwill
Submitted: 14:30 AEDT
```

**Bot continuously updates this post** with live timer countdown.

---

### **4.3 TIMER MECHANICS**

**Default Start:** $T = 240\text{min}$ (4 hours)

**Active Hours:** 09:00–21:00 AEST/AEDT

- Timers pause outside active hours
- Example: Post submitted at 20:30 with 2h timer → pauses at 21:00, resumes at 09:00 next day

**Floor/Ceiling:**

- **Floor:** $T_{\min} = 2\text{h}$ (Posted Gantry triggers)
- **Ceiling:** $T_{\max} = 8\text{h}$ (Objected Gantry triggers)

---

### **4.4 REACTION HANDLING**

**✅ Approve Reaction:**

```python
T_new = T_current / 2

if T_new <= 120min:
    trigger_posted_gantry()
else:
    update_timer(T_new)
```

**Bot updates post:**

```
✅ Approved by @Member1 (14:45)
⏱️ Timer: 2:00:00 remaining → 1:00:00 remaining
🎯 New target: 15:30 AEDT
```

**Multiple approvals compound:**

- Approval 1: 4h → 2h
- Approval 2: 2h → 1h
- Approval 3: 1h → 30min (triggers Posted Gantry)

---

**🛑 Object Reaction:**

```python
pause_timer()
create_objection_hearing_thread()
start_hearing_timer(15min)
```

**Bot updates main post:**

```
⚠️ OBJECTION by @Member2 (15:10)
⏸️ Timer paused at: 1:45:00 remaining
🧵 Objection hearing in progress: [thread link]
```

**Bot creates objection hearing thread:**

```
⚠️ OBJECTION HEARING: NCAP-2025-047
Objector: @Member2
Hearing Duration: ⏱️ 15:00 remaining

@Member2: Please state your objection below.

EC Members: React to this message to vote:
🗑️ Dismiss Objection (2 votes needed)
⚠️ Validate Objection (2-3 votes needed)

If no consensus in 15min, objection is discarded.
```

---

### **4.5 OBJECTION HEARING RESOLUTION**

**Case 1: Dismissed (2+ votes on 🗑️)**

Bot posts in thread:

```
✅ HEARING RESULT: Objection DISMISSED
Votes: 🗑️ 3 (Member3, Member4, Member5) | ⚠️ 1 (Member2)

Main timer resuming from 1:45:00
Target: 17:15 AEDT
```

**Case 2: Validated (2-3 votes on ⚠️)**

```python
T_new = T_current * 2

if T_new >= 480min:  # 8 hours
    trigger_objected_gantry()
else:
    update_timer(T_new)
```

Bot posts in thread:

```
⚠️ HEARING RESULT: Objection VALIDATED
Votes: ⚠️ 3 (Member2, Member6, Member7) | 🗑️ 1 (Member3)

Main timer doubled: 1:45:00 → 3:30:00
New target: 19:00 AEDT
```

**Case 3: Hearing Expires (No Consensus)**

If 15 minutes pass without 2+ votes on either option:

```
⏱️ HEARING EXPIRED: No consensus reached
Objection automatically discarded per NCAP rules.

Main timer resuming from 1:45:00
Target: 17:15 AEDT
```

---

### **4.6 GANTRIES (FINAL BUFFERS)**

**Posted Gantry (T ≤ 2h)**

Bot updates main post:

```
⏰ POSTED GANTRY: NCAP-2025-047
🚦 Final 5-minute window for emergency objection
⏱️ Publication in: 4:32 remaining

Emergency stop: React 🛑 to trigger urgent hearing
Otherwise, post proceeds automatically.
```

After 5 minutes with no new objection:

```
✅ PUBLISHED: NCAP-2025-047
Posted to Facebook: 18:35 AEDT
Link: https://facebook.com/fusionparty/posts/...
Authorization complete.
```

Bot also posts formatted minute to `#meta`:

```
📋 NCAP-2025-047 | PUBLISHED
Content: "Reclaim Our Economy campaign launch..."
Approved by: @Member1, @Member3, @Member4
Objections: 0
Published: 18:35 AEDT, 25 Dec 2025
```

---

**Objected Gantry (T ≥ 8h)**

Bot updates main post:

```
🛑 OBJECTED GANTRY: NCAP-2025-047
⏱️ Final 5-minute window to rescue post
React ✅ to override and publish anyway (requires 3 votes)

Deletion in: 4:15 remaining
Validated objections: 2
```

After 5 minutes:

```
🗑️ DELETED: NCAP-2025-047
Validated objections: 2 (Member2, Member6)
Post archived for quarterly review.
Reason: [Link to objection hearing threads]
```

Bot posts to `#meta`:

```
📋 NCAP-2025-047 | OBJECTED
Content: [summary]
Objections: 2 validated
Deleted: 19:45 AEDT, 25 Dec 2025
Review: Q1 2026 post-mortem
```

---

## 5. STANDARD MOTION MODULE (POSITIVE CONSENT)

**Purpose:** Committee decisions requiring explicit approval (non-NCAP items).

**Scope:** Strategic decisions, policy positions, budget allocations, procedural changes.

**Channel:** `#motions`

---

### **5.1 MOTION SUBMISSION**

**Command:** `/motion-propose [type] [text] [context-url]`

**Parameters:**

- `type`: `standard` | `out-of-session` | `preference`
- `text`: Motion text (clear, actionable)
- `context-url`: Optional link to Google Chat "Kitchen" thread

**Example:**

```
/motion-propose standard

Motion: The Executive Committee formally adopts the "Reclaim Our Economy/Future"
strategic framework and authorizes implementation beginning February 2026.

Context: https://chat.google.com/room/.@/thread/...
```

---

### **5.2 MOTION POST FORMAT**

**Bot creates post in `#motions`:**

```
📜 MOTION-2025-012: Strategic Framework Adoption
📊 Type: Standard Motion (60% of present EC required)
⏱️ Voting Period: 48 hours (closes 27 Dec, 14:30 AEDT)

MOTION TEXT:
The Executive Committee formally adopts the "Reclaim Our Economy/Future"
strategic framework and authorizes implementation beginning February 2026.

CONTEXT:
Google Chat Discussion: [Kitchen thread link]

React to vote:
✅ Yes
❌ No
🤷 Abstain

Proposed by: @EthanCornwill
Submitted: 25 Dec 2025, 14:30 AEDT
```

---

### **5.3 THRESHOLD LOGIC**

**Standard Motion (Rule 66(3)):**

```python
present_voters = yes + no + abstain
required_yes = ceil(present_voters * 0.6)

if yes >= required_yes:
    motion_passes()
```

**Out-of-Session (Rule 67(2)):**

```python
present_voters = yes + no + abstain
total_ec_seats = 9  # or current Committee size

required_present = ceil(present_voters * 0.6)
required_absolute = ceil(total_ec_seats * 0.5) + 1  # absolute majority

if yes >= required_present AND yes >= required_absolute:
    motion_passes()
else:
    motion_fails()
```

**Example:**

- Total EC: 9 members
- Voters: 7 (Yes: 5, No: 2, Abstain: 0)
- Present threshold: 60% of 7 = 5 ✅
- Absolute threshold: Majority of 9 = 5 ✅
- **Result: PASSED**

**Preference Guidelines (Rule 106(1)(c)):**

```python
total_ec_seats = 9
required_supermajority = ceil(total_ec_seats * 0.8)

if yes >= required_supermajority:
    motion_passes()
```

---

### **5.4 MOTION CLOSURE**

**When voting period ends, bot updates post:**

```
✅ MOTION PASSED: MOTION-2025-012

RESULT:
Yes: 6 (@Member1, @Member2, @Member3, @Member4, @Member5, @Member6)
No: 2 (@Member7, @Member8)
Abstain: 1 (@Member9)

Threshold: 60% of 9 present = 6 required
Achieved: 6 Yes votes

Status: ADOPTED
Closed: 27 Dec 2025, 14:30 AEDT
```

**Bot posts formatted minute to `#meta`:**

```
📋 MOTION-2025-012 | PASSED
Type: Standard Motion
Text: "The Executive Committee formally adopts the Reclaim Our Economy/Future
strategic framework..."
Result: 6 Yes, 2 No, 1 Abstain (60% threshold met)
Adopted: 27 Dec 2025, 14:30 AEDT
```

---

## 6. INTEGRATION FEATURES

### **6.1 GOOGLE CHAT BRIDGE**

**Purpose:** Link Discord votes to Google Chat ("Kitchen") deliberation threads for context.

**Implementation:**

- Motion/NCAP submissions accept optional `context-url` parameter
- Bot embeds clickable link in authorization/motion posts
- EC members can review deliberation before voting
- Does not affect vote mechanics, purely informational

**Example:**

```
CONTEXT:
Kitchen Discussion: https://chat.google.com/room/AAAAx.@/thread/abc123
Read EC deliberation before voting.
```

---

### **6.2 MINUTE GENERATOR**

**Purpose:** Auto-generate formatted minutes for transparency and constitutional compliance.

**Trigger:** Any concluded vote (NCAP published/deleted, motion passed/failed)

**Output Channel:** `#meta` (The Menu - public Discord)

**Format:**

**NCAP Minutes:**

```
📋 NCAP-2025-047 | PUBLISHED
Type: Social Media Post (Facebook)
Content: "Reclaim Our Economy campaign launch at Federation Square..."
Approved by: @Member1 (14:45), @Member3 (15:20), @Member4 (15:55)
Objections: 1 dismissed (Member2 - 15:10)
Published: 18:35 AEDT, 25 Dec 2025
Authorization time: 4h 5min
```

**Motion Minutes:**

```
📋 MOTION-2025-012 | PASSED
Type: Standard Motion (Rule 66(3))
Motion: "The Executive Committee formally adopts the Reclaim Our Economy/Future
strategic framework and authorizes implementation beginning February 2026."
Votes: 6 Yes, 2 No, 1 Abstain
Yes: @Member1, @Member2, @Member3, @Member4, @Member5, @Member6
No: @Member7, @Member8
Abstain: @Member9
Threshold: 60% of 9 present = 6 required
Result: ADOPTED (6 ≥ 6)
Closed: 27 Dec 2025, 14:30 AEDT
Proposed by: @EthanCornwill
Context: [Kitchen thread link]
```

**Archival:** Bot maintains SQLite database of all votes for export/analysis.

---

### **6.3 ABSOLUTE MAJORITY CHECK**

**Purpose:** Enforce Rule 67(2) requirement that out-of-session motions pass absolute majority of total Committee, not just present voters.

**Implementation:**

```typescript
interface Committee {
  totalSeats: number; // 9 or current size
  activeMembers: string[]; // Discord user IDs
}

function checkAbsoluteMajority(
  yesVotes: number,
  committee: Committee
): boolean {
  const absoluteThreshold = Math.ceil(committee.totalSeats / 2) + 1;
  return yesVotes >= absoluteThreshold;
}
```

**User Feedback:** Bot clearly displays both thresholds in motion posts:

```
📊 Type: Out-of-Session Motion
Thresholds Required:
  ✅ 60% of present voters
  ✅ Absolute majority of 9 total EC seats (≥5 votes)
```

---

## 7. ACCESSIBILITY & REDUNDANCY

### **7.1 MULTI-CHANNEL PINGS**

**Purpose:** Ensure less-active EC members (e.g., Kammy, Therese) receive urgent notifications for critical votes.

**Implementation:**

**Tier 1: NCAP** (Standard comms)

- Discord auth channel only
- No external pings

**Tier 2: Standard Motions**

- Discord `#motions` + DM to all EC members
- Subject: "New motion requires your vote: MOTION-2025-XXX"

**Tier 3: Out-of-Session / Preferences**

- Discord + DM + Webhook to Google Chat
- Optional: SMS via Twilio integration (future enhancement)
- Subject: "URGENT: Critical motion requires absolute majority"

**Webhook Configuration:**

```typescript
interface NotificationConfig {
  tier: "ncap" | "standard" | "critical";
  channels: {
    discord: boolean;
    dm: boolean;
    googleChat?: string; // Webhook URL
    sms?: boolean;
  };
}
```

---

### **7.2 OPEN SOURCE STANDARDS**

**Purpose:** Eliminate "bus factor" by ensuring any TypeScript developer can maintain the system.

**Code Quality Requirements:**

1. **Strict TypeScript Typing:**

```typescript
// No 'any' types permitted
interface NCAPPost {
  id: string;
  content: string;
  timer: number; // minutes remaining
  status:
    | "pending"
    | "posted-gantry"
    | "objected-gantry"
    | "published"
    | "deleted";
  approvals: string[]; // Discord user IDs
  objections: Objection[];
  submittedBy: string;
  submittedAt: Date;
}

interface Objection {
  objector: string;
  timestamp: Date;
  hearingThread: string;
  status: "pending" | "dismissed" | "validated" | "expired";
  votes: {
    dismiss: string[];
    validate: string[];
  };
}
```

2. **Comprehensive JSDoc Comments:**

```typescript
/**
 * Handles ✅ Approve reaction on NCAP post.
 * Halves the timer and triggers Posted Gantry if timer ≤ 2h.
 * @param postId - NCAP authorization post ID
 * @param userId - Discord user ID of approver
 * @returns Updated NCAP post state
 */
async function handleApproval(
  postId: string,
  userId: string
): Promise<NCAPPost> {
  // Implementation
}
```

3. **Unit Test Coverage ≥80%:**

```typescript
describe("NCAP Timer Logic", () => {
  it("should halve timer on approval", () => {
    const post = { timer: 240 };
    const result = applyApproval(post);
    expect(result.timer).toBe(120);
  });

  it("should trigger Posted Gantry when timer ≤ 2h", () => {
    const post = { timer: 120 };
    const result = applyApproval(post);
    expect(result.status).toBe("posted-gantry");
  });
});
```

4. **Configuration via Environment Variables:**

```bash
# .env
DISCORD_TOKEN=your_bot_token
ACTIVE_HOURS_START=09:00
ACTIVE_HOURS_END=21:00
TIMEZONE=Australia/Melbourne
COMMITTEE_SIZE=9
META_CHANNEL_ID=1234567890
GOOGLE_CHAT_WEBHOOK=https://chat.googleapis.com/...
```

5. **Modular Architecture:**

```
src/
├── modules/
│   ├── ncap/
│   │   ├── timer.ts
│   │   ├── objection-hearing.ts
│   │   └── gantries.ts
│   ├── motions/
│   │   ├── standard.ts
│   │   ├── out-of-session.ts
│   │   └── preferences.ts
│   └── minutes/
│       ├── generator.ts
│       └── templates.ts
├── utils/
│   ├── database.ts
│   ├── reactions.ts
│   └── notifications.ts
└── index.ts
```

---

## 8. DATABASE SCHEMA

**SQLite for portability and simplicity:**

```sql
CREATE TABLE ncap_posts (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  channel TEXT NOT NULL,  -- 'socmed' | 'general'
  timer INTEGER NOT NULL,  -- minutes remaining
  status TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  submitted_at DATETIME NOT NULL,
  target_time DATETIME NOT NULL,
  published_at DATETIME,
  deleted_at DATETIME
);

CREATE TABLE ncap_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  reaction TEXT NOT NULL,  -- 'approve' | 'object'
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (post_id) REFERENCES ncap_posts(id)
);

CREATE TABLE objection_hearings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL,
  objector_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'pending' | 'dismissed' | 'validated' | 'expired'
  created_at DATETIME NOT NULL,
  resolved_at DATETIME,
  FOREIGN KEY (post_id) REFERENCES ncap_posts(id)
);

CREATE TABLE motions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,  -- 'standard' | 'out-of-session' | 'preference'
  text TEXT NOT NULL,
  context_url TEXT,
  proposed_by TEXT NOT NULL,
  submitted_at DATETIME NOT NULL,
  closes_at DATETIME NOT NULL,
  status TEXT NOT NULL,  -- 'open' | 'passed' | 'failed'
  closed_at DATETIME
);

CREATE TABLE motion_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  motion_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote TEXT NOT NULL,  -- 'yes' | 'no' | 'abstain'
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (motion_id) REFERENCES motions(id)
);
```

---

## 9. CONSTITUTIONAL VERIFICATION

**Rule 43 (Delegation):**

> "The Committee may delegate any of its powers... to a Unit or to staff of the Association"

✅ **NCAP operates under delegated communications authority**

**Rule 66(3) (Standard Motions):**

> "A question arising at a Committee meeting... is to be decided by a majority of votes"
> "A majority of votes means 60% of Committee members present at a meeting"

✅ **Bot enforces 60% of present voters for standard motions**

**Rule 67(2) (Out-of-Session):**

> "The Committee may pass a resolution without a Committee meeting... if:
> (a) at least 60% of Committee members... indicate agreement, and
> (b) an absolute majority of the Committee indicates agreement"

✅ **Bot enforces both 60% of present AND absolute majority of total seats**

**Rule 106(1)(c) (Preferences):**

> "Binding on... all office bearers and members of the Executive... if at least 80%
> of the Committee passes them"

✅ **Bot enforces 80% supermajority of total Committee**

**Rule 21(3) (Technology Use):**

> "A Committee member... may participate in a Committee meeting...
> by any technology that reasonably allows that person to hear and
> take part in discussions"

✅ **Discord + bot constitutes permissible technology under this rule**

---

## 10. SUCCESS METRICS & MONITORING

**Organizational Performance:**

- Posts per week: 8-12 (target 3-4x increase from baseline ~2-3)
- Average NCAP authorization time: <6 hours
- NCAP objection validation rate: <25%
- EC engagement rate: >70% (reaction participation)
- Motion participation rate: >80% (of total EC)

**Bot Performance:**

- Uptime: 99%+ during active hours (09:00-21:00 AEDT)
- Reaction processing latency: <5 seconds
- Timer update frequency: Every 5 minutes
- Message auto-delete latency: <10 seconds

**Quality Indicators:**

- Posts abandoned in authorization: <10%
- Objections dismissed vs validated ratio: Track for pattern analysis
- Average deliberation time before submission: Track for workflow optimization

**Audit Trail:**

- All votes exportable as CSV
- Quarterly review reports auto-generated
- Transparency dashboard (public-facing):
  - Total authorizations this month
  - Average authorization time
  - Objection rate
  - EC participation rate by member (anonymized)

---

## 11. ROLLOUT PLAN

**Phase 1: Development (2 weeks)**

- Build bot with NCAP + motions logic
- Implement database schema
- Write unit tests (≥80% coverage)
- Deploy to test Discord server

**Phase 2: Internal Testing (1 week)**

- EC practices with dummy content
- Test all reaction flows
- Validate timer mechanics
- Stress-test objection hearings

**Phase 3: Pilot (2 weeks)**

- Run NCAP on real content in parallel with manual process
- Monitor objection rates and friction points
- Iterate based on feedback
- Adjust default timers if needed

**Phase 4: Full Deployment**

- NCAP becomes exclusive protocol
- Lock auth channels to bot-only
- Manual approval deprecated
- Quarterly reviews for continuous improvement

---

## 12. MAINTENANCE & DOCUMENTATION

**Secretary Responsibilities (Rule 58(3)):**

- Maintain custody of bot repository
- Ensure GitHub access credentials documented
- Annual review of bot permissions and access
- Backup database quarterly

**Bus Factor Mitigation:**

- At least 2 EC members with admin access to repository
- Onboarding documentation for new developers
- Code review required for all changes
- Staging environment for testing updates

---

## CLAIMS VERIFICATION

✅ **The Constitution allows for the use of technology for meeting participation and voting** (Rule 21(3))

✅ **Rule 43 permits the Committee to delegate specific powers to a unit or staff**

✅ **Standard Committee motions require a 60% majority** (Rule 66(3) - of present voters)

✅ **Out-of-session decisions require both a 60% majority and an absolute majority of the Committee** (Rule 67(2))

✅ **Binding preference guidelines require an 80% passing vote** (Rule 106(1)(c))

✅ **The Secretary is responsible for the custody of all books and documents of the Association** (Rule 58(3))
