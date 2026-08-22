// ============================================================
// Dayflow HRMS — Frontend JavaScript (Vanilla JS + Fetch API)
// Connects to Flask backend at same origin /api
// ============================================================

const API_BASE = '/api';
let authToken = localStorage.getItem('token') || null;
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// ────────────────────────────────────────────────────────────
// SECTION 1: API CLIENT
// ────────────────────────────────────────────────────────────

async function apiCall(method, endpoint, body = null) {
    const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (authToken) {
        options.headers['Authorization'] = 'Bearer ' + authToken;
    }

    if (body !== null) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(API_BASE + endpoint, options);
        const data = await response.json();

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            authToken = null;
            currentUser = null;
            showError('Session expired. Please login again.');
            showView('login');
            throw new Error('Unauthorized');
        }

        if (response.status === 403) {
            showError(data.error || 'Access denied.');
            throw new Error('Forbidden');
        }

        if (response.status === 404) {
            showError(data.error || 'Resource not found');
            throw new Error('Not Found');
        }

        if (response.status === 409) {
            showError(data.error || 'Conflict — already exists');
            throw new Error('Conflict');
        }

        if (!response.ok) {
            showError(data.error || 'Something went wrong.');
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        if (error.name === 'TypeError') {
            showError('Cannot connect to server. Is the backend running?');
        }
        throw error;
    }
}

function showError(message) {
    const toast = document.getElementById('error-toast');
    if (toast) {
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 4000);
    } else {
        console.error('Error:', message);
    }
}

function showSuccess(message) {
    const toast = document.getElementById('success-toast');
    if (toast) {
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
    } else {
        console.log('Success:', message);
    }
}

// ────────────────────────────────────────────────────────────
// SECTION 2: AUTHENTICATION
// ────────────────────────────────────────────────────────────

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    setLoading(btn, true, 'Signing in...');

    try {
        const data = await apiCall('POST', '/auth/login', { email, password });
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        showSuccess('Login successful!');
        onLoginSuccess();
    } catch (err) {
        // Error already shown
    } finally {
        setLoading(btn, false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const employee_id = document.getElementById('reg-empid')?.value.trim().toUpperCase();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const role = document.getElementById('reg-role')?.value;

    if (!employee_id || !email || !password || !role) {
        showError('Please fill all fields');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    setLoading(btn, true, 'Creating account...');

    try {
        const data = await apiCall('POST', '/auth/signup', { employee_id, email, password, role });
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        showSuccess('Account created!');
        onLoginSuccess();
    } catch (err) {
        // Error already shown
    } finally {
        setLoading(btn, false);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authToken = null;
    currentUser = null;
    document.getElementById('main-navbar')?.classList.add('hidden');
    showView('login');
    showSuccess('Logged out');
}

function onLoginSuccess() {
    // Show navbar
    document.getElementById('main-navbar')?.classList.remove('hidden');
    // Route to dashboard
    navigateTo('dashboard');
}

// ────────────────────────────────────────────────────────────
// SECTION 3: VIEW ROUTER
// ────────────────────────────────────────────────────────────

function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

    const view = document.getElementById(viewName + '-view');
    if (view) view.classList.remove('hidden');

    // Update navbar active state
    document.querySelectorAll('.nav-links a[data-view]').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-view') === viewName);
    });

    // Toggle role-based sections
    document.querySelectorAll('.hr-only').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.employee-only').forEach(el => el.classList.remove('hidden'));

    if (currentUser && currentUser.role === 'hr') {
        document.querySelectorAll('.hr-only').forEach(el => el.classList.remove('hidden'));
    }

    // Show/hide navbar based on auth state
    const navbar = document.getElementById('main-navbar');
    if (navbar) {
        if (viewName === 'login' || viewName === 'register') {
            navbar.classList.add('hidden');
        } else {
            navbar.classList.remove('hidden');
        }
    }
}

function navigateTo(viewName) {
    showView(viewName);

    switch (viewName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'profile':
            loadProfile();
            if (currentUser?.role === 'hr') loadAllProfiles();
            break;
        case 'attendance':
            loadAttendance();
            if (currentUser?.role === 'hr') loadAllAttendance();
            break;
        case 'leaves':
            loadMyLeaves();
            if (currentUser?.role === 'hr') loadAllLeaves();
            break;
        case 'payroll':
            loadMyPayroll();
            if (currentUser?.role === 'hr') loadAllPayroll();
            break;
    }
}

// ────────────────────────────────────────────────────────────
// SECTION 4: DASHBOARD
// ────────────────────────────────────────────────────────────

