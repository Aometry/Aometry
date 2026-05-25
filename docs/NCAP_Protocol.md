# Negative Consent Approval Protocol (NCAP)

**Version 2.0**  

---

## 1. Concept & Definition

**NCAP (Negative Consent Approval Protocol)** is a high-velocity decision-making framework designed to authorize routine operational actions without requiring formal meetings or affirmative votes. It operates on the principle that **silence equals consent**: if relevant stakeholders are notified and choose not to object within a specified timeframe, the action is approved.

### 1.1 Core Principles

1.  **Speed over Consensus:** Bias toward action for reversible decisions.
2.  **Independent Oversight:** Proposers cannot self-approve; at least one other person must review.
3.  **Safety Valves:** Robust objection mechanisms stop the clock immediately.
4.  **Escalation:** Controversial items are kicked to formal Committee meetings, not fought over in NCAP.

---

## 2. Scope & Authority

### 2.1 Authorized Uses (Rule 49.1.a)

NCAP is suitable for:

- **Routine Communications:** Social media posts, press releases, newsletters.
- **Minor Expenditure:** Spending within delegated budget limits (see Financial Authorization).
- **Operational Decisions:** Software updates, minor process changes, event logistics.
- **Low-Risk Actions:** Decisions that are easily reversible if problems emerge.

### 2.2 Prohibited Uses (Rule 52.1)

NCAP **cannot** be used for:

- **Constitutional Amendments**
- **Membership Termination** or serious discipline.
- **Major Budget Adoption** or spending above delegated limits.
- **Candidate Endorsements** or sensitive political strategy.
- **Legal Matters** or compliance risks.
- **Personnel Decisions** (hiring/firing).

---

## 3. Core Mechanics

### 3.1 The Timer ($T$)

Every NCAP request starts with an initial timer ($T$) based on urgency and complexity.

- **Default:** $T$ counts down.
- **Approval:** Reduces $T$ (accelerates decision).
- **Objection:** Increases $T$ (delays decision) and pauses for hearing.

### 3.2 Dynamic Timer Calculation

The timer adjusts in real-time based on the **approver pool's** participation:

$$ T*{current} = T*{initial} \times (1 - 0.5 \times ApprovalRate + 1.0 \times ObjectionRate) $$

- **Approval Rate:** % of pool voting ✅. Max reduction is 50% of initial timer.
- **Objection Rate:** % of pool voting 🛑. Objections have double the weight of approvals.
- **Floor:** Timer cannot go below $0.5 \times T$ (unless Supermajority Bypass applies).
- **Ceiling:** Timer cannot exceed $2.0 \times T$.

### 3.3 Gantries (Final Buffers)

Gantries are fixed "final call" windows before a decision is finalized.

| Type                 | Trigger                              | Duration  | Outcome if Expired      |
| :------------------- | :----------------------------------- | :-------- | :---------------------- |
| **Natural Approval** | Timer reaches 25% naturally          | ~0.25 × T | **APPROVED**            |
| **Voted Approval**   | Timer reduced to Floor by votes      | 0.5 × T   | **APPROVED**            |
| **Objection**        | Timer hits Ceiling due to objections | 0.25 × T  | **BLOCKED** (Escalated) |

### 3.4 Supermajority Bypass

If **≥75%** of the approver pool votes **APPROVE**:

- Timer is bypassed.
- Gantries are skipped.
- Decision is **APPROVED IMMEDIATELY**.

---

## 4. Workflow

### 4.1 Submission

1.  **Proposer** submits request via Discord command (`/ncap-submit`).
2.  **Parameters:**
    - Content/Description
    - Approver Pool (e.g., Communications WG)
    - Initial Timer ($T$)
3.  **Bot** posts authorization request to relevant channel (`#auth-socmed`, `#auth-general`).

### 4.2 Review & Voting

Pool members react with emojis:

- ✅ **APPROVE:** "Looks good." Reduces timer.
- 🛑 **OBJECT:** "Stop, I have concerns." Pauses timer, opens hearing.

### 4.3 Objection Hearing

1.  **Trigger:** Any 🛑 reaction immediately pauses the main timer.
2.  **Hearing Thread:** Bot creates a private thread for discussion (15 min duration).
3.  **Resolution:**
    - **Dismissed:** Pool votes to dismiss objection (requires 2+ votes). Timer resumes.
    - **Validated:** Pool votes to uphold objection. Timer doubles (may hit Ceiling).
    - **Expired:** No consensus. Objection discarded, timer resumes.

### 4.4 Finalization

- **Approved:** Bot posts "PUBLISHED" status. Action can proceed.
- **Blocked:** Bot posts "ESCALATED" status. Sent to next Committee meeting.
- **Withdrawn:** Proposer cancels request.

---

## 5. Categories & Default Timers (Schedule B)

Timers are guidelines. Proposers should select based on specific context.

| Category        | Timer ($T$)   | Typical Use Case                  | Approver Pool     |
| :-------------- | :------------ | :-------------------------------- | :---------------- |
| **Urgent**      | 4 - 12 hours  | Comms, rapid response, fixes      | Relevant WG       |
| **Routine**     | 12 - 24 hours | Minor spend, admin, ops           | Relevant WG       |
| **Standard**    | 24 - 48 hours | Most operational decisions        | Relevant WG       |
| **Significant** | 48 - 72 hours | Policy drafts, cross-WG items     | Committee / Logic |
| **Major**       | 72+ hours     | Governance, strategy, large spend | Committee         |

_Note: Active hours are typically 09:00 - 21:00 AEST/AEDT. Timers pause overnight._

---

## 6. Financial Authorizations (Rule 50)

NCAP can verify spending **within** delegated limits.

### 6.1 Requirements

- Must state exact amount or range.
- Must identify budget line item.
- Must confirm funds are available.
- Receipt must be uploaded within 7 days of expenditure.

### 6.2 Limits (Schedule B)

- **Working Group Coordinators:** Up to $X / transaction.
- **Committee Members:** Up to $Z / transaction.
- **Over Limit:** Requires formal Committee vote.

---

## 7. Technical Implementation

The NCAP system is automated via the **Fusion Governance Bot**.

- **Input:** `#comms-drafts`, `#ncap-requests`
- **Auth Channels:** `#auth-socmed` (Public), `#auth-general` (Internal)
- **Archives:** `#exec-meta` (The Menu) - Public record of all decisions.

### 7.1 Commands

- `/ncap-submit [channel] [urgency] [content]`
- `/ncap-status [id]`
- `/ncap-withdraw [id]`

### 7.2 Transparency

All NCAP decisions are logged.

- **Approved items** are published to `#exec-meta`.
- **Blocked items** are added to Committee agenda.
- **Data** is auditable by any member.
