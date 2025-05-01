// index.js
const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const DATA_DIR     = path.join(__dirname, 'data');
const WOS_PATH     = path.join(DATA_DIR, 'wos.json');
const EQUIPAS_PATH = path.join(DATA_DIR, 'equipas.json');
const USERS_PATH   = path.join(DATA_DIR, 'users.json');
const JWT_SECRET   = 'SEU_SEGREDO_SUPER_SECRETO';

app.use(express.json());
app.use(express.static('public'));

// --- Helpers robustos ---
function readJSON(p) {
  if (!fs.existsSync(p)) return [];
  const txt = fs.readFileSync(p, 'utf8').trim();
  if (!txt) return [];
  try {
    return JSON.parse(txt);
  } catch (err) {
    console.error(`⚠️ Erro a fazer parse de ${p}: ${err.message}`);
    return [];
  }
}
function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

// --- Middleware de autenticação/autorização ---
function auth(requiredRole) {
  return (req, res, next) => {
    const h = req.headers.authorization;
    if (!h) return res.status(401).send('Token em falta');
    const token = h.split(' ')[1];
    try {
      const user = jwt.verify(token, JWT_SECRET);
      req.user = user;
      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).send('Sem permissão');
      }
      next();
    } catch {
      return res.status(401).send('Token inválido');
    }
  };
}

// --- ROTAS DE AUTENTICAÇÃO ---

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(USERS_PATH);
  const u = users.find(u => u.username === username);
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) {
    return res.status(401).send('Credenciais inválidas');
  }
  const token = jwt.sign(
    { username: u.username, role: u.role, equipa: u.equipa },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token });
});

// Listar utilizadores (Admin)
app.get('/users', auth('admin'), (req, res) => {
  const users = readJSON(USERS_PATH)
    .map(u => ({ username: u.username, role: u.role, equipa: u.equipa }));
  res.json(users);
});

// Criar utilizador (Admin)
app.post('/users', auth('admin'), async (req, res) => {
  const { username, password, role, equipa } = req.body;
  const users = readJSON(USERS_PATH);
  if (users.find(u => u.username === username)) {
    return res.status(409).send('Já existe');
  }
  const hash = await bcrypt.hash(password, 10);
  users.push({
    username,
    passwordHash: hash,
    role,
    equipa: role === 'admin' ? null : equipa
  });
  writeJSON(USERS_PATH, users);
  res.sendStatus(201);
});

// Remover utilizador (Admin)
app.delete('/users/:username', auth('admin'), (req, res) => {
  let users = readJSON(USERS_PATH);
  users = users.filter(u => u.username !== req.params.username);
  writeJSON(USERS_PATH, users);
  res.sendStatus(204);
});

// --- ROTAS DE WOs ---

app.get('/wos', auth(), (req, res) => {
  res.json(readJSON(WOS_PATH));
});
app.post('/wos', auth(), (req, res) => {
  const wos = readJSON(WOS_PATH);
  wos.push(req.body);
  writeJSON(WOS_PATH, wos);
  res.sendStatus(201);
});
app.put('/wos/:assunto', auth(), (req, res) => {
  const wos = readJSON(WOS_PATH);
  const idx = wos.findIndex(w => w.assunto === decodeURIComponent(req.params.assunto));
  if (idx === -1) return res.status(404).send('WO não encontrada');
  wos[idx] = { ...wos[idx], ...req.body };
  writeJSON(WOS_PATH, wos);
  res.sendStatus(200);
});
app.delete('/wos/:assunto', auth(), (req, res) => {
  let wos = readJSON(WOS_PATH);
  wos = wos.filter(w => w.assunto !== decodeURIComponent(req.params.assunto));
  writeJSON(WOS_PATH, wos);
  res.sendStatus(204);
});

// --- ROTAS DE EQUIPAS ---

app.get('/equipas', auth(), (req, res) => {
  res.json(readJSON(EQUIPAS_PATH));
});
app.post('/equipas', auth(), (req, res) => {
  const eqs = readJSON(EQUIPAS_PATH);
  eqs.push(req.body);
  writeJSON(EQUIPAS_PATH, eqs);
  res.sendStatus(201);
});
app.delete('/equipas/:tecnico', auth(), (req, res) => {
  let eqs = readJSON(EQUIPAS_PATH);
  eqs = eqs.filter(e => e.tecnico !== decodeURIComponent(req.params.tecnico));
  writeJSON(EQUIPAS_PATH, eqs);
  res.sendStatus(204);
});

// --- ROTAS DE COMENTÁRIOS ---

app.post('/comentarios/:assunto', auth(), (req, res) => {
  const wos = readJSON(WOS_PATH);
  const idx = wos.findIndex(w => w.assunto === decodeURIComponent(req.params.assunto));
  if (idx === -1) return res.status(404).send('WO não encontrada');
  const key = req.body.tipo === 'tecnico' ? 'comentarios_tecnico' : 'comentarios_backoffice';
  wos[idx][key] = wos[idx][key] || [];
  wos[idx][key].push(req.body.comentario);
  writeJSON(WOS_PATH, wos);
  res.sendStatus(201);
});

// --- ROTAS DE FOTOS ---

const multer = require('multer');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
const upload = multer({ dest: UPLOAD_DIR });

app.post('/fotos/:assunto', auth(), upload.array('fotos'), (req, res) => {
  const wos = readJSON(WOS_PATH);
  const idx = wos.findIndex(w => w.assunto === decodeURIComponent(req.params.assunto));
  if (idx === -1) return res.status(404).send('WO não encontrada');
  wos[idx].fotos = wos[idx].fotos || [];
  req.files.forEach(f => {
    wos[idx].fotos.push({ filename: f.filename, path: `/uploads/${f.filename}` });
  });
  writeJSON(WOS_PATH, wos);
  res.sendStatus(201);
});

app.use('/uploads', express.static(UPLOAD_DIR));

// --- Iniciar servidor ---
app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
