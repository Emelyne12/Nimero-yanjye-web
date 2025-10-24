/* NimeroYanjye - script.js
   Simple SPA with slideshow (Unsplash image queries) and localStorage queue.
*/

// ------- Simple Data Adapter (localStorage) -------
const STORE_KEY = 'nimero-storage-v1';
function loadState(){
  const raw = localStorage.getItem(STORE_KEY);
  if(!raw){
    const seed = {
      org:{id:'org-1',name:'NimeroYanjye',locale:'rw'},
      locations:[{id:'loc-1',name:'Head Office'}],
      services:[{id:'svc-1',name:'Registration',slotMins:10}],
      queues:[{id:'q-1',locationId:'loc-1',serviceId:'svc-1',mode:'FIFO',tickets:[]}]
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}
function saveState(s){ localStorage.setItem(STORE_KEY, JSON.stringify(s)); }
function createTicket(queueId, payload){
  const s = loadState();
  const q = s.queues.find(x=>x.id===queueId);
  const nextNum = (q.tickets.length+1).toString().padStart(3,'0');
  const id = String.fromCharCode(65 + (q.tickets.length % 26)) + nextNum;
  const ticket = {id,status:'WAITING',createdAt:Date.now(),meta:payload||{}};
  q.tickets.push(ticket);
  saveState(s);
  return ticket;
}
function getQueue(queueId){ const s = loadState(); return JSON.parse(JSON.stringify(s.queues.find(q=>q.id===queueId))); }
function nextTicket(queueId){
  const s = loadState(); const q = s.queues.find(q=>q.id===queueId);
  const waiting = q.tickets.find(t=>t.status==='WAITING');
  if(waiting){ waiting.status='CALLED'; waiting.calledAt=Date.now(); saveState(s); return waiting; } 
  return null;
}
function updateTicket(queueId, ticketId, patch){
  const s = loadState(); const q = s.queues.find(q=>q.id===queueId); const t = q.tickets.find(x=>x.id===ticketId);
  if(!t) return null; Object.assign(t, patch); saveState(s); return t;
}

// ------- Simple Router & Rendering -------
const ROOT = document.getElementById('app');
const QUEUE_ID = 'q-1';

function route(){
  const hash = location.hash.replace('#','') || '/';
  if(hash.startsWith('/take')) return renderTake();
  if(hash.startsWith('/agent')) return renderAgent();
  if(hash.startsWith('/display')) return renderDisplay();
  return renderHome();
}

// --------- Home (hero + take ticket) ----------
function renderHome(){
  const slides = [
    'https://source.unsplash.com/1200x800/?african,people,queue',
    'https://source.unsplash.com/1200x800/?african,hospital,waiting',
    'https://source.unsplash.com/1200x800/?african,queue,bank',
    'https://source.unsplash.com/1200x800/?african,clinic,waiting'
  ];

  ROOT.innerHTML = `
    <section class="hero">
      <div class="slides" id="slides"></div>
      <div class="copy">
        <div class="h1">NimeroYanjye</div>
        <div class="lead">Teka nimero yawe, ukurikirane umurongo, ushyikire serivisi ku gihe.</div>
        <div class="controls">
          <button class="btn" id="take-now">Fata Nimero</button>
          <a href="#/take" class="btn btn-ghost">Reserve / Details</a>
        </div>
        <div style="margin-top:10px;color:rgba(255,255,255,0.9);font-weight:600">Scan the counter display or follow on your phone</div>
      </div>
    </section>

    <div class="grid">
      <div class="card">
        <h3 style="margin:0 0 8px">How it works</h3>
        <p style="color:var(--muted)">Click <strong>Fata Nimero</strong> to get a ticket instantly. Agents call next ticket in order.</p>
        <div style="margin-top:12px">
          <h4 style="margin:6px 0">Queue</h4>
          <div id="waiting-list"></div>
        </div>
      </div>

      <aside class="card">
        <h4>Display</h4>
        <div id="mini-display" class="display-screen">---</div>
        <div style="margin-top:10px;color:var(--muted)">Open <a href="#/display">Display</a> on a TV for the waiting room.</div>
      </aside>
    </div>
  `;

  // render slides
  const slidesEl = document.getElementById('slides');
  slides.forEach((url,i)=>{
    const div = document.createElement('div');
    div.className = 'slide' + (i===0 ? ' active' : '');
    div.style.backgroundImage = `url('${url}')`;
    slidesEl.appendChild(div);
  });
  // slide rotation
  let cur = 0;
  setInterval(()=>{ 
    const nodes = document.querySelectorAll('.slide');
    nodes[cur].classList.remove('active');
    cur = (cur + 1) % nodes.length;
    nodes[cur].classList.add('active');
  }, 5000);

  document.getElementById('take-now').addEventListener('click', ()=>{
    const t = createTicket(QUEUE_ID, {});
    renderHome();
    alert(`Nimero yawe: ${t.id}`);
  });

  refreshWaitingList();
}

function refreshWaitingList(){
  const q = getQueue(QUEUE_ID);
  const el = document.getElementById('waiting-list');
  if(!el) return;
  const items = q.tickets.filter(t=>t.status!=='SERVED').map(t=>`
    <div class="ticket">
      <div>
         <div class="id">${t.id}</div>
         <div class="meta">${new Date(t.createdAt).toLocaleTimeString()}</div>
      </div>
    </div>`).join('');
  el.innerHTML = items || `<div style="color:var(--muted)">Nta bantu bari gutegereza</div>`;
  // update mini display if called exists
  const called = q.tickets.find(t=>t.status==='CALLED');
  const mini = document.getElementById('mini-display');
  if(mini) mini.textContent = called ? called.id : '---';
}

// --------- Take / Reserve view (simple) ----------
function renderTake(){
  const q = getQueue(QUEUE_ID);
  ROOT.innerHTML = `
    <div class="card">
      <h2>Fata Nimero</h2>
      <p style="color:var(--muted)">Choose mode: FIFO or Reserve (demo uses FIFO).</p>
      <div style="margin-top:12px">
        <button class="btn" id="btn-get">Fata Nimero (FIFO)</button>
      </div>
      <div style="margin-top:18px"><h4>Recent tickets</h4><div id="recent-list"></div></div>
    </div>
  `;
  document.getElementById('btn-get').addEventListener('click', ()=>{
    const t = createTicket(QUEUE_ID, {});
    renderTake();
    alert(`Nimero yawe: ${t.id}`);
  });
  const recent = q.tickets.slice(-6).reverse().map(t=>`<div class="ticket"><div><div class="id">${t.id}</div><div class="meta">${t.status}</div></div></div>`).join('') || `<div style="color:var(--muted)">Nta tickets</div>`;
  document.getElementById('recent-list').innerHTML = recent;
}

// --------- Agent console ----------
function renderAgent(){
  const q = getQueue(QUEUE_ID);
  ROOT.innerHTML = `
    <div class="card">
      <h2>Agent Console</h2>
      <div style="margin-top:10px">
        <button class="btn" id="btn-next">Hamagarira Ukurikira (Call Next)</button>
        <button class="btn btn-ghost" id="btn-mark-served">Mark Served</button>
      </div>
      <div style="margin-top:12px"><h4>Queue</h4><div id="agent-list"></div></div>
    </div>
  `;
  document.getElementById('btn-next').addEventListener('click', ()=>{
    const n = nextTicket(QUEUE_ID);
    if(n){ broadcastEvent('CALLED_NEXT', n); alert(`Called: ${n.id}`); }
    else alert('Nta bantu bari gutegereza');
    renderAgent();
  });
  document.getElementById('btn-mark-served').addEventListener('click', ()=>{
    // mark first CALLED as served
    const state = loadState();
    const qobj = state.queues.find(x=>x.id===QUEUE_ID);
    const called = qobj.tickets.find(t=>t.status==='CALLED');
    if(called){ updateTicket(QUEUE_ID, called.id, {status:'SERVED', servedAt:Date.now()}); broadcastEvent('STATUS_CHANGED', called); renderAgent(); }
    else alert('Nta wahamagawe');
  });

  // render list
  const list = q.tickets.map(t=>`
    <div class="ticket">
      <div>
        <div class="id">${t.id}</div>
        <div class="meta">${t.status}</div>
      </div>
      <div>
        <button class="btn btn-ghost call-btn" data-id="${t.id}">${t.status==='WAITING'?'Call':'Recall'}</button>
      </div>
    </div>
  `).join('') || `<div style="color:var(--muted)">Queue is empty</div>`;
  document.getElementById('agent-list').innerHTML = list;
  document.querySelectorAll('.call-btn').forEach(b => b.addEventListener('click', ev=>{
    const id = ev.currentTarget.dataset.id;
    updateTicket(QUEUE_ID, id, {status:'CALLED', calledAt:Date.now()});
    broadcastEvent('CALLED_NEXT', {id});
    renderAgent();
  }));
}

// --------- Display (big screen) ----------
function renderDisplay(){
  const q = getQueue(QUEUE_ID);
  const called = q.tickets.find(t=>t.status==='CALLED');
  ROOT.innerHTML = `
    <div class="card display-screen">${called ? called.id : '---'}</div>
    <div style="margin-top:10px;color:var(--muted)">Now serving</div>
  `;
}

// --------- Broadcast updates between tabs (BroadcastChannel fallback) -----------
function broadcastEvent(type, payload){
  // try BroadcastChannel
  try{
    if(window.BroadcastChannel){
      const ch = new BroadcastChannel('nimero-channel');
      ch.postMessage({type,payload});
      ch.close();
    } else {
      // fallback: localStorage event
      localStorage.setItem('nimero-event', JSON.stringify({type,payload,t:Date.now()}));
    }
  }catch(e){ console.warn(e); }
}

// listen for broadcast events to re-render
if(window.BroadcastChannel){
  const ch = new BroadcastChannel('nimero-channel');
  ch.onmessage = (m)=>{ route(); };
}
window.addEventListener('storage', (e)=>{
  if(e.key === 'nimero-event') route();
});

// boot
window.addEventListener('hashchange', route);
window.addEventListener('load', route);
