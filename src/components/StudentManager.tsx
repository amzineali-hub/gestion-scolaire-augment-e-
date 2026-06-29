import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Student, Class, Subject } from "../types";
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  UserPlus, 
  Phone, 
  Mail, 
  GraduationCap,
  Download,
  Loader2,
  Award,
  Printer
} from "lucide-react";

export interface SubjectGrade {
  id: string;
  name: string;
  code: string;
  coeff: number;
  cc: number;
  exam: number;
}

interface StudentManagerProps {
  students: Student[];
  classes: Class[];
  onAddStudent: (student: Omit<Student, "id" | "outstandingBalance">) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  subjects?: Subject[];
  schoolName?: string;
  schoolLogo?: string;
  contactPhone?: string;
  contactEmail?: string;
  schoolCity?: string;
  regionalAcademy?: string;
  initialSearchQuery?: string;
}

export default function StudentManager({
  students,
  classes,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  subjects = [],
  schoolName,
  schoolLogo,
  contactPhone,
  contactEmail,
  schoolCity,
  regionalAcademy,
  initialSearchQuery = ""
}: StudentManagerProps) {
  // Filters and search states
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      setSelectedClassFilter("all");
      setSelectedStatusFilter("all");
    }
  }, [initialSearchQuery]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handlePrintDoc = (elementId: string, title: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    const printWindow = window.open('', '', 'width=800,height=900');
    if (!printWindow) return;
    
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('\n');
      
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          ${styles}
          <style>
            @media print {
              body, html { padding: 0 !important; margin: 0 !important; background: white !important; }
              @page { margin: 10mm; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
            body { padding: 24px; background: white; }
          </style>
        </head>
        <body class="bg-white">
          ${el.innerHTML}
          <div class="no-print" style="margin-top: 40px; text-align: center; padding: 20px;">
            <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-family: sans-serif; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              Lancer l'impression
            </button>
          </div>
          <style>@media print { .no-print { display: none !important; } }</style>
          <script>
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Modal states
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Bulletin / Report Card states
  const [isOpenBulletinModal, setIsOpenBulletinModal] = useState(false);
  const [selectedStudentForBulletin, setSelectedStudentForBulletin] = useState<Student | null>(null);
  const [bulletinSemester, setBulletinSemester] = useState<string>("Semestre 1");
  const [bulletinAcademicYear, setBulletinAcademicYear] = useState<string>("2025/2026");
  const [gradeRecords, setGradeRecords] = useState<SubjectGrade[]>([]);

  const handleOpenBulletinModal = (student: Student) => {
    setSelectedStudentForBulletin(student);
    const assignedClass = classes.find(c => c.id === student.classId);
    const cycle = assignedClass?.cycle || "Primaire";
    const cycleSubjects = subjects.filter(s => s.cycle === cycle);

    const fallbackSubjects: Record<"Primaire" | "Collège" | "Lycée", Array<{name: string, code: string, coeff: number}>> = {
      Primaire: [
        { name: "Langue Arabe", code: "ARA", coeff: 3 },
        { name: "Langue Française", code: "FRA", coeff: 3 },
        { name: "Mathématiques", code: "MAT", coeff: 3 },
        { name: "Éducation Islamique", code: "ISL", coeff: 2 },
        { name: "Éveils Scientifiques - SVT", code: "SCI", coeff: 2 },
        { name: "Arts Plastiques & Activités", code: "ART", coeff: 1 },
        { name: "Éducation Physique (Sport)", code: "EPS", coeff: 1 }
      ],
      Collège: [
        { name: "Langue Arabe", code: "ARA_C", coeff: 5 },
        { name: "Langue Française", code: "FRA_C", coeff: 5 },
        { name: "Mathématiques", code: "MAT_C", coeff: 5 },
        { name: "Physique-Chimie", code: "PHY_C", coeff: 4 },
        { name: "Sciences de la Vie et de la Terre", code: "SVT_C", coeff: 4 },
        { name: "Histoire-Géographie", code: "HIS_C", coeff: 3 },
        { name: "Éducation Islamique", code: "ISL_C", coeff: 2 },
        { name: "Anglais", code: "ANG_C", coeff: 3 },
        { name: "Éducation Physique", code: "EPS_C", coeff: 2 }
      ],
      Lycée: [
        { name: "Mathématiques", code: "MAT_L", coeff: 7 },
        { name: "Physique-Chimie", code: "PHY_L", coeff: 7 },
        { name: "Sciences de la Vie et de la Terre", code: "SVT_L", coeff: 5 },
        { name: "Philosophie", code: "PHI_L", coeff: 2 },
        { name: "Langue Arabe", code: "ARA_L", coeff: 2 },
        { name: "Langue Française", code: "FRA_L", coeff: 4 },
        { name: "Anglais", code: "ANG_L", coeff: 4 },
        { name: "Histoire-Géographie", code: "HIS_L", coeff: 2 },
        { name: "Éducation Islamique", code: "ISL_L", coeff: 2 }
      ]
    };

    const initialGrades: SubjectGrade[] = [];

    if (cycleSubjects.length >= 3) {
      cycleSubjects.forEach(s => {
        const seed = (student.firstName + s.name).length;
        const ccVal = parseFloat((12 + (seed % 7) * 0.8 + ((seed * 3) % 10) * 0.1).toFixed(2));
        const examVal = parseFloat((ccVal - 1 + ((seed * 7) % 3) * 0.7).toFixed(2));
        initialGrades.push({
          id: s.id,
          name: s.name,
          code: s.code,
          coeff: s.hoursPerWeek ? Math.max(1, Math.min(7, Math.round(s.hoursPerWeek / 1.5))) : 3,
          cc: ccVal,
          exam: examVal
        });
      });
    } else {
      const selectedFallbackList = fallbackSubjects[cycle as "Primaire" | "Collège" | "Lycée"] || fallbackSubjects["Primaire"];
      selectedFallbackList.forEach((sub, idx) => {
        const seed = idx + (student.firstName.charCodeAt(0) || 12);
        const ccVal = parseFloat((12 + (seed % 7) * 0.8 + ((seed * 3) % 10) * 0.1).toFixed(2));
        const examVal = parseFloat((ccVal - 1 + ((seed * 7) % 3) * 0.7).toFixed(2));
        initialGrades.push({
          id: `fallback-${idx}`,
          name: sub.name,
          code: sub.code,
          coeff: sub.coeff,
          cc: ccVal,
          exam: examVal
        });
      });
    }

    setGradeRecords(initialGrades);
    setIsOpenBulletinModal(true);
  };

  const handleUpdateGradeCC = (id: string, value: string) => {
    let numVal = parseFloat(value);
    if (isNaN(numVal)) numVal = 0;
    if (numVal < 0) numVal = 0;
    if (numVal > 20) numVal = 20;
    setGradeRecords(prev => prev.map(r => r.id === id ? { ...r, cc: numVal } : r));
  };

  const handleUpdateGradeExam = (id: string, value: string) => {
    let numVal = parseFloat(value);
    if (isNaN(numVal)) numVal = 0;
    if (numVal < 0) numVal = 0;
    if (numVal > 20) numVal = 20;
    setGradeRecords(prev => prev.map(r => r.id === id ? { ...r, exam: numVal } : r));
  };

  const handleUpdateGradeCoeff = (id: string, value: string) => {
    let numVal = parseInt(value);
    if (isNaN(numVal)) numVal = 1;
    if (numVal < 1) numVal = 1;
    if (numVal > 10) numVal = 10;
    setGradeRecords(prev => prev.map(r => r.id === id ? { ...r, coeff: numVal } : r));
  };

  // Export states
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingMassar, setIsExportingMassar] = useState(false);

  const handleExportCSV = () => {
    setIsExportingCSV(true);
    setTimeout(() => {
      // Dynamic generation of Moroccan CSV file with all student details and selected options
      const headers = "Identifiant,Prenom,Nom,Classe,Cycle,Parent,Telephone,Email,Statut,Date_Inscription,Frais_Classe_MAD,Solde_Du_MAD,Option_Transport,Option_Cantine,Option_Soutien,Option_Club_Sport,Option_Suivi_WhatsApp,Option_Assurance,Option_IA\n";
      const rows = filteredStudents.map(s => {
        const assignedClass = classes.find(c => c.id === s.classId);
        const className = assignedClass?.name || "N/A";
        const cycle = assignedClass?.cycle || "N/A";
        const classFee = assignedClass?.feeAmount || 0;
        
        const transport = s.transportOption ? "Oui" : "Non";
        const canteen = s.canteenOption ? "Oui" : "Non";
        const tutoring = s.tutoringOption ? "Oui" : "Non";
        const sport = s.sportOption ? "Oui" : "Non";
        const sms = s.smsOption ? "Oui" : "Non";
        const insurance = s.insuranceOption ? "Oui" : "Non";
        const aiOptVal = s.aiOption ? "Oui" : "Non";

        return `${s.id},"${s.firstName}","${s.lastName}","${className}","${cycle}","${s.parentName}","${s.parentPhone || ""}","${s.parentEmail || ""}","${s.status}","${s.registrationDate}",${classFee},${s.outstandingBalance},"${transport}","${canteen}","${tutoring}","${sport}","${sms}","${insurance}","${aiOptVal}"`;
      }).join("\n");
      
      const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `registre_eleves_export.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportingCSV(false);
    }, 1200);
  };

  const handleExportMassar = () => {
    setIsExportingMassar(true);
    setTimeout(() => {
      // Massar systems in Moroccan schools expect column structures
      const headers = "Code_Massar,Nom,Prenom,Classe,Parent,Telephone,Email,Statut,Niveau_Scolaire\n";
      const rows = filteredStudents.map(s => {
        const className = classes.find(c => c.id === s.classId)?.name || "N/A";
        const codeMassar = `M${Math.floor(130000000 + Math.random() * 90000000)}`;
        return `${codeMassar},"${s.lastName}","${s.firstName}","${className}","${s.parentName}","${s.parentPhone || ""}","${s.parentEmail || ""}","${s.status}","${className}"`;
      }).join("\n");
      
      const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `massar_students_list.xls`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportingMassar(false);
    }, 2000);
  };

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [classId, setClassId] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [status, setStatus] = useState<"actif" | "suspendu" | "archivé">("actif");
  const [registrationDate, setRegistrationDate] = useState("");
  const [transportOption, setTransportOption] = useState(false);
  const [canteenOption, setCanteenOption] = useState(false);
  const [tutoringOption, setTutoringOption] = useState(false);
  const [sportOption, setSportOption] = useState(false);
  const [smsOption, setSmsOption] = useState(false);
  const [insuranceOption, setInsuranceOption] = useState(false);
  const [aiOption, setAiOption] = useState(false);

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFirstName("");
    setLastName("");
    setClassId(classes[0]?.id || "");
    setParentName("");
    setParentPhone("");
    setParentEmail("");
    setStatus("actif");
    setRegistrationDate(new Date().toISOString().split("T")[0]);
    setTransportOption(false);
    setCanteenOption(false);
    setTutoringOption(false);
    setSportOption(false);
    setSmsOption(false);
    setInsuranceOption(false);
    setAiOption(false);
    setIsOpenModal(true);
  };

  const handleOpenEditModal = (std: Student) => {
    setEditingStudent(std);
    setFirstName(std.firstName);
    setLastName(std.lastName);
    setClassId(std.classId);
    setParentName(std.parentName);
    setParentPhone(std.parentPhone);
    setParentEmail(std.parentEmail);
    setStatus(std.status);
    setRegistrationDate(std.registrationDate);
    setTransportOption(std.transportOption || false);
    setCanteenOption(std.canteenOption || false);
    setTutoringOption(std.tutoringOption || false);
    setSportOption(std.sportOption || false);
    setSmsOption(std.smsOption || false);
    setInsuranceOption(std.insuranceOption || false);
    setAiOption(std.aiOption || false);
    setIsOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !classId || !parentName) {
      alert("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    const payload = {
      firstName,
      lastName,
      classId,
      parentName,
      parentPhone,
      parentEmail,
      status,
      registrationDate,
      transportOption,
      canteenOption,
      tutoringOption,
      sportOption,
      smsOption,
      insuranceOption,
      aiOption
    };

    setIsSaving(true);
    try {
      if (editingStudent) {
        await onEditStudent({
          ...editingStudent,
          ...payload
        });
      } else {
        await onAddStudent(payload);
      }
      setIsSaving(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpenModal(false);
      }, 900);
    } catch (err: any) {
      console.error("Error saving student:", err);
      setIsSaving(false);
      alert(`Une erreur s'est produite lors de l'enregistrement de l'élève : ${err?.message || err}`);
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const queryMatch = fullName.includes(searchQuery.toLowerCase()) || 
                       student.parentName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const classMatch = selectedClassFilter === "all" || student.classId === selectedClassFilter;
    const statusMatch = selectedStatusFilter === "all" || student.status === selectedStatusFilter;

    return queryMatch && classMatch && statusMatch;
  });

  // Safe pagination
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);

  return (
    <div id="student-manager-section" className="space-y-6">
      {/* Header section with add button */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 font-display">
            <Users className="h-6 w-6 text-indigo-600 animate-pulse" /> Gestion des Élèves
          </h2>
          <p className="text-sm text-black">
            Enregistrez les nouveaux élèves, attribuez-les aux classes et suivez les informations de facturation parentale.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={isExportingCSV || isExportingMassar}
            className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-3.5 rounded-xl text-xs border border-slate-200 flex items-center gap-1.5 shadow-xs transition duration-150 cursor-pointer disabled:opacity-60"
          >
            {isExportingCSV ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                <span>Exportation...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 text-black" />
                <span>Exporter CSV</span>
              </>
            )}
          </button>

          {/* Export Massar Button */}
          <button
            onClick={handleExportMassar}
            disabled={isExportingCSV || isExportingMassar}
            className="bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 font-bold py-2 px-3.5 rounded-xl text-xs border border-emerald-200 flex items-center gap-1.5 shadow-xs transition duration-150 cursor-pointer disabled:opacity-60"
          >
            {isExportingMassar ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span>Traitement Massar...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 text-emerald-600 animate-bounce" />
                <span>Export Massar (.xls)</span>
              </>
            )}
          </button>

          {/* Export PDF Button */}
          <button
            onClick={() => handlePrintDoc("student-list-print-area", "Liste_Eleves")}
            className="bg-white hover:bg-slate-50 text-indigo-700 font-bold py-2 px-3.5 rounded-xl text-xs border border-indigo-200 flex items-center gap-1.5 shadow-xs transition duration-150 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Exporter PDF</span>
          </button>

          {/* New Student Button */}
          <button
            onClick={handleOpenAddModal}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-100 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Nouvel Élève
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="print:hidden bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search bar */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-black" />
          <input
            type="text"
            placeholder="Rechercher par élève ou parent..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition"
          />
        </div>

        {/* Action Selectors */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Class filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => {
              setSelectedClassFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          >
            <option value="all">Toutes les Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => {
              setSelectedStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          >
            <option value="all">Tous les Statuts</option>
            <option value="actif">Actif</option>
            <option value="suspendu">Suspendu</option>
            <option value="archivé">Archivé</option>
          </select>

          {/* Reset filter */}
          {(searchQuery || selectedClassFilter !== "all" || selectedStatusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedClassFilter("all");
                setSelectedStatusFilter("all");
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs text-rose-600 font-bold hover:bg-rose-50 rounded-lg transition"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Main Grid display of students */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="student-list-print-area">
        {filteredStudents.length > 0 ? (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-xs font-bold text-black uppercase tracking-wider">
                  <th className="px-6 py-4">Nom de l'Élève</th>
                  <th className="px-6 py-4">Cycle & Classe</th>
                  <th className="px-6 py-4">Responsable Légal (Parent)</th>
                  <th className="px-6 py-4">Frais Scolaires</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map(student => {
                  const assignedClass = classes.find(c => c.id === student.classId);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition">
                      {/* Name / Gen Avatar */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold uppercase text-sm border border-indigo-100">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-[10px] text-black">Inscrit le {student.registrationDate}</p>
                          </div>
                        </div>
                      </td>

                      {/* Class / Cycle */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assignedClass ? (
                          <div>
                            <span className="text-xs font-semibold text-slate-800 block">
                              {assignedClass.name}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1 items-center">
                              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded ${
                                assignedClass.cycle === "Lycée" 
                                  ? "bg-violet-50 text-violet-700" 
                                  : assignedClass.cycle === "Collège" 
                                    ? "bg-amber-50 text-amber-700" 
                                    : "bg-emerald-50 text-emerald-700"
                              }`}>
                                {assignedClass.cycle}
                              </span>
                              {student.transportOption && (
                                <span className="inline-block text-[9px] font-semibold bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100" title="Transport Scolaire Activé">
                                  🚌 Transport
                                </span>
                              )}
                              {student.canteenOption && (
                                <span className="inline-block text-[9px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100" title="Cantine Scolaire Activée">
                                  🍽️ Cantine
                                </span>
                              )}
                              {student.tutoringOption && (
                                <span className="inline-block text-[9px] font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100" title="Soutien Scolaire / Étude Activé">
                                  📚 Soutien
                                </span>
                              )}
                              {student.sportOption && (
                                <span className="inline-block text-[9px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100" title="Club Sportif & Artistique Activé">
                                  ⚽ Club Sport
                                </span>
                              )}
                              {student.smsOption && (
                                <span className="inline-block text-[9px] font-semibold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100" title="Notifications WhatsApp Parents Activées">
                                  📱 Suivi WhatsApp
                                </span>
                              )}
                              {student.insuranceOption && (
                                <span className="inline-block text-[9px] font-semibold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-100" title="Assurance Scolaire Premium">
                                  🛡️ Assurance
                                </span>
                              )}
                              {student.aiOption && (
                                <span className="inline-block text-[9px] font-semibold bg-violet-100 text-violet-800 px-1.5 py-0.5 rounded border border-violet-200 animate-pulse" title="Tuteur IA & Rapports Personnalisés Activé">
                                  🤖 Option IA
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-rose-500 font-medium">Non assigné</span>
                        )}
                      </td>

                      {/* Parent profile */}
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-700 space-y-1">
                          <p className="font-medium text-slate-800">{student.parentName}</p>
                          <div className="flex items-center gap-1.5 text-black">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{student.parentPhone || "N/A"}</span>
                          </div>
                          {student.parentEmail && (
                            <div className="flex items-center gap-1.5 text-black">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span>{student.parentEmail}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Payment Due status info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {assignedClass ? `${assignedClass.feeAmount} MAD` : "0 MAD"}
                            <span className="text-[10px] font-normal text-black"> / mois</span>
                          </p>
                          <p className={`text-[10px] font-medium mt-0.5 ${
                            student.outstandingBalance > 0 
                              ? "text-rose-600" 
                              : "text-emerald-600"
                          }`}>
                            {student.outstandingBalance > 0 
                              ? `Dû: ${student.outstandingBalance} MAD` 
                              : "À jour de paiement"}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          student.status === "actif" 
                            ? "bg-emerald-50 text-emerald-700" 
                            : student.status === "suspendu" 
                              ? "bg-rose-50 text-rose-700" 
                              : "bg-slate-100 text-black"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            student.status === "actif" 
                              ? "bg-emerald-500" 
                              : student.status === "suspendu" 
                                ? "bg-rose-500" 
                                : "bg-slate-400"
                          }`} />
                          {student.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs print:hidden">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenBulletinModal(student)}
                            className="bg-emerald-50 hover:bg-emerald-150 border border-emerald-200 hover:border-emerald-300 text-emerald-800 p-1.5 rounded-lg transition shrink-0 cursor-pointer"
                            title="Générer & Exporter Bulletin Scolaire PDF"
                          >
                            <GraduationCap className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-black hover:text-indigo-600 p-1.5 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Êtes-vous sûr de vouloir supprimer l'élève ${student.firstName} ${student.lastName} ?`)) {
                                onDeleteStudent(student.id);
                              }
                            }}
                            className="bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-black hover:text-rose-600 p-1.5 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="print:hidden bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-black font-medium">
              Affichage de <span className="font-bold text-slate-700">{totalItems > 0 ? startIndex + 1 : 0}</span> à{" "}
              <span className="font-bold text-slate-700">{Math.min(startIndex + pageSize, totalItems)}</span> sur{" "}
              <span className="font-bold text-slate-700">{totalItems}</span> élèves
            </div>
            <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
              {/* Page Size Selector */}
              <div className="flex items-center gap-1.5 text-xs text-black">
                <span>Lignes par page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700 cursor-pointer text-[11px]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-black hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Précédent
                </button>
                <span className="text-xs text-black font-semibold px-2">
                  Page {activePage} sur {totalPages}
                </span>
                <button
                  type="button"
                  disabled={activePage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-black hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </>
        ) : (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-slate-350 mx-auto mb-3" />
            <p className="text-black font-medium">Aucun élève trouvé</p>
            <p className="text-xs text-black mt-1">Essayez d'ajuster vos filtres de recherche ou créez un nouvel élève.</p>
          </div>
        )}
      </div>

      {/* CREATE & EDIT MODAL DIALOG */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-100 overflow-hidden animate-in fade-in-50 duration-250">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-500" />
                {editingStudent ? "Modifier l'Élève" : "Enregistrer un Nouvel Élève"}
              </h3>
              <button 
                onClick={() => setIsOpenModal(false)}
                className="text-black hover:text-black p-1 bg-white hover:bg-slate-100 rounded-full border border-slate-100 transition focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Personal Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black uppercase mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Omar"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black uppercase mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Bensouda"
                  />
                </div>
              </div>

              {/* Class Registration selection */}
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Classe Assignée *</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} - ({c.level} | {c.cycle} | Mensualité: {c.feeAmount} MAD)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-black mt-1">
                  Les frais mensuels de facturation s'adapteront automatiquement au tarif de la classe choisie.
                </p>
              </div>

              {/* Parent Details */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-indigo-500" /> Tuteur Légal / Parent Mandataire
                </h4>
                
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Nom Complet du Responsable *</label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full bg-white text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: Hicham Bensouda"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Téléphone Principal *</label>
                    <input
                      type="tel"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full bg-white text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ex: 0661234567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Adresse E-mail Parent</label>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full bg-white text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ex: parent@bensouda.com"
                    />
                  </div>
                </div>
              </div>

              {/* Options & Prestations scolaires annexes */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/65 space-y-3">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  ✨ Options de Services de l'Élève
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      id="opt-transport-chk"
                      checked={transportOption}
                      onChange={(e) => setTransportOption(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">🚌 Transport (+400 DH)</span>
                  </label>
                  
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      id="opt-canteen-chk"
                      checked={canteenOption}
                      onChange={(e) => setCanteenOption(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">🍽️ Cantine (+500 DH)</span>
                  </label>
                  
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      id="opt-tutoring-chk"
                      checked={tutoringOption}
                      onChange={(e) => setTutoringOption(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">📚 Soutien (+300 DH)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      id="opt-sport-chk"
                      checked={sportOption}
                      onChange={(e) => setSportOption(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">⚽ Club Sport (+250 DH)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      id="opt-sms-chk"
                      checked={smsOption}
                      onChange={(e) => setSmsOption(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">📱 Suivi WhatsApp (+50 DH)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      id="opt-insurance-chk"
                      checked={insuranceOption}
                      onChange={(e) => setInsuranceOption(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">🛡️ Assurance (+100 DH)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-indigo-50/50 rounded-lg border border-indigo-200 cursor-pointer hover:bg-indigo-100/30 transition">
                    <input
                      type="checkbox"
                      id="opt-ai-chk"
                      checked={aiOption}
                      onChange={(e) => setAiOption(e.target.checked)}
                      className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-indigo-950">🤖 Option IA (+150 DH)</span>
                  </label>
                </div>
                <p className="text-[10px] text-indigo-805">
                  Ces options s'ajouteront automatiquement au calcul de la facturation mensuelle de l'élève.
                </p>
              </div>

              {/* Status and Registration Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black uppercase mb-1">Date d'inscription</label>
                  <input
                    type="date"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black uppercase mb-1">Statut Scolaire</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="actif">Actif (Inscrit)</option>
                    <option value="suspendu">Suspendu (Défaut de paiement)</option>
                    <option value="archivé">Archivé / Sorti</option>
                  </select>
                </div>
              </div>

              {/* Trigger submit */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-white">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer"
                >
                  Annuler
                </button>
                <motion.button
                  whileHover={!isSaving ? { scale: 1.02 } : {}}
                  whileTap={!isSaving ? { scale: 0.98 } : {}}
                  type="submit"
                  disabled={isSaving || isSuccess}
                  className={`relative overflow-hidden px-4 py-2 text-sm font-semibold text-white rounded-lg shadow transition-all duration-300 min-w-40 flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSuccess
                      ? "bg-emerald-600 border-emerald-600"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Enregistrement...</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <Check className="h-4 w-4 text-white animate-bounce shrink-0" />
                      <span>Inscrit !</span>
                    </>
                  ) : (
                    <span>{editingStudent ? "Enregistrer" : "Inscrire l'Élève"}</span>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULLETIN SCOLAIRE - REPORT CARD GENERATION & PDF EXPORT MODAL (A4) */}
      {isOpenBulletinModal && selectedStudentForBulletin && (() => {
         const student = selectedStudentForBulletin;
         const assignedClass = classes.find(c => c.id === student.classId) || { id: "none", name: "Classe Non Assignée", level: "N/A", cycle: "Primaire" as const, feeAmount: 0 };
         
         const getMentionsAndDecision = (avg: number) => {
           if (avg >= 16) return { mention: "Très Bien", decision: "Félicitations du Jury", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" };
           if (avg >= 14) return { mention: "Bien", decision: "Tableau d'Honneur", bg: "bg-indigo-50 text-indigo-800 border-indigo-200" };
           if (avg >= 12) return { mention: "Assez Bien", decision: "Encouragements", bg: "bg-sky-50 text-sky-850 border-sky-200" };
           if (avg >= 10) return { mention: "Passable", decision: "Admis", bg: "bg-amber-50 text-amber-800 border-amber-200" };
           return { mention: "Insuffisant", decision: "Doit fournir des efforts", bg: "bg-rose-50 text-rose-800 border-rose-200" };
         };

         const totalCoeff = gradeRecords.reduce((sum, r) => sum + r.coeff, 0);
         const rawTotalWeightedGrades = gradeRecords.reduce((sum, r) => sum + ((r.cc + r.exam) / 2) * r.coeff, 0);
         const generalAverage = totalCoeff > 0 ? parseFloat((rawTotalWeightedGrades / totalCoeff).toFixed(2)) : 0;
         const mentionMeta = getMentionsAndDecision(generalAverage);

         return (
           <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 backdrop-blur-xs overflow-y-auto">
             {/* Print styles specifically targeting bulletin-print-area while hiding everything else */}
             <style dangerouslySetInnerHTML={{ __html: `
               @media print {
                 * {
                   -webkit-print-color-adjust: exact !important;
                   print-color-adjust: exact !important;
                 }
                 body * {
                   visibility: hidden !important;
                 }
                 #school-bulletin-print-area, #school-bulletin-print-area * {
                   visibility: visible !important;
                 }
                 #school-bulletin-print-area {
                   position: absolute !important;
                   left: 0 !important;
                   top: 0 !important;
                   width: 210mm !important;
                   height: 297mm !important;
                   border: none !important;
                   box-shadow: none !important;
                   margin: 0 !important;
                   padding: 10mm !important;
                   background-color: white !important;
                 }
                 .print\\:hidden {
                   display: none !important;
                 }
               }
             `}} />

             <div className="bg-slate-100 rounded-2xl w-full max-w-6xl shadow-2xl border flex flex-col md:flex-row max-h-[92vh] overflow-hidden animate-in scale-in-95 duration-200">
               
               {/* Left Column: Grade input & Controls */}
               <div className="w-full md:w-96 bg-white border-r border-slate-200 p-5 flex flex-col gap-5 shrink-0 print:hidden overflow-y-auto">
                 <div>
                   <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                     <GraduationCap className="h-5 w-5 text-emerald-600 animate-bounce animate-duration-1000" /> Options du Bulletin
                   </h3>
                   <p className="text-[11px] text-black mt-1">
                     Modifiez les notes et les coefficients ci-dessous. Le calcul de la moyenne générale se met à jour instantanément.
                   </p>
                 </div>

                 {/* Settings / Meta Inputs */}
                 <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                   <div className="space-y-1">
                     <label className="block text-[10px] font-bold text-slate-550 uppercase">Période Scolaire</label>
                     <select
                       value={bulletinSemester}
                       onChange={(e) => setBulletinSemester(e.target.value)}
                       className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
                     >
                       <option value="Semestre 1">Semestre 1</option>
                       <option value="Semestre 2">Semestre 2</option>
                       <option value="Semestre 3">Semestre 3</option>
                       <option value="Examen Final">Examen Final</option>
                     </select>
                   </div>
                   <div className="space-y-1">
                     <label className="block text-[10px] font-bold text-slate-555 uppercase">Année Scolaire</label>
                     <input
                       type="text"
                       value={bulletinAcademicYear}
                       onChange={(e) => setBulletinAcademicYear(e.target.value)}
                       placeholder="Ex: 2025/2026"
                       className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
                     />
                   </div>
                 </div>

                 {/* Subject list editable fields */}
                 <div className="flex-1 space-y-3 pr-1 overflow-y-auto max-h-[45vh]">
                   <span className="block text-[10px] font-bold text-black uppercase tracking-wider">Saisie des Notes (/20)</span>
                   
                   {gradeRecords.map((rec) => (
                     <div key={rec.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                       <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{rec.name}</span>
                         <span className="text-[9px] bg-slate-200 text-slate-700 border font-mono px-1.5 py-0.5 rounded uppercase font-bold">{rec.code}</span>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-2">
                         <div className="space-y-0.5">
                           <span className="block text-[9px] font-bold text-black">Coeff</span>
                           <input
                             type="number"
                             min="1"
                             max="10"
                             value={rec.coeff}
                             onChange={(e) => handleUpdateGradeCoeff(rec.id, e.target.value)}
                             className="w-full text-center text-xs font-bold bg-white border border-slate-200 rounded px-1 py-1"
                           />
                         </div>
                         <div className="space-y-0.5">
                           <span className="block text-[9px] font-bold text-black">Contrôle C.</span>
                           <input
                             type="number"
                             step="0.25"
                             min="0"
                             max="20"
                             value={rec.cc}
                             onChange={(e) => handleUpdateGradeCC(rec.id, e.target.value)}
                             className="w-full text-center text-xs font-bold bg-white border border-slate-200 rounded px-1 py-1 text-emerald-700"
                           />
                         </div>
                         <div className="space-y-0.5">
                           <span className="block text-[9px] font-bold text-black">Examen</span>
                           <input
                             type="number"
                             step="0.25"
                             min="0"
                             max="20"
                             value={rec.exam}
                             onChange={(e) => handleUpdateGradeExam(rec.id, e.target.value)}
                             className="w-full text-center text-xs font-bold bg-white border border-slate-200 rounded px-1 py-1 text-indigo-700"
                           />
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>

                 {/* Information warning */}
                 <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-[10px] leading-relaxed text-indigo-805">
                   <p className="font-bold">✨ Prêt pour impression A4</p>
                   Mise en page formatée pour **A4 Portrait**. Cochez **"Graphiques d'arrière-plan"** dans vos paramètres d'impression pour exporter le logo et les couleurs du bulletin.
                 </div>

                 {/* Action Buttons */}
                 <div className="space-y-2 pt-3 border-t border-slate-100">
                   <button
                     type="button"
                     onClick={() => handlePrintDoc("school-bulletin-print-area", `Bulletin_${selectedStudentForBulletin?.firstName}`)}
                     className="w-full py-2.5 rounded-xl text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-extrabold flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md"
                   >
                     <Printer className="h-4 w-4" /> Exporter en bulletin PDF
                   </button>
                   <button
                     type="button"
                     onClick={() => setIsOpenBulletinModal(false)}
                     className="w-full py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-black transition cursor-pointer"
                   >
                     Annuler / Fermer
                   </button>
                 </div>
               </div>

               {/* Right Column: Pre-visualization Canvas */}
               <div className="flex-1 p-5 md:p-8 overflow-y-auto bg-slate-250/40 print:bg-white print:p-0">
                 
                 {/* Printable Canvas Sheet (Ratio design A4) */}
                 <div
                   id="school-bulletin-print-area"
                   className="bg-white mx-auto shadow-xl border border-slate-250/70 p-6 sm:p-10 font-sans text-slate-800 max-w-[210mm] min-h-[297mm] h-fit relative rounded-xl print:rounded-none print:shadow-none print:border-none print:p-0 flex flex-col justify-between"
                 >
                   <div>
                     {/* Head Authority Seal & School Logo metadata */}
                     <div className="grid grid-cols-3 gap-2 border-b-2 border-slate-800 pb-4 mb-4 shrink-0">
                       <div className="text-[9px] text-black font-medium space-y-0.5">
                         <p className="font-extrabold text-slate-800">ROYAUME DU MAROC</p>
                         <p className="font-bold text-[8.5px]">Ministère de l'Éducation Nationale</p>
                         <p className="text-black">{regionalAcademy || "AREF Casablanca - Settat"}</p>
                         <p className="text-black">Délégation de l'Enseignement Privé</p>
                       </div>
                       
                       {/* Emblem or National star */}
                       <div className="flex flex-col items-center justify-center text-center">
                         <div className="h-7 w-7 text-emerald-600 opacity-80 flex items-center justify-center font-black text-lg">
                           ★
                         </div>
                         <p className="text-[8px] font-black uppercase tracking-widest text-black mt-0.5">Royaume du Maroc</p>
                       </div>

                       <div className="flex justify-end items-start gap-2 text-right">
                         <div className="space-y-0.5">
                           <h4 className="font-bold text-slate-900 text-[10px] tracking-tight uppercase">
                             {schoolName || "GROUPE SCOLAIRE ARRACHAD"}
                           </h4>
                           <p className="text-[8px] text-black">Ville: {schoolCity || "Casablanca"}</p>
                           <p className="text-[8.5px] font-semibold text-black">Tél: {contactPhone || "0522123456"}</p>
                         </div>
                         {schoolLogo ? (
                           <div className="h-10 w-10 rounded-lg border border-slate-150 overflow-hidden bg-slate-50 flex items-center justify-center p-0.5 shrink-0 shadow-inner">
                             <img src={schoolLogo} alt="Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                           </div>
                         ) : (
                           <div className="h-9 w-9 bg-slate-900 text-white rounded-lg flex items-center justify-center text-sm font-black shrink-0">
                             GS
                           </div>
                         )}
                       </div>
                     </div>

                     {/* Document title ribbon */}
                     <div className="text-center py-2 px-4 bg-slate-50 border-2 border-slate-850 rounded-xl mb-4 shrink-0">
                       <h2 className="text-sm font-black text-slate-900 tracking-wide uppercase">
                         Bulletin de Notes Semestriel
                       </h2>
                       <p className="text-[10px] font-bold text-black mt-0.5">
                         Période: <strong className="text-slate-800">{bulletinSemester}</strong> | Année Académique: <strong className="text-slate-800">{bulletinAcademicYear}</strong>
                       </p>
                     </div>

                     {/* Student Info Dashboard Badge */}
                     <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs shrink-0">
                       <div>
                         <span className="text-[9px] font-bold text-black uppercase block">Élève</span>
                         <span className="font-extrabold text-slate-800 text-sm tracking-tight">{student.firstName} {student.lastName}</span>
                       </div>
                       <div>
                         <span className="text-[9px] font-bold text-black uppercase block">Établissement</span>
                         <span className="font-bold text-slate-700">{schoolName || "Groupe Scolaire Madrasati"}</span>
                       </div>
                       <div>
                         <span className="text-[9px] font-bold text-black uppercase block">Niveau & Classe</span>
                         <span className="font-extrabold text-slate-800">{assignedClass.level} &mdash; <strong className="text-indigo-600">{assignedClass.name}</strong></span>
                       </div>
                       <div>
                         <span className="text-[9px] font-bold text-black uppercase block">Cycle d'Enseignement</span>
                         <span className="font-bold text-slate-700">{assignedClass.cycle}</span>
                       </div>
                       <div>
                         <span className="text-[9px] font-bold text-black uppercase block">Date d'admission</span>
                         <span className="font-semibold text-black">{student.registrationDate}</span>
                       </div>
                       <div>
                         <span className="text-[9px] font-bold text-black uppercase block">Matricule Interne</span>
                         <span className="font-mono text-[10.5px] font-bold text-black">#{student.id.substring(0, 8).toUpperCase()}</span>
                       </div>
                     </div>

                     {/* Grades and Coefficients core layout table */}
                     <div className="border border-slate-300 rounded-xl overflow-hidden mb-4 shrink-0">
                       <table className="w-full text-left text-[11px] border-collapse leading-normal">
                         <thead>
                           <tr className="bg-slate-50 border-b-2 border-slate-300 font-bold text-slate-605 uppercase text-[8px] tracking-wider">
                             <th className="px-3.5 py-2">Code</th>
                             <th className="px-3.5 py-2">Intitulé de la Matière</th>
                             <th className="px-3.5 py-2 text-center">Coeff</th>
                             <th className="px-3.5 py-2 text-center bg-emerald-50/20 text-emerald-950 border-x">Contrôle Continu</th>
                             <th className="px-3.5 py-2 text-center bg-indigo-50/20 text-indigo-950 border-r">Examen de Session</th>
                             <th className="px-3.5 py-2 text-right bg-slate-50 font-bold">Moyenne Matière</th>
                             <th className="px-3.5 py-2 text-center">Appréciation par Matière</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-205">
                           {gradeRecords.map((rec) => {
                             const rowAvg = parseFloat(((rec.cc + rec.exam) / 2).toFixed(2));
                             let appText = "Insuffisant";
                             let colorClass = "text-rose-700";
                             if (rowAvg >= 16) { appText = "Excellent"; colorClass = "text-emerald-700 font-extrabold"; }
                             else if (rowAvg >= 14) { appText = "Très Bien"; colorClass = "text-indigo-700 font-bold"; }
                             else if (rowAvg >= 12) { appText = "Bien"; colorClass = "text-indigo-600"; }
                             else if (rowAvg >= 10) { appText = "Passable"; colorClass = "text-amber-700"; }
                             
                             return (
                               <tr key={rec.id} className="hover:bg-slate-50/20">
                                 <td className="px-3.5 py-1.5 font-mono text-[9px] text-black font-bold uppercase">{rec.code}</td>
                                 <td className="px-3.5 py-1.5 font-extrabold text-slate-800">{rec.name}</td>
                                 <td className="px-3.5 py-1.5 text-center text-black font-bold">{rec.coeff}</td>
                                 <td className="px-3.5 py-1.5 text-center font-bold text-emerald-800 bg-emerald-50/10 border-x">{rec.cc.toFixed(2)}</td>
                                 <td className="px-3.5 py-1.5 text-center font-bold text-indigo-800 bg-indigo-50/10 border-r">{rec.exam.toFixed(2)}</td>
                                 <td className="px-3.5 py-1.5 text-right font-black text-slate-800 bg-slate-50/40">{rowAvg.toFixed(2)} / 20</td>
                                 <td className="px-3.5 py-1.5 text-center font-semibold text-[9.5px]">
                                   <span className={colorClass}>{appText}</span>
                                 </td>
                               </tr>
                             );
                           })}
                         </tbody>
                       </table>
                     </div>

                     {/* Total and Weighted General Average Ribbon bar */}
                     <div className="grid grid-cols-2 gap-4 items-stretch mb-4 shrink-0">
                       <div className="bg-slate-55 border border-slate-200 rounded-xl p-3 flex flex-col justify-center">
                         <div className="flex justify-between text-[10.5px] font-bold text-black">
                           <span>Total des Coefficients:</span>
                           <span className="text-slate-800 font-extrabold">{totalCoeff}</span>
                         </div>
                         <div className="flex justify-between text-[10.5px] font-bold text-black mt-1">
                           <span>Matières évaluées:</span>
                           <span className="text-slate-800 font-bold">{gradeRecords.length} disciplines</span>
                         </div>
                       </div>

                       <div className={`border p-3 rounded-xl flex items-center justify-between shadow-xs ${mentionMeta.bg}`}>
                         <div>
                           <span className="text-[9px] font-extrabold uppercase block tracking-wide opacity-80">Moyenne Générale</span>
                           <span className="text-2xl font-black">{generalAverage.toFixed(2)} <span className="text-xs font-bold">/ 20</span></span>
                         </div>
                         <div className="text-right">
                           <span className="text-[9px] font-extrabold uppercase block tracking-wide opacity-80">Mention Conseil</span>
                           <span className="text-xs font-black tracking-tight">{mentionMeta.mention}</span>
                           <p className="text-[8px] opacity-75 font-semibold mt-0.5">{mentionMeta.decision}</p>
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Legal, Stamps, and Official Signatures footer section */}
                   <div className="border-t border-dashed border-slate-300 pt-5 mt-4 shrink-0">
                     <div className="grid grid-cols-3 gap-3 text-center text-[10px] text-black">
                       
                       {/* Prof signature area */}
                       <div className="space-y-10">
                         <span className="font-bold text-slate-700 uppercase text-[9px] block">Avis des Enseignants</span>
                         <p className="italic text-[9px] text-black select-none">Matières validées</p>
                         <p className="text-[8px] text-black font-mono">Professeur Principal</p>
                       </div>

                       {/* Central Cachet official institution seal */}
                       <div className="flex flex-col items-center justify-center">
                         <span className="font-bold text-slate-700 uppercase text-[9px] mb-1">Cachet de l'Établissement</span>
                         <div className="h-16 w-32 border border-emerald-650/40 border-double rounded-full flex flex-col items-center justify-center bg-slate-50/50 opacity-90">
                           <span className="text-[7px] text-emerald-800 font-extrabold uppercase tracking-wide">Direction</span>
                           <span className="text-[7.5px] text-emerald-850 font-bold uppercase truncate max-w-[110px]">{schoolCity || "Casablanca"}</span>
                           <span className="text-[6.5px] text-emerald-650/80 font-bold uppercase mt-0.5">GS Madrasati</span>
                         </div>
                       </div>

                       {/* Direction or director profile */}
                       <div className="space-y-10 text-right">
                         <span className="font-bold text-slate-700 uppercase text-[9px] block text-center">La Direction</span>
                         <p className="text-center font-bold text-slate-900 text-[9px]">Le Directeur Pédagogique</p>
                         <p className="text-[8px] text-black text-center font-mono">Signature électronique</p>
                       </div>

                     </div>

                     {/* Outer legal tag */}
                     <p className="text-[7.5px] text-black text-center mt-6 uppercase tracking-wider font-semibold">
                       Ce bulletin de notes est certifié conforme au règlement officiel de l'Établissement.
                     </p>
                   </div>

                 </div>

               </div>

             </div>
           </div>
         );
      })()}
    </div>
  );
}
