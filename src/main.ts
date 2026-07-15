/**
 * @module ElectronMainframe
 * @description Orchestrates the desktop application runtime, window lifecycle, and secure IPC communication bridges.
 * @author Thaveesha Nirman / K.K.T.V.N. Kodithuwakku (Lead Architect)
 * @institution NSBM Green University
 */


import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import sqlite3 from 'sqlite3';

// 1. SETUP DATABASE
// We use 'sqlite3.verbose()' for better error logging
const sql = sqlite3.verbose();
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'hospital_v2.db'); 
console.log('Database Path:', dbPath);

const db = new sql.Database(dbPath, (err: Error | null) => {
  if (err) console.error('DB Error:', err.message);
  else console.log('Connected to SQLite database.');
});

// 2. CREATE TABLES (Patients & Layouts)
db.serialize(() => {
  // Table 1: Patients
  db.run(`CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT,
    bht TEXT,
    admissionDate TEXT,
    fullData TEXT,
    lastModified TEXT
  )`);

  // Table 2: Layouts (For your Print Studio)
  db.run(`CREATE TABLE IF NOT EXISTS layouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_name TEXT,
    coordinates TEXT
  )`);
});

// 3. CREATE WINDOW (Your Original Logic)
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,    // Security
      contextIsolation: true,    // Security (Must be true for preload)
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
  });

  // Load the VITE build or Dev Server
  // @ts-ignore
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    // @ts-ignore
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    // @ts-ignore
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ==========================================
// 4. API HANDLERS (The Backend Logic)
// ==========================================

// --- PATIENT HANDLERS ---

// Save Patient
ipcMain.handle('save-patient', async (event: any, patient: any) => {
  return new Promise((resolve, reject) => {
    const { id, patientName, bhtNo, admissionDate } = patient;
    const fullData = JSON.stringify(patient);
    const lastModified = new Date().toISOString();

    const stmt = db.prepare(`INSERT OR REPLACE INTO patients (id, name, bht, admissionDate, fullData, lastModified) VALUES (?, ?, ?, ?, ?, ?)`);
    stmt.run(id, patientName, bhtNo, admissionDate, fullData, lastModified, function(this: any, err: Error | null) {
      if (err) reject(err);
      else resolve({ status: 'success', id: id });
    });
    stmt.finalize();
  });
});

// Get All Patients
ipcMain.handle('get-patients', async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT id, name, bht, admissionDate, lastModified FROM patients ORDER BY lastModified DESC", [], (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

// Get One Patient
ipcMain.handle('get-patient-by-id', async (event: any, id: string) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT fullData FROM patients WHERE id = ?", [id], (err: Error | null, row: any) => {
      if (err) reject(err);
      else resolve(row ? JSON.parse(row.fullData) : null);
    });
  });
});

// Delete Patient
ipcMain.handle('delete-patient', async (event: any, id: string) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM patients WHERE id = ?", [id], function(err: Error | null) {
      if (err) reject(err);
      else resolve({ status: 'deleted' });
    });
  });
});

// --- LAYOUT HANDLERS (Your Studio Code) ---

ipcMain.handle('save-layout', async (event: any, data: any) => {
  return new Promise((resolve, reject) => {
    const { profile_name, coordinates } = data;
    const stmt = db.prepare("INSERT INTO layouts (profile_name, coordinates) VALUES (?, ?)");
    stmt.run(profile_name, coordinates, function(this: any, err: Error | null) {
      if (err) reject(err);
      else resolve({ id: this.lastID, status: 'success' });
    });
    stmt.finalize();
  });
});

ipcMain.handle('get-layouts', async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM layouts", [], (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

// Print Handler
ipcMain.handle('print-patient', async (event: any, data: any) => {
  const win = BrowserWindow.getFocusedWindow();
  win?.webContents.print();
  return { status: 'printed' };
});
