
﻿const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// ==========================================
// 1. DATABASE INITIALIZATION & AUTO-UPGRADE
// ==========================================
const dbPath = path.join(app.getPath('userData'), 'patients.db');
const db = new Database(dbPath);

// Create the base table if it's a fresh install
db.prepare(`
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT,
    bht TEXT,
    admissionDate TEXT,
    fullData TEXT,
    lastModified INTEGER
  )
`).run();
// --- ADD THIS RIGHT AFTER THE PATIENTS TABLE CODE ---
db.prepare(`
  CREATE TABLE IF NOT EXISTS layouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_name TEXT,
    coordinates TEXT
  )
`).run();

/** * SELF-HEALING LOGIC
 * This ensures your existing database gets the new columns 
 * without needing to delete your data.
 */
try { db.prepare("ALTER TABLE patients ADD COLUMN nic TEXT").run(); } catch (e) { /* Column already exists */ }
try { db.prepare("ALTER TABLE patients ADD COLUMN ward TEXT").run(); } catch (e) { /* Column already exists */ }

// ==========================================
// 2. WINDOW MANAGEMENT
// ==========================================
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

// ✅ Logic to handle both Development and Production (Packaged)
if (app.isPackaged) {
  win.loadFile(path.join(__dirname, 'dist/index.html'));
} else {
  win.loadURL('http://localhost:5173');
}
  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ==========================================
// 3. PATIENT DATA HANDLERS (THE BRIDGE)
// ==========================================

// Fetch all patients - selecting ALL columns to ensure Dashboard sees everything
ipcMain.handle('get-patients', () => {
  try {
    return db.prepare('SELECT * FROM patients ORDER BY lastModified DESC').all();
  } catch (err) {
    console.error("Database Error (get-patients):", err);
    return [];
  }
});

// Fetch full patient JSON for View/Edit mode
ipcMain.handle('get-patient-by-id', (event, id) => {
  try {
    const row = db.prepare('SELECT fullData FROM patients WHERE id = ?').get(id);
    return row ? JSON.parse(row.fullData) : null;
  } catch (err) {
    console.error("Database Error (get-patient-by-id):", err);
    return null;
  }
});

// Save or Update patient - explicitly saving nic and ward columns
ipcMain.handle('save-patient', (event, data) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO patients (id, name, bht, nic, ward, admissionDate, fullData, lastModified)
      VALUES (@id, @name, @bht, @nic, @ward, @admissionDate, @fullData, @lastModified)
      ON CONFLICT(id) DO UPDATE SET
        name = @name,
        bht = @bht,
        nic = @nic,
        ward = @ward,
        admissionDate = @admissionDate,
        fullData = @fullData,
        lastModified = @lastModified
    `);

    stmt.run({
      id: data.id,
      name: data.patientName || data.name,
      bht: data.bhtNo || data.bht,
      nic: data.nic || data.nic_no,
      ward: data.ward,
      admissionDate: data.admissionDate,
      fullData: JSON.stringify(data),
      lastModified: Date.now()
    });

    return { status: 'success' };
  } catch (err) {
    console.error("Database Error (save-patient):", err);
    return { status: 'error', message: err.message };
  }
});

// Delete patient permanently
ipcMain.handle('delete-patient', (event, id) => {
  try {
    db.prepare('DELETE FROM patients WHERE id = ?').run(id);
    return { status: 'success' };
  } catch (err) {
    console.error("Database Error (delete-patient):", err);
    return { status: 'error', message: err.message };
  }
});

// WIPE ALL PATIENTS
ipcMain.handle('wipe-all-patients', () => {
  try {
    db.prepare('DELETE FROM patients').run();
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
});


// --- NEW: STUDIO LAYOUT HANDLERS ---
ipcMain.handle('get-layouts', () => {
  try {
    return db.prepare('SELECT * FROM layouts').all();
  } catch (err) {
    return [];
  }
});

ipcMain.handle('save-layout', (event, data) => {
  try {
    if (data.id) {
      // Update existing layout
      const stmt = db.prepare('INSERT OR REPLACE INTO layouts (id, profile_name, coordinates) VALUES (?, ?, ?)');
      stmt.run(data.id, data.profile_name, data.coordinates);
    } else {
      // Save brand new layout
      const stmt = db.prepare('INSERT INTO layouts (profile_name, coordinates) VALUES (?, ?)');
      stmt.run(data.profile_name, data.coordinates);
    }
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
});

ipcMain.handle('delete-layout', (event, id) => {
  try {
    db.prepare('DELETE FROM layouts WHERE id = ?').run(id);
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
});

// ==========================================
// 4. BACKUP & RESTORE
// ==========================================
ipcMain.handle('export-database', async () => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Database',
      defaultPath: `Hospital_Full_Backup_${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (filePath) {
      const patients = db.prepare('SELECT * FROM patients').all();
      const layouts = db.prepare('SELECT * FROM layouts').all();
      // We wrap both in one object so they save together
      fs.writeFileSync(filePath, JSON.stringify({ patients, layouts }, null, 2));
      return { status: 'success', path: filePath };
    }
    return { status: 'cancelled' };
  } catch (err) { return { status: 'error', message: err.message }; }
});

ipcMain.handle('select-backup-file', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (filePaths && filePaths.length > 0) {
      return { status: 'success', path: filePaths[0], name: path.basename(filePaths[0]) };
    }
    return { status: 'cancelled' };
  } catch (err) { return { status: 'error', message: err.message }; }
});

ipcMain.handle('restore-database', async (event, filePath) => {
  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const backup = JSON.parse(rawData);

    // SMART CHECK: Detect if it's your old backup (just an array) or new (object)
    const patientsToRestore = backup.patients || (Array.isArray(backup) ? backup : []);
    const layoutsToRestore = backup.layouts || [];

    const restoreTx = db.transaction(() => {
      db.prepare("DELETE FROM patients").run();
      db.prepare("DELETE FROM layouts").run();

      const insP = db.prepare(`INSERT INTO patients (id, name, bht, nic, ward, admissionDate, fullData, lastModified) VALUES (@id, @name, @bht, @nic, @ward, @admissionDate, @fullData, @lastModified)`);
      const insL = db.prepare(`INSERT INTO layouts (profile_name, coordinates) VALUES (@profile_name, @coordinates)`);

      for (const p of patientsToRestore) insP.run(p);
      for (const l of layoutsToRestore) insL.run(l);
    });

    restoreTx();
    return { status: 'success' };
  } catch (err) { return { status: 'error', message: err.message }; }
});
