/// <reference types="vite/client" />

interface Window {
  api: {
    // Patient Database
    savePatient: (data: any) => Promise<{ status: string; id: string }>;
    getPatients: () => Promise<any[]>;
    getPatientById: (id: string) => Promise<any>;
    deletePatient: (id: string) => Promise<{ status: string }>;

    // Layouts
    saveLayout: (data: { profile_name: string; coordinates: string }) => Promise<{ id: number; status: string }>;
    getLayouts: () => Promise<any[]>;

    // System
    print: () => void;
    log: (msg: string) => void;
  };
}