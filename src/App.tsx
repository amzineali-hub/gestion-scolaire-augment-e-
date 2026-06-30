import { useState, useEffect } from "react";
import defaultLogo from "./assets/images/school_logo_academia_1781715806486.jpg";
import { 
  Subject, 
  Class, 
  Student, 
  Teacher, 
  ScheduleItem, 
  Invoice,
  AttendanceRecord
} from "./types";
import { 
  INITIAL_SUBJECTS, 
  INITIAL_CLASSES, 
  INITIAL_TEACHERS, 
  INITIAL_STUDENTS, 
  INITIAL_SCHEDULES, 
  INITIAL_INVOICES 
} from "./data";

// Import modules
import Dashboard from "./components/Dashboard";
import StudentManager from "./components/StudentManager";
import BulletinsManager from "./components/BulletinsManager";
import TeacherManager from "./components/TeacherManager";
import ClassCourseManager from "./components/ClassCourseManager";
import SchedulePlanner from "./components/SchedulePlanner";
import FinanceManager from "./components/FinanceManager";
import SettingsManager from "./components/SettingsManager";
import Communicator from "./components/Communicator";
import AttendanceManager from "./components/AttendanceManager";
import { translations } from "./translations";
import { useAuth } from "./AuthContext";
import { useFirebaseData } from "./hooks/useFirebaseData";
import { RoleGuard } from "./components/RoleGuard";
import Auth from "./components/Auth";
import SchoolSetupCard from "./components/SchoolSetupCard";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Icons
import { 
  School,
  Users, 
  GraduationCap, 
  Calendar, 
  DollarSign, 
  LayoutDashboard, 
  Settings, 
  Globe, 
  ChevronRight,
  Menu,
  X,
  MessageSquare,
  LogOut,
  QrCode,
  Cloud,
  Search,
  Compass,
  FileText
} from "lucide-react";

// Programmatic generators for 500 Moroccan students and 50 teachers
const generateMoroccanStudents = (baseStudents: Student[]): Student[] => {
  const boys = ["Amine", "Omar", "Mehdi", "Reda", "Saad", "Youssef", "Tarik", "Hamza", "Karim", "Anass", "Othmane", "Zakaria", "Ayoub", "Walid", "Elias", "Sami", "Yassine"];
  const girls = ["Yasmine", "Ghita", "Sofia", "Kawtar", "Salma", "Malak", "Douae", "Lina", "Rim", "Aya", "Hiba", "Rania", "Kenza", "Ines", "Sarah"];
  const lastNames = ["Alami", "Cherkaoui", "Filali", "Kadiri", "Bennani", "El Idrissi", "Belkhayat", "Slaoui", "Bouazzaoui", "Tazi", "Berrada", "Mansouri", "Chraibi", "Daoudi", "Senhaji", "Fassi", "Guessous"];
  
  const result = [...baseStudents];
  const classes = ["cls-1", "cls-2", "cls-3", "cls-4", "cls-5", "cls-6"];
  
  let counter = result.length + 1;
  while (result.length < 500) {
    const isGirl = Math.random() > 0.5;
    const firstName = isGirl ? girls[Math.floor(Math.random() * girls.length)] : boys[Math.floor(Math.random() * boys.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const classId = classes[Math.floor(Math.random() * classes.length)];
    const parentFirstName = boys[Math.floor(Math.random() * boys.length)];
    const status = Math.random() > 0.08 ? "actif" : (Math.random() > 0.5 ? "suspendu" : "archivé");
    
    // Services options
    const transportOption = Math.random() > 0.65;
    const canteenOption = Math.random() > 0.55;
    const tutoringOption = Math.random() > 0.75;
    const sportOption = Math.random() > 0.8;
    const smsOption = Math.random() > 0.45;
    const insuranceOption = Math.random() > 0.35;

    const possibleMissingDocs = ["Certificat médical", "Photos d'identité", "Extrait d'acte de naissance", "Livret de santé", "Attestation de scolarité précédente"];
    const missingDocuments: string[] = [];
    if (Math.random() > 0.85) {
      const numDocs = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numDocs; i++) {
        const doc = possibleMissingDocs[Math.floor(Math.random() * possibleMissingDocs.length)];
        if (!missingDocuments.includes(doc)) missingDocuments.push(doc);
      }
    }

    // outstandingBalance for status
    let outstandingBalance = 0;
    if (status === "suspendu") {
      outstandingBalance = Math.random() > 0.5 ? 4800 : 2200;
    } else if (status === "actif") {
      outstandingBalance = Math.random() > 0.9 ? 2400 : 0;
    }

    result.push({
      id: `std-gen-${counter}`,
      firstName,
      lastName,
      classId,
      parentName: `${parentFirstName} ${lastName}`,
      parentPhone: `06${Math.floor(10000000 + Math.random() * 90000000)}`,
      parentEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
      registrationDate: `2025-09-${String(Math.floor(Math.random() * 20) + 1).padStart(2, "0")}`,
      status,
      outstandingBalance,
      transportOption,
      canteenOption,
      tutoringOption,
      sportOption,
      smsOption,
      insuranceOption,
      missingDocuments: missingDocuments.length > 0 ? missingDocuments : undefined
    });
    counter++;
  }
  return result;
};

const generateMoroccanTeachers = (baseTeachers: Teacher[]): Teacher[] => {
  const firstNames = ["Abdelilah", "Nadia", "Rachid", "Fatima-Zahra", "Khalid", "Mohamed", "Hassan", "Samira", "Khadija", "Mustapha", "Naoual", "Youssef", "Meryem", "Latifa", "Said", "Adil", "Amal", "Brahim", "Jamal", "Noureddine", "Karim", "Zouhair", "Asmae", "Fouad"];
  const lastNames = ["El Amrani", "Benjelloun", "Tazi", "Bensouda", "Alaoui", "Mansouri", "Slaoui", "El Idrissi", "Berrada", "Cherkaoui", "Kadiri", "Bennani", "Filali", "Alami", "Fassi", "Chraibi", "Guessous", "Mezouar"];
  
  const result = [...baseTeachers];
  const subjects = ["sub-1", "sub-2", "sub-3", "sub-4", "sub-5", "sub-6", "sub-7", "sub-8", "sub-9", "sub-10", "sub-11", "sub-12", "sub-13"];
  const classes = ["cls-1", "cls-2", "cls-3", "cls-4", "cls-5", "cls-6"];
  
  let counter = result.length + 1;
  while (result.length < 50) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    const numSubs = Math.floor(Math.random() * 2) + 1;
    const teacherSubs: string[] = [];
    while (teacherSubs.length < numSubs) {
      const sub = subjects[Math.floor(Math.random() * subjects.length)];
      if (!teacherSubs.includes(sub)) teacherSubs.push(sub);
    }

    const numClasses = Math.floor(Math.random() * 2) + 1;
    const teacherClasses: string[] = [];
    while (teacherClasses.length < numClasses) {
      const cls = classes[Math.floor(Math.random() * classes.length)];
      if (!teacherClasses.includes(cls)) teacherClasses.push(cls);
    }

    const salaryType = Math.random() > 0.2 ? "mensuel" : "horaire";
    const salaryValue = salaryType === "mensuel" 
      ? Math.floor(7000 + Math.random() * 3500) 
      : Math.floor(150 + Math.random() * 80);

    result.push({
      id: `tch-gen-${counter}`,
      firstName,
      lastName,
      email: `${firstName.charAt(0).toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, "")}@madrasati.ma`,
      phone: `06${Math.floor(60000000 + Math.random() * 30000000)}`,
      subjectIds: teacherSubs,
      classIds: teacherClasses,
      salaryType,
      salaryValue,
      status: "actif"
    });
    counter++;
  }
  return result;
};

