// @ts-nocheck
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // ==========================================
  // 1. PATIENT OPERATIONS (CRUD)
  // ==========================================
  
  // Fetches all patients for the Registry Table
  getPatients: () => ipcRenderer.invoke('get-patients'),
  
  // Fetches a specific patient for View or Edit modes
  getPatientById: (id) => ipcRenderer.invoke('get-patient-by-id', id),
  
  // Saves a new patient or updates an existing one
  savePatient: (data) => ipcRenderer.invoke('save-patient', data),
  
  // Deletes a patient record permanently
  deletePatient: (id) => ipcRenderer.invoke('delete-patient', id),

  // ==========================================
  // 2. ADVANCED BACKUP & RESTORE
  // ==========================================
  
  // Exports current data to a chosen JSON file
  exportDatabase: () => ipcRenderer.invoke('export-database'),
  
  // STEP 1: Opens the file picker to select a backup (fixes "not a function" error)
  selectBackupFile: () => ipcRenderer.invoke('select-backup-file'),
  
  // STEP 2: Actually performs the data replacement from the selected file path
  restoreDatabase: (path) => ipcRenderer.invoke('restore-database', path),
// Add this line inside contextBridge.exposeInMainWorld('api', { ... })
wipeAllPatients: () => ipcRenderer.invoke('wipe-all-patients'),
  // ==========================================
  // 3. UTILITY FUNCTIONS
  // ==========================================
  
  // Triggers the system print dialog
  print: () => window.print()
});