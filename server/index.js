require('dotenv').config();
const express = require('express'), mongoose = require('mongoose'), bcrypt = require('bcryptjs'),
  jwt = require('jsonwebtoken'), cors = require('cors'), http = require('http'), { Server } = require('socket.io');

const app = express(), server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.use(cors()); app.use(express.json());
const SECRET = process.env.JWT_SECRET || 'dev_secret';

// ---------- Models ----------
const { Schema, model } = mongoose, ref = (m) => ({ type: Schema.Types.ObjectId, ref: m });
const User = model('User', new Schema({ name: String, email: { type: String, unique: true, lowercase: true }, password: String }));
const Project = model('Project', new Schema({ name: String, description: String, owner: ref('User'), members: [ref('User')] }, { timestamps: true }));
const Task = model('Task', new Schema({
  project: ref('Project'), title: String, description: String,
  status: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo' },
  assignee: ref('User'),
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: Date,
  comments: [{ user: ref('User'), text: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true }));

// ---------- Helpers ----------
const sign = (u) => jwt.sign({ id: u._id }, SECRET, { expiresIn: '7d' });
const safe = (u) => ({ _id: u._id, name: u.name, email: u.email });
const auth = (req, res, next) => {
  try { req.uid = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET).id; next(); }
  catch { res.status(401).json({ error: 'Please log in' }); }
};
const h = (fn) => (req, res) => fn(req, res).catch((e) => res.status(400).json({ error: e.message }));
const mine = async (pid, uid) => {
  const p = await Project.findOne({ _id: pid, members: uid });
  if (!p) throw new Error('Project not found or no access');
  return p;
};
const populateTask = (q) => q.populate('assignee', 'name email').populate('comments.user', 'name');
const ping = (pid, message) => io.to(String(pid)).emit('task:changed', message);

// ---------- Auth ----------
app.post('/api/auth/register', h(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || (password || '').length < 6) throw new Error('Name, email and a 6+ character password are required');
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.json({ token: sign(u), user: safe(u) });
}));
app.post('/api/auth/login', h(async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) throw new Error('Wrong email or password');
  res.json({ token: sign(u), user: safe(u) });
}));
app.get('/api/me', auth, h(async (req, res) => res.json(safe(await User.findById(req.uid)))));

// ---------- Projects ----------
app.get('/api/projects', auth, h(async (req, res) =>
  res.json(await Project.find({ members: req.uid }).populate('members', 'name email').sort('-createdAt'))));
app.post('/api/projects', auth, h(async (req, res) => {
  const p = await Project.create({ name: req.body.name, description: req.body.description, owner: req.uid, members: [req.uid] });
  res.json(await p.populate('members', 'name email'));
}));
app.post('/api/projects/:id/members', auth, h(async (req, res) => {
  const p = await mine(req.params.id, req.uid);
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u) throw new Error('No user with that email. Ask them to register first');
  if (!p.members.includes(u._id)) p.members.push(u._id);
  await p.save(); ping(p._id, `${u.name} joined the project`);
  res.json(await p.populate('members', 'name email'));
}));

// ---------- Tasks ----------
app.get('/api/projects/:id/tasks', auth, h(async (req, res) => {
  await mine(req.params.id, req.uid);
  res.json(await populateTask(Task.find({ project: req.params.id }).sort('createdAt')));
}));
app.post('/api/projects/:id/tasks', auth, h(async (req, res) => {
  await mine(req.params.id, req.uid);
  const t = await Task.create({ project: req.params.id, title: req.body.title, description: req.body.description, priority: req.body.priority, dueDate: req.body.dueDate });
  ping(req.params.id, `New task: ${t.title}`); res.json(t);
}));
app.patch('/api/tasks/:id', auth, h(async (req, res) => {
  const t = await Task.findById(req.params.id); await mine(t.project, req.uid);
  ['status', 'assignee', 'title', 'priority', 'dueDate'].forEach((k) => { if (k in req.body) t[k] = req.body[k] || undefined; });
  await t.save(); ping(t.project, `Task updated: ${t.title}`);
  res.json(await populateTask(Task.findById(t._id)));
}));
app.post('/api/tasks/:id/comments', auth, h(async (req, res) => {
  const t = await Task.findById(req.params.id); await mine(t.project, req.uid);
  t.comments.push({ user: req.uid, text: req.body.text }); await t.save();
  ping(t.project, `New comment on: ${t.title}`);
  res.json(await populateTask(Task.findById(t._id)));
}));
app.delete('/api/tasks/:id', auth, h(async (req, res) => {
  const t = await Task.findById(req.params.id); await mine(t.project, req.uid);
  await t.deleteOne(); ping(t.project, `Task deleted: ${t.title}`); res.json({ ok: true });
}));

// ---------- Real-time ----------
io.on('connection', (s) => s.on('join', (pid) => s.join(String(pid))));

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pmtool').then(() =>
  server.listen(process.env.PORT || 5000, () => console.log('API running on port', process.env.PORT || 5000)));