async function loadDashboard() {
    try {
        const data = await apiCall('GET', '/dashboard');

        const nameEl = document.getElementById('emp-name');
        if (nameEl) nameEl.textContent = currentUser?.employee_id || 'User';

        if (data.role === 'hr') {
            setText('total-employees', data.total_employees || 0);
            setText('pending-leave-reqs', data.pending_leave_requests || 0);
            setText('today-present', data.today_present || 0);
            setText('today-absent', data.today_absent || 0);
            setText('today-on-leave', data.today_on_leave || 0);
        } else {
            const att = data.today_attendance || {};
            const statusEl = document.getElementById('today-status');
            const btn = document.getElementById('checkin-btn');

            if (statusEl) {
                if (!att.check_in) {
                    statusEl.textContent = 'Not checked in';
                } else if (att.check_in && !att.check_out) {
                    statusEl.textContent = 'Checked in at ' + att.check_in;
                } else {
                    statusEl.textContent = 'Done for today (' + att.status + ')';
                }
            }

            if (btn) {
                if (!att.check_in) {
                    btn.textContent = 'Check In';
                    btn.onclick = handleCheckIn;
                    btn.disabled = false;
                } else if (att.check_in && !att.check_out) {
                    btn.textContent = 'Check Out';
                    btn.onclick = handleCheckOut;
                    btn.disabled = false;
                } else {
                    btn.textContent = 'Checked Out ✓';
                    btn.disabled = true;
                }
            }

            setText('pending-leaves', data.pending_leaves || 0);

            const pct = data.profile_completeness || 0;
            setText('profile-pct', pct + '%');
            const barEl = document.getElementById('profile-bar');
            if (barEl) barEl.style.width = pct + '%';
        }
    } catch (err) {
        console.error('Dashboard load failed:', err);
    }
}

// ────────────────────────────────────────────────────────────
// SECTION 5: PROFILE
// ────────────────────────────────────────────────────────────

async function loadProfile() {
    try {
        const profile = await apiCall('GET', '/profile');

        setText('profile-name', profile.full_name || 'No Name');
        setText('profile-dept', profile.department || '—');
        setText('profile-desig', profile.designation || '—');
        setText('profile-empid', currentUser?.employee_id || '—');
        setText('profile-email', currentUser?.email || '—');
        setText('profile-joining', profile.joining_date || '—');

        const phoneInput = document.getElementById('edit-phone');
        if (phoneInput) phoneInput.value = profile.phone || '';

        const addrInput = document.getElementById('edit-address');
        if (addrInput) addrInput.value = profile.address || '';

        const avatarEl = document.getElementById('profile-avatar');
        if (avatarEl && profile.profile_picture) {
            avatarEl.innerHTML = '<img src="' + profile.profile_picture + '" style="width:80px;height:80px;border-radius:50%;object-fit:cover">';
        }
    } catch (err) {
        console.error('Profile load failed:', err);
    }
}

async function saveProfile() {
    const phone = document.getElementById('edit-phone')?.value.trim();
    const address = document.getElementById('edit-address')?.value.trim();
    const profile_picture = document.getElementById('edit-pic')?.value.trim() || '';

    const btn = document.getElementById('save-profile-btn');
    setLoading(btn, true, 'Saving...');

    try {
        const body = { phone, address };
        if (profile_picture) body.profile_picture = profile_picture;
        await apiCall('PUT', '/profile', body);
        showSuccess('Profile updated!');
        loadProfile();
        loadDashboard();
    } catch (err) {
        // Error shown
    } finally {
        setLoading(btn, false);
    }
}

