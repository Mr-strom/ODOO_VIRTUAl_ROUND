/* Dayflow Editorial Workbench: warm editorial operations console, teal actions, ember attention, calm asymmetric workspace. */
import { useCallback, useEffect, useMemo, useState } from "react";
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
  TrendingUp,
  Upload,
  UserCog,
  UserRound,
  Users,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

import {
  authLogin,
  authSignup,
  authMe,
  clearSession,
  storeSession,
  getStoredUser,
  fetchDashboard,
  fetchProfile,
  updateProfile,
  fetchAllProfiles,
  updateProfileById,
  postCheckIn,
  postCheckOut,
  fetchMyAttendance,
  fetchAllAttendance,
  submitLeaveRequest,
  fetchMyLeaves,
  fetchAllLeaves,
  updateLeaveStatus,
  fetchMyPayroll,
  fetchAllPayroll,
  updatePayroll,
  fetchAttendanceAnalytics,
  fetchLeavesAnalytics,
} from "./lib/api.js";

import {
  mapApiToPerson,
  mapHrProfileToPerson,
  mapApiAttendance,
  mapApiLeave,
  mapLeaveFormToApi,
  mapEmployeeProfileToApi,
  mapHrProfileToApi,
  mapSalaryToApi,
  formatDate,
  capitalize,
  initials,
} from "./lib/mappers.js";

const ASSET = {
  logo: "/assets/dayflow-logo.svg",
  auth: "/assets/dayflow-auth-desk.svg",
  people: "/assets/dayflow-people-flow.svg",
  payroll: "/assets/dayflow-payroll-slip.svg",
};

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

const dateLabel = (iso) => formatDate(iso);

const classNames = (...names) => names.filter(Boolean).join(" ");

const todayISO = () => new Date().toISOString().slice(0, 10);