const generateSimulatedInvoices = (students: Student[]): Invoice[] => {
  const result: Invoice[] = [];
  const months = ["Mai 2026", "Juin 2026"];
  const paymentMethods: ("Carte" | "Espèces" | "Chèque" | "Virement")[] = ["Chèque", "Virement", "Espèces", "Carte"];
  
  let counter = 1;
  const numInvoices = 220;
  for (let i = 0; i < numInvoices; i++) {
    const student = students[Math.floor(Math.random() * students.length)];
    const month = months[Math.floor(Math.random() * months.length)];
    
    let amount = 2000;
    if (student.classId === "cls-1") amount = 2200;
    else if (student.classId === "cls-2") amount = 2400;
    else if (student.classId === "cls-3") amount = 2800;
    else if (student.classId === "cls-4") amount = 2700;
    else if (student.classId === "cls-5") amount = 3500;
    else if (student.classId === "cls-6") amount = 3200;

    amount += student.transportOption ? 400 : 0;
    amount += student.canteenOption ? 500 : 0;
    amount += student.tutoringOption ? 300 : 0;
    amount += student.sportOption ? 250 : 0;
    amount += student.smsOption ? 50 : 0;
    amount += student.insuranceOption ? 100 : 0;

    const statusSeed = Math.random();
    const status = statusSeed > 0.45 ? "payé" : (statusSeed > 0.15 ? "impayé" : "retard");
    
    const invoice: Invoice = {
      id: `inv-sim-${counter}-${i}`,
      studentId: student.id,
      month,
      amount,
      dueDate: month === "Mai 2026" ? "2026-05-10" : "2026-06-10",
      status
    };

    if (status === "payé") {
      invoice.paymentDate = month === "Mai 2026" ? "2026-05-08" : "2026-06-07";
      invoice.paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    }

    result.push(invoice);
    counter++;
  }
  return result;
};

const APP_TAGS = [
  { tab: "dashboard", keywords: ["accueil", "tableau de bord", "principal", "statistiques", "stats", "dashboard"], labelFr: "Tableau de bord de l'école", labelAr: "لوحة التحكم", icon: "LayoutDashboard" },
  { tab: "bulletins", keywords: ["bulletin", "bulletins", "note", "notes", "resultats", "évaluation", "examens"], labelFr: "Gestion des Bulletins & Notes", labelAr: "النتائج والامتحانات", icon: "FileText" },
  { tab: "students", keywords: ["eleve", "eleves", "etudiant", "etudiants", "apprenant", "apprenants", "scolarite", "student", "students"], labelFr: "Gestion des Élèves & Inscriptions", labelAr: "إدارة التلاميذ", icon: "Users" },
  { tab: "teachers", keywords: ["prof", "profs", "professeur", "professeurs", "enseignant", "enseignants", "instituteur", "instituteurs", "teacher", "teachers"], labelFr: "Gestion des Enseignants & Spécialités", labelAr: "إدارة الأساتذة", icon: "GraduationCap" },
  { tab: "classes", keywords: ["classe", "classes", "salle", "salles", "cycle", "cycles", "cours", "matiere", "matieres", "niveaux"], labelFr: "Gestion des Classes & Matières", labelAr: "الأقسام والمواد", icon: "School" },
  { tab: "schedules", keywords: ["planning", "plannings", "horaire", "horaires", "emploi du temps", "calendrier", "schedule", "schedules"], labelFr: "Emplois du temps & Horaires", labelAr: "جداول الحصص", icon: "Calendar" },
  { tab: "attendance", keywords: ["presence", "presences", "absence", "absences", "appel", "pointage", "qr code", "presence", "attendance"], labelFr: "Suivi des Absences & Pointages", labelAr: "متابعة الغياب", icon: "QrCode" },
  { tab: "financials", keywords: ["finance", "finances", "facture", "factures", "paiement", "paiements", "frais", "compta", "comptabilite", "invoice", "invoices"], labelFr: "Paiements scolaires & Factures", labelAr: "المالية والفواتير", icon: "DollarSign" },
  { tab: "communicator", keywords: ["communication", "parents", "parent", "message", "messages", "whatsapp", "newsletter", "annonce", "annonces", "communicator"], labelFr: "Annonces & Communication Parentale", labelAr: "التواصل avec les parents", icon: "MessageSquare" },
  { tab: "settings", keywords: ["parametre", "parametres", "configuration", "config", "logo", "profile", "compte", "reglages", "ville", "settings"], labelFr: "Paramètres de l'établissement", labelAr: "الإعدادات", icon: "Settings" }
];

