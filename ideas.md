# Dayflow HRMS — Design Exploration

## Three possible directions

### 1. Editorial Workbench
**Very Brief Intro:** A calm, high-trust operations console shaped by editorial spacing, warm paper surfaces, and disciplined data presentation. It makes people administration feel clear and humane rather than bureaucratic.

**Probability:** 0.06

### 2. Civic Ledger
**Very Brief Intro:** A utilitarian, municipal-inspired system built from strong rules, compact tables, and archival details. It signals procedural integrity and administrative control.

**Probability:** 0.03

### 3. Daylight Studio
**Very Brief Intro:** A soft, optimistic workspace with sunlit color fields and gentle dimensional objects. It frames HR operations as employee support, not surveillance.

**Probability:** 0.08

## Chosen approach: Editorial Workbench

### Design Movement
Contemporary editorial systems design, translated for an internal operations product. The interface borrows the hierarchy, measured rhythm, and calm confidence of a well-produced annual report rather than a generic SaaS dashboard.

### Core Principles
1. **Clarity over decoration:** Information has a deliberate order, with compact labels, generous line-height, and useful contrast.
2. **Warm precision:** Off-white paper surfaces and graphite text make payroll, attendance, and approvals feel reliable without becoming sterile.
3. **Role-aware composition:** Employee and HR views share a visual grammar, but HR gains wider operational panels and decisive review tools.
4. **Tactile restraint:** Hairline dividers, subtle paper grain, and restrained shadows create depth without card clutter.

### Color Philosophy
The base is warm parchment rather than bright white to reduce the harshness of long administrative sessions. Graphite provides a serious, highly legible anchor. A deep teal communicates action and system confidence; ember orange marks attention and incomplete work. Pale sage and rose are status surfaces, not decorative colors.

### Layout Paradigm
The application uses a persistent left rail on desktop, a slim utility strip, and a staggered editorial workspace. The main content is composed as broad asymmetric columns, split by vertical rules and quiet side annotations; it does not rely on a single centered stack of identical cards. On mobile, the navigation becomes a compact top bar and panels form a single readable sequence.

### Signature Elements
1. A tall, softly rounded **daylight bar** that anchors the dashboard’s left edge and changes tone by status.
2. **Ledger labels** in compact uppercase mono type paired with oversized human-readable values.
3. A subtle dotted-paper texture and fine rule lines that connect sections without heavy boxes.

### Interaction Philosophy
Every interaction should feel like moving a well-organized paper file: immediate, legible, and reversible where appropriate. Buttons compress lightly on press, filter changes are obvious, and important decisions use a focused confirmation surface rather than hidden state.

### Animation
Use a 180–240ms custom ease-out for panel entrance, tab changes, and toasts. Dashboard elements may rise 6px with a short stagger on route change. Hover changes should be limited to a border shift, a small translateY movement, and a shadow refinement. All nonessential motion must respect `prefers-reduced-motion`.

### Typography System
**Space Grotesk** is the display and interface headline font: assertive but human. **DM Mono** is used only for labels, dates, metadata, and amount anchors. Headings use a tight tracking value; dense tables use Space Grotesk at comfortable 14–15px with DM Mono for IDs, dates, and numeric sublabels.

### Brand Essence
**Dayflow is a calmer HR operating desk for small teams that need people data to stay clear, current, and human.**

Personality adjectives: **grounded, precise, considerate.**

### Brand Voice
Headlines are direct and low-drama; CTAs are action-based and specific. Microcopy confirms context rather than congratulating users generically.

Example lines: “Keep today’s people work moving.” and “One pending request needs your decision.”

### Wordmark & Logo
The Dayflow mark is a bold abstract **D** made from two offset, flowing vertical forms: one deep teal, one warm ember. It suggests a workday moving forward while remaining recognizable at favicon scale. The full wordmark pairs the icon with custom-spaced Space Grotesk lettering, never a default wordmark treatment.

### Signature Brand Color
**Dayflow Teal — #0B6E69**. This is the system’s ownable action color and the anchor for navigation, focus states, and key progress signals.

## Style Decisions
- Authentication uses a visible daylight bar, hairline ledger rules, DM Mono access annotations, and squared paper-file controls rather than generic floating SaaS cards.
- Large photography is always treated as a documented people-operations artefact, paired with file labels and restrained operational metadata.
- The Dayflow identity is the abstract teal-and-ember D paired with deliberately tight, two-tone Space Grotesk lettering.

## Verification Notes
- The live authentication screen renders the intended Dayflow logo, desk-file metadata, access fields, password guardrails, and documentary workspace visual. Demo Employee and HR access controls are visible for validation.
- HR demo sign-in successfully opens the role-aware overview with team metrics, people roster, attendance overview, leave decision queue, left-rail navigation, and perspective switch. The present-percentage metric was detected as a literal interpolation string and requires correction before delivery.
- Hot reload intentionally clears the in-memory demonstration session; the named demo controls re-populate valid credentials so the HR and employee states remain quick to test.
- The corrected HR dashboard now shows the computed 75% present metric. The HR leave screen renders a decision queue with employee context, dates, statuses, and review controls for all pending requests.
- Switching the HR session to employee perspective replaces the decision queue with a self-service leave form and a personal history view. The employee overview shows the required profile, attendance, leave-request, and payroll quick actions plus a current check-out action and recent activity ledger.
- Employee attendance renders the check-out action, status legend, and a concise daily/weekly ledger. The daily toggle correctly reduces the record table to the current date.