function downloadBlob(content, filename, type = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportAttendanceCSV(records, people) {
  const headers = ["Date", "Employee ID", "Employee Name", "Check In", "Check Out", "Status", "Hours"];
  const rows = records.map((r) => {
    const p = people.find((entry) => entry._userId === r.personId) || { name: r._user?.employee_id || "—", employeeId: r._user?.employee_id || "" };
    return [
      r.date || "",
      `"${p.employeeId}"`,
      `"${p.name}"`,
      r.checkIn || "—",
      r.checkOut || "—",
      r.status || "—",
      calculateHours(r.checkIn, r.checkOut),
    ];
  });
  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  downloadBlob(csv, `dayflow_attendance_records_${todayISO()}.csv`);
}

function exportPayrollCSV(people) {
  const headers = ["Employee ID", "Employee Name", "Job Title", "Department", "Basic Salary (INR)", "HRA (INR)", "Deductions (INR)", "Net Salary (INR)"];
  const rows = people.map((p) => {
    const net = Number(p.salary?.basic || 0) + Number(p.salary?.hra || 0) - Number(p.salary?.deductions || 0);
    return [
      `"${p.employeeId}"`,
      `"${p.name}"`,
      `"${p.title}"`,
      `"${p.department}"`,
      p.salary?.basic || 0,
      p.salary?.hra || 0,
      p.salary?.deductions || 0,
      net,
    ];
  });
  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  downloadBlob(csv, `dayflow_payroll_summary_${todayISO()}.csv`);
}

function downloadSalaryStatement(person) {
  const net = Number(person.salary?.basic || 0) + Number(person.salary?.hra || 0) - Number(person.salary?.deductions || 0);
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Salary Statement - ${person.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #1e2928; background: #f7f4ed; }
    .slip { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px; border: 1px solid #dedbd1; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
    .head { border-bottom: 2px solid #0b6e69; padding-bottom: 16px; margin-bottom: 20px; }
    h1 { margin: 0 0 6px 0; color: #0b6e69; font-size: 24px; letter-spacing: -0.5px; }
    .meta { color: #71807c; font-size: 13px; line-height: 1.6; margin-bottom: 20px; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th, .table td { padding: 11px 12px; border-bottom: 1px solid #dedbd1; text-align: left; }
    .table th { background: #fbf9f4; font-size: 11px; color: #71807c; text-transform: uppercase; letter-spacing: 0.05em; }
    .net { font-size: 16px; font-weight: bold; color: #0b6e69; background: #f4f7f3; }
    .footer { font-size: 11px; color: #71807c; margin-top: 30px; text-align: center; border-top: 1px solid #dedbd1; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="slip">
    <div class="head">
      <h1>DAYFLOW HRMS</h1>
      <p style="margin: 0; font-size: 14px; color: #71807c;">Official Salary Statement / ${new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date())}</p>
    </div>
    <div class="meta">
      <strong>Employee:</strong> ${person.name} (${person.employeeId})<br/>
      <strong>Designation:</strong> ${person.title} &middot; <strong>Department:</strong> ${person.department}
    </div>
    <table class="table">
      <thead><tr><th>Salary Component</th><th style="text-align: right;">Amount (INR)</th></tr></thead>
      <tbody>
        <tr><td>Basic Monthly Salary</td><td style="text-align: right;">₹${Number(person.salary?.basic || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>House Rent Allowance (HRA)</td><td style="text-align: right;">₹${Number(person.salary?.hra || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Deductions (Tax/PF)</td><td style="text-align: right; color: #a84743;">- ₹${Number(person.salary?.deductions || 0).toLocaleString('en-IN')}</td></tr>
        <tr class="net"><td><strong>Net Monthly Pay</strong></td><td style="text-align: right;"><strong>₹${net.toLocaleString('en-IN')}</strong></td></tr>
      </tbody>
    </table>
    <div class="footer">
      Generated securely via Dayflow HRMS Operations Console &middot; Date: ${new Date().toLocaleDateString('en-IN')}
    </div>
  </div>
</body>
</html>`;
  downloadBlob(html, `dayflow_salary_statement_${person.employeeId || "EMP"}_${todayISO()}.html`, "text/html;charset=utf-8;");
}

// ════════════════════════════════════════════════════════════════
// APP ROOT
// ════════════════════════════════════════════════════════════════

function App() {
  // ── Auth state ───────────────────────────────────────────────
  const [session, setSession] = useState(null); // { user }
  const [authMode, setAuthMode] = useState("signin");
  const [authLoading, setAuthLoading] = useState(true); // initial session restore

  // ── App state ────────────────────────────────────────────────
  const [people, setPeople] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [viewAs, setViewAs] = useState("hr");
  const [toast, setToast] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifs, setReadNotifs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dayflow_read_notifs") || "[]");
    } catch {
      return [];
    }
  });

  const notify = (message, tone = "success") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3600);
  };

  // ── Session restore on mount ─────────────────────────────────
  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      setAuthLoading(false);
      return;
    }

    authMe().then(({ data, error }) => {
      if (error) {
        clearSession();
        setAuthLoading(false);
        return;
      }
      const user = data.user || data;
      storeSession(localStorage.getItem("dayflow_token"), user);
      setSession({ user });
      setViewAs(user.role === "hr" || user.role === "admin" ? "hr" : "employee");
      setAuthLoading(false);
    });
  }, []);

  // ── Data loading when session is set ─────────────────────────
  const isHR = session?.user?.role === "hr" || session?.user?.role === "admin";

  const loadDashboard = useCallback(async () => {
    const { data } = await fetchDashboard();
    if (data) setDashData(data);
  }, []);

  const loadPeople = useCallback(async () => {
    if (isHR) {
      const [profilesRes, payrollRes] = await Promise.all([
        fetchAllProfiles(),
        fetchAllPayroll(),
      ]);
      const profiles = profilesRes.data?.profiles || profilesRes.data || [];
      const payrolls = payrollRes.data?.payrolls || payrollRes.data || [];
      const payrollMap = {};
      payrolls.forEach((p) => { payrollMap[p.user_id] = p; });
      setPeople(profiles.map((p) => mapHrProfileToPerson(p, payrollMap)));
    } else {
      const [profileRes, payrollRes, meRes] = await Promise.all([
        fetchProfile(),
        fetchMyPayroll(),
        authMe(),
      ]);
      const user = meRes.data?.user || meRes.data || session?.user || {};
      const profile = profileRes.data || {};
      const payroll = payrollRes.data || {};
      setPeople([mapApiToPerson(user, profile, payroll)]);
    }
  }, [isHR, session]);

  const loadAttendance = useCallback(async () => {
    if (isHR) {
      const { data } = await fetchAllAttendance(todayISO());
      const records = data?.attendance || data || [];
      setAttendance(records.map(mapApiAttendance));
    } else {
      const { data } = await fetchMyAttendance();
      const records = data?.attendance || data || [];
      setAttendance(records.map(mapApiAttendance));
    }
  }, [isHR]);

  const loadLeaves = useCallback(async () => {
    if (isHR) {
      const { data } = await fetchAllLeaves();
      const items = data?.leaves || data || [];
      setLeaves(items.map(mapApiLeave));
    } else {
      const { data } = await fetchMyLeaves();
      const items = data?.leaves || data || [];
      setLeaves(items.map(mapApiLeave));
    }
  }, [isHR]);

  const loadAll = useCallback(() => {
    loadDashboard();
    loadPeople();
    loadAttendance();
    loadLeaves();
  }, [loadDashboard, loadPeople, loadAttendance, loadLeaves]);

  useEffect(() => {
    if (session) loadAll();
  }, [session, loadAll]);

  // ── Derived state ────────────────────────────────────────────
  const sessionPerson = useMemo(() => {
    if (!session) return null;
    return people.find((p) => p._userId === session.user.id) || people[0] || null;
  }, [people, session]);

  const displayRole = isHR ? viewAs : "employee";
  const previewPerson = isHR && viewAs === "employee"
    ? people.find((p) => p.role === "employee") || sessionPerson
    : sessionPerson;

  // ── Notifications calculation ────────────────────────────────
  const notifications = useMemo(() => {
    const list = [];
    if (isHR) {
      const pendingLeaves = leaves.filter((l) => l.status === "Pending");
      pendingLeaves.forEach((l) => {
        const p = people.find((item) => item._userId === l.personId) || { name: l._user?.employee_id || "Employee" };
        list.push({
          id: `leave-${l.id}`,
          type: "leave",
          title: "Leave review needed",
          message: `${p.name} requested ${l.type} leave (${l.days}d).`,
          view: "leaves",
          read: readNotifs.includes(`leave-${l.id}`),
        });
      });
    } else {
      const today = attendance.find((r) => r.personId === previewPerson?.id && r.date === todayISO());
      if (!today?.checkIn) {
        list.push({
          id: "checkin-reminder",
          type: "attendance",
          title: "Attendance reminder",
          message: "You haven't recorded your check-in today.",
          view: "attendance",
          read: readNotifs.includes("checkin-reminder"),
        });
      }
    }
    return list;
  }, [isHR, leaves, people, attendance, previewPerson, readNotifs]);

  const unreadNotifCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markAllNotifsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotifs(allIds);
    localStorage.setItem("dayflow_read_notifs", JSON.stringify(allIds));
    notify("All notifications marked as read.", "neutral");
  };

  const markNotifRead = (id) => {
    if (!readNotifs.includes(id)) {
      const updated = [...readNotifs, id];
      setReadNotifs(updated);
      localStorage.setItem("dayflow_read_notifs", JSON.stringify(updated));
    }
  };

  // ── Auth actions ─────────────────────────────────────────────
  const signIn = async ({ email, password }) => {
    const { data, error } = await authLogin(email, password);
    if (error) return { error };
    storeSession(data.token, data.user);
    setSession({ user: data.user });
    setViewAs(data.user.role === "hr" || data.user.role === "admin" ? "hr" : "employee");
    setActiveView("dashboard");
    return { success: `Welcome back, ${(data.user.email || "").split("@")[0]}.` };
  };

  const signUp = async ({ employeeId, email, password, role }) => {
    const { data, error } = await authSignup(employeeId, email, password, role);
    if (error) return { error };
    storeSession(data.token, data.user);
    setSession({ user: data.user });
    setViewAs(data.user.role === "hr" || data.user.role === "admin" ? "hr" : "employee");
    setActiveView("dashboard");
    return { success: "Your account is ready. Complete your profile when you are ready." };
  };

  const signOut = () => {
    clearSession();
    setSession(null);
    setPeople([]);
    setAttendance([]);
    setLeaves([]);
    setDashData(null);
    setAuthMode("signin");
    setNavOpen(false);
    notify("You have been signed out.", "neutral");
  };

  // ── Data mutation actions ────────────────────────────────────
  const updatePerson = async (personId, changes) => {
    const person = people.find((p) => p._userId === personId || p.id === personId);
    if (!person) return;

    if (isHR && displayRole === "hr") {
      const body = mapHrProfileToApi(changes);
      const { error } = await updateProfileById(person._userId, body);
      if (error) return notify(error, "warning");
    } else {
      const body = mapEmployeeProfileToApi(changes);
      const { error } = await updateProfile(body);
      if (error) return notify(error, "warning");
    }
    await loadPeople();
    loadDashboard();
  };

  const updateSalaryAction = async (personId, salary) => {
    const person = people.find((p) => p._userId === personId || p.id === personId);
    if (!person) return;
    const body = mapSalaryToApi(salary);
    const { error } = await updatePayroll(person._userId, body);
    if (error) return notify(error, "warning");
    await loadPeople();
  };

  const handleCheckIn = async () => {
    const { error } = await postCheckIn();
    if (error) return notify(error, "warning");
    notify("Checked in. Have a focused day.");
    loadAttendance();
    loadDashboard();
  };

  const handleCheckOut = async () => {
    const { error } = await postCheckOut();
    if (error) return notify(error, "warning");
    notify("Checked out. Your day is recorded.");
    loadAttendance();
    loadDashboard();
  };

  const submitLeave = async (payload) => {
    const body = mapLeaveFormToApi(payload);
    const { error } = await submitLeaveRequest(body);
    if (error) return { error };
    loadLeaves();
    loadDashboard();
    return { success: "Leave request submitted for review." };
  };

  const decideLeave = async (leaveId, status, comment) => {
    const apiStatus = status.toLowerCase();
    const { error } = await updateLeaveStatus(leaveId, apiStatus, comment);
    if (error) return notify(error, "warning");
    notify(`Leave request ${status.toLowerCase()}.`);
    loadLeaves();
    loadDashboard();
  };

  // ── Loading / Auth gate ──────────────────────────────────────
  if (authLoading) {
    return (
      <div className="auth-page" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#5c6b63" }}>
          <div className="brand-lockup" style={{ justifyContent: "center", marginBottom: 16 }}>
            <img className="brand-mark" src={ASSET.logo} alt="Dayflow" style={{ width: 40, height: 40 }} />
            <span className="brand-name" style={{ fontSize: 22 }}>dayflow</span>
          </div>
          <p>Restoring your session…</p>
        </div>
      </div>
    );
  }

  if (!session || !sessionPerson) {
    return <AuthScreen mode={authMode} setMode={setAuthMode} onSignIn={signIn} onSignUp={signUp} />;
  }

  const shared = {
    people,
    attendance,
    leaves,
    dashData,
    displayRole,
    previewPerson,
    isHR,
    notify,
    updatePerson,
    updateSalary: updateSalaryAction,
    handleCheckIn,
    handleCheckOut,
    submitLeave,
    decideLeave,
    loadAttendance,
    loadLeaves,
    loadPeople,
  };

  return (
    <div className="app-shell">
      <aside className={classNames("sidebar", navOpen && "sidebar--open")}>
        <div className="brand-lockup">
          <img className="brand-mark" src={ASSET.logo} alt="Dayflow" onError={(e) => { e.target.style.display = 'none'; }} />
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
          {isHR && (
            <button
              className={classNames("nav-item", activeView === "analytics" && "nav-item--active")}
              onClick={() => { setActiveView("analytics"); setNavOpen(false); }}
            >
              <TrendingUp size={18} strokeWidth={1.8} />
              <span>Analytics</span>
            </button>
          )}
        </nav>

        {isHR && (
          <section className="role-preview">
            <span className="nav-kicker">Perspective</span>
            <div className="role-toggle" role="group" aria-label="Change dashboard perspective">
              <button className={viewAs === "hr" ? "active" : ""} onClick={() => setViewAs("hr")}>HR desk</button>
              <button className={viewAs === "employee" ? "active" : ""} onClick={() => setViewAs("employee")}>Employee</button>
            </div>
            <p>{viewAs === "hr" ? "Review the full people operation." : "Preview the employee workspace."}</p>
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
          <div className="crumb"><span>Dayflow</span><ArrowRight size={14} /><strong>{[...navItems, { id: "analytics", label: "Analytics" }].find((item) => item.id === activeView)?.label}</strong></div>
          <div className="utility-actions">
            <div style={{ position: "relative" }}>
              <button
                className="round-control"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && <i />}
              </button>
              {notifOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 10px)",
                    width: 320,
                    background: "var(--surface)",
                    border: "1px solid var(--rule)",
                    borderRadius: 12,
                    boxShadow: "0 18px 44px rgba(31, 44, 41, .15)",
                    zIndex: 100,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: "1px solid var(--rule)", paddingBottom: 8 }}>
                    <strong style={{ fontSize: 13 }}>Activity notifications ({unreadNotifCount} unread)</strong>
                    {unreadNotifCount > 0 && (
                      <button className="text-button" onClick={markAllNotifsRead} style={{ fontSize: 11 }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: 12, margin: "16px 0", textAlign: "center" }}>
                      No active notifications.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotifRead(n.id);
                            setActiveView(n.view);
                            setNotifOpen(false);
                          }}
                          style={{
                            padding: "10px 12px",
                            background: n.read ? "#fdfbf7" : "var(--teal-pale)",
                            borderRadius: 8,
                            cursor: "pointer",
                            border: "1px solid var(--rule)",
                          }}
                        >
                          <strong style={{ fontSize: 12, display: "block", color: "var(--ink)" }}>{n.title}</strong>
                          <span style={{ fontSize: 11, color: "var(--muted)", display: "block", marginTop: 2 }}>{n.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
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
          {activeView === "analytics" && isHR && <AnalyticsView notify={notify} />}
        </section>
      </main>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ════════════════════════════════════════════════════════════════

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

  const submit = async (event) => {
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
    const result = isSignIn
      ? await onSignIn(form)
      : await onSignUp(form);
    if (result.error) setMessage(result.error);
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <img src={ASSET.logo} alt="Dayflow" onError={(e) => { e.target.style.display = 'none'; }} />
          <span><b>day</b><em>flow</em></span>
        </div>
        <div className="auth-access-meta"><span>DF / 001</span><i /><span>Staff ledger access</span><i /><span>{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/\//g, ".")}</span></div>
        <div className="auth-copy">
          <div className="auth-copy__ledger"><i /><span>Workspace / 01</span></div>
          <span className="eyebrow">{isSignIn ? "Your people desk" : "Start your workspace"}</span>
          <h1>{isSignIn ? "The workday, better organised." : "Make the people work visible."}</h1>
          <p>{isSignIn ? "Sign in to keep attendance, requests, and the day’s essentials moving." : "Create an account to access the Dayflow people operations workspace."}</p>
        </div>
        {isSignIn && (
          <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid var(--rule)" }}>
            {[["employee","Employee Login"],["hr","HR Login"]].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab ? "2px solid #0b6e69" : "2px solid transparent",
                  color: activeTab === tab ? "#0b6e69" : "#9ca3af",
                  fontWeight: activeTab === tab ? 700 : 400,
                  opacity: activeTab === tab ? 1 : 0.5,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  letterSpacing: "0.01em",
                }}
              >{label}</button>
            ))}
          </div>
        )}
        <form className="auth-form" onSubmit={submit} noValidate>
          <div className="auth-form__caption"><span>Access details</span><i /></div>
          {!isSignIn && (
            <label className="field"><span>Employee ID</span><input value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} placeholder="EMP-1041" autoComplete="off" /></label>
          )}
          <label className="field"><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@company.com" autoComplete="email" /></label>
          <label className="field"><span>Password</span><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" autoComplete={isSignIn ? "current-password" : "new-password"} /></label>
          {!isSignIn && (
            <div style={{ marginTop: 2, marginBottom: 6, padding: "8px 10px", background: "var(--paper-deep)", borderRadius: 6 }}>
              <span style={{ color: "var(--muted)", fontSize: 11, lineHeight: 1.4, display: "block" }}>
                Public registration creates an <strong>Employee</strong> workspace. Administrative &amp; HR access is granted by system administrators.
              </span>
            </div>
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
      </section>
      <aside className="auth-visual" style={{ backgroundImage: `url(${ASSET.auth})` }}>
        <div className="auth-visual__rule auth-visual__rule--v" /><div className="auth-visual__rule auth-visual__rule--h" />
        <div className="auth-photo-meta"><span>People operations</span><strong>Desk file / 01</strong><small>Attendance · Requests · Records</small></div>
        <div className="auth-visual-copy"><span>Dayflow / 01</span><strong>Make the people work visible.</strong><p>A single, calm place for the checks, requests, and people details that keep a team moving.</p></div>
      </aside>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════

function Dashboard({ people, attendance, leaves, dashData, displayRole, previewPerson, setView, handleCheckIn, handleCheckOut }) {
  const TODAY = todayISO();
  if (displayRole === "hr") return <HRDashboard people={people} attendance={attendance} leaves={leaves} dashData={dashData} setView={setView} />;

  const today = attendance.find((record) => record.personId === previewPerson?.id && record.date === TODAY);
  const pending = leaves.filter((leave) => leave.personId === previewPerson?.id && leave.status === "Pending").length;
  const dayName = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <>
      <div className="view-heading"><div><span className="eyebrow">{dayName}</span><h1>Good morning, {previewPerson?.name?.split(" ")[0] || "there"}.</h1><p>Here is the human side of your workday, arranged in one place.</p></div><button className="quiet-button"><CalendarCheck size={17} /> This week</button></div>
      <section className="employee-hero">
        <div className="daylight-rail" />
        <div><span className="eyebrow">Today's attendance</span><h2>{today?.checkIn ? `Checked in at ${today.checkIn}` : "Your day is ready when you are."}</h2><p>{today?.checkOut ? "Your attendance is complete for today." : "Use check-in when you begin, then check out when the day closes."}</p></div>
        <div className="hero-actions">{!today?.checkIn ? <button className="primary-button" onClick={handleCheckIn}>Check in <ArrowRight size={17} /></button> : !today?.checkOut ? <button className="primary-button" onClick={handleCheckOut}>Check out <ArrowRight size={17} /></button> : <span className="status-pill status-pill--approved"><CheckCircle2 size={16} /> Day complete</span>}</div>
      </section>
      <section className="quick-grid">
        <QuickAction icon={UserRound} label="Profile" value="Keep details current" tone="teal" onClick={() => setView("profile")} />
        <QuickAction icon={Clock3} label="Attendance" value={today?.status || "Not checked in"} tone="blue" onClick={() => setView("attendance")} />
        <QuickAction icon={CalendarDays} label="Leave requests" value={`${pending} awaiting review`} tone="amber" onClick={() => setView("leaves")} />
        <QuickAction icon={LogOut} label="Payroll" value="Salary details" tone="ink" onClick={() => setView("payroll")} />
      </section>
      <section className="dashboard-lower">
        <article className="activity-card"><div className="section-heading"><div><span className="eyebrow">Activity ledger</span><h2>Recent movement</h2></div><button className="text-button" onClick={() => setView("attendance")}>View attendance <ArrowUpRight size={15} /></button></div><ActivityLine icon={Clock3} title={today?.checkIn ? "Checked in" : "Not checked in"} detail={today?.checkIn ? `Today at ${today.checkIn}` : "Waiting for check-in"} tone="teal" /><ActivityLine icon={CalendarDays} title={`${pending} leave request(s) pending`} detail="Check your leave status" tone="amber" /><ActivityLine icon={BadgeCheck} title="Profile information" detail={`Completeness: ${dashData?.profile_completeness || 0}%`} tone="sage" /></article>
        <article className="help-card"><div className="help-card__accent" /><span className="eyebrow">A clearer workday</span><h2>One place for the people details that matter.</h2><p>Update your profile, record time, and follow every request without switching tools.</p><button className="text-button" onClick={() => setView("profile")}>Open profile <ArrowRight size={15} /></button></article>
      </section>
    </>
  );
}

function HRDashboard({ people, attendance, leaves, dashData, setView }) {
  const d = dashData || {};
  const present = d.today_present ?? 0;
  const totalEmp = d.total_employees ?? people.length;
  const pending = leaves.filter((leave) => leave.status === "Pending");
  const absent = d.today_absent ?? 0;
  const onLeave = d.today_on_leave ?? 0;
  const dayName = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <>
      <div className="view-heading"><div><span className="eyebrow">People operations / {dayName}</span><h1>Keep the workday moving.</h1><p>Attendance, requests, and the team pulse — together in one clear review desk.</p></div><button className="quiet-button" onClick={() => setView("leaves")}><ClipboardList size={17} /> {pending.length} reviews due</button></div>
      <section className="metric-strip">
        <Metric label="Team members" value={totalEmp} detail="Across active groups" icon={Users} tone="teal" />
        <Metric label="Present today" value={`${present}/${totalEmp}`} detail={totalEmp ? `${Math.round((present / totalEmp) * 100)}% recorded` : "—"} icon={CalendarCheck} tone="blue" />
        <Metric label="Pending approvals" value={d.pending_leave_requests ?? pending.length} detail="Needs a decision today" icon={ClipboardList} tone="amber" />
        <Metric label="Absent / leave" value={absent + onLeave} detail="Record and support early" icon={AlertCircle} tone="rose" />
      </section>
      <section className="hr-feature-grid">
        <article className="roster-card"><div className="section-heading"><div><span className="eyebrow">Team roster</span><h2>People at a glance</h2></div><button className="text-button" onClick={() => setView("profile")}>Manage people <ArrowUpRight size={15} /></button></div><div className="roster-list">{people.slice(0, 4).map((person) => <div className="roster-row" key={person.id}><Avatar person={person} size="small" /><div><strong>{person.name}</strong><span>{person.title}</span></div><span className="department-dot">{person.department.split(" ")[0]}</span></div>)}</div></article>
        <article className="attendance-overview"><div className="section-heading"><div><span className="eyebrow">Today's record</span><h2>Attendance overview</h2></div><button className="round-control plain" onClick={() => setView("attendance")}><ArrowUpRight size={17} /></button></div><div className="presence-chart"><div className="presence-number"><strong>{present}</strong><span>present</span></div><div className="presence-bars"><i className="bar-teal" style={{ height: `${totalEmp ? (present / totalEmp) * 100 : 0}%` }} /><i className="bar-sage" style={{ height: "50%" }} /><i className="bar-amber" style={{ height: "25%" }} /><i className="bar-ink" style={{ height: "65%" }} /></div></div><p><strong>{present} people</strong> have checked in.</p></article>
        <article className="approval-card"><div className="section-heading"><div><span className="eyebrow">Decision queue</span><h2>Leave approvals</h2></div><button className="text-button" onClick={() => setView("leaves")}>Open queue <ArrowUpRight size={15} /></button></div>{pending.slice(0, 2).map((leave) => { const person = people.find((entry) => entry._userId === leave.personId) || { name: leave._user?.employee_id || "—", avatar: "??" }; return <div className="approval-row" key={leave.id}><Avatar person={person} size="small" /><div><strong>{person.name}</strong><span>{leave.type} leave · {leave.days} day{leave.days > 1 ? "s" : ""}</span></div><span className="status-pill status-pill--pending">Pending</span></div>; })}</article>
      </section>
      <section className="status-band">
        <img src={ASSET.people} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
        <div>
          <span className="eyebrow">The people flow</span>
          <h2>Small operational checks add up to a calmer team.</h2>
        </div>
        <button className="primary-button" onClick={() => setView("attendance")}>Review attendance <ArrowRight size={17} /></button>
      </section>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// PROFILE
// ════════════════════════════════════════════════════════════════

function ProfileView({ people, previewPerson, displayRole, isHR, updatePerson, notify }) {
  const [selectedId, setSelectedId] = useState(previewPerson?.id);
  const person = displayRole === "hr" && isHR ? people.find((entry) => entry.id === selectedId) || previewPerson : previewPerson;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(person);
  const canEditAll = displayRole === "hr" && isHR;

  useEffect(() => { if (person) setDraft(person); }, [person]);

  const choosePerson = (id) => {
    const next = people.find((entry) => entry.id === Number(id));
    setSelectedId(Number(id));
    setDraft(next);
    setEditing(false);
  };
  const edit = () => { setDraft(person); setEditing(true); };
  const save = async () => {
    const changes = canEditAll ? draft : { phone: draft.phone, address: draft.address, avatarImage: draft.avatarImage };
    await updatePerson(person._userId || person.id, changes);
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

  if (!person) return <p>Loading profile…</p>;

  return (
    <>
      <div className="view-heading profile-heading"><div><span className="eyebrow">{canEditAll ? "People directory" : "Your people record"}</span><h1>{canEditAll ? "Profiles, with context." : "Your profile, clearly held."}</h1><p>{canEditAll ? "Update any record while keeping the team directory easy to scan." : "Keep the personal details that support your workday current."}</p></div><div className="heading-actions">{canEditAll && <label className="person-select"><Users size={17} /><select value={selectedId} onChange={(event) => choosePerson(event.target.value)}>{people.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>}{editing ? <><button className="quiet-button" onClick={() => setEditing(false)}>Cancel</button><button className="primary-button" onClick={save}><Save size={17} /> Save changes</button></> : <button className="primary-button" onClick={edit}><PencilLine size={17} /> Edit profile</button>}</div></div>
      <section className="profile-layout">
        <article className="profile-identity"><div className="profile-hero"><Avatar person={editing ? draft : person} size="large" /><div><span className="eyebrow">{person.employeeId}</span><h2>{person.name}</h2><p>{person.title} · {person.department}</p></div>{editing && <label className="upload-button"><Upload size={16} /> Update picture<input type="file" accept="image/*" onChange={upload} /></label>}</div><div className="profile-meta"><Meta icon={Mail} label="Work email" value={person.email} /><Meta icon={BriefcaseBusiness} label="Manager" value={person.manager} /><Meta icon={CalendarDays} label="Joined Dayflow" value={person.joined} /></div><div className="document-section"><div className="section-heading"><div><span className="eyebrow">Documents</span><h3>On file</h3></div><button className="round-control plain"><MoreHorizontal size={18} /></button></div>{(person.documents || []).map((document) => <div className="document-row" key={document}><FileText size={17} /><span>{document}</span><Download size={15} /></div>)}</div></article>
        <article className="profile-details-card"><section className="details-section"><div className="section-heading"><div><span className="eyebrow">Personal details</span><h2>How to reach {canEditAll ? person.name?.split(" ")[0] : "you"}</h2></div></div><div className="details-grid"><EditableField label="Phone" value={editing ? draft.phone : person.phone || "Add a phone number"} disabled={!editing} onChange={(value) => setDraft({ ...draft, phone: value })} icon={Phone} /><EditableField label="Address" value={editing ? draft.address : person.address || "Add your address"} disabled={!editing} onChange={(value) => setDraft({ ...draft, address: value })} icon={MapPin} multiline /></div></section><section className="details-section ruled"><div className="section-heading"><div><span className="eyebrow">Job details</span><h2>Work at Dayflow</h2></div></div><div className="details-grid"><EditableField label="Department" value={editing ? draft.department : person.department} disabled={!editing || !canEditAll} onChange={(value) => setDraft({ ...draft, department: value })} icon={Users} /><EditableField label="Job title" value={editing ? draft.title : person.title} disabled={!editing || !canEditAll} onChange={(value) => setDraft({ ...draft, title: value })} icon={BriefcaseBusiness} /><EditableField label="Manager" value={editing ? draft.manager : person.manager} disabled={!editing || !canEditAll} onChange={(value) => setDraft({ ...draft, manager: value })} icon={UserCog} /><EditableField label="Employee ID" value={editing ? draft.employeeId : person.employeeId} disabled={!editing || !canEditAll} onChange={(value) => setDraft({ ...draft, employeeId: value })} icon={BadgeCheck} /></div></section><section className="details-section ruled"><div className="section-heading"><div><span className="eyebrow">Salary structure</span><h2>Current monthly structure</h2></div><span className="status-pill status-pill--muted">{canEditAll ? "Editable in Payroll" : "Read only"}</span></div><SalaryBreakdown salary={person.salary} /></section></article>
      </section>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// ATTENDANCE
// ════════════════════════════════════════════════════════════════

function AttendanceView({ people, attendance, displayRole, previewPerson, isHR, handleCheckIn, handleCheckOut, loadAttendance: reload }) {
  const [range, setRange] = useState("week");
  const [search, setSearch] = useState("");
  const isAdminView = displayRole === "hr" && isHR;
  const TODAY = todayISO();

  const records = attendance
    .filter((record) => isAdminView || record.personId === previewPerson?.id)
    .filter((record) => {
      if (!isAdminView) return true;
      const person = people.find((entry) => entry._userId === record.personId);
      const label = person ? `${person.name} ${person.employeeId}` : (record._user?.employee_id || "");
      return label.toLowerCase().includes(search.toLowerCase());
    })
    .filter((record) => range === "week" || record.date === TODAY)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const today = attendance.find((record) => record.personId === previewPerson?.id && record.date === TODAY);

  return (
    <>
      <div className="view-heading"><div><span className="eyebrow">Time record</span><h1>{isAdminView ? "Attendance, with a clear view." : "The shape of your week."}</h1><p>{isAdminView ? "Review the day’s records across the team and follow up on what is missing." : "Check in, check out, and see your recent attendance in one readable ledger."}</p></div>{!isAdminView && <div className="heading-actions">{!today?.checkIn ? <button className="primary-button" onClick={handleCheckIn}><Clock3 size={17} /> Check in</button> : !today?.checkOut ? <button className="primary-button" onClick={handleCheckOut}><Check size={17} /> Check out</button> : <span className="status-pill status-pill--approved"><CheckCircle2 size={16} /> Day complete</span>}</div>}</div>
      <section className="attendance-summary"><div className="attendance-callout"><div className="daylight-rail" /><div><span className="eyebrow">Today / {dateLabel(TODAY)}</span><h2>{isAdminView ? `${attendance.filter((r) => r.date === TODAY && (r.status === "Present" || r.status === "Half-day")).length} of ${people.length} people are present` : today?.checkIn ? `Started at ${today.checkIn}` : "No start time recorded"}</h2><p>{isAdminView ? "Review attendance across the team." : today?.checkOut ? `Finished at ${today.checkOut}. Your attendance has been logged.` : "Your check-in and check-out are recorded against your workday."}</p></div></div><div className="attendance-statuses"><StatusLegend status="Present" /><StatusLegend status="Half-day" /><StatusLegend status="Leave" /><StatusLegend status="Absent" /></div></section>
      <section className="table-card"><div className="table-toolbar"><div className="segmented-control"><button className={range === "day" ? "active" : ""} onClick={() => setRange("day")}>Daily</button><button className={range === "week" ? "active" : ""} onClick={() => setRange("week")}>Weekly</button></div>{isAdminView && <label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find employee" /></label>}<button className="quiet-button" onClick={() => exportAttendanceCSV(records, people)}><Download size={16} /> Export CSV</button><button className="quiet-button" onClick={() => reload && reload()}><RefreshCcw size={16} /> Refresh</button></div><div className="table-scroll"><table className="data-table"><thead><tr>{isAdminView && <th>Employee</th>}<th>Date</th><th>Check in</th><th>Check out</th><th>Status</th><th>Hours</th></tr></thead><tbody>{records.map((record) => { const person = people.find((entry) => entry._userId === record.personId) || { name: record._user?.employee_id || "—", employeeId: record._user?.employee_id || "", avatar: "??" }; return <tr key={record.id}>{isAdminView && <td><div className="table-person"><Avatar person={person} size="small" /><span><strong>{person.name}</strong><small>{person.employeeId}</small></span></div></td>}<td>{dateLabel(record.date)}</td><td>{record.checkIn || "\u2014"}</td><td>{record.checkOut || "\u2014"}</td><td><StatusPill status={record.status} /></td><td>{record.checkIn && record.checkOut ? calculateHours(record.checkIn, record.checkOut) : "\u2014"}</td></tr>; })}</tbody></table></div></section>
    </>
  );
}

function calculateHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "—";
  try {
    const [h1, m1] = checkIn.split(":").map(Number);
    const [h2, m2] = checkOut.split(":").map(Number);
    const totalMin = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMin < 0) return "—";
    return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
  } catch { return "—"; }
}

// ════════════════════════════════════════════════════════════════
// LEAVES
// ════════════════════════════════════════════════════════════════

function LeaveView({ people, leaves, displayRole, previewPerson, isHR, submitLeave, decideLeave, notify }) {
  const [form, setForm] = useState({ type: "Paid", start: "", end: "", remarks: "" });
  const [error, setError] = useState("");
  const [decision, setDecision] = useState(null);
  const isAdminView = displayRole === "hr" && isHR;
  const myLeaves = leaves.filter((leave) => leave.personId === previewPerson?.id);
  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.start || !form.end || !form.remarks.trim()) return setError("Choose your dates and add a short reason for the request.");
    const result = await submitLeave(form);
    if (result.error) return setError(result.error);
    setForm({ type: "Paid", start: "", end: "", remarks: "" });
    notify(result.success);
  };
  return (
    <>
      <div className="view-heading"><div><span className="eyebrow">Time away</span><h1>{isAdminView ? "Requests deserve a clear decision." : "Plan time away with confidence."}</h1><p>{isAdminView ? "Review every request in context, then provide a useful reason for the decision." : "Submit a request, follow its decision, and keep your manager in the loop."}</p></div><span className="status-pill status-pill--pending">{isAdminView ? `${leaves.filter((leave) => leave.status === "Pending").length} waiting` : `${myLeaves.filter((leave) => leave.status === "Pending").length} waiting`}</span></div>
      <section className="leave-layout">{!isAdminView && <article className="leave-form-card"><div className="section-heading"><div><span className="eyebrow">New request</span><h2>Set your leave dates</h2></div><CalendarDays size={22} /></div><form className="leave-form" onSubmit={onSubmit}><label className="field"><span>Leave type</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Paid</option><option>Sick</option><option>Unpaid</option></select></label><div className="date-fields"><label className="field"><span>Start date</span><input type="date" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} /></label><label className="field"><span>End date</span><input type="date" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} /></label></div><label className="field"><span>Remarks</span><textarea value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} placeholder="Share the relevant context with your HR team." rows="4" /></label>{error && <div className="form-alert"><AlertCircle size={16} />{error}</div>}<button className="primary-button" type="submit">Submit for review <ArrowRight size={17} /></button></form></article>}
        <article className={classNames("leave-list-card", isAdminView && "leave-list-card--full")}><div className="section-heading"><div><span className="eyebrow">{isAdminView ? "Decision queue" : "Your history"}</span><h2>{isAdminView ? "Leave requests" : "Your leave requests"}</h2></div><button className="round-control plain"><MoreHorizontal size={18} /></button></div><div className="leave-list">{(isAdminView ? leaves : myLeaves).map((leave) => { const person = people.find((entry) => entry._userId === leave.personId) || { name: leave._user?.employee_id || "Employee", avatar: "??" }; const isDeciding = decision?.id === leave.id; return <div className="leave-item" key={leave.id}><div className="leave-item__lead">{isAdminView && <Avatar person={person} size="small" />}<div><strong>{isAdminView ? person.name : leave.type + " leave"}</strong><span>{isAdminView ? `${leave.type} leave · ${leave.days} day${leave.days > 1 ? "s" : ""}` : `${dateLabel(leave.start)} — ${dateLabel(leave.end)}`}</span></div></div><div className="leave-item__meta"><span>{isAdminView ? `${dateLabel(leave.start)} — ${dateLabel(leave.end)}` : leave.remarks}</span><StatusPill status={leave.status} /></div>{isAdminView && leave.status === "Pending" && !isDeciding && <button className="decision-button" onClick={() => setDecision({ id: leave.id, status: "Approved", comment: "" })}>Review <ArrowRight size={15} /></button>}{isDeciding && <div className="decision-editor"><select value={decision.status} onChange={(event) => setDecision({ ...decision, status: event.target.value })}><option>Approved</option><option>Rejected</option></select><input value={decision.comment} onChange={(event) => setDecision({ ...decision, comment: event.target.value })} placeholder="Decision comment" /><button className="primary-button" onClick={() => { decideLeave(leave.id, decision.status, decision.comment); setDecision(null); }}>Save</button><button className="icon-button" onClick={() => setDecision(null)} aria-label="Cancel decision"><X size={16} /></button></div>}{!isAdminView && leave.comment && <p className="leave-comment"><strong>HR note:</strong> {leave.comment}</p>}</div>; })}</div></article></section>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// PAYROLL
// ════════════════════════════════════════════════════════════════

function PayrollView({ people, previewPerson, displayRole, isHR, updateSalary, notify }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const isAdminView = displayRole === "hr" && isHR;
  const net = (salary) => Number(salary.basic) + Number(salary.hra) - Number(salary.deductions);
  const beginEdit = (person) => { setEditingId(person.id); setDraft({ ...person.salary }); };
  const save = async (person) => {
    await updateSalary(person._userId || person.id, Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, Number(value) || 0])));
    setEditingId(null);
    setDraft(null);
    notify("Payroll structure updated.");
  };

  if (!previewPerson) return <p>Loading payroll…</p>;

    if (!isAdminView) return <><div className="view-heading"><div><span className="eyebrow">Your salary details</span><h1>Clarity in every pay cycle.</h1><p>Your current monthly salary structure is shown here for review.</p></div><span className="status-pill status-pill--muted"><LockKeyhole size={15} /> Read only</span></div><section className="payroll-feature"><article className="payroll-slip"><div className="payroll-slip__head"><div><span className="eyebrow">Monthly salary / {new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date())}</span><h2>{previewPerson.name}</h2><p>{previewPerson.employeeId} · {previewPerson.department}</p></div><img src={ASSET.payroll} alt="" onError={(e) => { e.target.style.display = 'none'; }} /></div><SalaryBreakdown salary={previewPerson.salary} highlighted /><div className="payslip-footer"><span>Net monthly salary</span><strong>{currency(net(previewPerson.salary))}</strong></div></article><article className="payroll-note"><span className="eyebrow">Good to know</span><h2>This is your current record.</h2><p>For a payroll discrepancy or change request, use your regular people-operations contact with the pay period and detail noted.</p><button className="text-button" onClick={() => downloadSalaryStatement(previewPerson)}>Download HTML statement <Download size={15} /></button></article></section></>;
  return <><div className="view-heading"><div><span className="eyebrow">Compensation desk</span><h1>Payroll, without the fog.</h1><p>Review monthly salary structures across the team, update the inputs, and keep every total visible.</p></div><button className="quiet-button" onClick={() => exportPayrollCSV(people)}><Download size={17} /> Export CSV summary</button></div><section className="payroll-summary"><Metric label="Monthly base" value={currency(people.reduce((sum, person) => sum + (person.salary?.basic || 0), 0))} detail="Across active records" icon={CircleDollarSign} tone="teal" /><Metric label="Total HRA" value={currency(people.reduce((sum, person) => sum + (person.salary?.hra || 0), 0))} detail="Monthly allowance" icon={WalletCards} tone="blue" /><Metric label="Deductions" value={currency(people.reduce((sum, person) => sum + (person.salary?.deductions || 0), 0))} detail="Current period" icon={FileText} tone="amber" /></section><section className="table-card payroll-table"><div className="table-toolbar"><div><span className="eyebrow">Salary register</span><h2>Current monthly structure</h2></div><button className="quiet-button"><RefreshCcw size={16} /> Refresh</button></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Employee</th><th>Basic</th><th>HRA</th><th>Deductions</th><th>Net salary</th><th /></tr></thead><tbody>{people.map((person) => { const editing = editingId === person.id; const salary = editing ? draft : person.salary; return <tr key={person.id}><td><div className="table-person"><Avatar person={person} size="small" /><span><strong>{person.name}</strong><small>{person.title}</small></span></div></td>{["basic", "hra", "deductions"].map((key) => <td key={key}>{editing ? <input className="salary-input" type="number" value={salary[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /> : currency(person.salary?.[key])}</td>)}<td><strong>{currency(net(salary))}</strong></td><td>{editing ? <div className="table-actions"><button className="save-mini" onClick={() => save(person)}><Check size={15} /></button><button className="cancel-mini" onClick={() => setEditingId(null)}><X size={15} /></button></div> : <button className="text-button" onClick={() => beginEdit(person)}>Edit <PencilLine size={14} /></button>}</td></tr>; })}</tbody></table></div></section></>;
}

// ════════════════════════════════════════════════════════════════
// ANALYTICS (HR only)
// ════════════════════════════════════════════════════════════════

function AnalyticsView({ notify }) {
  const [attData, setAttData] = useState(null);
  const [leaveData, setLeaveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAttendanceAnalytics(), fetchLeavesAnalytics()])
      .then(([attRes, leaveRes]) => {
        if (attRes.error && leaveRes.error) {
          setError("Could not load analytics data.");
          notify("Analytics data unavailable.", "warning");
        } else {
          if (attRes.data) setAttData(attRes.data);
          if (leaveRes.data) setLeaveData(leaveRes.data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="view-heading"><div><span className="eyebrow">Analytics</span><h1>Loading insights…</h1></div></div>;
  if (error) return <div className="view-heading"><div><span className="eyebrow">Analytics</span><h1>Data unavailable</h1><p>{error}</p></div></div>;

  const totalAtt = attData?.status_breakdown
    ? (attData.status_breakdown.present || 0) + (attData.status_breakdown.half_day || 0) + (attData.status_breakdown.leave || 0) + (attData.status_breakdown.absent || 0)
    : 0;

  return (
    <>
      <div className="view-heading"><div><span className="eyebrow">People analytics</span><h1>Patterns worth noticing.</h1><p>Attendance trends, leave patterns, and operational visibility for the HR desk.</p></div></div>

      {attData && (
        <>
          <section className="metric-strip">
            <Metric label="30-Day Records" value={totalAtt} detail="Total tracked entries" icon={CalendarCheck} tone="teal" />
            <Metric label="Present" value={attData.status_breakdown?.present ?? 0} detail="Days marked present" icon={CheckCircle2} tone="blue" />
            <Metric label="Half-day" value={attData.status_breakdown?.half_day ?? 0} detail="Partial attendance" icon={Clock3} tone="amber" />
            <Metric label="On leave" value={attData.status_breakdown?.leave ?? 0} detail="Approved leave days" icon={CalendarDays} tone="rose" />
          </section>

          {attData.daily_summary && attData.daily_summary.length > 0 && (
            <section className="table-card" style={{ marginBottom: 20 }}>
              <div className="table-toolbar">
                <div><span className="eyebrow">Daily attendance</span><h2>Last 30 days activity ledger</h2></div>
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Present</th>
                      <th>Half-day</th>
                      <th>On leave</th>
                      <th>Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attData.daily_summary.slice(-10).reverse().map((day) => (
                      <tr key={day.date}>
                        <td><strong>{dateLabel(day.date)}</strong></td>
                        <td><span className="status-pill status-pill--present">{day.present}</span></td>
                        <td><span className="status-pill status-pill--half-day">{day.half_day}</span></td>
                        <td><span className="status-pill status-pill--leave">{day.leave}</span></td>
                        <td><span className="status-pill status-pill--absent">{day.absent}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {leaveData && (
        <section className="hr-feature-grid" style={{ marginTop: 20 }}>
          {leaveData.by_type && (
            <article className="table-card" style={{ padding: 20 }}>
              <div className="section-heading"><div><span className="eyebrow">Leave categories</span><h2>Leave requests by type</h2></div></div>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {Object.entries(leaveData.by_type).map(([type, count]) => (
                  <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--paper-deep)", borderRadius: 8 }}>
                    <span><strong>{capitalize(type)} leave</strong></span>
                    <span className="status-pill status-pill--pending" style={{ fontSize: 12 }}>{count} requests</span>
                  </div>
                ))}
              </div>
            </article>
          )}

          {leaveData.monthly_trend && (
            <article className="table-card" style={{ padding: 20, gridColumn: "span 2" }}>
              <div className="section-heading"><div><span className="eyebrow">6-Month Trend</span><h2>Monthly leave volume</h2></div></div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 160, padding: "20px 10px 0" }}>
                {leaveData.monthly_trend.map((m) => {
                  const maxCount = Math.max(...leaveData.monthly_trend.map((x) => x.count), 1);
                  const pct = Math.max(12, Math.round((m.count / maxCount) * 100));
                  return (
                    <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--teal)" }}>{m.count}</span>
                      <div style={{ width: "100%", height: `${pct}%`, background: "var(--teal)", borderRadius: "6px 6px 0 0", opacity: m.count > 0 ? 0.9 : 0.2 }} />
                      <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'DM Mono', monospace" }}>{m.month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </article>
          )}
        </section>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ════════════════════════════════════════════════════════════════

function QuickAction({ icon: Icon, label, value, tone, onClick }) { return <button className={`quick-action quick-action--${tone}`} onClick={onClick}><div className="quick-icon"><Icon size={21} /></div><div><span>{label}</span><strong>{value}</strong></div><ArrowUpRight size={17} /></button>; }
function Metric({ label, value, detail, icon: Icon, tone }) { return <article className={`metric metric--${tone}`}><div className="metric-icon"><Icon size={19} /></div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function ActivityLine({ icon: Icon, title, detail, tone }) { return <div className="activity-line"><div className={`activity-icon activity-icon--${tone}`}><Icon size={16} /></div><div><strong>{title}</strong><span>{detail}</span></div></div>; }
function Avatar({ person, size = "small" }) { return <span className={`avatar avatar--${size}`}>{person?.avatarImage ? <img src={person.avatarImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} onError={(e) => { e.target.style.display = "none"; }} /> : person?.avatar || "DF"}</span>; }
function StatusPill({ status }) { return <span className={`status-pill status-pill--${(status || "").toLowerCase().replace(/[^a-z]/g, "-")}`}>{status}</span>; }
function StatusLegend({ status }) { return <span className="legend-item"><i className={`legend-dot legend-dot--${status.toLowerCase().replace(/[^a-z]/g, "-")}`} />{status}</span>; }
function Rule({ ok, text }) { return <span className={classNames("rule", ok && "rule--ok")}>{ok ? <Check size={13} /> : <i />}{text}</span>; }
function Meta({ icon: Icon, label, value }) { return <div className="meta-row"><Icon size={17} /><div><span>{label}</span><strong>{value}</strong></div></div>; }
function EditableField({ label, value, disabled, onChange, icon: Icon, multiline = false }) { return <label className={classNames("detail-field", disabled && "detail-field--static")}><span><Icon size={15} />{label}</span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} rows="3" /> : <input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} />}</label>; }
function SalaryBreakdown({ salary, highlighted = false }) { const net = Number(salary?.basic || 0) + Number(salary?.hra || 0) - Number(salary?.deductions || 0); return <div className={classNames("salary-breakdown", highlighted && "salary-breakdown--featured")}><div><span>Basic salary</span><strong>{currency(salary?.basic)}</strong></div><div><span>House rent allowance</span><strong>{currency(salary?.hra)}</strong></div><div><span>Deductions</span><strong className="deduction">− {currency(salary?.deductions)}</strong></div><div className="salary-net"><span>Net monthly salary</span><strong>{currency(net)}</strong></div></div>; }
function Toast({ message, tone, onClose }) { const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? AlertCircle : Bell; return <div className={`toast toast--${tone}`}><Icon size={18} /><span>{message}</span><button onClick={onClose} aria-label="Dismiss notification"><X size={16} /></button></div>; }

export default App;


