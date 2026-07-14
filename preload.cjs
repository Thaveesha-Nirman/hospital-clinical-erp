// @ts-nocheck
const { contextBridge, ipcRenderer } = require('electron');

/**
 * EXPOSE PROTECTED API TO THE FRONTEND
 * This allows Dashboard.tsx and Studio to communicate with main.cjs safely.
 */
contextBridge.exposeInMainWorld('api', {
  // --- 1. PATIENT CRUD OPERATIONS ---
  getPatients: () => ipcRenderer.invoke('get-patients'),
  getPatientById: (id) => ipcRenderer.invoke('get-patient-by-id', id),
  savePatient: (data) => ipcRenderer.invoke('save-patient', data),
  deletePatient: (id) => ipcRenderer.invoke('delete-patient', id),

  // --- 2. NEW: STUDIO LAYOUT OPERATIONS ---
  // These lanes connect your Studio/Layouts pages to the new Database tables
  getLayouts: () => ipcRenderer.invoke('get-layouts'),
  saveLayout: (data) => ipcRenderer.invoke('save-layout', data),
  deleteLayout: (id) => ipcRenderer.invoke('delete-layout', id),

  // --- 3. DATA CENTER OPERATIONS ---
  wipeAllPatients: () => ipcRenderer.invoke('wipe-all-patients'),
  exportDatabase: () => ipcRenderer.invoke('export-database'),
  selectBackupFile: () => ipcRenderer.invoke('select-backup-file'),
  restoreDatabase: (path) => ipcRenderer.invoke('restore-database', path),

  // --- 4. UTILITIES ---
  // KEEPING YOUR PRINTING EXACTLY THE SAME
  print: () => window.print()
});