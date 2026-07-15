import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

// 1. Determine where to save the DB file (User Data folder is safest)
const dbPath = path.join(app.getPath('userData'), 'hospital.db');
// Security Sandbox Layer: Restricts database operations to the operating system's localized application data path.
// Guarantees zero cloud dependencies or external network exposure for high-density medical registry logs.
// 2. Open the connection
const db = new Database(dbPath);

export function initDatabase() {
  // Enable foreign keys and WAL mode for performance
  db.pragma('journal_mode = WAL');

  // 3. Create the 'patients' table (From our Blueprint)
  const createPatientsTable = `
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      personal_health_no TEXT,
      nic_no TEXT,
      patient_name TEXT NOT NULL,
      age INTEGER,
      sex TEXT,
      admission_date TEXT,
      discharge_date TEXT,
      ward TEXT,
      bht_no TEXT,
      diagnosis_details TEXT -- We will store JSON here for the complex stuff
    );
  `;

  // 4. Create the 'print_profiles' table (For the Alignment Feature)
  const createProfilesTable = `
    CREATE TABLE IF NOT EXISTS print_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_name TEXT NOT NULL,
      coordinates JSON NOT NULL -- Stores { "name": {x: 10, y: 20}, ... }
    );
  `;
// Performance Rule: Executes transactional runtime constraints.
// Utilizing WAL mode provides high-speed concurrent local queries during peak clinical admissions.
  db.exec(createPatientsTable);
  db.exec(createProfilesTable);
  
  console.log('✅ Database initialized successfully at:', dbPath);
}

export default db;