async function loadAllProfiles() {
    try {
        const data = await apiCall('GET', '/profiles');
        const tbody = document.getElementById('all-profiles-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        const profiles = data.profiles || data;

        if (!profiles || profiles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty">No employees found</td></tr>';
            return;
        }

        profiles.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + (p.user?.employee_id || '—') + '</td>' +
                '<td>' + (p.full_name || '—') + '</td>' +
                '<td>' + (p.department || '—') + '</td>' +
                '<td>' + (p.designation || '—') + '</td>' +
                '<td>' + (p.phone || '—') + '</td>' +
                '<td><button class="btn btn-small" onclick="editProfile(' + p.user_id + ')">Edit</button></td>';
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Profiles load failed:', err);
    }
}

async function editProfile(userId) {
    const full_name = prompt('Full Name:');
    if (full_name === null) return;
    const department = prompt('Department:') || '';
    const designation = prompt('Designation:') || '';
    const phone = prompt('Phone:') || '';
    const address = prompt('Address:') || '';
    const joining_date = prompt('Joining Date (YYYY-MM-DD):') || '';

    try {
        await apiCall('PUT', '/profiles/' + userId, { full_name, department, designation, phone, address, joining_date });
        showSuccess('Profile updated!');
        loadAllProfiles();
    } catch (err) { /* shown */ }
}

// ────────────────────────────────────────────────────────────
// SECTION 6: ATTENDANCE
// ────────────────────────────────────────────────────────────

async function handleCheckIn() {
    const btn = document.getElementById('checkin-btn') || document.getElementById('att-checkin-btn');
    setLoading(btn, true, 'Checking in...');
    try {
        await apiCall('POST', '/attendance/checkin', {});
        showSuccess('Checked in!');
        loadDashboard();
        loadAttendance();
    } catch (err) { /* shown */ }
    finally { setLoading(btn, false); }
}

async function handleCheckOut() {
    const btn = document.getElementById('checkin-btn') || document.getElementById('att-checkout-btn');
    setLoading(btn, true, 'Checking out...');
    try {
        await apiCall('POST', '/attendance/checkout', {});
        showSuccess('Checked out!');
        loadDashboard();
        loadAttendance();
    } catch (err) { /* shown */ }
    finally { setLoading(btn, false); }
}

async function loadAttendance() {
    try {
        const start = document.getElementById('att-start')?.value || '';
        const end = document.getElementById('att-end')?.value || '';
        let url = '/attendance/my';
        if (start && end) url += '?start_date=' + start + '&end_date=' + end;

        const data = await apiCall('GET', url);
        const tbody = document.getElementById('attendance-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        const records = data.attendance || data;

        if (!records || records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty">No attendance records</td></tr>';
            return;
        }

        records.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + row.date + '</td>' +
                '<td>' + (row.check_in || '—') + '</td>' +
                '<td>' + (row.check_out || '—') + '</td>' +
                '<td><span class="badge badge-' + row.status + '">' + row.status + '</span></td>';
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Attendance load failed:', err);
    }
}

async function loadAllAttendance() {
    try {
        const dateVal = document.getElementById('att-filter-date')?.value || '';
        let url = '/attendance/all';
        if (dateVal) url += '?date=' + dateVal;

        const data = await apiCall('GET', url);
        const tbody = document.getElementById('all-attendance-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        const records = data.attendance || data;

        if (!records || records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty">No records</td></tr>';
            return;
        }

        records.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + (row.user?.employee_id || '—') + '</td>' +
                '<td>' + row.date + '</td>' +
                '<td>' + (row.check_in || '—') + '</td>' +
                '<td>' + (row.check_out || '—') + '</td>' +
                '<td><span class="badge badge-' + row.status + '">' + row.status + '</span></td>';
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('All attendance load failed:', err);
    }
}

// ────────────────────────────────────────────────────────────
// SECTION 7: LEAVES
// ────────────────────────────────────────────────────────────

async function applyLeave(e) {
    e.preventDefault();
    const leave_type = document.getElementById('leave-type')?.value;
    const start_date = document.getElementById('leave-start')?.value;
    const end_date = document.getElementById('leave-end')?.value;
    const remarks = document.getElementById('leave-remarks')?.value || '';

    if (!leave_type || !start_date || !end_date) {
        showError('Please fill all required fields');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    setLoading(btn, true, 'Submitting...');

    try {
        await apiCall('POST', '/leaves', { leave_type, start_date, end_date, remarks });
        showSuccess('Leave submitted!');
        e.target.reset();
        loadMyLeaves();
        loadDashboard();
    } catch (err) { /* shown */ }
    finally { setLoading(btn, false); }
}

async function loadMyLeaves() {
    try {
        const data = await apiCall('GET', '/leaves/my');
        const tbody = document.getElementById('my-leaves-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        const leaves = data.leaves || data;

        if (!leaves || leaves.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty">No leave requests</td></tr>';
            return;
        }

        leaves.forEach(leave => {
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + leave.leave_type + '</td>' +
                '<td>' + leave.start_date + '</td>' +
                '<td>' + leave.end_date + '</td>' +
                '<td>' + (leave.total_days || '—') + '</td>' +
                '<td><span class="badge badge-' + leave.status + '">' + leave.status + '</span></td>' +
                '<td>' + (leave.admin_comment || '—') + '</td>';
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('My leaves load failed:', err);
    }
}

async function loadAllLeaves() {
    try {
        const status = document.getElementById('leave-status-filter')?.value || '';
        let url = '/leaves/all';
        if (status) url += '?status=' + status;

        const data = await apiCall('GET', url);
        const tbody = document.getElementById('all-leaves-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        const leaves = data.leaves || data;

        if (!leaves || leaves.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty">No leave requests</td></tr>';
            return;
        }

        leaves.forEach(leave => {
            const tr = document.createElement('tr');
            let actionCell;
            if (leave.status === 'pending') {
                actionCell =
                    '<button class="btn btn-small btn-success" onclick="approveLeave(' + leave.id + ')">Approve</button> ' +
                    '<button class="btn btn-small btn-danger" onclick="rejectLeave(' + leave.id + ')">Reject</button>';
            } else {
                actionCell = leave.admin_comment || '—';
            }

            tr.innerHTML =
                '<td>' + (leave.user?.employee_id || '—') + '</td>' +
                '<td>' + leave.leave_type + '</td>' +
                '<td>' + leave.start_date + '</td>' +
                '<td>' + leave.end_date + '</td>' +
                '<td><span class="badge badge-' + leave.status + '">' + leave.status + '</span></td>' +
                '<td>' + actionCell + '</td>';
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('All leaves load failed:', err);
    }
}

async function approveLeave(id) {
    const comment = prompt('Add comment (optional):') || '';
    try {
        await apiCall('PUT', '/leaves/' + id + '/status', { status: 'approved', admin_comment: comment });
        showSuccess('Leave approved!');
        loadAllLeaves();
        loadDashboard();
    } catch (err) { /* shown */ }
}

async function rejectLeave(id) {
    const comment = prompt('Reason for rejection:') || '';
    try {
        await apiCall('PUT', '/leaves/' + id + '/status', { status: 'rejected', admin_comment: comment });
        showSuccess('Leave rejected');
        loadAllLeaves();
        loadDashboard();
    } catch (err) { /* shown */ }
}

// ────────────────────────────────────────────────────────────
// SECTION 8: PAYROLL
// ────────────────────────────────────────────────────────────

async function loadMyPayroll() {
    try {
        const data = await apiCall('GET', '/payroll/my');
        setText('pay-basic', '₹' + (data.basic_salary || 0).toLocaleString());
        setText('pay-hra', '₹' + (data.hra || 0).toLocaleString());
        setText('pay-deductions', '-₹' + (data.deductions || 0).toLocaleString());
        setText('pay-net', '₹' + (data.net_salary || 0).toLocaleString());
    } catch (err) {
        console.error('Payroll load failed:', err);
    }
}

async function loadAllPayroll() {
    try {
        const data = await apiCall('GET', '/payroll/all');
        const tbody = document.getElementById('all-payroll-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        const payrolls = data.payrolls || data;

        if (!payrolls || payrolls.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty">No payroll records</td></tr>';
            return;
        }

        payrolls.forEach(p => {
            const empId = p.user?.employee_id || p.employee?.employee_id || '—';
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + empId + '</td>' +
                '<td>₹' + (p.basic_salary || 0).toLocaleString() + '</td>' +
                '<td>₹' + (p.hra || 0).toLocaleString() + '</td>' +
                '<td>₹' + (p.deductions || 0).toLocaleString() + '</td>' +
                '<td>₹' + (p.net_salary || 0).toLocaleString() + '</td>' +
                '<td><button class="btn btn-small" onclick="editPayroll(' + p.user_id + ')">Edit</button></td>';
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('All payroll load failed:', err);
    }
}

async function editPayroll(userId) {
    const basic = parseFloat(prompt('Basic Salary:') || 0);
    if (isNaN(basic)) { showError('Invalid basic salary'); return; }
    const hra = parseFloat(prompt('HRA:') || 0);
    if (isNaN(hra)) { showError('Invalid HRA'); return; }
    const deductions = parseFloat(prompt('Deductions:') || 0);
    if (isNaN(deductions)) { showError('Invalid deductions'); return; }

    try {
        await apiCall('PUT', '/payroll/' + userId, { basic_salary: basic, hra: hra, deductions: deductions });
        showSuccess('Payroll updated!');
        loadAllPayroll();
    } catch (err) { /* shown */ }
}

// ────────────────────────────────────────────────────────────
// SECTION 9: UTILITIES
// ────────────────────────────────────────────────────────────

function setLoading(btn, isLoading, text = 'Loading...') {
    if (!btn) return;
    btn.disabled = isLoading;
    if (isLoading) {
        btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
        btn.textContent = text;
    } else {
        btn.textContent = btn.dataset.originalText || 'Submit';
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ────────────────────────────────────────────────────────────
// SECTION 10: INITIALIZATION
// ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Auth forms
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    // Profile
    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);

    // Attendance filter
    const attFilterBtn = document.getElementById('att-filter-btn');
    if (attFilterBtn) attFilterBtn.addEventListener('click', loadAttendance);

    // Leaves
    const leaveForm = document.getElementById('leave-form');
    if (leaveForm) leaveForm.addEventListener('submit', applyLeave);

    const leaveStatusFilter = document.getElementById('leave-status-filter');
    if (leaveStatusFilter) leaveStatusFilter.addEventListener('change', loadAllLeaves);

    // Navigation links
    document.querySelectorAll('.nav-links a[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.getAttribute('data-view'));
        });
    });

    // Check if already logged in
    if (authToken && currentUser) {
        apiCall('GET', '/auth/me')
            .then(() => { onLoginSuccess(); })
            .catch(() => { showView('login'); });
    } else {
        showView('login');
    }
});
