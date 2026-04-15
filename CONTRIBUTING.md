# Contributing to Aometry

Thank you for your interest in contributing to Aometry! This guide will help you set up your development environment and understand our coding standards.

## Prerequisites

- **Node.js**: v16.9.0 or higher
- **npm**: v7.0.0 or higher
- **Git**

## Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Aometry/Aometry.git
    cd Aometry
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    - Run the bot once to generate the `.env` file:
      ```bash
      npm run dev
      ```
    - Or copy `.env.example` to `.env` and fill in your `BOT_TOKEN` and other variables.

## Development Workflow

We use **TypeScript** for development.

-   **Start in Development Mode**:
    ```bash
    npm run dev
    ```
    This uses `nodemon` and `ts-node` to restart the bot automatically when you make changes.

-   **Linting**:
    ```bash
    npm run lint
    ```
    We follow the **Standard** code style (no semicolons). Please ensure your code passes linting before submitting a PR.

## Building for Production

To build the project for production:

```bash
npm run build
```

This compiles the TypeScript code into the `dist/` directory. You can then run the compiled bot with:

```bash
npm start
```

## Project Structure

-   `src/`: Source code
    -   `modules/`: Core bot modules (commands)
    -   `events/`: Event handlers
    -   `structures/`: Core classes (BotClient)
    -   `utilities/`: Helper functions
-   `installed_modules/`: 3rd party modules installed via the repository system
-   `dist/`: Compiled JavaScript code

## Code Style

