import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { serialize, parse } from 'cookie';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const VAULT_PATH = process.env.VAULT_PATH || '/root/synchthing/Obsidian.md';
const AUTH_USER = process.env.AUTH_USER || 'kindle';
const AUTH_PASS = process.env.AUTH_PASS || 'changeme';
const SESSION_SECRET = process.env.SESSION_SECRET || 'secret';
const COOKIE_NAME = 'ks';
const FONT_SIZES = [16, 18, 20, 22, 24, 26, 28];
const DEFAULT_FONT_SIZE = 18;

const app = express();
app.use(express.urlencoded({ extended: false }));

// Auth helpers
const genToken = (u) => Buffer.from(`${u}:${SESSION_SECRET}`).toString('base64');
const checkToken = (t) => {
  try {
    const [u, s] = Buffer.from(t, 'base64').toString('utf8').split(':');
    return u === AUTH_USER && s === SESSION_SECRET;
  } catch {
    return false;
  }
};
const isAuth = (req) => {
  const cookies = parse(req.headers.cookie || '');
  const t = cookies[COOKIE_NAME];
  return t ? checkToken(t) : false;
};
const authMw = (req, res, next) => {
  if (isAuth(req)) return next();
  return res.redirect('/login');
};

// Font size helpers
const getFontSize = (req) => {
  const cookies = parse(req.headers.cookie || '');
  const fsz = cookies['fs'] ? parseInt(cookies['fs'], 10) : DEFAULT_FONT_SIZE;
  return FONT_SIZES.includes(fsz) ? fsz : DEFAULT_FONT_SIZE;
};

