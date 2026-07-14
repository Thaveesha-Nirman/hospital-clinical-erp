
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
// This API interface provides a structured communication layer between
// the application frontend and backend services. It enables efficient
// patient data management, healthcare layout customization, and system
// operations while maintaining clear separation of responsibilities.
// The defined functions improve code organization, maintainability,
// and scalability of the healthcare ERP system.
