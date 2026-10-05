const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const CANAL = 'https://gedremsisep-lgtm.github.io/geres-software/';
let win = null;

function arquivoLocal(){ return path.join(app.getPath('userData'), 'sistema.html'); }

async function baixarSistema(){
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(CANAL + 'sistema.html?t=' + Date.now(), { cache: 'no-store', signal: ctl.signal });
    if (!r.ok) return false;
    const txt = await r.text();
    if (txt.length < 100000 || txt.indexOf('SYSTEM_VERSION') < 0) return false; // proteção contra página de erro
    fs.writeFileSync(arquivoLocal() + '.tmp', txt);
    fs.renameSync(arquivoLocal() + '.tmp', arquivoLocal());
    return true;
  } catch (e) { return false; }
  finally { clearTimeout(t); }
}

function versaoLocal(){
  try { const m = fs.readFileSync(arquivoLocal(), 'utf8').match(/SYSTEM_VERSION\s*=\s*['"]([^'"]+)['"]/); return m ? m[1] : ''; } catch (e) { return ''; }
}

function paginaSemSistema(){
  return 'data:text/html;charset=utf-8,' + encodeURIComponent('<body style="font-family:sans-serif;background:#0b1f3a;color:#fff;text-align:center;padding:60px"><h2>GERES</h2><p>Primeira abertura precisa de internet para baixar o sistema.</p><p>Conecte-se e abra o aplicativo novamente.</p></body>');
}

async function abrir(){
  await baixarSistema();            // sempre tenta a versão nova ao abrir
  if (!win) return;
  if (fs.existsSync(arquivoLocal())) win.loadFile(arquivoLocal());
  else win.loadURL(paginaSemSistema());
}

function createWindow(){
  win = new BrowserWindow({
    width: 1366, height: 820, autoHideMenuBar: true, show: true,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  abrir();
}

ipcMain.handle('geres-versao', () => versaoLocal());
ipcMain.handle('geres-atualizar', async () => {
  const ok = await baixarSistema();
  if (ok && win) win.loadFile(arquivoLocal());
  return ok;
});

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(permission === 'geolocation' || permission === 'clipboard-read' || permission === 'clipboard-sanitized-write'));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
