
const ROOT = document.getElementById('app');
const QUEUE_ID = 'q-1';


const STORE_KEY = 'nimero-storage-v1';       
const USERS_KEY = 'nimero-users-v1';         
const AGENTS_KEY = 'nimero-agents-v1';       


function loadState() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    const seed = {
      org: { id: 'org-1', name: 'NimeroYanjye', locale: 'rw' },
      queues: [{ id: QUEUE_ID, tickets: [] }]
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}

function saveState(s) {
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

function createTicket(queueId) {
  const s = loadState();
  const q = s.queues.find(x => x.id === queueId);
  const next = q.tickets.length + 1;
  const id = "A" + next.toString().padStart(3, '0');
  q.tickets.push({ id, status: 'WAITING', createdAt: Date.now() });
  saveState(s);
  return id;
}


function loadUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function loadAgents() {
  return JSON.parse(localStorage.getItem(AGENTS_KEY) || '[]');
}
function saveAgents(agents) {
  localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
}


window.addEventListener('hashchange', route);
window.addEventListener('load', route);

function route() {
  const hash = location.hash.replace('#', '') || '/';
  if (hash === '/take') renderTake();
  else if (hash === '/agent') renderAgent();
  else if (hash === '/display') renderDisplay();
  else if (hash === '/login') renderLogin();
  else if (hash === '/signup-user') renderSignupUser();
  else if (hash === '/signup-agent') renderSignupAgent();
  else renderHome();
}


function renderHome() {
  
  ROOT.innerHTML = `
    <section class="hero">
      <div class="slides" id="slides">
        <div class="slide" style="background-image:url('A.jpg')"></div>
        <div class="slide" style="background-image:url('B.jpg')"></div>
        <div class="slide" style="background-image:url('C.jpg')"></div>
      </div>

      <div class="copy">
        <div class="h1">NimeroYanjye</div>
        <div class="lead">Fata nimero yawe, ukurikirane umurongo, ushyikire serivisi ku gihe.</div>
        <div class="controls">
          <button class="btn" id="take-now">Fata Nimero</button>
          <a href="#/login" class="btn ghost">Login</a>
        </div>
      </div>
    </section>
  `;

  
  const slides = document.querySelectorAll('.slide');
  let cur = 0;
  slides.forEach((s, i) => {
    if (i === 0) s.classList.add('active');
  });
  setInterval(() => {
    slides[cur].classList.remove('active');
    cur = (cur + 1) % slides.length;
    slides[cur].classList.add('active');
  }, 4000);

  document.getElementById('take-now').addEventListener('click', () => {
    const id = createTicket(QUEUE_ID);
    alert(`Nimero yawe: ${id}`);
  });
}

function renderTake() {
  ROOT.innerHTML = `
    <div class="card">
      <h2>Fata Nimero</h2>
      <p>Click the button to get your ticket number.</p>
      <button class="btn" id="btn-get">Fata Nimero</button>
    </div>
  `;
  document.getElementById('btn-get').addEventListener('click', () => {
    const id = createTicket(QUEUE_ID);
    alert(`Nimero yawe: ${id}`);
  });
}

function renderAgent() {
  ROOT.innerHTML = `
    <div class="card">
      <h2>Agent Console</h2>
      <p>Hamagarira abantu bakurikira cyangwa mark as served.</p>
      <div style="margin-top:12px;">
        <button id="next-btn" class="btn">Call Next</button>
        <button id="mark-served" class="btn" style="margin-left:8px">Mark Served</button>
      </div>
      <div id="agent-info" style="margin-top:12px;color:var(--muted)"></div>
    </div>
  `;

  
  const infoEl = document.getElementById('agent-info');
  function refreshInfo() {
    const s = loadState();
    const q = s.queues.find(x => x.id === QUEUE_ID);
    const next = q.tickets.find(t => t.status === 'WAITING');
    if (next) infoEl.textContent = `Next: ${next.id} (created ${new Date(next.createdAt).toLocaleString()})`;
    else infoEl.textContent = 'No waiting tickets';
  }
  refreshInfo();

  document.getElementById('next-btn').addEventListener('click', () => {
    const s = loadState();
    const q = s.queues.find(x => x.id === QUEUE_ID);
    const next = q.tickets.find(t => t.status === 'WAITING');
    if (next) {
      next.status = 'CALLED';
      saveState(s);
      alert(`Calling: ${next.id}`);
    } else {
      alert('Nta muntu uri mu murongo.');
    }
    refreshInfo();
  });

  document.getElementById('mark-served').addEventListener('click', () => {
    const s = loadState();
    const q = s.queues.find(x => x.id === QUEUE_ID);
    const called = q.tickets.find(t => t.status === 'CALLED');
    if (called) {
      called.status = 'SERVED';
      saveState(s);
      alert(`${called.id} served.`);
    } else {
      alert('Nta nimero yahamagawe ubu.');
    }
    refreshInfo();
  });
}

function renderDisplay() {
  
  const s = loadState();
  const q = s.queues.find(x => x.id === QUEUE_ID);
  const called = q.tickets.find(t => t.status === 'CALLED');
  const show = called ? called.id : '—';
  ROOT.innerHTML = `
    <div class="card display-screen">Now Serving: ${show}</div>
  `;
}

function renderLogin() {
  ROOT.innerHTML = `
    <div class="login-container">
      <div class="login-box">
        <h2>User Login</h2>
        <input type="text" id="user-name" placeholder="Username">
        <input type="password" id="user-pass" placeholder="Password">
        <button id="user-login">Login</button>
        <p style="margin-top:10px;text-align:center">Nta konti? <a href="#/signup-user">Sign Up</a></p>
      </div>

      <div class="login-box">
        <h2>Agent Login</h2>
        <input type="text" id="agent-name" placeholder="Agent ID">
        <input type="password" id="agent-pass" placeholder="Password">
        <button id="agent-login">Login</button>
        <p style="margin-top:10px;text-align:center">Agent mushya? <a href="#/signup-agent">Sign Up</a></p>
      </div>
    </div>
  `;

  document.getElementById('user-login').addEventListener('click', () => {
    const users = loadUsers();
    const u = document.getElementById('user-name').value.trim();
    const p = document.getElementById('user-pass').value.trim();
    const found = users.find(x => x.username === u && x.password === p);
    if (found) {
      alert(`Murakaza neza, ${u}!`);
      location.hash = '/take';
    } else {
      alert('Izina cyangwa ijambo banga si byo.');
    }
  });

  document.getElementById('agent-login').addEventListener('click', () => {
    const agents = loadAgents();
    const id = document.getElementById('agent-name').value.trim();
    const p = document.getElementById('agent-pass').value.trim();
    const found = agents.find(x => x.agentId === id && x.password === p);
    if (found) {
      alert(`Murakaza neza Agent ${id}!`);
      location.hash = '/agent';
    } else {
      alert('Agent ID cyangwa password si byo.');
    }
  });
}

function renderSignupUser() {
  ROOT.innerHTML = `
    <div class="login-container">
      <div class="login-box">
        <h2>Sign Up (User)</h2>
        <input type="text" id="new-user" placeholder="Username">
        <input type="password" id="new-pass" placeholder="Password">
        <button id="signup-btn">Create Account</button>
        <p style="margin-top:10px;text-align:center">Usanzwe ufite konti? <a href="#/login">Login</a></p>
      </div>
    </div>
  `;
  document.getElementById('signup-btn').addEventListener('click', () => {
    const users = loadUsers();
    const u = document.getElementById('new-user').value.trim();
    const p = document.getElementById('new-pass').value.trim();
    if (!u || !p) return alert("Uzuza imyanya yose.");
    if (users.find(x => x.username === u)) return alert("Izina rimaze gukoreshwa.");
    users.push({ username: u, password: p });
    saveUsers(users);
    alert("Konti yawe yakozwe neza!");
    location.hash = '/login';
  });
}

function renderSignupAgent() {
  ROOT.innerHTML = `
    <div class="login-container">
      <div class="login-box">
        <h2>Sign Up (Agent)</h2>
        <input type="text" id="new-agent" placeholder="Agent ID">
        <input type="password" id="new-agent-pass" placeholder="Password">
        <button id="signup-agent-btn">Create Agent Account</button>
        <p style="margin-top:10px;text-align:center">Ufite konti? <a href="#/login">Login</a></p>
      </div>
    </div>
  `;
  document.getElementById('signup-agent-btn').addEventListener('click', () => {
    const agents = loadAgents();
    const id = document.getElementById('new-agent').value.trim();
    const p = document.getElementById('new-agent-pass').value.trim();
    if (!id || !p) return alert("Uzuza imyanya yose.");
    if (agents.find(x => x.agentId === id)) return alert("Agent ID yamaze gukoreshwa.");
    agents.push({ agentId: id, password: p });
    saveAgents(agents);
    alert("Agent account yakozwe neza!");
    location.hash = '/login';
  });
}
