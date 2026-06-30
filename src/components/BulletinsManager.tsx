import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Student, Class, Subject } from "../types";
import { 
  Users, 
  Search, 
  X,
  FileText,
  Download,
  Loader2,
  GraduationCap,
  Mail,
  Filter
} from "lucide-react";
import defaultLogo from "../assets/images/school_logo_academia_1781715806486.jpg";

interface BulletinsManagerProps {
  students: Student[];
  classes: Class[];
  subjects: Subject[];
}

const BulletinsManager: React.FC<BulletinsManagerProps> = ({ students, classes, subjects }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");

  const [selectedStudentForBulletin, setSelectedStudentForBulletin] = useState<Student | null>(null);
  const [bulletinSemester, setBulletinSemester] = useState("1er Trimestre");
  const [bulletinAcademicYear, setBulletinAcademicYear] = useState("2026/2027");
  const [gradeRecords, setGradeRecords] = useState<{ id: string; name: string; cc: number; exam: number; coeff: number }[]>([]);
  
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{success: boolean, message: string} | null>(null);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesClass = selectedClassFilter === "all" || student.classId === selectedClassFilter;
      
      // Only active students usually get bulletins
      const matchesStatus = student.status === "actif";

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, searchQuery, selectedClassFilter]);

  const handleOpenBulletinModal = (student: Student) => {
    setSelectedStudentForBulletin(student);
    
    // Auto-populate subjects based on student cycle
    const studentClass = classes.find(c => c.id === student.classId);
    if (studentClass) {
      const cycleSubjects = subjects.filter(s => s.cycle === studentClass.cycle);
      const initialGrades = cycleSubjects.map(sub => ({
        id: sub.id,
        name: sub.name,
        cc: Math.floor(Math.random() * 8) + 12, // mock data 12-20
        exam: Math.floor(Math.random() * 8) + 12,
        coeff: sub.hoursPerWeek > 3 ? 3 : (sub.hoursPerWeek > 1 ? 2 : 1)
      }));
      setGradeRecords(initialGrades);
    } else {
      setGradeRecords([]);
    }
  };

  const handleUpdateGrade = (id: string, field: 'cc' | 'exam' | 'coeff', value: string) => {
    const numValue = parseFloat(value) || 0;
    setGradeRecords(prev => prev.map(rec => rec.id === id ? { ...rec, [field]: numValue > 20 ? 20 : (numValue < 0 ? 0 : numValue) } : rec));
  };

  const handleSendBulletinEmail = async () => {
    if (!selectedStudentForBulletin || !selectedStudentForBulletin.parentEmail) {
       setEmailResult({ success: false, message: 'Email du parent manquant.' });
       setTimeout(() => setEmailResult(null), 3000);
       return;
    }
    
    setIsSendingEmail(true);
    setEmailResult(null);

    try {
      const response = await fetch('/api/email/send-bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedStudentForBulletin.parentEmail,
          studentName: `${selectedStudentForBulletin.firstName} ${selectedStudentForBulletin.lastName}`,
          term: bulletinSemester,
          academicYear: bulletinAcademicYear,
          grades: gradeRecords.map(rec => ({
             subject: rec.name,
             value: ((rec.cc + rec.exam) / 2).toFixed(2)
          }))
        })
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         const text = await response.text();
         console.error("Server returned non-JSON:", text.substring(0, 100));
         setEmailResult({ success: false, message: 'La session a expiré ou le serveur est indisponible. Veuillez rafraîchir la page.' });
         return;
      }
      
      if (!response.ok) {
         const data = await response.json();
         setEmailResult({ success: false, message: `Erreur ${response.status}: ` + (data.error || 'Erreur serveur') });
         return;
      }
      
      const data = await response.json();
      if (data.success) {
         setEmailResult({ success: true, message: 'Bulletin envoyé par email avec succès !' });
      } else {
         setEmailResult({ success: false, message: 'Erreur: ' + data.error });
      }
    } catch (e: any) {
      console.error(e);
      setEmailResult({ success: false, message: 'Erreur de connexion au serveur.' });
    } finally {
      setIsSendingEmail(false);
      setTimeout(() => setEmailResult(null), 4000);
    }
  };

  const handlePrintDoc = async (elementId: string, title: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    setIsExportingPDF(true);
    try {
      const canvas = await html2canvas(el, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title.replace(/ /g, '_')}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Une erreur est survenue lors de la création du PDF.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const bulletinOverallAverage = gradeRecords.length > 0
    ? (gradeRecords.reduce((acc, rec) => acc + (((rec.cc + rec.exam) / 2) * rec.coeff), 0) / gradeRecords.reduce((acc, rec) => acc + rec.coeff, 0)).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3 tracking-tight">
            <FileText className="h-8 w-8 text-indigo-600 p-1.5 bg-indigo-50 rounded-xl" />
            Édition des Bulletins Scolaires
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Générez, imprimez et envoyez les bulletins de notes de vos élèves.</p>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Rechercher par élève..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-shadow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="relative shrink-0">
            <select
              className="appearance-none pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
            >
              <option value="all">Toutes les Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          </div>
        </div>
      </div>

      {/* STUDENTS LIST SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-extrabold">
                <th className="p-4 rounded-tl-2xl">Nom de l'élève</th>
                <th className="p-4">Classe</th>
                <th className="p-4">Parent</th>
                <th className="p-4 rounded-tr-2xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const studentClass = classes.find(c => c.id === student.classId);
                  return (
                    <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-700 font-bold border border-indigo-100/50 shadow-sm shrink-0">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">
                              {student.firstName} {student.lastName}
                            </p>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold mt-1 inline-block">
                              Actif
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{studentClass?.name || 'N/A'}</p>
                        <p className="text-xs text-slate-500 font-medium">{studentClass?.cycle || 'N/A'}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{student.parentName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                          {student.parentEmail || student.parentPhone}
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenBulletinModal(student)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm hover:shadow transition-all text-xs flex items-center gap-2 inline-flex"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Bulletin
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 font-medium">
                    Aucun élève trouvé pour cette sélection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BULLETIN MODAL */}
      {selectedStudentForBulletin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: 10 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-[1200px] flex flex-col max-h-[95vh] border border-slate-200 overflow-hidden"
           >
             <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10 shrink-0">
               <div>
                 <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                   <FileText className="h-5 w-5 text-indigo-600" />
                   Bulletin de {selectedStudentForBulletin.firstName} {selectedStudentForBulletin.lastName}
                 </h2>
                 <p className="text-xs text-slate-500 font-medium mt-0.5">Éditez les notes avant exportation ou envoi direct</p>
               </div>
               <button onClick={() => setSelectedStudentForBulletin(null)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors">
                 <X className="h-5 w-5" />
               </button>
             </div>

             <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
               {/* Left Column: Grade input & Controls */}
               <div className="w-full md:w-96 bg-white border-r border-slate-200 p-5 flex flex-col gap-5 shrink-0 print:hidden overflow-y-auto">
                 <div>
                   <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                     <GraduationCap className="h-5 w-5 text-emerald-600" /> Options du Bulletin
                   </h3>
                   <p className="text-[11px] text-slate-500 mt-1">
                     Modifiez les notes et les coefficients ci-dessous. Le calcul de la moyenne générale se met à jour instantanément.
                   </p>
                 </div>
                 
                 <div className="space-y-3">
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Trimestre/Semestre</label>
                       <input 
                         type="text" 
                         value={bulletinSemester}
                         onChange={(e) => setBulletinSemester(e.target.value)}
                         className="w-full p-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 bg-slate-50"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Année Scolaire</label>
                       <input 
                         type="text" 
                         value={bulletinAcademicYear}
                         onChange={(e) => setBulletinAcademicYear(e.target.value)}
                         className="w-full p-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 bg-slate-50"
                       />
                     </div>
                   </div>
                 </div>

                 <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-1">
                   <div className="grid grid-cols-12 gap-1 px-2 py-2 text-[10px] font-extrabold text-slate-500 uppercase">
                      <div className="col-span-5">Matière</div>
                      <div className="col-span-3 text-center">CC</div>
                      <div className="col-span-3 text-center">Exam</div>
                      <div className="col-span-1 text-center">Cf</div>
                   </div>
                   <div className="space-y-1">
                     {gradeRecords.map(rec => (
                       <div key={rec.id} className="grid grid-cols-12 gap-1 items-center bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">
                         <div className="col-span-5 text-xs font-bold text-slate-700 truncate px-1" title={rec.name}>{rec.name}</div>
                         <div className="col-span-3">
                           <input type="number" min="0" max="20" step="0.5" value={rec.cc} onChange={(e) => handleUpdateGrade(rec.id, 'cc', e.target.value)} className="w-full p-1 text-xs font-bold text-center border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500" />
                         </div>
                         <div className="col-span-3">
                           <input type="number" min="0" max="20" step="0.5" value={rec.exam} onChange={(e) => handleUpdateGrade(rec.id, 'exam', e.target.value)} className="w-full p-1 text-xs font-bold text-center border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500" />
                         </div>
                         <div className="col-span-1">
                           <input type="number" min="1" max="10" value={rec.coeff} onChange={(e) => handleUpdateGrade(rec.id, 'coeff', e.target.value)} className="w-full p-1 text-[10px] font-bold text-center border border-slate-200 rounded-md bg-slate-50" />
                         </div>
                       </div>
                     ))}
                     {gradeRecords.length === 0 && (
                       <div className="p-4 text-center text-xs text-slate-500">Aucune matière configurée pour cette classe.</div>
                     )}
                   </div>
                 </div>

                 <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 shrink-0">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">Moyenne Générale</span>
                     <span className="text-xl font-black text-indigo-600">{bulletinOverallAverage} / 20</span>
                   </div>
                   
                   {emailResult && (
                     <div className={`text-xs font-bold p-3 rounded-xl mb-3 ${emailResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                       {emailResult.message}
                     </div>
                   )}
                   <button
                     type="button"
                     onClick={handleSendBulletinEmail}
                     disabled={isSendingEmail || isExportingPDF}
                     className={`w-full py-2.5 rounded-xl text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-extrabold flex items-center justify-center gap-2 transition shadow-md mb-2 ${isSendingEmail ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                   >
                     {isSendingEmail ? (
                       <>
                         <Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours...
                       </>
                     ) : (
                       <>
                         <Mail className="h-4 w-4" /> Envoyer par Email au Parent
                       </>
                     )}
                   </button>

                   <button
                     type="button"
                     onClick={() => handlePrintDoc('bulletin-preview-content', `Bulletin_${selectedStudentForBulletin.firstName}_${selectedStudentForBulletin.lastName}`)}
                     disabled={isExportingPDF || isSendingEmail}
                     className={`w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${isExportingPDF ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow'}`}
                   >
                     {isExportingPDF ? (
                       <><Loader2 className="h-4 w-4 animate-spin" /> Exportation...</>
                     ) : (
                       <><Download className="h-4 w-4" /> Télécharger PDF</>
                     )}
                   </button>
                 </div>
               </div>

               {/* Right Column: PDF Preview Render Area */}
               <div className="flex-1 bg-slate-200/50 p-4 sm:p-8 overflow-y-auto flex justify-center items-start">
                  <div 
                    id="bulletin-preview-content" 
                    className="bg-white w-[210mm] min-h-[297mm] shadow-xl p-[20mm] relative shrink-0 mx-auto"
                    style={{
                      fontFamily: "'Inter', sans-serif"
                    }}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                      <div className="flex items-center gap-4">
                        <img src={defaultLogo} alt="Logo" className="w-20 h-20 object-contain rounded-xl shadow-sm" />
                        <div>
                          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Groupe Scolaire Excellence</h1>
                          <p className="text-xs text-slate-500 font-medium">Reconnu par le Ministère de l'Éducation Nationale</p>
                          <p className="text-xs text-slate-500 font-medium">Académie de Casablanca-Settat</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-900 uppercase tracking-widest border-2 border-slate-900 px-4 py-2 inline-block shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                          BULLETIN
                        </div>
                        <p className="text-sm font-bold text-slate-700 mt-3 uppercase">{bulletinSemester}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Année {bulletinAcademicYear}</p>
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-200">
                      <div className="grid grid-cols-2 gap-y-3 text-sm">
                        <div>
                          <span className="text-slate-500 font-medium block text-xs">Élève</span>
                          <span className="font-black text-slate-900 text-lg uppercase">{selectedStudentForBulletin.firstName} {selectedStudentForBulletin.lastName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 font-medium block text-xs">Classe</span>
                          <span className="font-extrabold text-slate-800 text-lg">{classes.find(c => c.id === selectedStudentForBulletin.classId)?.name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium block text-xs mt-2">Matricule / Massar</span>
                          <span className="font-bold text-slate-700">M{selectedStudentForBulletin.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 font-medium block text-xs mt-2">Tuteur Légal</span>
                          <span className="font-bold text-slate-700">{selectedStudentForBulletin.parentName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Grades Table */}
                    <table className="w-full border-collapse mb-8 text-sm">
                      <thead>
                        <tr className="bg-slate-800 text-white">
                          <th className="border border-slate-800 p-2 text-left font-bold uppercase text-xs w-[40%]">Matière</th>
                          <th className="border border-slate-800 p-2 text-center font-bold uppercase text-xs">C.C</th>
                          <th className="border border-slate-800 p-2 text-center font-bold uppercase text-xs">Exam</th>
                          <th className="border border-slate-800 p-2 text-center font-bold uppercase text-xs">Moy</th>
                          <th className="border border-slate-800 p-2 text-center font-bold uppercase text-xs">Coef</th>
                          <th className="border border-slate-800 p-2 text-left font-bold uppercase text-xs">Appréciation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gradeRecords.map((rec, idx) => {
                          const avg = (rec.cc + rec.exam) / 2;
                          let appreciation = "Passable";
                          if (avg >= 16) appreciation = "Très Bien";
                          else if (avg >= 14) appreciation = "Bien";
                          else if (avg >= 12) appreciation = "Assez Bien";
                          else if (avg < 10) appreciation = "Insuffisant";

                          return (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                              <td className="border border-slate-300 p-2 font-bold text-slate-800">{rec.name}</td>
                              <td className="border border-slate-300 p-2 text-center text-slate-600">{rec.cc.toFixed(2)}</td>
                              <td className="border border-slate-300 p-2 text-center text-slate-600">{rec.exam.toFixed(2)}</td>
                              <td className="border border-slate-300 p-2 text-center font-bold text-slate-900">{avg.toFixed(2)}</td>
                              <td className="border border-slate-300 p-2 text-center text-slate-500">{rec.coeff}</td>
                              <td className="border border-slate-300 p-2 text-slate-600 italic text-xs">{appreciation}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Summary Footer */}
                    <div className="flex justify-between items-end mt-8 pt-6 border-t-2 border-slate-800">
                      <div className="w-[45%] text-xs text-slate-500 text-justify leading-relaxed">
                        Ce bulletin est un document officiel. Toute rature ou surcharge le rend nul. Conservez l'original avec soin. En cas d'erreur constatée, veuillez vous rapprocher de la direction dans un délai de 7 jours.
                      </div>
                      
                      <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg w-[45%]">
                        <div className="flex justify-between items-center">
                          <span className="text-sm uppercase font-bold tracking-widest text-slate-300">Moyenne Générale</span>
                          <span className="text-2xl font-black">{bulletinOverallAverage}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-600 text-right">
                          <span className="text-xs text-slate-400 block mb-12">Le Directeur / Cachet de l'établissement</span>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
             </div>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default BulletinsManager;
