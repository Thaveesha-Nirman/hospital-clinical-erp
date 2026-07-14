
/**
 * =================================================================================
 * HOSPITAL DIAGNOSIS CARD SYSTEM - PRINT DATA BRIDGE (V25.2.4)
 * =================================================================================
 * Managed by: Kodithuwakku K K T V N (Project 36682)
 * Institution: National Hospital Galle
 */

export interface AdmissionFormData {
  hospitalName: string;
  phn: string; contactNo: string; nic: string; bloodGroup: string;
  allergies: { food: string; plaster: string; drug: string; selectedDrugs: string[]; otherDrug: string; };
  patientName: string; bhtNo: string; ward: string; age: string; sex: string;
  admissionDate: string; dischargeDate: string;
  principalDiagnosis: string; comorbidities: string;
  modeOfAdmission: string; referringDoctor: string; transferInHospital: string;
  modeOfDischarge: string; transferOutHospital: string;
  diseaseNotification: string; medicalCertificate: string; insuranceForm: string;
  consultant: string; moName: string;
  presentingComplaint: string; historyOfComplaint: string;
  pastMedicalHistory: string; pastSurgicalHistory: string; socialHistory: string;
  allergyRemarks: Record<string, string>;
  generalExam: { pale: boolean; icterus: boolean; ankleEdema: boolean; otherFindings: string[] };
  cvs: { pulse: string; bpSys: string; bpDia: string; otherFindings: string[] };
  resp: { rightLung: any; leftLung: any };
  abdomen: { quadrants: (string | null)[]; additionalNotes: string; dre: any };
  cns: { gcs: string; other: string };
  opNote: { content: string; duration: string; drugsGiven: string };
  managementNotes: string; specialInvestigations: string;
  conditionAtDischarge: string; medicationsOnDischarge: string;
  dischargePlan: string; instructionsSinhalaTamil: string; referralNote: string;
}

export const getPrintData = (data: AdmissionFormData): Record<number, any> => {
  
  // 1. ALLERGY LOGIC (FIELD 6)
  const allergyParts: string[] = [];
  if (data.allergies.food === 'Positive') allergyParts.push("Food Allergy");
  if (data.allergies.plaster === 'Positive') allergyParts.push("Plaster Allergy");
  if (data.allergies.drug === 'Positive') {
    let drugString = "Drug Allergy";
    if (data.allergies.selectedDrugs?.length > 0) {
      drugString += ` - ${data.allergies.selectedDrugs.join(", ")}`;
    }
    allergyParts.push(drugString);
  }
  const finalAllergyString = allergyParts.length > 0 ? allergyParts.join(", ") : "Nil";

  // 2. COMPLEX ADMISSION LOGIC (FIELD 16) - 5 Boxes total
  const field16 = {
    _16t1: data.modeOfAdmission === 'Self',
    _16t2: data.modeOfAdmission === 'Referred',
    _16t3: data.modeOfAdmission === 'Transferred In',
    _16d1: data.referringDoctor || "",
    _16d2: data.transferInHospital || ""
  };

  // 3. COMPLEX DISCHARGE LOGIC (FIELD 17) - 4 Boxes total
  const field17 = {
    _17t1: data.modeOfDischarge === 'Routine',
    _17t2: data.modeOfDischarge === 'Transferred Out',
    _17t3: data.modeOfDischarge === 'Self Discharge',
    _17d1: data.transferOutHospital || ""
  };

  // 4. EXAMINATION MEGA-GROUP LOGIC (FIELD 29)
  // Maps general findings, CVS, Lungs, and Abdomen data
  const field29 = {
    _gen: `Pale: ${data.generalExam.pale ? '+' : '-'}, Icterus: ${data.generalExam.icterus ? '+' : '-'}, Edema: ${data.generalExam.ankleEdema ? '+' : '-'}, Others: ${data.generalExam.otherFindings?.join(", ") || "None"}`,
    _cvs: `Pulse: ${data.cvs.pulse || "---"} BPM, BP: ${data.cvs.bpSys || "---"}/${data.cvs.bpDia || "---"} mmHg, Findings: ${data.cvs.otherFindings?.join(", ") || "None"}`,
    _lung_txt: `R-Lung: ${data.resp.rightLung.sound}/${data.resp.rightLung.airEntry}, L-Lung: ${data.resp.leftLung.sound}/${data.resp.leftLung.airEntry}`,
    _cns: `GCS: ${data.cns.gcs}/15. ${data.cns.other || ""}`,
    _abd_data: data.abdomen.quadrants, // Sends raw array for the Octagon renderer
    _dre: `DRE: ${Object.entries(data.abdomen.dre).filter(([_, v]) => v === true).map(([k]) => k).join(", ") || "Normal"}`
  };

  return {
    1: data.hospitalName || "National Hospital Galle",
    2: data.phn, 
    3: data.contactNo, 
    4: data.nic, 
    5: data.bloodGroup,
    6: finalAllergyString,
    7: data.patientName, 
    8: data.bhtNo, 
    9: data.ward, 
    10: data.age, 
    11: data.sex,
    12: data.admissionDate, 
    13: data.dischargeDate,
    14: data.principalDiagnosis, 
    15: data.comorbidities,
    16: field16, 
    17: field17,
    18: data.diseaseNotification, 
    19: data.medicalCertificate, 
    20: data.insuranceForm,
    21: data.consultant, 
    22: data.moName,
    23: data.presentingComplaint, 
    24: data.historyOfComplaint,
    25: data.pastMedicalHistory, 
    26: data.pastSurgicalHistory,
    27: JSON.stringify(data.allergyRemarks || ""),
    28: data.socialHistory,
    29: field29, // Examination Mega-Object
    30: data.opNote.content || data.managementNotes,
    31: "Dynamic Table Data", 
    32: data.specialInvestigations,
    33: data.conditionAtDischarge, 
    34: data.medicationsOnDischarge,
    35: data.dischargePlan, 
    36: data.instructionsSinhalaTamil, 
    37: data.referralNote
  };
};