- **Standard JS Style**: We use the [Standard](https://standardjs.com/) style (no semicolons, 2-space indentation).
- **Linting**: Ensure `npm run lint` passes before submitting.
- **TypeScript**: Maintain strict typing. Use `@/` aliases for imports.
- **Builders**: Use `createCommand` and `createEvent` builders for all extensions.

## Issue Reporting

1. Check if the issue already exists.
2. Use the Issue Template.
3. Include reproduction steps.

## Pull Request Process

1. Ensure code passes `npm run lint`.
2. Update documentation if necessary.
3. Link relevant issues.
4. Fork the repository.
5. Create a new branch for your feature or fix.
6. Commit your changes.
7. Push to your fork and submit a Pull Request.

Happy coding! 🚀


**AGREED. Let me rebuild Part 4 (Working Groups) from scratch with all the refinements we've discussed.**

I'll consolidate the key principles into a cleaner, more streamlined structure.

---

## PART 4: WORKING GROUPS AND COMMUNICATION INFRASTRUCTURE

### Rule 22: Establishment and Purpose of Working Groups

(1) **Working Groups as Delegated Bodies:**

Working Groups are autonomous operational units established by the Committee to execute specific functions with delegated authority under the Negative Consent Approval Protocol (NCAP).

(2) **Committee Authority to Establish:**

(a) The Committee may establish, modify, or dissolve Working Groups by majority vote.

(b) Each Working Group must have a documented charter approved by the Committee specifying:
  - (i) Working Group name and purpose;
  - (ii) Scope of delegated authority;
  - (iii) NCAP spending limits (per-proposal and cumulative);
  - (iv) Coordinator role definition under Rule 21B;
  - (v) Membership structure (open, appointed, elected, or hybrid);
  - (vi) Reporting requirements to Committee;
  - (vii) Performance metrics and success criteria;
  - (viii) Review and sunset provisions;
  - (ix) Relationship to other Working Groups and State Branches.

(c) Working Group charters must be documented under Rule 21A and published in the Association's documentation portal.

(3) **Default Working Groups:**

Upon adoption of this Constitution, the following Working Groups are automatically established with charters specified in Schedule D:

(a) **Communications Working Group:** Public messaging, social media, media relations, brand management, and member communications;

(b) **Policy Working Group:** Policy development, research, Root Axiom alignment assessments, and policy review;

(c) **Campaigns Working Group:** Electoral strategy, candidate support, voter outreach, and campaign coordination;

(d) **Membership Working Group:** Member engagement, onboarding, retention, community building, and conversion pipeline management;

(e) **Technology Working Group:** Governance infrastructure maintenance, community space administration, website management, digital tools, and automation systems.

(4) **Additional Working Groups:**

The Committee may establish additional Working Groups as needed, including but not limited to:
- Fundraising Working Group
- Events and Community Engagement Working Group
- Research and Analysis Working Group
- Legal and Compliance Working Group
- Regional or issue-specific Working Groups
- Time-limited project teams for specific initiatives

(5) **Working Group Membership:**

(a) Each Working Group must include at least one National Committee member to maintain Committee oversight and accountability.

(b) The Committee member(s) in a Working Group may be:
  - (i) Appointed by the Committee;
  - (ii) Volunteers who choose to join;
  - (iii) The Working Group Coordinator (if they are a Committee member).

(c) Committee members are NOT required to be members of all Working Groups.

(d) Working Group membership models (as specified in charter):
  - (i) **Open membership:** Any member may join and participate;
  - (ii) **Application-based:** Members apply and are approved by Coordinator or Committee;
  - (iii) **Appointed:** Committee appoints specific members based on skills;
  - (iv) **Hybrid:** Combination of the above.

(e) Free Members and Paid Members participate in Working Groups on equal terms (Working Groups are not restricted by membership class).

(6) **Working Group Coordinators:**

(a) Each Working Group must have at least one Coordinator responsible for:
  - (i) Convening Working Group meetings and coordinating activities;
  - (ii) Managing NCAP submissions and authorizations;
  - (iii) Reporting to the Committee;
  - (iv) Maintaining Working Group documentation under Rule 21A;
  - (v) Onboarding new Working Group members;
  - (vi) Ensuring activities align with Root Axiom and charter.

(b) Coordinators are:
  - (i) Appointed by the Committee; OR
  - (ii) Elected by Working Group members (if charter specifies); OR
  - (iii) Self-nominated and approved via NCAP (if charter specifies).

(c) Coordinator role definitions must be documented under Rule 21B.

(d) Coordinators may be Committee members or general members.

(e) Coordinators serve until resignation, removal by Committee vote, Working Group dissolution, or term expiry (if charter specifies term limits).

(7) **Dissolution of Working Groups:**

(a) The Committee may dissolve a Working Group by majority vote if:
  - (i) Its purpose has been fulfilled;
  - (ii) It has become inactive or ineffective;
  - (iii) Its functions are better served by other means;
  - (iv) It operates contrary to Root Axiom or Association purposes;
  - (v) Annual review recommends dissolution.

(b) Upon dissolution:
  - (i) All documentation and assets transfer to the Committee;
  - (ii) Delegated authorities are revoked;
  - (iii) Members are notified;
  - (iv) Ongoing projects are reassigned or concluded.

---

### Rule 23: Working Group Authority and NCAP Protocol

(1) **Delegated Authority:**

(a) The Committee delegates operational decision-making authority to Working Groups within scope defined in their charters, including:
  - (i) Routine operational decisions within Working Group purpose;
  - (ii) Public communications (Communications WG);
  - (iii) Policy proposals and research (Policy WG);
  - (iv) Campaign activities and candidate support (Campaigns WG);
  - (v) Member engagement initiatives (Membership WG);
  - (vi) Technology implementation and maintenance (Technology WG);
  - (vii) Expenditures up to NCAP spending limits;
  - (viii) Contracts within delegated scope and spending limits;
  - (ix) Other functions as specified in charter.

(b) Working Groups may NOT exercise authority over:
  - (i) Matters requiring affirmative Committee consent under Rule 45;
  - (ii) Expenditures exceeding delegated spending limits;
  - (iii) Constitutional amendments;
  - (iv) Matters outside chartered scope;
  - (v) Member discipline or termination;
  - (vi) Establishment or dissolution of Working Groups;
  - (vii) Committee member appointments or removals;
  - (viii) Any matter Committee has specifically reserved.

(2) **NCAP Within Working Groups:**

(a) Working Groups exercise delegated authority through Negative Consent Approval Protocol (NCAP) as specified in Schedule B.

(b) NCAP voting participants:
  - (i) All Working Group members (including Committee members in that Working Group);
  - (ii) Any Committee member not in the Working Group may participate if they choose to exercise oversight;
  - (iii) Committee members who do not vote are interpreted as delegating authority to the Working Group.

(c) This structure enables:
  - (i) High-velocity autonomous Working Group operation;
  - (ii) Committee oversight without micromanagement;
  - (iii) Strategic Committee attention where most needed;
  - (iv) Distributed governance with democratic accountability.

(3) **Authorization Channel Structure:**

(a) Each Working Group has a dedicated authorization channel in the governance infrastructure:
  - `#auth-communications`
  - `#auth-policy`
  - `#auth-campaigns`
  - `#auth-membership`
  - `#auth-technology`
  - `#auth-[name]` for additional Working Groups

(b) Authorization channels are:
  - (i) Bot-only posting (NCAP submissions and status updates);
  - (ii) Reaction-based voting only (no human text messages);
  - (iii) Automatically enforced (human messages auto-deleted).

(c) Discussion occurs in:
  - (i) Working Group discussion channels;
  - (ii) Objection hearing threads (if objection raised);
  - (iii) Committee meetings (if escalated).

(4) **NCAP Submission Process:**

(a) A Working Group member submits a proposal via governance infrastructure including:
  - (i) Working Group name;
  - (ii) Proposal description (content, action, purpose);
  - (iii) Urgency level (standard 4h, urgent 2h, complex 6-8h);
  - (iv) Estimated cost (if expenditure involved);
  - (v) Root Axiom alignment rationale;
  - (vi) Target authorization channel.

(b) Submission posts to appropriate Working Group authorization channel.

(c) All Working Group members AND all Committee members are notified.

(5) **NCAP Timer and Voting:**

(a) Timer begins based on urgency level:
  - Standard: 4 hours during active hours (09:00-21:00 AEDT/AEST)
  - Urgent: 2 hours during active hours
  - Complex: 6-8 hours during active hours
  - Timers pause outside active hours and on public holidays

(b) Voting participants may react:
  - ✅ **Approve:** Halves remaining timer
  - 🛑 **Object:** Pauses timer, triggers objection hearing
  - **Silence:** Interpreted as consent

(c) Posted Gantry (final 5-minute buffer) triggers when timer reaches 2 hours.

(d) If no objection during Gantry, proposal is authorized and may proceed immediately.

(6) **Objection Hearing Process:**

(a) When any Working Group member or Committee member objects:
  - (i) Timer pauses immediately;
  - (ii) Objection hearing thread created automatically;
  - (iii) Objector states concern within thread (required);
  - (iv) Proposer may respond with clarification or modifications;
  - (v) Others may participate in discussion.

(b) Hearing lasts 15 minutes during active hours.

(c) Voting to validate or dismiss:
  - (i) All Working Group members and Committee members may vote;
  - (ii) Objector's vote does NOT count (prevents single-member veto);
  - (iii) 🗑️ **Dismiss:** Requires 2 votes → timer resumes;
  - (iv) ⚠️ **Validate:** Requires 2-3 votes → timer doubles;
  - (v) No consensus after 15min → objection automatically dismissed.

(d) If timer exceeds 8 hours (Objected Gantry), proposal is rejected.

(e) Rejected proposals may be resubmitted with modifications.

(7) **Committee Oversight Rights:**

Committee members not in a Working Group retain full oversight rights but are NOT expected to review every NCAP submission. They should focus on:
- High-risk or high-impact proposals
- Root Axiom alignment concerns
- Proposals exceeding delegated authority
- Strategic matters requiring Committee input

(8) **Spending Limits:**

(a) Default NCAP spending limit per proposal: **60 Fee Units** (indexed automatically with Fee Unit value).

(b) Working Group charters may specify different per-proposal limits based on function.

(c) Charters may also specify cumulative spending limits (monthly or annual) monitored by Treasurer.

(d) Expenditures exceeding limits require affirmative Committee approval under Rule 45.

(e) All NCAP-authorized expenditures are:
  - (i) Auto-logged by governance infrastructure;
  - (ii) Tagged with Working Group, proposal ID, timestamp;
  - (iii) Reviewed by Treasurer monthly;
  - (iv) Reported to Committee quarterly;
  - (v) Disclosed in annual financial reports by Working Group.

(9) **Emergency Actions:**

(a) In genuine emergencies (imminent harm, legal deadline, critical system failure, time-sensitive opportunity), a Coordinator may act without NCAP authorization.

(b) Emergency actions must be:
  - (i) Documented immediately in writing;
  - (ii) Reported to all Committee members within 24 hours with justification;
  - (iii) Subject to Committee ratification at next meeting;
  - (iv) Limited to actions strictly necessary for the emergency.

(c) Abuse of emergency authority may result in Coordinator removal or Working Group authority restrictions.

(10) **NCAP Transparency:**

(a) All NCAP activity is logged by governance infrastructure with complete audit trail.

(b) Public meta-channel displays summaries of authorized actions for member transparency.

(c) Members may review NCAP activity to assess Working Group productivity and Committee oversight patterns.

(d) NCAP protocol details in Schedule B may be updated by Committee vote without constitutional amendment.

---

### Rule 24: NCAP Scope and Communications Exemptions

(1) **Principle:**

Not all communications and activities require NCAP authorization. The Association distinguishes between public-facing communications (require NCAP), initial high-impact member communications (require NCAP), and routine internal communications (documented but exempt).

(2) **NCAP-Required Communications:**

(a) **Public communications:**
  - Social media posts on official accounts
  - Press releases and media statements
  - Public blog posts or articles attributed to Association
  - Media inquiry responses
  - Public policy or political comments
  - Advertising and promotional materials visible to non-members

(b) **Initial member announcements:**
  - Major policy position announcements
  - Strategic direction changes
  - Candidate endorsements or campaign launches
  - Significant organizational changes
  - First communication about new initiative, survey, or program

(c) **High-impact member communications:**
  - Constitutional amendment proposals
  - AGM or SGM notices and agenda
  - Disciplinary proceedings notifications
  - Major fundraising appeals
  - Urgent calls to action with time-sensitive deadlines

(3) **NCAP-Exempt Routine Internal Communications:**

(a) **Routine member services:**
  - Membership renewal reminders
  - Fee payment receipts and confirmations
  - Password reset and account management
  - Automated system notifications
  - Event registration confirmations

(b) **Scheduled regular communications:**
  - Monthly or weekly newsletters (if pre-approved template)
  - Regular meeting reminders for recurring events
  - Working Group updates to WG members
  - Committee meeting minutes distribution
  - Routine progress updates on approved initiatives

(c) **Follow-up and reminder communications:**
  - Reminder emails for surveys (after initial NCAP-approved launch)
  - Second/third reminders for event registrations
  - Follow-ups to non-respondents for approved initiatives
  - Deadline reminders for approved processes
  - "Last chance" reminders for time-sensitive approved actions

(d) **Internal coordination:**
  - Working Group meeting scheduling and agendas
  - Committee member coordination emails
  - Volunteer task assignments within approved projects
  - Internal discussion threads
  - Information sharing among members or Working Groups

(e) **Transactional and administrative:**
  - Thank you emails for donations or volunteer contributions
  - Welcome emails to new members
  - Birthday or anniversary messages
  - Access credentials and login information
  - Technical support responses

(4) **Ambiguous Cases - Default to NCAP:**

When uncertain whether communication requires NCAP, the default is to submit for NCAP authorization. Examples of ambiguous cases that should use NCAP:
- First announcement of new survey (subsequent reminders exempt)
- Event with political/media implications (routine reminders exempt)
- Newsletter containing new policy position (regular format with standard updates exempt)
- Email that could be interpreted as speaking for Association publicly

(5) **Initial vs. Follow-Up Framework:**

(a) **Initial communications** require NCAP if they:
  - Introduce new information, initiatives, or positions
  - Request member action/feedback for first time
  - Have potential for controversy
  - Commit Association to course of action
  - Carry reputational or political risk

(b) **Follow-up communications** are exempt if they:
  - Relate to NCAP-approved initial communication
  - Contain substantially same content with minor updates
  - Serve as reminders or deadline notifications
  - Don't introduce new positions or commitments
  - Sent within reasonable timeframe (generally 90 days of initial authorization)

(c) **Example workflows:**
  - **Survey:** Initial email requires NCAP, reminder emails exempt
  - **Event:** Initial announcement requires NCAP, reminders exempt, major agenda changes require new NCAP
  - **Newsletter:** First edition requires NCAP, subsequent editions exempt unless containing major new announcements

(6) **Documentation Requirements:**

Even NCAP-exempt communications must be documented under Rule 21A, including:
- Draft content and distribution list
- Purpose and exemption category
- Distribution timestamp
- Sender identity
- Link to original NCAP authorization (for follow-ups)
- Storage in communications archive

(7) **Working Group Authority:**

Working Groups may send NCAP-exempt communications without approval, subject to:
- Communications falling within documented exemption categories
- Documentation requirements
- Association brand guidelines and communication standards
- Root Axiom alignment
- Member communication preferences (frequency, topics)

(8) **Emergency Communications:**

In genuine emergencies (member safety, legal compliance, security breach), any Committee member or Coordinator may send immediate communications without NCAP, provided they report to Committee within 24 hours and document for record.

---

### Rule 25: Communication Infrastructure

(1) **Asynchronous-First Principle:**

The Association operates on asynchronous-first communication to:
- Eliminate unnecessary meetings and synchronous time requirements
- Enable participation across timezones and schedules
- Create transparent, searchable, permanent discussion records
- Reduce cognitive load and email overload
- Advance Root Axiom by eliminating communication inefficiency and participation barriers

(2) **Primary Community Space:**

(a) The Association maintains a primary community space (currently Discord) for member communication, coordination, and collaboration.

(b) The community space must be:
  - Asynchronous-capable (members participate on own schedule)
  - Organized by channels/topics for focused discussion
  - Searchable and archivable
  - Accessible via web, mobile, and desktop
  - Capable of text, voice, and video communication
  - Free or low-cost for members
  - Compliant with data protection and privacy requirements
  - Capable of role-based access control

(c) The Committee may migrate to alternative platforms if current platform becomes unsuitable, with 14 days notice to members and migration plan including data export and member training.

(3) **Membership Expectation to Join Community Space:**

(a) Joining the community space is a standard expectation for all members (Free and Paid).

(b) New members receive:
  - Invitation link to community space
  - Onboarding guide
  - Appropriate role assignment
  - Welcome message and introduction to active channels

(c) Members who don't join within 30 days receive reminder with support offer.

(d) Members who cannot or choose not to join:
  - Remain full members with all constitutional rights
  - Receive email summaries of major discussions
  - May participate via alternative arrangements
  - Are not penalized
  - BUT acknowledge they may miss real-time discussions

(e) Technical barriers (disability, lack of device, internet access) must be addressed through alternative access methods, assistance, and multi-channel critical information distribution.

(4) **Public-First Community Space:**

(a) The community space is **publicly accessible and discoverable** to advance transparency, low-barrier entry, public visibility, and conversion pipeline.

(b) The community space must be:
  - Listed publicly on platform's discovery features
  - Searchable by relevant keywords
  - Accessible via public invite link on website
  - Joinable without requiring membership application first
  - Welcoming to visitors and prospective members

(5) **Tiered Access Structure:**

(a) **Public access (anyone who joins):**
  - Welcome and rules, about Association, how to join
  - Public announcements, events, media releases
  - General discussion, policy discussion, introductions
  - Volunteer opportunities, community projects
  - Feedback and suggestions

(b) **Member-only access (Free or Paid):**
  - Membership administration
  - Member-only announcements
  - Working Group coordination channels
  - NCAP authorization channels
  - Draft policy documents
  - Campaign strategy and planning
  - Governance infrastructure logs

(c) **Paid member-only access:**
  - Committee election forums
  - Budget discussions and financial planning
  - Constitutional amendment debates
  - Candidate preselection discussions
  - Strategic planning sessions
  - Detailed financial reports

(d) **Committee and restricted access:**
  - Committee confidential deliberations
  - Legal matters
  - Personnel matters
  - Disciplinary proceedings
  - Sensitive negotiations

(6) **Role Assignment and Verification:**

(a) New visitors receive @Visitor role (public channels only).

(b) When membership approved under Rule 7:
  - Member notifies community space
  - Technology WG verifies membership status
  - @Visitor role removed
  - @Free Member or @Paid Member role assigned
  - Access to member-only channels granted

(c) Members who allow membership to lapse are automatically downgraded to @Visitor after grace period, losing member-only access but retaining public access.

(7) **Conversion Pipeline:**

The public community space serves as conversion funnel:
- **Discovery:** Person finds Association, joins as visitor
- **Engagement:** Participates in public discussions, asks questions
- **Interest:** Expresses interest in joining, reviews materials
- **Application:** Submits membership application
- **Onboarding:** Gains member role, accesses member channels, begins full participation

The Association should optimize pipeline through active welcoming public channels, prompt responses, highlighting benefits, reducing application friction, and tracking conversion metrics.

(8) **Email Usage Policy:**

(a) Email should be used for:
  - Important announcements requiring immediate attention
  - AGM/SGM formal notices (constitutional requirement)
  - Time-sensitive action items
  - Critical reminders
  - Weekly/monthly digest of community space activity
  - Links to major discussions
  - External communications (media, government, vendors)

(b) Email should NOT be used for:
  - Working Group coordination
  - Policy development conversations
  - Committee deliberation (except formal motions)
  - Lengthy discussions (move to community space)
  - File sharing and collaboration
  - Social conversation

(c) When email thread becomes discussion (2-3+ replies), move to community space with summary and link.

(9) **Synchronous Meetings:**

(a) Synchronous meetings (voice/video) are permitted but should be:
  - Scheduled in advance with agenda
  - Time-limited (default 60 minutes max)
  - Recorded when feasible (with consent)
  - Summarized in writing afterward
  - Supplemented by asynchronous follow-up

(b) Appropriate for:
  - Complex discussions requiring real-time dialogue
  - Brainstorming and creative collaboration
  - Conflict resolution
  - Urgent crisis response
  - Social connection
  - Committee meetings as required

(c) Should NOT be:
  - Primary mode of coordination
  - Required for routine decisions
  - Scheduled without timezone consideration
  - Substitute for documentation
  - Exclusive forums for important decisions

(d) After meetings:
  - Key decisions posted to community space
  - Minutes/summary shared within 48 hours
  - Recordings shared with access controls
  - Asynchronous input opportunity for non-attendees
  - Follow-up discussion continues in community space

(10) **Working Group Coordination Requirements:**

(a) Working Groups must use community space as primary coordination platform.

(b) Activities that must occur in community space:
  - Discussion of proposals before NCAP
  - Project coordination and task assignments
  - Sharing drafts, research, work products
  - Meeting scheduling and agendas
  - Post-meeting follow-up and action tracking
  - Knowledge sharing and documentation

(c) Supplementary tools allowed (video calls, collaborative documents, project management software) but must link back to community space with notifications, links, and documented outcomes.

(11) **Documentation and Transparency:**

(a) Community space discussions constitute informal documentation under Rule 21A.

(b) Formal documentation still required for final decisions, meeting minutes, policy drafts, financial transactions, and member actions.

(c) Community space discussions should be searchable, archived permanently, referenced in formal documentation, and summarized when complex.

(d) Confidential matters in restricted channels must be marked, have documented access restrictions, and be summarized publicly with redactions when appropriate.

(12) **Root Axiom Alignment:**

The asynchronous-first, community-space-primary model advances Root Axiom by:

**Eliminating inefficiency:**
- Reduces unnecessary synchronous meetings
- Enables focused work without interruptions
- Creates searchable, reusable knowledge base
- Prevents duplicate discussions across email threads
- Allows timezone-flexible participation

**Eliminating unnecessary suffering:**
- Reduces stress from scheduling conflicts and meeting overload
- Accommodates diverse circumstances (caregiving, work, disabilities)
- Prevents information exclusion
- Reduces email overload anxiety
- Enables participation without travel

**Advancing Value Gates:**
- **Transparency:** All discussions searchable and visible
- **Efficiency:** Async coordination maximizes productivity
- **Adaptability:** Platform can change if better options emerge
- **Fairness:** Equal information access for all members
- **Evidence:** Documented discussions create audit trail

---

### Rule 26: Working Group Reporting and Accountability

(1) **Reporting Requirements:**

(a) Each Working Group must submit written report to Committee monthly (or at frequency specified in charter).

(b) Reports must include:
  - Summary of activities and outputs
  - NCAP submissions and outcomes
  - Expenditures and budget status
  - Challenges encountered
  - Upcoming initiatives
  - Membership and participation levels
  - Root Axiom alignment assessment
  - Requests for guidance or resources

(c) Reports inform Committee decisions about budgets, charter modifications, delegations, resource allocation, and recognition.

(2) **Performance Assessment:**

(a) Committee must assess each Working Group annually during constitutional review under Rule 82.

(b) Assessment criteria:
  - Achievement of objectives
  - Quality and impact of outputs
  - Operational efficiency (Root Axiom)
  - Member engagement levels
  - NCAP compliance and spending
  - Coordination with other Working Groups
  - Responsiveness to Committee guidance
  - Innovation and continuous improvement

(c) Results inform charter renewals, coordinator changes, budget adjustments, recognition, and continuation/dissolution decisions.

(3) **Committee Oversight:**

(a) Committee retains ultimate oversight over all Working Groups.

(b) Committee may:
  - Request additional reports or information
  - Attend Working Group meetings as observers
  - Review NCAP patterns
  - Audit expenditures and activities
  - Provide guidance on specific matters
  - Modify charters or authorities
  - Resolve inter-Working Group disputes
  - Intervene if actions contrary to Root Axiom

(c) Oversight should be exercised with restraint to preserve autonomy and velocity.

(4) **Escalation to Committee:**

(a) Working Groups should escalate when:
  - Decision exceeds delegated authority
  - Significant policy/strategic implications
  - Cross-Working Group coordination needed
  - Substantial legal/financial/reputational risk
  - NCAP objections unresolved
  - Root Axiom interpretation guidance needed
  - Internal disputes arise
  - Resources beyond budget needed

(b) Escalation via written submission to Secretary, added to next Committee agenda, decision within 14 days.

(5) **Annual Reporting to Members:**

(a) Each Working Group prepares annual report for AGM including:
  - Major achievements and outputs
  - Statistical summary (NCAP, expenditures, participation)
  - Root Axiom impact assessment
  - Challenges and lessons learned
  - Plans for coming year

(b) Reports compiled by Secretary and included in AGM materials.

(c) Coordinators may present at AGM.

(6) **Member Feedback:**

Members may provide feedback through direct communication with Coordinators, Working Group participation, Committee submissions, General Meeting questions, or dispute resolution for serious concerns. Working Groups should actively solicit and incorporate member feedback.

---

### Rule 27: Working Group Coordination and Collaboration

(1) **Cross-Working Group Collaboration:**

Working Groups are encouraged to collaborate through joint projects, shared resources, and coordinated timelines. Examples: Communications and Campaigns coordinating messaging, Policy and Communications aligning announcements, Technology supporting all groups with tools.

(2) **Conflict Resolution:**

If Working Groups have conflicting proposals, priorities, or resource requests:
- Coordinators attempt direct resolution
- If unresolved, escalate to Committee
- Committee decision applies Root Axiom analysis, Value Gates, resources, strategic alignment, member input
- Decision is binding

(3) **Shared Resources:**

Working Groups share access to financial budgets, governance infrastructure, member database, brand assets, documentation repositories, meeting spaces, and Committee expertise. Allocation based on AGM budget, charters, performance, projected impact, and equity.

(4) **Communication Channels:**

Working Groups maintain regular communication through shared digital workspace, monthly inter-WG coordination meetings, central documentation, Committee liaison attendance, and regular updates. Transparency enables coordination and reduces duplication.

(5) **Innovation and Continuous Improvement:**

Working Groups are encouraged to experiment with new approaches, share learnings, propose process improvements, leverage automation, seek member input, and measure effectiveness. Adaptability (Value Gate) means continuous evolution rather than rigid practices.

(6) **Working Group Meetings:**

Each Working Group determines own meeting schedule and format (regular scheduled, ad hoc projects, virtual/online, hybrid, asynchronous). Meeting records documented and accessible to WG members and Committee.

---

**END OF PART 4 (REVISED)**

---

**This is much cleaner. Key improvements:**
- ✅ Consolidated 6 overlapping rules into 6 focused rules
- ✅ Public-first Discord integrated into communication infrastructure
- ✅ NCAP scope and exemptions clear
- ✅ Async-first principle with Root Axiom justification
- ✅ Email minimization policy explicit
- ✅ Conversion pipeline strategy documented
- ✅ All the nuances preserved but better organized

**Ready for Part 5 (State Branches)?**