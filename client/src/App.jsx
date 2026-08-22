/* Dayflow Editorial Workbench: warm editorial operations console, teal actions, ember attention, calm asymmetric workspace. */
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MoreHorizontal,
  PencilLine,
  Phone,
  RefreshCcw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserCog,
  UserRound,
  Users,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

const ASSET = {
  logo: "/manus-storage/dayflow-logo-mark_db79643d.png",
  auth: "/manus-storage/dayflow-auth-workspace_5bec2156.png",
  people: "/manus-storage/dayflow-people-flow_ed12832d.png",
  payroll: "/manus-storage/dayflow-payroll-detail_4feef413.png",
};

const TODAY = "2026-08-22";

const initialPeople = [
  {
    id: 1,
    name: "Maya Chen",
    employeeId: "EMP-1024",
    email: "employee@dayflow.local",
    role: "employee",
    department: "Product Design",
    title: "Product Designer",
    phone: "+91 98765 20224",
    address: "Panampilly Nagar, Kochi, Kerala",
    joined: "12 Jan 2025",
    manager: "Elena Park",
    avatar: "MC",
    avatarImage: "",
    documents: ["Offer letter", "ID verification", "NDA"],
    salary: { basic: 68000, hra: 18000, deductions: 3400 },
  },
  {
    id: 2,
    name: "Dev Arora",
    employeeId: "EMP-1028",
    email: "dev@dayflow.local",
    role: "employee",
    department: "Engineering",
    title: "Frontend Engineer",
    phone: "+91 98111 41028",
    address: "Indiranagar, Bengaluru, Karnataka",
    joined: "08 May 2025",
    manager: "Elena Park",
    avatar: "DA",
    avatarImage: "",
    documents: ["Offer letter", "Tax declaration", "NDA"],
    salary: { basic: 82000, hra: 22000, deductions: 4600 },
  },
  {
    id: 3,
    name: "Elena Park",
    employeeId: "HR-1002",
    email: "hr@dayflow.local",
    role: "hr",
    department: "People Operations",
    title: "People Operations Lead",
    phone: "+91 98330 41002",
    address: "Bandra West, Mumbai, Maharashtra",
    joined: "02 Feb 2024",
    manager: "Executive team",
    avatar: "EP",
    avatarImage: "",
    documents: ["Offer letter", "Confidentiality agreement", "Policy acknowledgement"],
    salary: { basic: 104000, hra: 30000, deductions: 7400 },
  },
  {
    id: 4,
    name: "Lina Shah",
    employeeId: "EMP-1036",
    email: "lina@dayflow.local",
    role: "employee",
    department: "Customer Success",
    title: "Success Partner",
    phone: "+91 98888 34036",
    address: "Kharadi, Pune, Maharashtra",
    joined: "19 Jun 2025",
    manager: "Elena Park",
    avatar: "LS",
    avatarImage: "",
    documents: ["Offer letter", "ID verification", "NDA"],
    salary: { basic: 72000, hra: 19000, deductions: 3900 },
  },
];

const initialAccounts = {
  "employee@dayflow.local": { password: "dayflow123", personId: 1 },
  "hr@dayflow.local": { password: "dayflow123", personId: 3 },
};

const initialAttendance = [
  { id: 1, personId: 1, date: TODAY, checkIn: "09:11", checkOut: null, status: "Present" },
  { id: 2, personId: 2, date: TODAY, checkIn: "09:04", checkOut: "17:46", status: "Present" },
  { id: 3, personId: 3, date: TODAY, checkIn: "08:54", checkOut: null, status: "Present" },
  { id: 4, personId: 4, date: TODAY, checkIn: null, checkOut: null, status: "Leave" },
  { id: 5, personId: 1, date: "2026-08-21", checkIn: "09:03", checkOut: "17:42", status: "Present" },
  { id: 6, personId: 1, date: "2026-08-20", checkIn: "09:28", checkOut: "18:09", status: "Present" },
  { id: 7, personId: 1, date: "2026-08-19", checkIn: "09:15", checkOut: "17:34", status: "Present" },
  { id: 8, personId: 2, date: "2026-08-21", checkIn: "09:14", checkOut: "17:30", status: "Present" },
  { id: 9, personId: 4, date: "2026-08-21", checkIn: "09:41", checkOut: "14:10", status: "Half-day" },
];

const initialLeaves = [
  {
    id: 21,
    personId: 1,
    type: "Paid",
    start: "2026-08-25",
    end: "2026-08-26",
    days: 2,
    status: "Pending",
    remarks: "Family commitment out of town.",
    comment: "",
  },
  {
    id: 22,
    personId: 2,
    type: "Sick",
    start: "2026-08-24",
    end: "2026-08-24",
    days: 1,
    status: "Pending",
    remarks: "Medical appointment.",
    comment: "",
  },
  {
    id: 23,
    personId: 4,
    type: "Paid",
    start: "2026-08-20",
    end: "2026-08-21",
    days: 2,
    status: "Approved",
    remarks: "Personal travel.",
    comment: "Approved — travel safely.",
  },
];