// Render helpers
const layout = (req, title, body, nav = true) => {
  const fontSize = getFontSize(req);
  const currentPath = req.originalUrl;
  const canDec = fontSize > FONT_SIZES[0];
  const canInc = fontSize < FONT_SIZES[FONT_SIZES.length - 1];
  const btn = 'display:inline-block;width:48px;height:48px;line-height:44px;text-align:center;font-size:24px;font-weight:bold;text-decoration:none;border:2px solid #000;margin-left:5px;';
  const act = `${btn}background:#000;color:#fff;`;
  const dis = `${btn}background:#ccc;color:#888;border-color:#999;`;
  const fontControls = nav ? `<div style="position:fixed;top:10px;right:10px;z-index:99;">${
    canDec ? `<a href="/font/down?back=${encodeURIComponent(currentPath)}" style="${act}">−</a>` : `<span style="${dis}">−</span>`
  }${
    canInc ? `<a href="/font/up?back=${encodeURIComponent(currentPath)}" style="${act}">+</a>` : `<span style="${dis}">+</span>`
  }</div>` : '';

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font:${fontSize}px/1.6 Georgia,serif;padding:15px;padding-top:70px;background:#fff;color:#000}
a{color:#000}h1{font-size:1.3em;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:15px}h2{font-size:1.1em;margin:15px 0 8px}ul,ol{margin:8px 0 8px 20px}li{margin-bottom:5px}pre{background:#eee;padding:8px;overflow-x:auto;font-size:0.85em}code{background:#eee;padding:1px 3px}blockquote{border-left:3px solid #000;padding-left:12px;margin:10px 0}input,button{font:inherit;padding:12px;border:2px solid #000;width:100%;margin-bottom:10px}button{background:#000;color:#fff}.item{display:block;padding:12px 8px;border-bottom:1px solid #ccc}.crumbs{margin-bottom:10px}.err{color:red;border:1px solid red;padding:8px;margin-bottom:10px}</style>
</head><body>${fontControls}${nav ? '<p style="margin-bottom:15px"><a href="/">← Inicio</a> <a href="/logout" style="float:right">Salir</a></p>' : ''}${body}</body></html>`;
};

const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const mdToHtml = (md) => {
  const raw = marked.parse(md, { mangle: false, headerIds: false });
  return sanitizeHtml(raw, {
    allowedTags: ['h1','h2','h3','p','ul','ol','li','pre','code','blockquote','strong','em','a','hr','br','span'],
    allowedAttributes: { a: ['href'] },
    transformTags: {
      a: (tag, attribs) => ({ tagName: 'a', attribs: { href: attribs.href || '#', target: '_blank' } }),
    },
  });
};

const listDir = (basePath, rel = '') => {
  const target = path.join(basePath, rel);
  const entries = fs.readdirSync(target, { withFileTypes: true }).filter(e => !['.stfolder'].includes(e.name));
  const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();
  const files = entries.filter(e => e.isFile() && e.name.toLowerCase().endsWith('.md')).map(e => e.name).sort();
  return { dirs, files };
};

const crumbs = (rel) => {
  const parts = rel.split('/').filter(Boolean);
  let acc = '';
  const links = ['<a href="/browse">/</a>'];
  for (const p of parts) {
    acc = path.join(acc, p);
    links.push(`<a href="/browse/${acc}">${esc(p)}</a>`);
  }
  return links.join(' / ');
};

// Routes
app.get('/', authMw, (req, res) => res.redirect('/browse'));

app.get('/font/up', authMw, (req, res) => {
  const fsz = getFontSize(req);
  const idx = FONT_SIZES.indexOf(fsz);
  const next = FONT_SIZES[Math.min(idx + 1, FONT_SIZES.length - 1)];
  res.setHeader('Set-Cookie', serialize('fs', String(next), { maxAge: 31536000, path: '/' }));
  const back = req.query.back || '/browse';
  return res.redirect(back);
});

app.get('/font/down', authMw, (req, res) => {
  const fsz = getFontSize(req);
  const idx = FONT_SIZES.indexOf(fsz);
  const next = FONT_SIZES[Math.max(idx - 1, 0)];
  res.setHeader('Set-Cookie', serialize('fs', String(next), { maxAge: 31536000, path: '/' }));
  const back = req.query.back || '/browse';
  return res.redirect(back);
});

app.get('/login', (req, res) => {
  if (isAuth(req)) return res.redirect('/browse');
  res.send(layout(req, 'Login', `
    <h1>📚 Markdown Vault</h1>
    <form method="POST" action="/login">
      <input name="user" placeholder="Usuario" required>
      <input name="pass" type="password" placeholder="Contraseña" required>
      <button>Entrar</button>
    </form>
  `, false));
});

app.post('/login', (req, res) => {
  const u = (req.body.user || '').toString();
  const p = (req.body.pass || '').toString();
  if (u === AUTH_USER && p === AUTH_PASS) {
    res.setHeader('Set-Cookie', serialize(COOKIE_NAME, genToken(u), { httpOnly: true, secure: false, sameSite: 'Lax', maxAge: 604800, path: '/' }));
    return res.redirect('/browse');
  }
  res.send(layout(req, 'Login', `<h1>📚 Markdown Vault</h1><div class="err">Credenciales incorrectas</div>
    <form method="POST" action="/login"><input name="user" placeholder="Usuario" required>
    <input name="pass" type="password" placeholder="Contraseña" required><button>Entrar</button></form>`, false));
});

app.get('/logout', (req, res) => {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', { maxAge: -1, path: '/' }));
  res.redirect('/login');
});

app.get('/browse/*', authMw, (req, res) => {
  const rel = decodeURIComponent(req.params[0] || '').replace(/^\/+/, '').replace(/\.\./g, '');
  const full = path.join(VAULT_PATH, rel);
  if (!full.startsWith(path.normalize(VAULT_PATH))) return res.status(400).send('Invalid path');
  if (!fs.existsSync(full)) return res.status(404).send('Not found');
  const stat = fs.statSync(full);
  if (stat.isDirectory()) {
    const { dirs, files } = listDir(VAULT_PATH, rel);
    const items = [
      rel ? `<a class="item" href="/browse/${encodeURIComponent(path.join(rel, '..'))}">⬆️ ..</a>` : ''
    ].concat(
      dirs.map(d => `<a class="item" href="/browse/${path.join(rel, d)}">📁 ${esc(d)}</a>`),
      files.map(f => `<a class="item" href="/file/${path.join(rel, f)}">📄 ${esc(f)}</a>`)
    ).join('');
    return res.send(layout(req, 'Explorar', `<div class="crumbs">${crumbs(rel)}</div><h1>📚 Archivos</h1>${items || '<p>Vacío</p>'}`));
  }
  return res.redirect(`/file/${rel}`);
});

app.get('/browse', authMw, (req, res) => res.redirect('/browse/'));

app.get('/file/*', authMw, (req, res) => {
  const rel = decodeURIComponent(req.params[0] || '').replace(/^\/+/, '').replace(/\.\./g, '');
  const full = path.join(VAULT_PATH, rel);
  if (!full.startsWith(path.normalize(VAULT_PATH))) return res.status(400).send('Invalid path');
  if (!fs.existsSync(full)) return res.status(404).send('Not found');
  const stat = fs.statSync(full);
  if (!stat.isFile()) return res.status(400).send('Not a file');
  const md = fs.readFileSync(full, 'utf8');
  const html = mdToHtml(md);
  const fname = path.basename(full);
  const dirRel = path.dirname(rel);
  res.send(layout(req, fname, `<div class="crumbs">${crumbs(dirRel)}</div><h1>${esc(fname)}</h1>${html}`));
});

app.listen(PORT, () => {
  console.log(`Kindle MD reader on :${PORT}, vault ${VAULT_PATH}`);
});
