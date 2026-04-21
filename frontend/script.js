const API = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://your-backend.vercel.app/api'; // 🔁 Replace with your deployed backend URL

let token      = '';
let allData    = [];
let txType     = 'income';
let curFilter  = 'all';
let chart      = null;

// ── Theme ────────────────────────────────────────────────────
function initTheme() {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    document.querySelector('#theme-btn i').className = 'fa fa-sun';
  }
}

document.getElementById('theme-btn').onclick = () => {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  document.querySelector('#theme-btn i').className = dark ? 'fa fa-sun' : 'fa fa-moon';
  if (chart) drawChart();
};

// ── Auth Tab Switch ──────────────────────────────────────────
let authMode = 'login';

function switchTab(mode) {
  authMode = mode;
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + mode).classList.add('active');
  document.getElementById('auth-btn-text').textContent =
    mode === 'login' ? 'Log me in' : 'Create my account';
  document.querySelector('#auth-btn i').className =
    mode === 'login' ? 'fa fa-sign-in-alt' : 'fa fa-user-plus';
  document.getElementById('auth-error').style.display = 'none';
}

// ── Auth Handler ─────────────────────────────────────────────
async function handleAuth() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errEl    = document.getElementById('auth-error');
  errEl.style.display = 'none';

  if (!username || !password) {
    errEl.textContent = 'Fill in both fields first.';
    errEl.style.display = 'block';
    return;
  }

  const btn = document.getElementById('auth-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa fa-spinner spin"></i> Hold on…';

  try {
    if (authMode === 'register') {
      const r = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const d = await r.json();
      if (!r.ok) {
        errEl.textContent = d.message || 'Registration failed.';
        errEl.style.display = 'block';
        return;
      }
      showToast('Account ready. Go ahead and log in.');
      switchTab('login');
    } else {
      const r = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const d = await r.json();
      if (!r.ok || !d.token) {
        errEl.textContent = d.message || 'Hmm, that didn\'t work. Check your username and password.';
        errEl.style.display = 'block';
        return;
      }
      token = d.token;
      localStorage.setItem('token', token);
      document.getElementById('username-display').textContent = d.username || username;
      showDashboard();
      getData();
    }
  } catch {
    errEl.textContent = 'Can\'t reach the server right now. Is it running?';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa fa-sign-in-alt"></i> <span id="auth-btn-text">${authMode === 'login' ? 'Log me in' : 'Create my account'}</span>`;
  }
}

document.getElementById('password').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleAuth();
});

// ── Show / Hide Dashboard ────────────────────────────────────
function showDashboard() {
  document.getElementById('auth-panel').style.display   = 'none';
  document.getElementById('dashboard').style.display    = 'block';
  document.getElementById('logout-btn').style.display   = 'flex';
  document.getElementById('user-pill').style.display    = 'flex';
}

document.getElementById('logout-btn').onclick = () => {
  token = '';
  allData = [];
  localStorage.removeItem('token');
  document.getElementById('auth-panel').style.display  = 'flex';
  document.getElementById('dashboard').style.display   = 'none';
  document.getElementById('logout-btn').style.display  = 'none';
  document.getElementById('user-pill').style.display   = 'none';
  document.getElementById('username').value  = '';
  document.getElementById('password').value  = '';
};

// ── Type Toggle ──────────────────────────────────────────────
function setType(t) {
  txType = t;
  document.getElementById('type-income').classList.toggle('active',  t === 'income');
  document.getElementById('type-expense').classList.toggle('active', t === 'expense');
}

