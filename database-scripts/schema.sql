-- National Hospital Galle - Diagnosis System Schema
-- Source: extracted from src/database.ts initialization logic

-- 1. Create the 'patients' table (From our Blueprint)
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
    diagnosis_details TEXT -- Stores JSON strings for complex multi-step fields
);

-- 2. Create the 'print_profiles' table (For the Alignment Calibration Feature)
CREATE TABLE IF NOT EXISTS print_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_name TEXT NOT NULL,
    coordinates JSON NOT NULL -- Stores coordinates: { "name": {x: 10, y: 20}, ... }
);

PRAGMA journal_mode = WAL;