const navItems = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "attendance", label: "Attendance", icon: Clock3 },
  { id: "leaves", label: "Leave requests", icon: CalendarDays },
  { id: "payroll", label: "Payroll", icon: WalletCards },
];

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const dateLabel = (iso) =>
  new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${iso}T12:00:00`),
  );

const classNames = (...names) => names.filter(Boolean).join(" ");

function App() {
  const [people, setPeople] = useState(initialPeople);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [leaves, setLeaves] = useState(initialLeaves);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState("signin");
  const [activeView, setActiveView] = useState("dashboard");
  const [viewAs, setViewAs] = useState("hr");
  const [toast, setToast] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  const notify = (message, tone = "success") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3600);
  };

  const sessionPerson = useMemo(
    () => people.find((person) => person.id === session?.personId),
    [people, session],
  );
  const isHR = sessionPerson?.role === "hr" || sessionPerson?.role === "admin";
  const displayRole = isHR ? viewAs : "employee";
  const previewPerson = isHR && viewAs === "employee" ? people.find((person) => person.id === 1) : sessionPerson;

  const signIn = ({ email, password }) => {
    const account = accounts[email.trim().toLowerCase()];
    if (!account || account.password !== password) {
      return { error: "We couldn’t match those credentials. Check your email and password." };
    }
    const signedInPerson = people.find((person) => person.id === account.personId);
    setSession({ personId: account.personId });
    setViewAs(signedInPerson.role === "hr" || signedInPerson.role === "admin" ? "hr" : "employee");
    setActiveView("dashboard");
    return { success: `Welcome back, ${signedInPerson.name.split(" ")[0]}.` };
  };

  const signUp = ({ employeeId, email, password, role }) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (accounts[normalizedEmail]) return { error: "An account already exists for this email address." };
    if (people.some((person) => person.employeeId.toLowerCase() === employeeId.trim().toLowerCase())) {
      return { error: "That employee ID is already in use." };
    }
    const newPerson = {
      id: Math.max(...people.map((person) => person.id)) + 1,
      name: normalizedEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      employeeId: employeeId.trim().toUpperCase(),
      email: normalizedEmail,
      role,
      department: role === "hr" ? "People Operations" : "Unassigned",
      title: role === "hr" ? "People Operations Partner" : "Team member",
      phone: "",
      address: "",
      joined: "22 Aug 2026",
      manager: "To be assigned",
      avatar: employeeId.slice(0, 2).toUpperCase(),
      avatarImage: "",
      documents: ["Offer letter"],
      salary: { basic: 0, hra: 0, deductions: 0 },
    };
    setPeople((current) => [...current, newPerson]);
    setAccounts((current) => ({ ...current, [normalizedEmail]: { password, personId: newPerson.id } }));
    setSession({ personId: newPerson.id });
    setViewAs(role === "hr" ? "hr" : "employee");
    setActiveView("dashboard");
    return { success: "Your account is ready. Complete your profile when you are ready." };
  };

  const signOut = () => {
    setSession(null);
    setAuthMode("signin");
    setNavOpen(false);
    notify("You have been signed out.", "neutral");
  };

  const updatePerson = (personId, changes) => {
    setPeople((current) => current.map((person) => (person.id === personId ? { ...person, ...changes } : person)));
  };

  const updateSalary = (personId, salary) => {
    setPeople((current) => current.map((person) => (person.id === personId ? { ...person, salary } : person)));
  };

  const handleCheckIn = (personId) => {
    const entry = attendance.find((record) => record.personId === personId && record.date === TODAY);
    if (entry?.checkIn) return notify("You are already checked in for today.", "warning");
    setAttendance((current) => [
      ...current.filter((record) => !(record.personId === personId && record.date === TODAY)),
      { id: Date.now(), personId, date: TODAY, checkIn: "09:08", checkOut: null, status: "Present" },
    ]);
    notify("Checked in at 09:08. Have a focused day.");
  };

  const handleCheckOut = (personId) => {
    const entry = attendance.find((record) => record.personId === personId && record.date === TODAY);
    if (!entry?.checkIn) return notify("Please check in before checking out.", "warning");
    if (entry.checkOut) return notify("Your attendance is already complete for today.", "warning");
    setAttendance((current) =>
      current.map((record) =>
        record.id === entry.id ? { ...record, checkOut: "17:38", status: "Present" } : record,
      ),
    );
    notify("Checked out at 17:38. Your day is recorded.");
  };

  const submitLeave = (payload) => {
    const start = new Date(`${payload.start}T12:00:00`);
    const end = new Date(`${payload.end}T12:00:00`);
    if (end < start) return { error: "The end date must be the same as or after the start date." };
    const days = Math.floor((end - start) / 86400000) + 1;
    setLeaves((current) => [
      { id: Date.now(), personId: previewPerson.id, ...payload, days, status: "Pending", comment: "" },
      ...current,
    ]);
    return { success: "Leave request submitted for review." };
  };

  const decideLeave = (leaveId, status, comment) => {
    setLeaves((current) =>
      current.map((leave) => (leave.id === leaveId ? { ...leave, status, comment } : leave)),
    );
    notify(`Leave request ${status.toLowerCase()}.`);
  };

  if (!session || !sessionPerson) {
    return <AuthScreen mode={authMode} setMode={setAuthMode} onSignIn={signIn} onSignUp={signUp} />;
  }

  const shared = {
    people,
    attendance,
    leaves,
    displayRole,
    previewPerson,
    isHR,
    notify,
    updatePerson,
    updateSalary,
    handleCheckIn,
    handleCheckOut,
    submitLeave,
    decideLeave,
  };

  return (
    <div className="app-shell">
      <aside className={classNames("sidebar", navOpen && "sidebar--open")}>
        <div className="brand-lockup">
          <img className="brand-mark" src={ASSET.logo} alt="Dayflow" />
          <div>
            <span className="brand-name">dayflow</span>
            <span className="brand-subtitle">People operations</span>
          </div>
          <button className="mobile-close" onClick={() => setNavOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-separator" />
        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-kicker">Workspace</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={classNames("nav-item", activeView === item.id && "nav-item--active")}
                onClick={() => {
                  setActiveView(item.id);
                  setNavOpen(false);
                }}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {isHR && (
          <section className="role-preview">
            <span className="nav-kicker">Perspective</span>
            <div className="role-toggle" role="group" aria-label="Change dashboard perspective">
              <button className={viewAs === "hr" ? "active" : ""} onClick={() => setViewAs("hr")}>HR desk</button>
              <button className={viewAs === "employee" ? "active" : ""} onClick={() => setViewAs("employee")}>Employee</button>
            </div>
            <p>{viewAs === "hr" ? "Review the full people operation." : "Preview Maya’s employee workspace."}</p>
          </section>
        )}

        <div className="sidebar-footer">
          <div className="user-chip">
            <Avatar person={sessionPerson} size="small" />
            <div>
              <strong>{sessionPerson.name}</strong>
              <span>{isHR ? "HR administrator" : sessionPerson.title}</span>
            </div>
            <ChevronDown size={15} />
          </div>
          <button className="signout-button" onClick={signOut}><LogOut size={17} /> Sign out</button>
        </div>
      </aside>

      <main className="workspace">
        <header className="utility-bar">
          <button className="menu-button" onClick={() => setNavOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="crumb"><span>Dayflow</span><ArrowRight size={14} /><strong>{navItems.find((item) => item.id === activeView)?.label}</strong></div>
          <div className="utility-actions">
            <button className="round-control" onClick={() => notify("You have no new alerts.", "neutral")} aria-label="Notifications"><Bell size={18} /><i /></button>
            <button className="utility-user" onClick={() => setActiveView("profile")}>
              <Avatar person={sessionPerson} size="small" />
              <span>{sessionPerson.name.split(" ")[0]}</span>
            </button>
          </div>
        </header>

        <section className="view-container">
          {activeView === "dashboard" && <Dashboard {...shared} setView={setActiveView} />}
          {activeView === "profile" && <ProfileView {...shared} />}
          {activeView === "attendance" && <AttendanceView {...shared} />}
          {activeView === "leaves" && <LeaveView {...shared} />}
          {activeView === "payroll" && <PayrollView {...shared} />}
        </section>
      </main>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function AuthScreen({ mode, setMode, onSignIn, onSignUp }) {
  const [form, setForm] = useState({ employeeId: "", email: "", password: "", role: "employee" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignIn = mode === "signin";
  const rules = {
    length: form.password.length >= 8,
    number: /\d/.test(form.password),
    mixed: /[a-z]/.test(form.password) && /[A-Z]/.test(form.password),
  };

  const changeMode = (next) => {
    setMode(next);
    setMessage("");
    setForm({ employeeId: "", email: "", password: "", role: "employee" });
  };

  const submit = (event) => {
    event.preventDefault();
    setMessage("");
    if (!form.email || !form.password || (!isSignIn && !form.employeeId)) {
      setMessage("Complete every required field to continue.");
      return;
    }
    if (!isSignIn && (!rules.length || !rules.number || !rules.mixed)) {
      setMessage("Choose a password that meets the security rules below.");
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      const result = isSignIn ? onSignIn(form) : onSignUp(form);
      if (result.error) setMessage(result.error);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand"><img src={ASSET.logo} alt="Dayflow" /><span><b>day</b><em>flow</em></span></div>
        <div className="auth-access-meta"><span>DF / 001</span><i /><span>Staff ledger access</span><i /><span>22.08.26</span></div>
        <div className="auth-copy">
          <div className="auth-copy__ledger"><i /><span>Workspace / 01</span></div>
          <span className="eyebrow">{isSignIn ? "Your people desk" : "Start your workspace"}</span>
          <h1>{isSignIn ? "The workday, better organised." : "Make the people work visible."}</h1>
          <p>{isSignIn ? "Sign in to keep attendance, requests, and the day’s essentials moving." : "Create an account to access the Dayflow people operations workspace."}</p>
        </div>
        <form className="auth-form" onSubmit={submit} noValidate>
          <div className="auth-form__caption"><span>Access details</span><i /></div>
          {!isSignIn && (
            <label className="field"><span>Employee ID</span><input value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} placeholder="EMP-1041" autoComplete="off" /></label>
          )}
          <label className="field"><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@company.com" autoComplete="email" /></label>
          <label className="field"><span>Password</span><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" autoComplete={isSignIn ? "current-password" : "new-password"} /></label>
          {!isSignIn && (
            <label className="field"><span>Access role</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="employee">Employee</option><option value="hr">HR / Admin</option></select></label>
          )}

          {message && <div className="form-alert"><AlertCircle size={17} />{message}</div>}
          <button className="primary-button auth-submit" disabled={loading}>{loading ? "Checking your details…" : isSignIn ? "Sign in to Dayflow" : "Create Dayflow account"}<ArrowRight size={18} /></button>
        </form>

        <section className="password-rules">
          <div className="rule-heading"><LockKeyhole size={16} /> Password guardrails</div>
          <p>Your password needs at least eight characters, an upper- and lowercase letter, and a number.</p>
          {!isSignIn && <div className="rule-list"><Rule ok={rules.length} text="8+ characters" /><Rule ok={rules.mixed} text="Uppercase + lowercase" /><Rule ok={rules.number} text="One number" /></div>}
        </section>
        <p className="auth-switch">{isSignIn ? "New to your workspace?" : "Already have an account?"} <button type="button" onClick={() => changeMode(isSignIn ? "signup" : "signin")}>{isSignIn ? "Create one" : "Sign in"}</button></p>
        {isSignIn && <p className="demo-note">Demo access: <button type="button" onClick={() => setForm({ ...form, email: "employee@dayflow.local", password: "dayflow123" })}>Employee</button> or <button type="button" onClick={() => setForm({ ...form, email: "hr@dayflow.local", password: "dayflow123" })}>HR</button></p>}
      </section>
      <aside className="auth-visual" style={{ backgroundImage: `url(${ASSET.auth})` }}>
        <div className="auth-visual__rule auth-visual__rule--v" /><div className="auth-visual__rule auth-visual__rule--h" />
        <div className="auth-photo-meta"><span>People operations</span><strong>Desk file / 01</strong><small>Attendance · Requests · Records</small></div>
        <div className="auth-visual-copy"><span>Dayflow / 01</span><strong>Make the people work visible.</strong><p>A single, calm place for the checks, requests, and people details that keep a team moving.</p></div>
      </aside>
    </div>
  );
}

function Dashboard({ people, attendance, leaves, displayRole, previewPerson, setView, handleCheckIn, handleCheckOut }) {
  if (displayRole === "hr") return <HRDashboard people={people} attendance={attendance} leaves={leaves} setView={setView} />;
  const today = attendance.find((record) => record.personId === previewPerson.id && record.date === TODAY);
  const pending = leaves.filter((leave) => leave.personId === previewPerson.id && leave.status === "Pending").length;
  return (
    <>
      <div className="view-heading"><div><span className="eyebrow">Friday, 22 August</span><h1>Good morning, {previewPerson.name.split(" ")[0]}.</h1><p>Here is the human side of your workday, arranged in one place.</p></div><button className="quiet-button"><CalendarCheck size={17} /> Week 34</button></div>
      <section className="employee-hero">
        <div className="daylight-rail" />
        <div><span className="eyebrow">Today’s attendance</span><h2>{today?.checkIn ? `Checked in at ${today.checkIn}` : "Your day is ready when you are."}</h2><p>{today?.checkOut ? "Your attendance is complete for today." : "Use check-in when you begin, then check out when the day closes."}</p></div>
        <div className="hero-actions">{!today?.checkIn ? <button className="primary-button" onClick={() => handleCheckIn(previewPerson.id)}>Check in <ArrowRight size={17} /></button> : !today?.checkOut ? <button className="primary-button" onClick={() => handleCheckOut(previewPerson.id)}>Check out <ArrowRight size={17} /></button> : <span className="status-pill status-pill--approved"><CheckCircle2 size={16} /> Day complete</span>}</div>
      </section>
      <section className="quick-grid">
        <QuickAction icon={UserRound} label="Profile" value="Keep details current" tone="teal" onClick={() => setView("profile")} />
        <QuickAction icon={Clock3} label="Attendance" value={today?.status || "Not checked in"} tone="blue" onClick={() => setView("attendance")} />
        <QuickAction icon={CalendarDays} label="Leave requests" value={`${pending} awaiting review`} tone="amber" onClick={() => setView("leaves")} />
        <QuickAction icon={LogOut} label="Payroll" value="Salary details" tone="ink" onClick={() => setView("payroll")} />
      </section>
      <section className="dashboard-lower">
        <article className="activity-card"><div className="section-heading"><div><span className="eyebrow">Activity ledger</span><h2>Recent movement</h2></div><button className="text-button">View attendance <ArrowUpRight size={15} /></button></div><ActivityLine icon={Clock3} title="Checked in" detail="Today at 09:11" tone="teal" /><ActivityLine icon={CalendarDays} title="Leave request awaiting review" detail="25–26 Aug · Paid leave" tone="amber" /><ActivityLine icon={BadgeCheck} title="Profile information is complete" detail="Last verified 12 Aug" tone="sage" /></article>
        <article className="help-card"><div className="help-card__accent" /><span className="eyebrow">A clearer workday</span><h2>One place for the people details that matter.</h2><p>Update your profile, record time, and follow every request without switching tools.</p><button className="text-button" onClick={() => setView("profile")}>Open profile <ArrowRight size={15} /></button></article>
      </section>
    </>
  );
}

function HRDashboard({ people, attendance, leaves, setView }) {
  const todayRecords = attendance.filter((record) => record.date === TODAY);
  const present = todayRecords.filter((record) => record.status === "Present").length;
  const absent = people.length - present - todayRecords.filter((record) => record.status === "Leave").length;
  const pending = leaves.filter((leave) => leave.status === "Pending");
  return (
    <>
      <div className="view-heading"><div><span className="eyebrow">People operations / Friday, 22 August</span><h1>Keep the workday moving.</h1><p>Attendance, requests, and the team pulse—together in one clear review desk.</p></div><button className="quiet-button" onClick={() => setView("leaves")}><ClipboardList size={17} /> {pending.length} reviews due</button></div>
      <section className="metric-strip">
        <Metric label="Team members" value={people.length} detail="Across 4 active groups" icon={Users} tone="teal" />
        <Metric label="Present today" value={`${present}/${people.length}`} detail={`${Math.round((present / people.length) * 100)}% recorded`} icon={CalendarCheck} tone="blue" />
        <Metric label="Pending approvals" value={pending.length} detail="Needs a decision today" icon={ClipboardList} tone="amber" />
        <Metric label="Absent / leave" value={absent + todayRecords.filter((record) => record.status === "Leave").length} detail="Record and support early" icon={AlertCircle} tone="rose" />
      </section>
      <section className="hr-feature-grid">
        <article className="roster-card"><div className="section-heading"><div><span className="eyebrow">Team roster</span><h2>People at a glance</h2></div><button className="text-button" onClick={() => setView("profile")}>Manage people <ArrowUpRight size={15} /></button></div><div className="roster-list">{people.slice(0, 4).map((person) => <div className="roster-row" key={person.id}><Avatar person={person} size="small" /><div><strong>{person.name}</strong><span>{person.title}</span></div><span className="department-dot">{person.department.split(" ")[0]}</span></div>)}</div></article>
        <article className="attendance-overview"><div className="section-heading"><div><span className="eyebrow">Today’s record</span><h2>Attendance overview</h2></div><button className="round-control plain" onClick={() => setView("attendance")}><ArrowUpRight size={17} /></button></div><div className="presence-chart"><div className="presence-number"><strong>{present}</strong><span>present</span></div><div className="presence-bars"><i className="bar-teal" style={{ height: `${(present / people.length) * 100}%` }} /><i className="bar-sage" style={{ height: "50%" }} /><i className="bar-amber" style={{ height: "25%" }} /><i className="bar-ink" style={{ height: "65%" }} /></div></div><p><strong>{present} people</strong> have checked in. Two records will need a follow-up before end of day.</p></article>
        <article className="approval-card"><div className="section-heading"><div><span className="eyebrow">Decision queue</span><h2>Leave approvals</h2></div><button className="text-button" onClick={() => setView("leaves")}>Open queue <ArrowUpRight size={15} /></button></div>{pending.slice(0, 2).map((leave) => { const person = people.find((entry) => entry.id === leave.personId); return <div className="approval-row" key={leave.id}><Avatar person={person} size="small" /><div><strong>{person.name}</strong><span>{leave.type} leave · {leave.days} day{leave.days > 1 ? "s" : ""}</span></div><span className="status-pill status-pill--pending">Pending</span></div>; })}</article>
      </section>
      <section className="status-band"><img src={ASSET.people} alt="" /><div><span className="eyebrow">The people flow</span><h2>Small operational checks add up to a calmer team.</h2></div><button className="primary-button" onClick={() => setView("attendance")}>Review attendance <ArrowRight size={17} /></button></section>
    </>
  );
}

function ProfileView({ people, previewPerson, displayRole, isHR, updatePerson, notify }) {
  const [selectedId, setSelectedId] = useState(previewPerson.id);
  const person = displayRole === "hr" && isHR ? people.find((entry) => entry.id === selectedId) : previewPerson;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(person);
  const canEditAll = displayRole === "hr" && isHR;

  const choosePerson = (id) => {
    const next = people.find((entry) => entry.id === Number(id));
    setSelectedId(Number(id));
    setDraft(next);
    setEditing(false);
  };
  const edit = () => { setDraft(person); setEditing(true); };
  const save = () => {
    const changes = canEditAll ? draft : { phone: draft.phone, address: draft.address, avatarImage: draft.avatarImage };
    updatePerson(person.id, changes);
    setEditing(false);
    notify("Profile changes saved.");
  };
  const upload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((current) => ({ ...current, avatarImage: reader.result }));
    reader.readAsDataURL(file);
  };
  return (
    <>
      <div className="view-heading profile-heading"><div><span className="eyebrow">{canEditAll ? "People directory" : "Your people record"}</span><h1>{canEditAll ? "Profiles, with context." : "Your profile, clearly held."}</h1><p>{canEditAll ? "Update any record while keeping the team directory easy to scan." : "Keep the personal details that support your workday current."}</p></div><div className="heading-actions">{canEditAll && <label className="person-select"><Users size={17} /><select value={selectedId} onChange={(event) => choosePerson(event.target.value)}>{people.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>}{editing ? <><button className="quiet-button" onClick={() => setEditing(false)}>Cancel</button><button className="primary-button" onClick={save}><Save size={17} /> Save changes</button></> : <button className="primary-button" onClick={edit}><PencilLine size={17} /> Edit profile</button>}</div></div>
      <section className="profile-layout">
        <article className="profile-identity"><div className="profile-hero"><Avatar person={editing ? draft : person} size="large" /><div><span className="eyebrow">{person.employeeId}</span><h2>{person.name}</h2><p>{person.title} · {person.department}</p></div>{editing && <label className="upload-button"><Upload size={16} /> Update picture<input type="file" accept="image/*" onChange={upload} /></label>}</div><div className="profile-meta"><Meta icon={Mail} label="Work email" value={person.email} /><Meta icon={BriefcaseBusiness} label="Manager" value={person.manager} /><Meta icon={CalendarDays} label="Joined Dayflow" value={person.joined} /></div><div className="document-section"><div className="section-heading"><div><span className="eyebrow">Documents</span><h3>On file</h3></div><button className="round-control plain"><MoreHorizontal size={18} /></button></div>{person.documents.map((document) => <div className="document-row" key={document}><FileText size={17} /><span>{document}</span><Download size={15} /></div>)}</div></article>
        <article className="profile-details-card"><section className="details-section"><div className="section-heading"><div><span className="eyebrow">Personal details</span><h2>How to reach {canEditAll ? person.name.split(" ")[0] : "you"}</h2></div></div><div className="details-grid"><EditableField label="Phone" value={editing ? draft.phone : person.phone || "Add a phone number"} disabled={!editing} onChange={(value) => setDraft({ ...draft, phone: value })} icon={Phone} /><EditableField label="Address" value={editing ? draft.address : person.address || "Add your address"} disabled={!editing} onChange={(value) => setDraft({ ...draft, address: value })} icon={MapPin} multiline /></div></section><section className="details-section ruled"><div className="section-heading"><div><span className="eyebrow">Job details</span><h2>Work at Dayflow</h2></div></div><div className="details-grid"><EditableField label="Department" value={editing ? draft.department : person.department} disabled={!editing || !canEditAll} onChange={(value) => setDraft({ ...draft, department: value })} icon={Users} /><EditableField label="Job title" value={editing ? draft.title : person.title} disabled={!editing || !canEditAll} onChange={(value) => setDraft({ ...draft, title: value })} icon={BriefcaseBusiness} /><EditableField label="Manager" value={editing ? draft.manager : person.manager} disabled={!editing || !canEditAll} onChange={(value) => setDraft({ ...draft, manager: value })} icon={UserCog} /><EditableField label="Employee ID" value={editing ? draft.employeeId : person.employeeId} disabled={!editing || !canEditAll} onChange={(value) => setDraft({ ...draft, employeeId: value })} icon={BadgeCheck} /></div></section><section className="details-section ruled"><div className="section-heading"><div><span className="eyebrow">Salary structure</span><h2>Current monthly structure</h2></div><span className="status-pill status-pill--muted">{canEditAll ? "Editable in Payroll" : "Read only"}</span></div><SalaryBreakdown salary={person.salary} /></section></article>
      </section>
    </>
  );
}

function AttendanceView({ people, attendance, displayRole, previewPerson, isHR, handleCheckIn, handleCheckOut }) {
  const [range, setRange] = useState("week");
  const [search, setSearch] = useState("");
  const isAdminView = displayRole === "hr" && isHR;
  const records = attendance
    .filter((record) => isAdminView || record.personId === previewPerson.id)
    .filter((record) => {
      const person = people.find((entry) => entry.id === record.personId);
      return `${person.name} ${person.employeeId}`.toLowerCase().includes(search.toLowerCase());
    })
    .filter((record) => range === "week" || record.date === TODAY)
    .sort((a, b) => b.date.localeCompare(a.date));
  const today = attendance.find((record) => record.personId === previewPerson.id && record.date === TODAY);
  return (
    <>
      <div className="view-heading"><div><span className="eyebrow">Time record / Week 34</span><h1>{isAdminView ? "Attendance, with a clear view." : "The shape of your week."}</h1><p>{isAdminView ? "Review the day’s records across the team and follow up on what is missing." : "Check in, check out, and see your recent attendance in one readable ledger."}</p></div>{!isAdminView && <div className="heading-actions">{!today?.checkIn ? <button className="primary-button" onClick={() => handleCheckIn(previewPerson.id)}><Clock3 size={17} /> Check in</button> : !today?.checkOut ? <button className="primary-button" onClick={() => handleCheckOut(previewPerson.id)}><Check size={17} /> Check out</button> : <span className="status-pill status-pill--approved"><CheckCircle2 size={16} /> Day complete</span>}</div>}</div>
      <section className="attendance-summary"><div className="attendance-callout"><div className="daylight-rail" /><div><span className="eyebrow">Today / {dateLabel(TODAY)}</span><h2>{isAdminView ? `${attendance.filter((record) => record.date === TODAY && record.status === "Present").length} of ${people.length} people are present` : today?.checkIn ? `Started at ${today.checkIn}` : "No start time recorded"}</h2><p>{isAdminView ? "One person is on leave, and no records are missing this morning." : today?.checkOut ? `Finished at ${today.checkOut}. Your attendance has been logged.` : "Your check-in and check-out are recorded against your workday."}</p></div></div><div className="attendance-statuses"><StatusLegend status="Present" /><StatusLegend status="Half-day" /><StatusLegend status="Leave" /><StatusLegend status="Absent" /></div></section>
      <section className="table-card"><div className="table-toolbar"><div className="segmented-control"><button className={range === "day" ? "active" : ""} onClick={() => setRange("day")}>Daily</button><button className={range === "week" ? "active" : ""} onClick={() => setRange("week")}>Weekly</button></div>{isAdminView && <label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find employee" /></label>}<button className="quiet-button"><SlidersHorizontal size={16} /> Filter</button></div><div className="table-scroll"><table className="data-table"><thead><tr>{isAdminView && <th>Employee</th>}<th>Date</th><th>Check in</th><th>Check out</th><th>Status</th><th>Hours</th></tr></thead><tbody>{records.map((record) => { const person = people.find((entry) => entry.id === record.personId); return <tr key={record.id}>{isAdminView && <td><div className="table-person"><Avatar person={person} size="small" /><span><strong>{person.name}</strong><small>{person.employeeId}</small></span></div></td>}<td>{dateLabel(record.date)}</td><td>{record.checkIn || "—"}</td><td>{record.checkOut || "—"}</td><td><StatusPill status={record.status} /></td><td>{record.checkIn && record.checkOut ? "8h 27m" : "—"}</td></tr>; })}</tbody></table></div></section>
    </>
  );
}

function LeaveView({ people, leaves, displayRole, previewPerson, isHR, submitLeave, decideLeave, notify }) {
  const [form, setForm] = useState({ type: "Paid", start: "", end: "", remarks: "" });
  const [error, setError] = useState("");
  const [decision, setDecision] = useState(null);
  const isAdminView = displayRole === "hr" && isHR;
  const myLeaves = leaves.filter((leave) => leave.personId === previewPerson.id);
  const onSubmit = (event) => {
    event.preventDefault();
    setError("");
    if (!form.start || !form.end || !form.remarks.trim()) return setError("Choose your dates and add a short reason for the request.");
    const result = submitLeave(form);
    if (result.error) return setError(result.error);
    setForm({ type: "Paid", start: "", end: "", remarks: "" });
    notify(result.success);
  };
  return (
    <>
      <div className="view-heading"><div><span className="eyebrow">Time away</span><h1>{isAdminView ? "Requests deserve a clear decision." : "Plan time away with confidence."}</h1><p>{isAdminView ? "Review every request in context, then provide a useful reason for the decision." : "Submit a request, follow its decision, and keep your manager in the loop."}</p></div><span className="status-pill status-pill--pending">{isAdminView ? `${leaves.filter((leave) => leave.status === "Pending").length} waiting` : `${myLeaves.filter((leave) => leave.status === "Pending").length} waiting`}</span></div>
      <section className="leave-layout">{!isAdminView && <article className="leave-form-card"><div className="section-heading"><div><span className="eyebrow">New request</span><h2>Set your leave dates</h2></div><CalendarDays size={22} /></div><form className="leave-form" onSubmit={onSubmit}><label className="field"><span>Leave type</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Paid</option><option>Sick</option><option>Unpaid</option></select></label><div className="date-fields"><label className="field"><span>Start date</span><input type="date" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} /></label><label className="field"><span>End date</span><input type="date" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} /></label></div><label className="field"><span>Remarks</span><textarea value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} placeholder="Share the relevant context with your HR team." rows="4" /></label>{error && <div className="form-alert"><AlertCircle size={16} />{error}</div>}<button className="primary-button" type="submit">Submit for review <ArrowRight size={17} /></button></form></article>}
        <article className={classNames("leave-list-card", isAdminView && "leave-list-card--full")}><div className="section-heading"><div><span className="eyebrow">{isAdminView ? "Decision queue" : "Your history"}</span><h2>{isAdminView ? "Leave requests" : "Your leave requests"}</h2></div><button className="round-control plain"><MoreHorizontal size={18} /></button></div><div className="leave-list">{(isAdminView ? leaves : myLeaves).map((leave) => { const person = people.find((entry) => entry.id === leave.personId); const isDeciding = decision?.id === leave.id; return <div className="leave-item" key={leave.id}><div className="leave-item__lead">{isAdminView && <Avatar person={person} size="small" />}<div><strong>{isAdminView ? person.name : leave.type + " leave"}</strong><span>{isAdminView ? `${leave.type} leave · ${leave.days} day${leave.days > 1 ? "s" : ""}` : `${dateLabel(leave.start)} — ${dateLabel(leave.end)}`}</span></div></div><div className="leave-item__meta"><span>{isAdminView ? `${dateLabel(leave.start)} — ${dateLabel(leave.end)}` : leave.remarks}</span><StatusPill status={leave.status} /></div>{isAdminView && leave.status === "Pending" && !isDeciding && <button className="decision-button" onClick={() => setDecision({ id: leave.id, status: "Approved", comment: "" })}>Review <ArrowRight size={15} /></button>}{isDeciding && <div className="decision-editor"><select value={decision.status} onChange={(event) => setDecision({ ...decision, status: event.target.value })}><option>Approved</option><option>Rejected</option></select><input value={decision.comment} onChange={(event) => setDecision({ ...decision, comment: event.target.value })} placeholder="Decision comment" /><button className="primary-button" onClick={() => { decideLeave(leave.id, decision.status, decision.comment); setDecision(null); }}>Save</button><button className="icon-button" onClick={() => setDecision(null)} aria-label="Cancel decision"><X size={16} /></button></div>}{!isAdminView && leave.comment && <p className="leave-comment"><strong>HR note:</strong> {leave.comment}</p>}</div>; })}</div></article></section>
    </>
  );
}

function PayrollView({ people, previewPerson, displayRole, isHR, updateSalary, notify }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const isAdminView = displayRole === "hr" && isHR;
  const net = (salary) => Number(salary.basic) + Number(salary.hra) - Number(salary.deductions);
  const beginEdit = (person) => { setEditingId(person.id); setDraft({ ...person.salary }); };
  const save = (personId) => { updateSalary(personId, Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, Number(value) || 0]))); setEditingId(null); setDraft(null); notify("Payroll structure updated."); };
  if (!isAdminView) return <><div className="view-heading"><div><span className="eyebrow">Your salary details</span><h1>Clarity in every pay cycle.</h1><p>Your current monthly salary structure is shown here for review.</p></div><span className="status-pill status-pill--muted"><LockKeyhole size={15} /> Read only</span></div><section className="payroll-feature"><article className="payroll-slip"><div className="payroll-slip__head"><div><span className="eyebrow">Monthly salary / August 2026</span><h2>{previewPerson.name}</h2><p>{previewPerson.employeeId} · {previewPerson.department}</p></div><img src={ASSET.payroll} alt="" /></div><SalaryBreakdown salary={previewPerson.salary} highlighted /><div className="payslip-footer"><span>Net monthly salary</span><strong>{currency(net(previewPerson.salary))}</strong></div></article><article className="payroll-note"><span className="eyebrow">Good to know</span><h2>This is your current record.</h2><p>For a payroll discrepancy or change request, use your regular people-operations contact with the pay period and detail noted.</p><button className="text-button">Download statement <Download size={15} /></button></article></section></>;
  return <><div className="view-heading"><div><span className="eyebrow">Compensation desk</span><h1>Payroll, without the fog.</h1><p>Review monthly salary structures across the team, update the inputs, and keep every total visible.</p></div><button className="quiet-button"><Download size={17} /> Export summary</button></div><section className="payroll-summary"><Metric label="Monthly base" value={currency(people.reduce((sum, person) => sum + person.salary.basic, 0))} detail="Across active records" icon={CircleDollarSign} tone="teal" /><Metric label="Total HRA" value={currency(people.reduce((sum, person) => sum + person.salary.hra, 0))} detail="Monthly allowance" icon={WalletCards} tone="blue" /><Metric label="Deductions" value={currency(people.reduce((sum, person) => sum + person.salary.deductions, 0))} detail="Current period" icon={FileText} tone="amber" /></section><section className="table-card payroll-table"><div className="table-toolbar"><div><span className="eyebrow">Salary register</span><h2>Current monthly structure</h2></div><button className="quiet-button"><RefreshCcw size={16} /> Refresh</button></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Employee</th><th>Basic</th><th>HRA</th><th>Deductions</th><th>Net salary</th><th /></tr></thead><tbody>{people.map((person) => { const editing = editingId === person.id; const salary = editing ? draft : person.salary; return <tr key={person.id}><td><div className="table-person"><Avatar person={person} size="small" /><span><strong>{person.name}</strong><small>{person.title}</small></span></div></td>{["basic", "hra", "deductions"].map((key) => <td key={key}>{editing ? <input className="salary-input" type="number" value={salary[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /> : currency(person.salary[key])}</td>)}<td><strong>{currency(net(salary))}</strong></td><td>{editing ? <div className="table-actions"><button className="save-mini" onClick={() => save(person.id)}><Check size={15} /></button><button className="cancel-mini" onClick={() => setEditingId(null)}><X size={15} /></button></div> : <button className="text-button" onClick={() => beginEdit(person)}>Edit <PencilLine size={14} /></button>}</td></tr>; })}</tbody></table></div></section></>;
}

function QuickAction({ icon: Icon, label, value, tone, onClick }) { return <button className={`quick-action quick-action--${tone}`} onClick={onClick}><div className="quick-icon"><Icon size={21} /></div><div><span>{label}</span><strong>{value}</strong></div><ArrowUpRight size={17} /></button>; }
function Metric({ label, value, detail, icon: Icon, tone }) { return <article className={`metric metric--${tone}`}><div className="metric-icon"><Icon size={19} /></div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function ActivityLine({ icon: Icon, title, detail, tone }) { return <div className="activity-line"><div className={`activity-icon activity-icon--${tone}`}><Icon size={16} /></div><div><strong>{title}</strong><span>{detail}</span></div></div>; }
function Avatar({ person, size = "small" }) { return <span className={`avatar avatar--${size}`}>{person?.avatarImage ? <img src={person.avatarImage} alt="" /> : person?.avatar || "DF"}</span>; }
function StatusPill({ status }) { return <span className={`status-pill status-pill--${status.toLowerCase().replace(/[^a-z]/g, "-")}`}>{status}</span>; }
function StatusLegend({ status }) { return <span className="legend-item"><i className={`legend-dot legend-dot--${status.toLowerCase().replace(/[^a-z]/g, "-")}`} />{status}</span>; }
function Rule({ ok, text }) { return <span className={classNames("rule", ok && "rule--ok")}>{ok ? <Check size={13} /> : <i />}{text}</span>; }
function Meta({ icon: Icon, label, value }) { return <div className="meta-row"><Icon size={17} /><div><span>{label}</span><strong>{value}</strong></div></div>; }
function EditableField({ label, value, disabled, onChange, icon: Icon, multiline = false }) { return <label className={classNames("detail-field", disabled && "detail-field--static")}><span><Icon size={15} />{label}</span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} rows="3" /> : <input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} />}</label>; }
function SalaryBreakdown({ salary, highlighted = false }) { const net = Number(salary.basic) + Number(salary.hra) - Number(salary.deductions); return <div className={classNames("salary-breakdown", highlighted && "salary-breakdown--featured")}><div><span>Basic salary</span><strong>{currency(salary.basic)}</strong></div><div><span>House rent allowance</span><strong>{currency(salary.hra)}</strong></div><div><span>Deductions</span><strong className="deduction">− {currency(salary.deductions)}</strong></div><div className="salary-net"><span>Net monthly salary</span><strong>{currency(net)}</strong></div></div>; }
function Toast({ message, tone, onClose }) { const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? AlertCircle : Bell; return <div className={`toast toast--${tone}`}><Icon size={18} /><span>{message}</span><button onClick={onClose} aria-label="Dismiss notification"><X size={16} /></button></div>; }

export default App;