export default function App() {
  // Language switcher state
  const [lang, setLang] = useState<"fr" | "ar">(() => {
    const stored = localStorage.getItem("madrasati_lang");
    return (stored === "ar" || stored === "fr") ? (stored as "fr" | "ar") : "fr";
  });


  const { currentUser, schoolId, schoolName: dbSchoolName, loading: authLoading, logout, userRole, switchRole } = useAuth();
  const { subjects, classes, students, teachers, schedules, invoices, attendance, loadingInitial, actions } = useFirebaseData(schoolId);
  const [schoolName, setSchoolName] = useState(dbSchoolName || "Gestion Scolaire Augmentée");
  const [schoolCity, setSchoolCity] = useState("Casablanca");
  const [regionalAcademy, setRegionalAcademy] = useState("AREF Casablanca-Settat");
  const [bilingualType, setBilingualType] = useState<"bilingue" | "arabe" | "francais">("bilingue");
  const [contactPhone, setContactPhone] = useState("0522123456");
  const [contactEmail, setContactEmail] = useState("contact@arrachad-school.ma");
  const [schoolLogo, setSchoolLogo] = useState(() => localStorage.getItem("madrasati_school_logo") || defaultLogo);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Global search & highlights presets
  const [globalSearchInput, setGlobalSearchInput] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [studentSearchPreset, setStudentSearchPreset] = useState("");
  const [teacherSearchPreset, setTeacherSearchPreset] = useState("");
  const [classSearchPreset, setClassSearchPreset] = useState("");

  // Auto-seed for school-demo if empty to provide an immediate out-of-the-box working visual showcase
  useEffect(() => {
    if (schoolId === "school-demo" && students.length === 0 && !loadingInitial && classes.length === 0 && db) {
      const seedDemoData = async () => {
        try {
          console.log("Starting automatic seed for demo school...");
          // 1. Seed School details
          await setDoc(doc(db, "schools", "school-demo"), {
            name: "Groupe Scolaire Excellence (Démo)",
            city: "Casablanca",
            academy: "AREF Casablanca-Settat",
            bilingualType: "bilingue",
            phone: "0522123456",
            email: "contact@excellence-school.ma",
            createdAt: new Date(),
            subscriptionPlan: "excellence"
          });

          // 2. Seed Subjects
          for (const sub of INITIAL_SUBJECTS) {
            await setDoc(doc(db, "schools", "school-demo", "subjects", sub.id), sub);
          }

          // 3. Seed Classes
          for (const cls of INITIAL_CLASSES) {
            await setDoc(doc(db, "schools", "school-demo", "classes", cls.id), cls);
          }

          // 4. Seed Teachers
          for (const tch of INITIAL_TEACHERS) {
            await setDoc(doc(db, "schools", "school-demo", "teachers", tch.id), tch);
          }

          // 5. Seed Students
          for (const std of INITIAL_STUDENTS) {
            await setDoc(doc(db, "schools", "school-demo", "students", std.id), std);
          }

          // 6. Seed Schedules
          for (const sch of INITIAL_SCHEDULES) {
            await setDoc(doc(db, "schools", "school-demo", "schedules", sch.id), sch);
          }

          // 7. Seed Invoices
          const demoInvoices = generateSimulatedInvoices(INITIAL_STUDENTS);
          for (const inv of demoInvoices) {
            await setDoc(doc(db, "schools", "school-demo", "invoices", inv.id), inv);
          }

          console.log("Demo database successfully seeded!");
        } catch (err) {
          console.error("Error automatic seeding:", err);
        }
      };
      seedDemoData();
    }
  }, [schoolId, students.length, classes.length, loadingInitial]);

  useEffect(() => {
    if (dbSchoolName) setSchoolName(dbSchoolName);
  }, [dbSchoolName]);

  // Fetch complete school details from Firestore
  useEffect(() => {
    if (!schoolId || !db) return;
    const fetchSchoolDetails = async () => {
      try {
        const docRef = doc(db, "schools", schoolId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.name) setSchoolName(data.name);
          if (data.city) setSchoolCity(data.city);
          if (data.academy) setRegionalAcademy(data.academy);
          if (data.bilingualType) setBilingualType(data.bilingualType);
          if (data.phone) setContactPhone(data.phone);
          if (data.email) setContactEmail(data.email);
          if (data.logo) setSchoolLogo(data.logo);
        }
      } catch (err) {
        console.error("Error loading school details in App:", err);
      }
    };
    fetchSchoolDetails();
  }, [schoolId]);

  const handleResetData = () => {
    console.log("Reset is disabled in Firebase mode");
  };

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    // Clear presets when manually changing tabs
    setStudentSearchPreset("");
    setTeacherSearchPreset("");
    setClassSearchPreset("");
  };

  // Global search matching results
  const getSearchResults = () => {
    if (!globalSearchInput.trim()) return { menus: [], students: [], teachers: [], classes: [] };

    // Accent removal and normalization helper to support typo-friendly & native search
    const removeAccents = (str: string) => 
      str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

    const query = removeAccents(globalSearchInput.trim());

    // 1. Match standard navigation Rubriques & Menus
    const matchedMenus = APP_TAGS.filter(tag => 
      tag.keywords.some(kw => removeAccents(kw).includes(query))
    );

    // Limit to 5 results per category for gorgeous, high-performance representation
    const matchedStudents = students.filter(s => 
      removeAccents(`${s.firstName || ""} ${s.lastName || ""}`).includes(query) ||
      (s.phone && removeAccents(s.phone).includes(query)) ||
      (s.id && removeAccents(s.id).includes(query))
    ).slice(0, 5);

    const matchedTeachers = teachers.filter(t => 
      removeAccents(`${t.firstName || ""} ${t.lastName || ""}`).includes(query) ||
      (t.email && removeAccents(t.email).includes(query)) ||
      (t.subjectIds && t.subjectIds.some(subId => {
        const sub = subjects.find(s => s.id === subId);
        return sub && removeAccents(sub.name).includes(query);
      }))
    ).slice(0, 5);

    const matchedClasses = classes.filter(c => 
      (c.name && removeAccents(c.name).includes(query)) || 
      (c.level && removeAccents(c.level).includes(query)) ||
      (c.cycle && removeAccents(c.cycle).includes(query))
    ).slice(0, 5);

    return {
      menus: matchedMenus,
      students: matchedStudents,
      teachers: matchedTeachers,
      classes: matchedClasses
    };
  };

  const searchResults = getSearchResults();
  const hasSearchResults = 
    searchResults.menus.length > 0 || 
    searchResults.students.length > 0 || 
    searchResults.teachers.length > 0 || 
    searchResults.classes.length > 0;

  const t = (key: keyof typeof translations["fr"]) => translations[lang][key] || key;

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse text-indigo-600 font-bold">Chargement de l'espace...</div></div>;
  }

  if (!currentUser) {
    return <Auth lang={lang} />;
  }

  if (!schoolId) {
    return (
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans selection:bg-indigo-150 selection:text-indigo-900 relative">
        {/* Un en-tête simple pour pouvoir se déconnecter de l'espace */}
        <div className="absolute top-4 right-4 sm:right-6">
          <button 
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-black hover:text-rose-600 font-bold px-3.5 py-1.5 sm:py-2 rounded-xl text-xs border border-slate-200 transition-all shadow-sm active:scale-[0.98]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{lang === "fr" ? "Se déconnecter" : "تسجيل الخروج"}</span>
          </button>
        </div>

        {/* Configuration d'établissement */}
        <SchoolSetupCard lang={lang} currentUser={currentUser} />
      </div>
    );
  }

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-150 selection:text-indigo-900 max-w-full overflow-x-hidden">
      
      {/* SaaS Top Header bar */}
      <header className="print:hidden bg-white border-b border-slate-150 h-20 shrink-0 flex items-center justify-between px-2 xs:px-4 sm:px-6 sticky top-0 z-40 max-w-full overflow-hidden">
        <div className="flex items-center gap-1.5 xs:gap-3 shrink-0">
          {/* Logo element */}
          <div className="h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-24 rounded-xl flex items-center justify-center overflow-hidden bg-[#0d2a4a] border border-slate-200/80 shadow-md shrink-0 group relative cursor-pointer transition-all hover:scale-[1.05] active:scale-[0.98] hover:ring-4 hover:ring-indigo-200/50" onClick={() => setActiveTab("settings")} title="Gérer le logo de l'établissement">
            {schoolLogo ? (
              <img 
                src={schoolLogo} 
                alt="Logo École" 
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white font-black text-base xs:text-xl">
                M
              </div>
            )}
          </div>
          <div className="max-w-[130px] xs:max-w-[180px] sm:max-w-md md:max-w-2xl">
            <h1 className="font-extrabold text-slate-850 tracking-tight text-[11px] xs:text-[13px] sm:text-base leading-tight flex flex-wrap items-center gap-1 xs:gap-1.5 font-sans">
              <span className="truncate max-w-[70px] xs:max-w-[110px] sm:max-w-xs md:max-w-md">{schoolName.toUpperCase()}</span> 
              <span className="hidden xs:inline-block text-[9px] sm:text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold border border-indigo-100 uppercase shrink-0">SAAS</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[8px] sm:text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-lg font-black border border-emerald-200/80 shrink-0 shadow-xs">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <Cloud className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                <span className="tracking-wide uppercase">{loadingInitial ? "SYNCHRONISATION..." : "EN LIGNE · SAUVEGARDÉ"}</span>
              </span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-black mt-0.5 font-medium truncate">{t("school_portal")}</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-[200px] xs:max-w-[240px] sm:max-w-md mx-1.5 xs:mx-3 sm:mx-4 min-w-[75px] xs:min-w-[110px] sm:min-w-[200px] md:min-w-[240px] shrink-1">
          <div className="relative">
            <Search className="absolute left-2 sm:left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black" />
            <input
              type="text"
              value={globalSearchInput}
              onChange={(e) => {
                setGlobalSearchInput(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={lang === "fr" ? "Recherche..." : "بحث..."}
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-7 sm:pl-9 pr-6 sm:pr-8 py-1.5 sm:py-2 text-[10px] sm:text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            />
            {globalSearchInput && (
              <button 
                onClick={() => {
                  setGlobalSearchInput("");
                  setIsSearchFocused(false);
                }}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-black hover:text-black font-sans text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Dropdown / Popover Results */}
          {isSearchFocused && globalSearchInput.trim() && (
            <>
              {/* Overlay Backdrop to close search */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsSearchFocused(false)} 
              />
              
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-150 shadow-2xl overflow-hidden z-50 max-h-[480px] overflow-y-auto">
                <div className="p-3 bg-indigo-50/50 border-b border-indigo-50 text-[10px] font-bold text-indigo-700 uppercase tracking-widest flex items-center justify-between">
                  <span>{lang === "fr" ? "Résultats de recherche" : "نتائج البحث"}</span>
                  <span className="bg-indigo-150/50 text-indigo-800 text-[9px] px-1.5 py-0.5 rounded-full font-black">
                    {hasSearchResults ? "MATCH" : "0"}
                  </span>
                </div>

                {!hasSearchResults && (
                  <div className="p-8 text-center text-black text-xs sm:text-sm space-y-1">
                    <p className="font-extrabold text-black">{lang === "fr" ? "Aucun résultat trouvé" : "لا توجد نتائج"}</p>
                    <p className="text-[10px] text-black">"{globalSearchInput}"</p>
                  </div>
                )}

                {hasSearchResults && (
                  <div className="divide-y divide-slate-100">
                    {/* MENUS RESULTS SECTION */}
                    {searchResults.menus.length > 0 && (
                      <div className="p-2.5">
                        <div className="px-2 pb-1.5 text-[9px] font-extrabold tracking-widest text-indigo-600 uppercase flex items-center gap-1">
                          <Compass className="h-3 w-3 animate-pulse" />
                          <span>{lang === "fr" ? "Rubriques & En-têtes" : "الأقسام والميزات"}</span>
                        </div>
                        <div className="space-y-0.5">
                          {searchResults.menus.map(menu => {
                            const IconComponent = (() => {
                              switch (menu.icon) {
                                case "LayoutDashboard": return LayoutDashboard;
                                case "Users": return Users;
                                case "GraduationCap": return GraduationCap;
                                case "School": return School;
                                case "Calendar": return Calendar;
                                case "QrCode": return QrCode;
                                case "DollarSign": return DollarSign;
                                case "MessageSquare": return MessageSquare;
                                case "Settings": return Settings;
                                default: return Compass;
                              }
                            })();

                            return (
                              <button
                                key={menu.tab}
                                onClick={() => {
                                  navigateToTab(menu.tab);
                                  setGlobalSearchInput("");
                                  setIsSearchFocused(false);
                                }}
                                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-indigo-50/50 flex items-center justify-between gap-2.5 transition text-xs group cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold font-sans text-[11px] shrink-0 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <IconComponent className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-850 truncate group-hover:text-indigo-600 transition-colors">
                                      {lang === "fr" ? menu.labelFr : menu.labelAr}
                                    </p>
                                    <p className="text-[10px] text-black truncate">
                                      {lang === "fr" ? "Accéder à l'espace" : "الانتقال إلى القسم"}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[9px] font-bold bg-slate-100 text-black px-1.5 py-0.5 rounded-md border border-slate-200 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition shrink-0">
                                  {lang === "fr" ? "Entrer ➔" : "دخول ➔"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* STUDENTS RESULTS SECTION */}
                    {searchResults.students.length > 0 && (
                      <div className="p-2.5">
                        <div className="px-2 pb-1.5 text-[9px] font-extrabold tracking-widest text-indigo-500 uppercase flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{lang === "fr" ? "Élèves" : "التلاميذ"}</span>
                        </div>
                        <div className="space-y-0.5">
                          {searchResults.students.map(student => {
                            const assignedClass = classes.find(c => c.id === student.classId);
                            return (
                              <button
                                key={student.id}
                                onClick={() => {
                                  // Set target presets to filter within the manager component
                                  setStudentSearchPreset(`${student.firstName} ${student.lastName}`);
                                  navigateToTab("students");
                                  setGlobalSearchInput("");
                                  setIsSearchFocused(false);
                                }}
                                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2.5 transition text-xs group cursor-pointer"
                              >
                                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold font-sans text-[11px] shrink-0 border border-indigo-200/50 group-hover:scale-105 transition-all">
                                  {student.firstName[0]}{student.lastName[0]}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                                    {student.firstName} {student.lastName}
                                  </p>
                                  <p className="text-[10px] text-black truncate font-medium">
                                    {assignedClass ? `${assignedClass.name} · ${assignedClass.cycle}` : "Classe non assignée"}
                                  </p>
                                </div>
                                <span className="text-[9px] font-bold bg-slate-100 text-black px-1.5 py-0.5 rounded-md border border-slate-200 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition shrink-0">
                                  {lang === "fr" ? "Voir" : "عرض"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* TEACHERS RESULTS SECTION */}
                    {searchResults.teachers.length > 0 && (
                      <div className="p-2.5">
                        <div className="px-2 pb-1.5 text-[9px] font-extrabold tracking-widest text-emerald-500 uppercase flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          <span>{lang === "fr" ? "Enseignants" : "الأساتذة"}</span>
                        </div>
                        <div className="space-y-0.5">
                          {searchResults.teachers.map(teacher => {
                            const mainSubjects = teacher.subjectIds
                              .map(id => subjects.find(s => s.id === id)?.name)
                              .filter(Boolean)
                              .join(", ");
                            return (
                              <button
                                key={teacher.id}
                                onClick={() => {
                                  setTeacherSearchPreset(`${teacher.firstName} ${teacher.lastName}`);
                                  navigateToTab("teachers");
                                  setGlobalSearchInput("");
                                  setIsSearchFocused(false);
                                }}
                                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2.5 transition text-xs group cursor-pointer"
                              >
                                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold font-sans text-[11px] shrink-0 border border-emerald-200/50 group-hover:scale-105 transition-all">
                                  {teacher.firstName[0]}{teacher.lastName[0]}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-700 truncate group-hover:text-emerald-700 transition-colors">
                                    M. {teacher.firstName} {teacher.lastName}
                                  </p>
                                  <p className="text-[10px] text-black truncate font-medium">
                                    {mainSubjects || (lang === "fr" ? "Pas de matière assignée" : "لا توجد مادة")}
                                  </p>
                                </div>
                                <span className="text-[9px] font-bold bg-slate-100 text-black px-1.5 py-0.5 rounded-md border border-slate-200 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition shrink-0">
                                  {lang === "fr" ? "Voir" : "عرض"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* CLASSES RESULTS SECTION */}
                    {searchResults.classes.length > 0 && (
                      <div className="p-2.5">
                        <div className="px-2 pb-1.5 text-[9px] font-extrabold tracking-widest text-violet-500 uppercase flex items-center gap-1">
                          <School className="h-3 w-3" />
                          <span>{lang === "fr" ? "Classes & Cycles" : "الأقسام والأسلاك"}</span>
                        </div>
                        <div className="space-y-0.5">
                          {searchResults.classes.map(cls => (
                            <button
                              key={cls.id}
                              onClick={() => {
                                setClassSearchPreset(cls.name);
                                navigateToTab("classes");
                                setGlobalSearchInput("");
                                setIsSearchFocused(false);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2.5 transition text-xs group cursor-pointer"
                            >
                              <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-800 flex items-center justify-center font-bold font-sans text-[11px] shrink-0 border border-violet-200/50 group-hover:scale-105 transition-all">
                                CL
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-700 truncate group-hover:text-violet-700 transition-colors">
                                  {cls.name}
                                </p>
                                <p className="text-[10px] text-black truncate font-medium">
                                  {cls.level} · {cls.room ? `Salle ${cls.room}` : "Sans salle"}
                                </p>
                              </div>
                              <span className="text-[9px] font-bold bg-slate-100 text-black px-1.5 py-0.5 rounded-md border border-slate-200 group-hover:bg-violet-100 group-hover:text-violet-800 transition shrink-0">
                                {lang === "fr" ? "Voir" : "عرض"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Language switcher & Moroccan token info */}
        <div className="hidden lg:flex items-center gap-1.5 md:gap-3 shrink-0">
          
          <div className="flex items-center gap-2 mr-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Rôle:</span>
            <select 
              value={userRole || 'admin'} 
              onChange={(e) => switchRole(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-indigo-700 focus:outline-none cursor-pointer"
            >
              <option value="admin">Admin</option>
              <option value="secretariat">Secrétariat</option>
              <option value="enseignant">Enseignant</option>
            </select>
          </div>

          <button 
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-150 hover:bg-rose-50 transition-all text-xs font-bold text-rose-600 bg-white shadow-sm cursor-pointer z-50 hover:border-rose-200 mr-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Déconnexion</span>
          </button>
    {/* AR/FR selector */}
          <button 
            onClick={() => {
              const next = lang === "fr" ? "ar" : "fr";
              setLang(next);
              localStorage.setItem("madrasati_lang", next);
            }}
            className="flex items-center gap-1 py-1.5 px-2 sm:px-3 rounded-xl border border-slate-150 hover:bg-slate-50 transition-all text-xs font-bold text-slate-700 bg-white shadow-sm cursor-pointer z-50 hover:border-indigo-200"
          >
            <Globe className="h-3.5 w-3.5 text-indigo-600 animate-pulse shrink-0" />
            <span className="font-mono hidden lg:inline">{lang === "fr" ? "العربية (AR)" : "Français (FR)"}</span>
            <span className="font-mono lg:hidden inline">{lang === "fr" ? "AR" : "FR"}</span>
          </button>

          {/* Moroccan flag token & bilingual indicator */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-black font-sans">
              <span>{schoolCity}</span>
              <span className="text-black">|</span>
              <span className="text-emerald-700 font-bold">مدرستي</span>
            </div>
            <span className="text-sm leading-none">🇲🇦</span>
          </div>
        </div>

        {/* Mobile menu trigger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 xs:p-2 text-black hover:bg-slate-100 rounded-xl border border-slate-200 lg:hidden flex items-center justify-center shrink-0 focus:outline-none active:scale-95 transition-all ml-1 bg-white shadow-xs z-50 cursor-pointer"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Main SaaS Workspace */}
      <div className="flex flex-1 relative min-h-0">
        
        {/* Mobile Menu Backdrop Mask */}
        {mobileMenuOpen && (
          <button 
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 w-full h-full text-left cursor-default outline-none animate-fade-in"
            aria-label="Fermer le menu"
          />
        )}

        {/* SIDEBAR NAVIGATION */}
        <nav className={`
          print:hidden
          fixed lg:sticky top-20 h-[calc(100vh-5rem)] z-50 bg-white
          w-64 max-w-[85vw] p-4 flex flex-col justify-between
          transition-transform duration-300 ease-in-out shrink-0 shadow-2xl lg:shadow-none
          ${lang === "ar" 
            ? `right-0 border-l border-slate-150 lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}` 
            : `left-0 border-r border-slate-150 lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`
          }
        `}>
          <div className="space-y-6">
            <span className="text-[10px] font-bold text-black uppercase tracking-widest block px-3 font-display">
              {t("main_menu")}
            </span>

            <div className="space-y-2">
              {/* Dashboard */}
              <button
                onClick={() => navigateToTab("dashboard")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  activeTab === "dashboard" 
                    ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-200/50 scale-[1.02]" 
                    : "text-black hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <LayoutDashboard className="h-4 w-4" /> {t("dashboard")}
                </span>
                <ChevronRight className={`h-3 w-3 opacity-60 transition-transform ${activeTab === "dashboard" ? "translate-x-0.5" : ""}`} />
              </button>

              {/* Bulletins */}
              <button
                onClick={() => navigateToTab("bulletins")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  activeTab === "bulletins" 
                    ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-200/50 scale-[1.02]" 
                    : "text-black hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4" /> Bulletins
                </span>
                <ChevronRight className={`h-3 w-3 opacity-60 transition-transform ${activeTab === "bulletins" ? "translate-x-0.5" : ""}`} />
              </button>

              {/* Students */}
              <button
                onClick={() => navigateToTab("students")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  activeTab === "students" 
                    ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-200/50 scale-[1.02]" 
                    : "text-black hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="h-4 w-4" /> {t("students")} ({students.length})
                </span>
                <ChevronRight className={`h-3 w-3 opacity-60 transition-transform ${activeTab === "students" ? "translate-x-0.5" : ""}`} />
              </button>

              {/* Teachers */}
              <button
                onClick={() => navigateToTab("teachers")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  activeTab === "teachers" 
                    ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-200/50 scale-[1.02]" 
                    : "text-black hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <GraduationCap className="h-4 w-4" /> {t("teachers")} ({teachers.length})
                </span>
                <ChevronRight className={`h-3 w-3 opacity-60 transition-transform ${activeTab === "teachers" ? "translate-x-0.5" : ""}`} />
              </button>

              {/* Classes & Subjects */}
              <button
                onClick={() => navigateToTab("classes")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  activeTab === "classes" 
                    ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-200/50 scale-[1.02]" 
                    : "text-black hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <School className="h-4 w-4" /> {t("classes")}
                </span>
                <ChevronRight className={`h-3 w-3 opacity-60 transition-transform ${activeTab === "classes" ? "translate-x-0.5" : ""}`} />
              </button>

              {/* Schedule */}
              <button
                onClick={() => navigateToTab("schedules")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  activeTab === "schedules" 
                    ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-200/50 scale-[1.02]" 
                    : "text-black hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4" /> {t("schedules")}
                </span>
                <ChevronRight className={`h-3 w-3 opacity-60 transition-transform ${activeTab === "schedules" ? "translate-x-0.5" : ""}`} />
              </button>

              {/* Attendance */}
              <button
                onClick={() => navigateToTab("attendance")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  activeTab === "attendance" 
                    ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-200/50 scale-[1.02]" 
                    : "text-black hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <QrCode className="h-4 w-4" /> {t("attendance")}
                </span>
                <ChevronRight className={`h-3 w-3 opacity-60 transition-transform ${activeTab === "attendance" ? "translate-x-0.5" : ""}`} />
              </button>

              {/* Financials / Invoices */}
              <button
                onClick={() => navigateToTab("financials")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  activeTab === "financials" 
                    ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-200/50 scale-[1.02]" 
                    : "text-black hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <DollarSign className="h-4 w-4" /> {t("financials")}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  activeTab === "financials" 
                    ? "bg-white/20 text-white border-white/20" 
                    : "bg-rose-50 text-rose-700 border-rose-100"
                }`}>
                  {students.filter(s => s.outstandingBalance > 0).length} {t("active_invoices")}
                </span>
              </button>

              {/* Communication Parentale */}
              <button
                onClick={() => navigateToTab("communicator")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  activeTab === "communicator" 
                    ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-200/50 scale-[1.02]" 
                    : "text-black hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <MessageSquare className="h-4 w-4" /> {t("communicator")}
                </span>
                <ChevronRight className={`h-3 w-3 opacity-60 transition-transform ${activeTab === "communicator" ? "translate-x-0.5" : ""}`} />
              </button>

              {/* Options & Config */}
              <button
                onClick={() => navigateToTab("settings")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  activeTab === "settings" 
                    ? "bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-200/50 scale-[1.02]" 
                    : "text-black hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4" /> {t("settings")}
                </span>
                <ChevronRight className={`h-3 w-3 opacity-60 transition-transform ${activeTab === "settings" ? "translate-x-0.5" : ""}`} />
              </button>
            </div>
          </div>

          {/* Quick legal Footer in navigation rail */}
          <div className="space-y-3 mt-4">
            {/* Lang & Logout visible ONLY on mobile/tablets (hidden lg:) */}
            <div className="flex flex-col gap-2 lg:hidden border-t border-slate-150 pt-3">
              
              <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Rôle:</span>
                <select 
                  value={userRole || 'admin'} 
                  onChange={(e) => switchRole(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-indigo-700 focus:outline-none cursor-pointer text-right"
                >
                  <option value="admin">Admin</option>
                  <option value="secretariat">Secrétariat</option>
                  <option value="enseignant">Enseignant</option>
                </select>
              </div>

              <button 
                onClick={() => {
                  const next = lang === "fr" ? "ar" : "fr";
                  setLang(next);
                  localStorage.setItem("madrasati_lang", next);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 text-xs font-extrabold text-slate-700 transition"
              >
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-600 animate-pulse" />
                  {lang === "fr" ? "Changer en Arabe" : "Changer en Français"}
                </span>
                <span className="bg-white px-2 py-0.5 rounded text-[10px] uppercase border font-mono">
                  {lang === "fr" ? "AR" : "FR"}
                </span>
              </button>

              <button 
                onClick={() => logout()}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-rose-150 bg-rose-50/50 hover:bg-rose-100 text-xs font-extrabold text-rose-600 transition"
              >
                <LogOut className="h-4 w-4 text-rose-500 animate-pulse" />
                Déconnexion
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-slate-700 block uppercase">{t("assistance")}</span>
              <p className="text-[9px] text-black mt-1 leading-relaxed">
                {t("assistance_desc")}
              </p>
            </div>
          </div>
        </nav>

        {/* WORKSPACE VIEWPORT */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6 max-w-full lg:max-w-[1500px] mx-auto w-full min-w-0">
          {activeTab === "dashboard" && (
            <Dashboard 
              students={students} 
              teachers={teachers} 
              classes={classes} 
              subjects={subjects} 
              invoices={invoices}
              setActiveTab={navigateToTab}
              lang={lang}
            />
          )}

          {activeTab === "bulletins" && (
            <RoleGuard allowedRoles={['admin', 'secretariat', 'enseignant']}>
              <BulletinsManager 
                students={students} 
                classes={classes} 
                subjects={subjects}
              />
            </RoleGuard>
          )}

          {activeTab === "students" && (
            <RoleGuard allowedRoles={['admin', 'secretariat']}>
              <StudentManager 
                students={students} 
                classes={classes} 
                onAddStudent={actions.addStudent}
                onEditStudent={actions.updateStudent}
                onDeleteStudent={actions.deleteStudent}
                subjects={subjects}
                schoolName={schoolName}
                schoolLogo={schoolLogo}
                contactPhone={contactPhone}
                contactEmail={contactEmail}
                schoolCity={schoolCity}
                regionalAcademy={regionalAcademy}
                initialSearchQuery={studentSearchPreset}
              />
            </RoleGuard>
          )}

          {activeTab === "teachers" && (
            <RoleGuard allowedRoles={['admin', 'secretariat']}>
              <TeacherManager 
                teachers={teachers} 
                subjects={subjects} 
                classes={classes} 
                onAddTeacher={actions.addTeacher}
                onEditTeacher={actions.updateTeacher}
                onDeleteTeacher={actions.deleteTeacher}
                initialSearchQuery={teacherSearchPreset}
              />
            </RoleGuard>
          )}

          {activeTab === "classes" && (
            <RoleGuard allowedRoles={['admin', 'secretariat']}>
              <ClassCourseManager 
                classes={classes}
                subjects={subjects}
                onAddClass={actions.addClass}
                onEditClass={actions.updateClass}
                onDeleteClass={actions.deleteClass}
                onAddSubject={actions.addSubject}
                onEditSubject={actions.updateSubject}
                onDeleteSubject={actions.deleteSubject}
                initialSearchQuery={classSearchPreset}
              />
            </RoleGuard>
          )}

          {activeTab === "schedules" && (
            <RoleGuard allowedRoles={['admin', 'secretariat', 'enseignant']}>
              <SchedulePlanner 
                schedules={schedules}
                classes={classes}
                teachers={teachers}
                subjects={subjects}
                onAddSchedule={actions.addSchedule}
                onDeleteSchedule={actions.deleteSchedule}
              />
            </RoleGuard>
          )}

          {activeTab === "financials" && (
            <RoleGuard allowedRoles={['admin', 'secretariat']}>
              <FinanceManager 
                invoices={invoices}
                students={students}
                classes={classes}
                onAddInvoices={actions.addInvoices}
                onPayInvoice={actions.payInvoice}
                schoolName={schoolName}
                schoolLogo={schoolLogo}
                contactPhone={contactPhone}
                contactEmail={contactEmail}
              />
            </RoleGuard>
          )}

          {activeTab === "attendance" && (
            <RoleGuard allowedRoles={['admin', 'secretariat', 'enseignant']}>
              <AttendanceManager 
                students={students}
                classes={classes}
                attendance={attendance || []}
                schoolName={schoolName}
                actions={actions}
              />
            </RoleGuard>
          )}

          {activeTab === "communicator" && (
            <RoleGuard allowedRoles={['admin', 'secretariat']}>
              <Communicator 
                students={students}
                classes={classes}
                schoolName={schoolName}
              />
            </RoleGuard>
          )}

          {activeTab === "settings" && (
            <RoleGuard allowedRoles={['admin']}>
              <SettingsManager 
                schoolId={schoolId}
                schoolName={schoolName}
                setSchoolName={setSchoolName}
                schoolCity={schoolCity}
                setSchoolCity={setSchoolCity}
                regionalAcademy={regionalAcademy}
                setRegionalAcademy={setRegionalAcademy}
                bilingualType={bilingualType}
                setBilingualType={setBilingualType}
                contactPhone={contactPhone}
                setContactPhone={setContactPhone}
                contactEmail={contactEmail}
                setContactEmail={setContactEmail}
                schoolLogo={schoolLogo}
                setSchoolLogo={setSchoolLogo}
                onResetData={handleResetData}
              />
            </RoleGuard>
          )}
        </main>

      </div>
    </div>
  );
}
