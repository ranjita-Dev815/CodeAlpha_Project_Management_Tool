import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
 
const API_URL = import.meta.env.VITE_API_URL || '';
 
const api = async (path, method = 'GET', body) => {
  const r = await fetch(API_URL + '/api' + path, {
    method, body: body && JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.token || '') },
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Something went wrong');
  return d;
};
const COLS = [['todo', 'To do'], ['doing', 'In progress'], ['done', 'Done']];
 
function Auth({ onAuth }) {
  const [mode, setMode] = useState('login'), [f, setF] = useState({ name: '', email: '', password: '' }), [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try { const d = await api('/auth/' + mode, 'POST', f); localStorage.token = d.token; onAuth(d.user); }
    catch (x) { setErr(x.message); }
  };
  return (
    <form className="auth" onSubmit={submit}>
      <h1>Taskboard</h1>
      <p>{mode === 'login' ? 'Log in to your projects' : 'Create your account'}</p>
      {mode === 'register' && <input placeholder="Name" value={f.name} onChange={set('name')} />}
      <input placeholder="Email" type="email" value={f.email} onChange={set('email')} />
      <input placeholder="Password" type="password" value={f.password} onChange={set('password')} />
      {err && <div className="err">{err}</div>}
      <button className="primary">{mode === 'login' ? 'Log in' : 'Create account'}</button>
      <a onClick={() => { setErr(''); setMode(mode === 'login' ? 'register' : 'login'); }}>
        {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
      </a>
    </form>
  );
}
 
function Card({ t, members, reload }) {
  const [open, setOpen] = useState(false), [text, setText] = useState('');
  const patch = (b) => api('/tasks/' + t._id, 'PATCH', b).then(reload);
  const idx = COLS.findIndex((c) => c[0] === t.status);
  const overdue = t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date(new Date().toDateString());
  const comment = async (e) => { e.preventDefault(); if (!text.trim()) return; await api(`/tasks/${t._id}/comments`, 'POST', { text }); setText(''); reload(); };
  return (
    <div className="card">
      <div className="card-top"><b>{t.title}</b><button className="x" title="Delete task" onClick={() => api('/tasks/' + t._id, 'DELETE').then(reload)}>×</button></div>
      <select value={t.assignee?._id || ''} onChange={(e) => patch({ assignee: e.target.value })}>
        <option value="">Unassigned</option>
        {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
      </select>
      <div className="meta">
        <select className={'pri ' + (t.priority || 'medium')} value={t.priority || 'medium'} onChange={(e) => patch({ priority: e.target.value })}>
          <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <input type="date" title={overdue ? 'Overdue' : 'Due date'} className={overdue ? 'late' : ''} value={t.dueDate ? t.dueDate.slice(0, 10) : ''} onChange={(e) => patch({ dueDate: e.target.value })} />
      </div>
      <div className="row">
        <button disabled={idx === 0} onClick={() => patch({ status: COLS[idx - 1][0] })}>Back</button>
        <button disabled={idx === 2} onClick={() => patch({ status: COLS[idx + 1][0] })}>Move on</button>
        <button onClick={() => setOpen(!open)}>Comments ({t.comments.length})</button>
      </div>
      {open && (
        <div className="comments">
          {t.comments.map((c, i) => <p key={i}><b>{c.user?.name}:</b> {c.text}</p>)}
          <form onSubmit={comment}><input placeholder="Write a comment" value={text} onChange={(e) => setText(e.target.value)} /></form>
        </div>
      )}
    </div>
  );
}
 
function Board({ project, notify, reloadProjects }) {
  const [tasks, setTasks] = useState([]), [title, setTitle] = useState(''), [email, setEmail] = useState(''), [pri, setPri] = useState('medium'), [due, setDue] = useState('');
  const load = useCallback(() => api(`/projects/${project._id}/tasks`).then(setTasks).catch((e) => notify(e.message)), [project._id]);
  useEffect(() => {
    load();
    const s = io(API_URL || undefined); s.emit('join', project._id);
    s.on('connect', () => s.emit('join', project._id));
    s.on('task:changed', (msg) => { load(); notify(msg); });
    return () => s.disconnect();
  }, [project._id]);
  const addTask = async (e) => { e.preventDefault(); if (!title.trim()) return; await api(`/projects/${project._id}/tasks`, 'POST', { title, priority: pri, dueDate: due || undefined }); setTitle(''); setDue(''); load(); };
  const invite = async (e) => {
    e.preventDefault();
    try { await api(`/projects/${project._id}/members`, 'POST', { email }); setEmail(''); reloadProjects(); } catch (x) { notify(x.message); }
  };
  const done = tasks.filter((t) => t.status === 'done').length, pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    today = new Date(new Date().toDateString()),
    late = tasks.filter((t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < today).length,
    high = tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length;
  return (
    <section className="board">
      <header>
        <div><h2>{project.name}</h2><small>{project.members.map((m) => m.name).join(', ')}</small></div>
        <form onSubmit={invite}><input placeholder="Invite by email" value={email} onChange={(e) => setEmail(e.target.value)} /><button>Invite</button></form>
      </header>
      <div className="stats">
        {[['Total', tasks.length], ['In progress', tasks.filter((t) => t.status === 'doing').length], ['Done', done], ['Overdue', late], ['High priority', high]].map(([l, v]) => (
          <div className={'stat' + (l === 'Overdue' && v ? ' bad' : '')} key={l}><b>{v}</b><span>{l}</span></div>
        ))}
        <div className="prog"><div className="bar"><i style={{ width: pct + '%' }} /></div><span>{pct}% complete</span></div>
      </div>
      <form className="add" onSubmit={addTask}>
        <input placeholder="What needs doing?" value={title} onChange={(e) => setTitle(e.target.value)} /><select value={pri} onChange={(e) => setPri(e.target.value)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <button className="primary">Add task</button>
      </form>
      <div className="cols">
        {COLS.map(([key, label]) => (
          <div className="col" key={key}>
            <h3>{label} <span>{tasks.filter((t) => t.status === key).length}</span></h3>
            {tasks.filter((t) => t.status === key).map((t) => <Card key={t._id} t={t} members={project.members} reload={load} />)}
          </div>
        ))}
      </div>
    </section>
  );
}
 
export default function App() {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false), [projects, setProjects] = useState([]),
    [cur, setCur] = useState(null), [toast, setToast] = useState(''), [name, setName] = useState(''), [theme, setTheme] = useState(localStorage.theme || 'light');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.theme = theme; }, [theme]);
  useEffect(() => { api('/me').then(setUser).catch(() => {}).finally(() => setReady(true)); }, []);
  const load = () => api('/projects').then((p) => { setProjects(p); setCur((c) => c || p[0]?._id || null); });
  useEffect(() => { if (user) load(); }, [user]);
  const create = async (e) => { e.preventDefault(); if (!name.trim()) return; const p = await api('/projects', 'POST', { name }); setName(''); await load(); setCur(p._id); };
  if (!ready) return null;
  if (!user) return <Auth onAuth={setUser} />;
  const project = projects.find((p) => p._id === cur);
  return (
    <div className="app">
      <aside>
        <h1>Taskboard</h1>
        {projects.map((p) => <button key={p._id} className={p._id === cur ? 'on' : ''} onClick={() => setCur(p._id)}>{p.name}</button>)}
        <form onSubmit={create}><input placeholder="New project name" value={name} onChange={(e) => setName(e.target.value)} /></form>
        <button className="theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
        <a onClick={() => { localStorage.removeItem('token'); setUser(null); setProjects([]); setCur(null); }}>Log out ({user.name})</a>
      </aside>
      <main>{project ? <Board project={project} notify={notify} reloadProjects={load} /> : <p className="empty">Create your first project in the sidebar.</p>}</main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