// ── Add Transaction ──────────────────────────────────────────
async function addTransaction() {
  const title    = document.getElementById('tx-title').value.trim();
  const rawAmt   = parseFloat(document.getElementById('tx-amount').value);
  const category = document.getElementById('tx-category').value;
  const date     = document.getElementById('tx-date').value || today();

  if (!title || isNaN(rawAmt) || rawAmt <= 0) {
    showToast('Need a title and a valid amount.');
    return;
  }

  const amount = txType === 'expense' ? -Math.abs(rawAmt) : Math.abs(rawAmt);

  try {
    const r = await fetch(`${API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ title, amount, category, date }),
    });
    if (!r.ok) { showToast('Couldn\'t save that one.'); return; }
    document.getElementById('tx-title').value  = '';
    document.getElementById('tx-amount').value = '';
    showToast('Logged. Your wallet knows.');
    getData();
  } catch {
    showToast('Something went wrong. Try again.');
  }
}

// ── Fetch Transactions ───────────────────────────────────────
async function getData() {
  document.getElementById('loader').classList.add('show');
  try {
    const r = await fetch(`${API}/transactions`, { headers: { Authorization: token } });
    if (!r.ok) throw new Error();
    allData = await r.json();
    renderAll();
  } catch {
    document.getElementById('list').innerHTML =
      '<p style="color:var(--muted);font-size:13px;text-align:center;padding:1rem;font-style:italic">Couldn\'t load your transactions. Server issue?</p>';
  } finally {
    document.getElementById('loader').classList.remove('show');
  }
}

// ── Render All ───────────────────────────────────────────────
function renderAll() {
  updateSummary();
  renderList();
  drawChart();
  updateStats();
}

// ── Summary Cards ────────────────────────────────────────────
function updateSummary() {
  let income = 0, expense = 0;
  allData.forEach(i => {
    if (i.amount > 0) income  += i.amount;
    else              expense += Math.abs(i.amount);
  });
  const balance     = income - expense;
  const incomeItems  = allData.filter(i => i.amount > 0);
  const expenseItems = allData.filter(i => i.amount < 0);

  document.getElementById('balance-main').textContent  = fmt(balance);
  document.getElementById('total-income').textContent  = fmt(income);
  document.getElementById('total-expense').textContent = fmt(expense);
  document.getElementById('tx-count').textContent      = allData.length
    ? `${allData.length} transaction${allData.length !== 1 ? 's' : ''}`
    : 'nothing logged yet';
  document.getElementById('income-count').textContent  = incomeItems.length
    ? `${incomeItems.length} entr${incomeItems.length !== 1 ? 'ies' : 'y'}`
    : 'no income added';
  document.getElementById('expense-count').textContent = expenseItems.length
    ? `${expenseItems.length} entr${expenseItems.length !== 1 ? 'ies' : 'y'}`
    : 'no expenses yet';
}

// ── Quick Stats ──────────────────────────────────────────────
function updateStats() {
  const expenses = allData.filter(i => i.amount < 0);
  if (expenses.length === 0) {
    document.getElementById('stat-biggest').textContent  = '—';
    document.getElementById('stat-avg').textContent      = '—';
    document.getElementById('stat-top-cat').textContent  = '—';
    document.getElementById('stat-count').textContent    = allData.length;
    document.getElementById('chart-center-amount').textContent = '₹0';
    return;
  }

  const amounts   = expenses.map(i => Math.abs(i.amount));
  const biggest   = Math.max(...amounts);
  const avg       = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const totalExp  = amounts.reduce((a, b) => a + b, 0);

  const catMap = {};
  expenses.forEach(i => {
    catMap[i.category] = (catMap[i.category] || 0) + Math.abs(i.amount);
  });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  document.getElementById('stat-biggest').textContent  = fmt(biggest);
  document.getElementById('stat-avg').textContent      = fmt(avg);
  document.getElementById('stat-top-cat').textContent  = topCat;
  document.getElementById('stat-count').textContent    = allData.length;
  document.getElementById('chart-center-amount').textContent = fmt(totalExp);
}

// ── Transaction List ─────────────────────────────────────────
const catIcons = {
  Food: 'fa-utensils', Transport: 'fa-bus', Shopping: 'fa-shopping-bag',
  Bills: 'fa-file-invoice-dollar', Health: 'fa-heart',
  Entertainment: 'fa-gamepad', Salary: 'fa-briefcase',
  Freelance: 'fa-laptop-code', General: 'fa-wallet',
};

function renderList() {
  const listEl = document.getElementById('list');

  let filtered = allData;
  if      (curFilter === 'income')  filtered = allData.filter(i => i.amount > 0);
  else if (curFilter === 'expense') filtered = allData.filter(i => i.amount < 0);
  else if (curFilter !== 'all')     filtered = allData.filter(i => i.category === curFilter);

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fa fa-inbox"></i>
        <p>Nothing here yet. Add something above.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = [...filtered].reverse().map(item => {
    const isIncome = item.amount > 0;
    const icon     = catIcons[item.category] || 'fa-wallet';
    const amtStr   = isIncome
      ? `+₹${fmt2(Math.abs(item.amount))}`
      : `-₹${fmt2(Math.abs(item.amount))}`;
    return `
      <div class="tx-item">
        <div class="tx-icon ${isIncome ? 'income-icon' : 'expense-icon'}">
          <i class="fa ${icon}"></i>
        </div>
        <div class="tx-info">
          <div class="tx-title">${esc(item.title)}</div>
          <div class="tx-meta">${item.category || 'General'} · ${item.date || ''}</div>
        </div>
        <div class="tx-amount ${isIncome ? 'pos' : 'neg'}">${amtStr}</div>
        <button class="tx-del" onclick="deleteItem('${item._id}')" title="Remove this">
          <i class="fa fa-trash"></i>
        </button>
      </div>`;
  }).join('');
}

// ── Doughnut Chart ───────────────────────────────────────────
function drawChart() {
  const isDark   = document.body.classList.contains('dark');
  const ctx      = document.getElementById('chart').getContext('2d');
  const catTotals = {};

  allData.filter(i => i.amount < 0).forEach(i => {
    const cat = i.category || 'General';
    catTotals[cat] = (catTotals[cat] || 0) + Math.abs(i.amount);
  });

  const labels  = Object.keys(catTotals);
  const values  = Object.values(catTotals);
  const palette = ['#2d5a3d','#c0392b','#2980b9','#e67e22','#8e44ad','#16a085','#d35400','#27ae60','#8e6b3e'];

  if (chart) chart.destroy();

  if (values.length === 0) {
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['No expenses yet'],
        datasets: [{ data: [1], backgroundColor: [isDark ? '#2a2a28' : '#e8e5e0'], borderWidth: 0 }],
      },
      options: {
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        cutout: '68%',
      },
    });
    return;
  }

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: palette.slice(0, labels.length),
        borderWidth: 2,
        borderColor: isDark ? '#1a1916' : '#ffffff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: isDark ? '#a09d98' : '#6b6762',
            font: { size: 11, family: 'DM Sans' },
            padding: 12,
            boxWidth: 10,
            boxHeight: 10,
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ₹${ctx.raw.toLocaleString('en-IN')}`,
          },
        },
      },
    },
  });
}

// ── Filter ───────────────────────────────────────────────────
function applyFilter(el, filter) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  curFilter = filter;
  renderList();
}

// ── Delete ───────────────────────────────────────────────────
async function deleteItem(id) {
  try {
    const r = await fetch(`${API}/transactions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    });
    if (!r.ok) { showToast('Couldn\'t delete that one.'); return; }
    showToast('Gone. Never happened.');
    getData();
  } catch {
    showToast('Couldn\'t delete that one.');
  }
}

// ── Helpers ──────────────────────────────────────────────────
function fmt(n) {
  return '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN');
}
function fmt2(n) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function today() {
  return new Date().toISOString().split('T')[0];
}
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Boot ─────────────────────────────────────────────────────
document.getElementById('tx-date').valueAsDate = new Date();
initTheme();

const saved = localStorage.getItem('token');
if (saved) {
  token = saved;
  showDashboard();
  getData();
}
