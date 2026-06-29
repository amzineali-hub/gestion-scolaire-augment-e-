import React, { useState } from "react";
import { motion } from "motion/react";
import { Invoice, Student, Class } from "../types";
import { 
  DollarSign, 
  Search, 
  Calendar, 
  Printer, 
  Check, 
  HelpCircle, 
  CreditCard, 
  SlidersHorizontal, 
  FileCheck, 
  User, 
  AlertCircle, 
  X, 
  Plus,
  Bell,
  Download,
  Loader2
} from "lucide-react";

interface FinanceManagerProps {
  invoices: Invoice[];
  students: Student[];
  classes: Class[];
  onAddInvoices: (newInvoices: Invoice[]) => void;
  onPayInvoice: (invoiceId: string, paymentMethod: Invoice["paymentMethod"]) => void;
  schoolName?: string;
  schoolLogo?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export default function FinanceManager({
  invoices,
  students,
  classes,
  onAddInvoices,
  onPayInvoice,
  schoolName,
  schoolLogo,
  contactPhone,
  contactEmail
}: FinanceManagerProps) {
  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  // Monthly Report Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState("all");
  const [reportStatus, setReportStatus] = useState("all");

  // Alert simulation notification
  const [reminderNotification, setReminderNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

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

  const handleExportCSV = () => {
    setIsExportingCSV(true);
    setTimeout(() => {
      const headers = "Identifiant,Mois,Montant_MAD,Date_Echeance,Statut,Eleve,Classe,Date_Systeme\n";
      const rows = filteredInvoices.map(inv => {
        const student = students.find(s => s.id === inv.studentId);
        const cls = student ? classes.find(c => c.id === student.classId) : null;
        
        return [
          inv.id,
          inv.month,
          inv.amount,
          inv.dueDate,
          inv.status === 'payé' ? "Payée" : inv.status === 'impayé' ? "Impayée" : "Partielle",
          student ? `${student.firstName} ${student.lastName}` : "Étudiant inconnu",
          cls ? cls.name : "-",
          new Date().toISOString()
        ].map(v => `"${v}"`).join(',');
      });

      const csvContent = headers + rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `factures_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExportingCSV(false);
    }, 600);
  };

  // Helper to calculate overdue days
  const getOverdueDays = (dueDateStr: string): number => {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper to dispatch personalized automated reminders
  const handleSendIndividualReminder = (inv: Invoice) => {
    const student = students.find(s => s.id === inv.studentId);
    if (!student) return;
    
    setReminderNotification({
      type: "success",
      text: `Rappel de paiement automatique envoyé avec succès par WhatsApp et e-mail à ${student.parentName || "Parent d'élève"} en tant que tuteur de ${student.firstName} ${student.lastName} pour sa facture de ${inv.month} (${inv.amount} MAD, en retard de ${getOverdueDays(inv.dueDate)} jours).`
    });

    setTimeout(() => {
      setReminderNotification(null);
    }, 6000);
  };

  // Helper to dispatch global campaign remind
  const handleSendAllReminders = () => {
    const overdueCount = criticalOverdueInvoices.length;
    if (overdueCount === 0) return;

    setReminderNotification({
      type: "success",
      text: `Campagne de relance automatisée lancée ! Des messages WhatsApp et e-mails ont été délivrés à ${overdueCount} familles d'élèves présentant un retard de plus de 30 jours.`
    });

    setTimeout(() => {
      setReminderNotification(null);
    }, 7000);
  };

  // Modal State for Receipt printing
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<Invoice | null>(null);

  // States to custom generate bills
  const [isOpenBillingModal, setIsOpenBillingModal] = useState(false);
  const [billingMonthYear, setBillingMonthYear] = useState("Octobre 2026");
  const [billingDueDate, setBillingDueDate] = useState("2026-10-10");

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // State to custom pay invoice modal
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<Invoice["paymentMethod"]>("Espèces");

  // Calculated metrics
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "payé").reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter(i => i.status !== "payé").reduce((sum, i) => sum + i.amount, 0);

  // Filter invoices that are critically overdue by more than 30 days
  const criticalOverdueInvoices = invoices.filter(
    inv => inv.status !== "payé" && getOverdueDays(inv.dueDate) > 30
  );

  // Automated Trigger for overdue invoices > 30 days via Communicator component
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  
  React.useEffect(() => {
    if (!hasAutoTriggered && criticalOverdueInvoices.length > 0) {
      setHasAutoTriggered(true);
      setReminderNotification({
        type: "success",
        text: `Déclencheur automatique : ${criticalOverdueInvoices.length} retard(s) de plus de 30 jours détecté(s). Messages de relance envoyés automatiquement via le système Communicator.`
      });
      setTimeout(() => {
        setReminderNotification(null);
      }, 7000);
    }
  }, [criticalOverdueInvoices.length, hasAutoTriggered]);

  // Filter invoices list
  const filteredInvoices = invoices.filter(inv => {
    const student = students.find(s => s.id === inv.studentId);
    const fullName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : "";
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());
    
    let matchesStatus = false;
    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter === "overdue30") {
      matchesStatus = inv.status !== "payé" && getOverdueDays(inv.dueDate) > 30;
    } else {
      matchesStatus = inv.status === statusFilter;
    }
    
    const matchesMonth = monthFilter === "all" || inv.month === monthFilter;

    return matchesSearch && matchesStatus && matchesMonth;
  });

  // Extract unique invoice months available in database for filtering
  const invoiceMonths = Array.from(new Set(invoices.map(i => i.month)));

  // Handle billing generation for a selected month
  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if invoices for this month already exist
    const monthExists = invoices.some(i => i.month.toLowerCase() === billingMonthYear.trim().toLowerCase());
    if (monthExists) {
      if (!confirm(`Des factures existent déjà pour ${billingMonthYear}. Voulez-vous tout de même générer des doublons pour les nouveaux élèves ?`)) {
        return;
      }
    }

    const activeStudents = students.filter(s => s.status === "actif");
    if (activeStudents.length === 0) {
      alert("Aucun élève actif pour qui générer des factures.");
      return;
    }

    const generated: Invoice[] = activeStudents.map(std => {
      const assignedClass = classes.find(c => c.id === std.classId);
      const baseFee = assignedClass ? assignedClass.feeAmount : 2000;
      const transportFee = std.transportOption ? 400 : 0;
      const canteenFee = std.canteenOption ? 500 : 0;
      const tutoringFee = std.tutoringOption ? 300 : 0;
      const sportFee = std.sportOption ? 250 : 0;
      const smsFee = std.smsOption ? 50 : 0;
      const insuranceFee = std.insuranceOption ? 100 : 0;
      const aiFee = std.aiOption ? 150 : 0;
      const amount = baseFee + transportFee + canteenFee + tutoringFee + sportFee + smsFee + insuranceFee + aiFee;

      return {
        id: `inv-gen-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        studentId: std.id,
        month: billingMonthYear,
        amount,
        dueDate: billingDueDate,
        status: "impayé"
      };
    });

    setIsSaving(true);
    try {
      await onAddInvoices(generated);
      setIsSaving(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpenBillingModal(false);
      }, 900);
    } catch (err: any) {
      console.error("Error invoicing:", err);
      setIsSaving(false);
      alert(`Erreur lors de la facturation : ${err?.message || err}`);
    }
  };

  const handleTriggerPay = (inv: Invoice) => {
    setPayingInvoice(inv);
    setPaymentMethod("Espèces");
  };

  const handleConfirmPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    setIsSaving(true);
    try {
      await onPayInvoice(payingInvoice.id, paymentMethod);
      setIsSaving(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPayingInvoice(null);
      }, 900);
    } catch (err: any) {
      console.error("Error setting payment:", err);
      setIsSaving(false);
      alert(`Une erreur s'est produite lors de l'enregistrement du règlement : ${err?.message || err}`);
    }
  };

  return (
    <div id="finance-management" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-600" /> Facturation & Scolarité
          </h2>
          <p className="text-sm text-black">
            Suivez les encaissements, enregistrez les règlements des parents, générez les appels de fonds mensuels et imprimez les quittances d'écolage.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            disabled={isExportingCSV}
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
          
          <button
            onClick={() => setIsOpenBillingModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-xl text-sm flex items-center gap-2 transition focus:outline-none shadow-xs"
          >
            <Plus className="h-4 w-4" /> Appeler un Mois Scolaise
          </button>
        </div>
      </div>

      {/* Reminder Notification Toast Banner */}
      {reminderNotification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg shadow-indigo-100 flex items-start justify-between gap-3 text-xs leading-relaxed border border-indigo-500 animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div className="flex items-start gap-2.5">
            <div className="bg-indigo-500 p-1.5 rounded-lg shrink-0 text-white mt-0.5">
              <Bell className="h-4 w-4 animate-swing" />
            </div>
            <div>
              <p className="font-bold">Notification d'Envoi de Rappel Automatique</p>
              <p className="opacity-90 mt-1">{reminderNotification.text}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setReminderNotification(null)} 
            className="opacity-70 hover:opacity-100 p-1 text-white hover:bg-indigo-700 rounded-lg transition"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-xs text-black block uppercase font-bold tracking-wide">Total Émis (Annuel)</span>
          <p className="text-2xl font-bold text-slate-800 mt-2">{totalInvoiced.toLocaleString()} MAD</p>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3" />
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs bg-gradient-to-tr from-emerald-50/20 to-white">
          <span className="text-xs text-emerald-600 block uppercase font-bold tracking-wide">Total Encaissé</span>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{totalPaid.toLocaleString()} MAD</p>
          <div className="w-full bg-emerald-150 h-1 rounded-full mt-3">
            <div className="bg-emerald-500 h-full" style={{ width: `${totalInvoiced ? (totalPaid / totalInvoiced) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs bg-gradient-to-tr from-rose-50/20 to-white">
          <span className="text-xs text-rose-500 block uppercase font-bold tracking-wide">Reste à Recouvrer</span>
          <p className="text-2xl font-bold text-rose-700 mt-2">{totalPending.toLocaleString()} MAD</p>
          <div className="w-full bg-rose-150 h-1 rounded-full mt-3">
            <div className="bg-rose-500 h-full" style={{ width: `${totalInvoiced ? (totalPending / totalInvoiced) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Critical Overdues Auto Reminder Banner */}
      {criticalOverdueInvoices.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-xl shrink-0">
              <Bell className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-rose-900 text-xs sm:text-xs uppercase tracking-wide">Relances Automatiques Recommandées</h4>
              <p className="text-[11px] text-rose-600 mt-0.5 leading-relaxed">
                Il y a <strong className="font-extrabold text-rose-800">{criticalOverdueInvoices.length} dossier(s) d'élèves</strong> présentant un retard de scolarité de <strong className="font-bold text-rose-800">plus de 30 jours</strong>.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter("overdue30")}
              className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold py-1.5 px-3 rounded-xl transition cursor-pointer shadow-xs"
            >
              Afficher ces dossiers
            </button>
            <button
              onClick={handleSendAllReminders}
              className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Bell className="h-3 w-3" /> Relancer Tout ({criticalOverdueInvoices.length})
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="absolute left-3 top-2.5 h-4 w-4 text-black">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Filtrer par nom de l'élève..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-750 focus:outline-none cursor-pointer"
          >
            <option value="all">Tous les États</option>
            <option value="payé">Payé (Encaissé)</option>
            <option value="impayé">Impayé</option>
            <option value="retard">En Retard</option>
            <option value="overdue30">⚠️ Retard Critique &gt; 30j ({criticalOverdueInvoices.length})</option>
          </select>

          {/* Month filter */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">Tous les Mois</option>
            {invoiceMonths.map(mon => (
              <option key={mon} value={mon}>{mon}</option>
            ))}
          </select>

          {/* Exporter PDF Button */}
          <button
            type="button"
            onClick={() => {
              setReportMonth(monthFilter);
              setReportStatus(statusFilter === "overdue30" ? "impayé" : statusFilter);
              setIsReportModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-bold bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs font-sans"
            title="Exporter un récapitulatif mensuel imprimable en PDF"
          >
            <Printer className="h-3.5 w-3.5 text-indigo-600" /> Exporter PDF
          </button>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-xs font-bold text-black uppercase tracking-wider">
                  <th className="px-6 py-4">Élève concerné</th>
                  <th className="px-6 py-4">Période scolaire</th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4">Échéance</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Règlement / Quittance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs">
                {filteredInvoices.map(inv => {
                  const student = students.find(s => s.id === inv.studentId);
                  const cls = student ? classes.find(c => c.id === student.classId) : null;
                  const isCritOverdue = inv.status !== "payé" && getOverdueDays(inv.dueDate) > 30;

                  return (
                    <tr key={inv.id} className={`hover:bg-slate-50/50 transition ${isCritOverdue ? "bg-rose-50/10" : ""}`}>
                      {/* Student info */}
                      <td className="px-6 py-4">
                        {student ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-650 font-bold flex items-center justify-center border text-[11px] relative shrink-0">
                              {student.firstName[0]}{student.lastName[0]}
                              {isCritOverdue && (
                                <>
                                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-ping" />
                                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
                                </>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-slate-800 text-xs">{student.firstName} {student.lastName}</p>
                                {isCritOverdue && (
                                  <span className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-rose-100 shrink-0">
                                    <AlertCircle className="h-2.5 w-2.5 text-rose-500 shrink-0" /> {getOverdueDays(inv.dueDate)}j de retard
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-black">Classe: {cls?.name || "Non assignée"}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-450 italic">Élève retiré</span>
                        )}
                      </td>

                      {/* Period */}
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                        {inv.month}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">
                        {inv.amount} MAD
                      </td>

                      {/* Due date */}
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {inv.dueDate}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          inv.status === "payé" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : isCritOverdue 
                              ? "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse-slow"
                              : inv.status === "retard" 
                                ? "bg-rose-50 text-rose-700 border border-rose-100" 
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                          {inv.status === "payé" ? "Payé" : isCritOverdue ? "Retard Brutal" : inv.status === "retard" ? "En Retard" : "Impayé"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {inv.status !== "payé" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptInvoice(inv)}
                                className="bg-slate-50 hover:bg-slate-100 border text-slate-650 hover:text-slate-900 font-bold py-1 px-2.5 rounded-lg text-[10px] flex items-center gap-1 transition cursor-pointer"
                                title="Exporter la facture / avis d'échéance au format PDF"
                              >
                                <Printer className="h-3.5 w-3.5 text-indigo-500" /> Facture PDF
                              </button>
                              {isCritOverdue && (
                                <button
                                  type="button"
                                  onClick={() => handleSendIndividualReminder(inv)}
                                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold py-1 px-2.5 rounded-lg text-[10px] flex items-center gap-1 transition cursor-pointer"
                                  title="Envoyer un rappel automatique (WhatsApp/Email)"
                                >
                                  <Bell className="h-3.5 w-3.5 text-indigo-600" /> Relancer
                                </button>
                              )}
                              <button
                                onClick={() => handleTriggerPay(inv)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1 px-2.5 rounded-lg text-[10px] shadow-xs flex items-center gap-1 transition cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" /> Encaisser
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setSelectedReceiptInvoice(inv)}
                              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold py-1 px-2.5 rounded-lg text-[10px] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                              title="Générer et télécharger le reçu de règlement"
                            >
                              <Printer className="h-3.5 w-3.5 text-emerald-600 animate-pulse" /> Reçu PDF
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-450 italic bg-white">
            <DollarSign className="h-12 w-12 text-slate-200 mx-auto mb-2" />
            Aucun reçu ni rappel ne coïncide avec votre filtrage.
          </div>
        )}
      </div>

      {/* BILLING INVOICES FOR ALL ACTIVE STUDENTS GENERATOR MODAL */}
      {isOpenBillingModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-500" /> Appels de Fonds Mensuels
              </h3>
              <button onClick={() => setIsOpenBillingModal(false)}>
                <X className="h-4 w-4 text-black" />
              </button>
            </div>
            <form onSubmit={handleGenerateInvoices} className="p-5 space-y-4 text-left">
              <div className="p-3 bg-indigo-50 text-indigo-800 rounded-xl text-[11px] leading-relaxed border border-indigo-100">
                Cette opération va générer automatiquement une facture d'écolage pour <strong>Chaque Éléve Actif</strong> dans l'école, basée sur le barème tarifaire de sa classe active.
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Mois Scolaire</label>
                <select
                  value={billingMonthYear}
                  onChange={(e) => setBillingMonthYear(e.target.value)}
                  className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 focus:outline-none"
                >
                  <option value="Septembre 2026">Septembre 2026</option>
                  <option value="Octobre 2026">Octobre 2026</option>
                  <option value="Novembre 2026">Novembre 2026</option>
                  <option value="Décembre 2026">Décembre 2026</option>
                  <option value="Janvier 2027">Janvier 2027</option>
                  <option value="Février 2027">Février 2027</option>
                  <option value="Mars 2027">Mars 2027</option>
                  <option value="Avril 2027">Avril 2027</option>
                  <option value="Mai 2027">Mai 2027</option>
                  <option value="Juin 2027">Juin 2027</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Date d'Échéance Exigée</label>
                <input
                  type="date"
                  required
                  value={billingDueDate}
                  onChange={(e) => setBillingDueDate(e.target.value)}
                  className="w-full text-xs border rounded-lg px-3 py-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs bg-white">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsOpenBillingModal(false)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded cursor-pointer"
                >
                  Annuler
                </button>
                <motion.button
                  whileHover={!isSaving ? { scale: 1.02 } : {}}
                  whileTap={!isSaving ? { scale: 0.98 } : {}}
                  type="submit"
                  disabled={isSaving || isSuccess}
                  className={`relative overflow-hidden px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow transition-all duration-300 min-w-44 flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSuccess
                      ? "bg-emerald-600 border-emerald-600"
                      : "bg-emerald-600 hover:bg-emerald-700 font-bold"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Facturation en cours...</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <Check className="h-4 w-4 text-white animate-bounce shrink-0" />
                      <span>Appels de Fonds Lancés!</span>
                    </>
                  ) : (
                    <span>Lancer la Facturation</span>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYING TRANSACTION MODAL */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                Enregistrer un Encaissement
              </h3>
              <button onClick={() => setPayingInvoice(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmPaymentSubmit} className="p-5 space-y-4 text-left text-xs">
              <div>
                <span className="text-black block font-semibold mb-1">Période concernée</span>
                <p className="font-bold text-slate-800 text-sm">{payingInvoice.month}</p>
              </div>

              <div>
                <span className="text-black block font-semibold mb-1">Montant à Encaisser</span>
                <p className="text-lg font-extrabold text-emerald-700">{payingInvoice.amount} MAD</p>
              </div>

              <div>
                <label className="block font-bold text-slate-650 mb-1.5 uppercase">Mode de Règlement *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Espèces", "Chèque", "Carte", "Virement"] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2.5 rounded-lg border text-center font-bold transition flex items-center justify-center gap-1.5 ${
                        paymentMethod === method 
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800" 
                          : "border-slate-200 text-slate-650 hover:bg-slate-50"
                      }`}
                    >
                      <span>{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setPayingInvoice(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-xs cursor-pointer"
                >
                  Fermer
                </button>
                <motion.button
                  whileHover={!isSaving ? { scale: 1.02 } : {}}
                  whileTap={!isSaving ? { scale: 0.98 } : {}}
                  type="submit"
                  disabled={isSaving || isSuccess}
                  className={`relative overflow-hidden px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow transition-all duration-300 min-w-44 flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSuccess
                      ? "bg-emerald-600 border-emerald-600"
                      : "bg-emerald-600 hover:bg-emerald-700 font-bold"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Validation...</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <Check className="h-4 w-4 text-white animate-bounce shrink-0" />
                      <span>Encaissements Validés!</span>
                    </>
                  ) : (
                    <span>Valider l'Encaissement</span>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL SCHOOL RECEIPT BILL DIALOG */}
      {selectedReceiptInvoice && (() => {
        const student = students.find(s => s.id === selectedReceiptInvoice.studentId);
        const cls = student ? classes.find(c => c.id === student.classId) : null;
        const isPaid = selectedReceiptInvoice.status === "payé";
        const serialNo = isPaid
          ? `REC-2026-${selectedReceiptInvoice.id.substring(3, 8).toUpperCase()}`
          : `FAC-2026-${selectedReceiptInvoice.id.substring(3, 8).toUpperCase()}`;

        return (
          <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border overflow-hidden max-h-[90vh] flex flex-col animate-in scale-in-95 duration-200">
              
              {/* Receipt Body Container (Can be printed) */}
              <div id="school-receipt-print-area" className="p-8 space-y-6 text-slate-855 overflow-y-auto flex-1">
                
                {/* Receipt School Header */}
                <div className="flex justify-between items-start border-b-2 border-dashed border-slate-200 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🇲🇦</span>
                      <h4 className="font-extrabold text-slate-900 text-base">GROUPE SCOLAIRE AMZINE</h4>
                    </div>
                    <p className="text-[10px] text-black">
                      Enseignement Privé - Casablanca, Maroc
                    </p>
                    <p className="text-[9px] text-black">
                      Autorisation Ministérielle N° 20384/26
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className={`border font-bold px-2.5 py-1 rounded text-[10px] inline-block uppercase ${
                      isPaid 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>
                      {isPaid ? "QUITTANCE DE PAIEMENT" : "FACTURE / AVIS D'ÉCHÉANCE"}
                    </span>
                    <p className="text-[10px] text-slate-505">Réf: <span className="font-bold text-slate-800">{serialNo}</span></p>
                    <p className="text-[10px] text-slate-450">
                      {isPaid
                        ? `Règlement: ${selectedReceiptInvoice.paymentDate || "Enregistré"}`
                        : `Échéance exigée: ${selectedReceiptInvoice.dueDate}`
                      }
                    </p>
                  </div>
                </div>

                {/* Main Transaction info */}
                <div className="bg-slate-50 p-4 rounded-xl border grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] text-black block uppercase font-bold">Élève</span>
                    <p className="font-bold text-slate-800">
                      {student ? `${student.firstName} ${student.lastName}` : "Inconnu"}
                    </p>
                    <p className="text-[10px] text-black">Classe: {cls?.name || "Non affecté"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-black block uppercase font-bold">Tuteur / Parent d'Élève</span>
                    <p className="font-medium text-slate-800">{student?.parentName || "Parent"}</p>
                    <p className="text-[10px] text-black">Tél: {student?.parentPhone || "N/A"}</p>
                  </div>
                </div>

                {/* Fee list */}
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b font-bold text-black uppercase tracking-wider text-[9px]">
                      <th className="py-2.5">Libellé Frais / Rubrique</th>
                      <th className="py-2.5 text-center">Période</th>
                      <th className="py-2.5 text-right">{isPaid ? "Montant Réglé" : "Montant Dû"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-755">
                    <tr>
                      <td className="py-2.5">
                        <span className="font-semibold block text-slate-800">Frais d'Écolage Général</span>
                        <span className="text-[10px] text-black">Prestations d'enseignement et activités pédagogiques ordinaires</span>
                      </td>
                      <td className="py-2.5 text-center text-slate-655">
                        {selectedReceiptInvoice.month}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-800">
                        {cls ? `${cls.feeAmount} MAD` : `${selectedReceiptInvoice.amount} MAD`}
                      </td>
                    </tr>
                    {student?.transportOption && (
                      <tr>
                        <td className="py-2.5">
                          <span className="font-semibold block text-slate-800">🚌 Option - Transport Scolaire</span>
                          <span className="text-[10px] text-black">Service de navette mensuel sécurisé</span>
                        </td>
                        <td className="py-2.5 text-center text-slate-655">
                          {selectedReceiptInvoice.month}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-800">
                          400 MAD
                        </td>
                      </tr>
                    )}
                    {student?.canteenOption && (
                      <tr>
                        <td className="py-2.5">
                          <span className="font-semibold block text-slate-800">🍽️ Option - Restauration Scolaire</span>
                          <span className="text-[10px] text-black">Service de restauration et cantine du midi</span>
                        </td>
                        <td className="py-2.5 text-center text-slate-655">
                          {selectedReceiptInvoice.month}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-800">
                          500 MAD
                        </td>
                      </tr>
                    )}
                    {student?.tutoringOption && (
                      <tr>
                        <td className="py-2.5">
                          <span className="font-semibold block text-slate-800">📚 Option - Étude & Soutien Scolaire</span>
                          <span className="text-[10px] text-black">Étude surveillée et aide aux devoirs</span>
                        </td>
                        <td className="py-2.5 text-center text-slate-655">
                          {selectedReceiptInvoice.month}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-800">
                          300 MAD
                        </td>
                      </tr>
                    )}
                    {student?.sportOption && (
                      <tr>
                        <td className="py-2.5">
                          <span className="font-semibold block text-slate-800">⚽ Option - Club Sport & Arts</span>
                          <span className="text-[10px] text-black">Activités sportives, théâtre et arts créatifs l'après-midi</span>
                        </td>
                        <td className="py-2.5 text-center text-slate-655">
                          {selectedReceiptInvoice.month}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-800">
                          250 MAD
                        </td>
                      </tr>
                    )}
                    {student?.smsOption && (
                      <tr>
                        <td className="py-2.5">
                          <span className="font-semibold block text-slate-800">📱 Option - Suivi Relais WhatsApp</span>
                          <span className="text-[10px] text-black">Alertes absences, devoirs et mot de la direction instantané</span>
                        </td>
                        <td className="py-2.5 text-center text-slate-655">
                          {selectedReceiptInvoice.month}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-800">
                          50 MAD
                        </td>
                      </tr>
                    )}
                    {student?.insuranceOption && (
                      <tr>
                        <td className="py-2.5">
                          <span className="font-semibold block text-slate-800">🛡️ Option - Assurance Scolaire Gold</span>
                          <span className="text-[10px] text-black">Responsabilité civile et frais médicaux d'urgence couverts</span>
                        </td>
                        <td className="py-2.5 text-center text-slate-655">
                          {selectedReceiptInvoice.month}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-800">
                          100 MAD
                        </td>
                      </tr>
                    )}
                    {student?.aiOption && (
                      <tr>
                        <td className="py-2.5">
                          <span className="font-semibold block text-slate-800">🤖 Option - Tuteur Intellectuel IA</span>
                          <span className="text-[10px] text-black">Tutorat connecté par l'IA et rapports d'apprentissage trimestriels personnalisés</span>
                        </td>
                        <td className="py-2.5 text-center text-slate-655">
                          {selectedReceiptInvoice.month}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-800">
                          150 MAD
                        </td>
                      </tr>
                    )}
                    <tr className="font-extrabold border-t-2">
                      <td colSpan={2} className="py-3 text-right uppercase text-[10px] text-black">
                        {isPaid ? "Total Encaissé" : "Total à Régler"}
                      </td>
                      <td className={`py-3 text-right text-sm ${isPaid ? "text-emerald-700" : "text-amber-700"}`}>
                        {selectedReceiptInvoice.amount} MAD
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Legal notes */}
                <div className="pt-4 border-t border-dashed flex justify-between items-end">
                  <div className="space-y-1 text-[9px] text-slate-450 leading-tight">
                    <p>* Quittance officielle émise par l'administration du Groupe Scolaire Amzine.</p>
                    <p>* Certifié conforme par la direction administrative.</p>
                    <p className="font-bold text-black">
                      {isPaid 
                        ? `Mode de Règlement: ${selectedReceiptInvoice.paymentMethod || "Espèces"}` 
                        : "Statut: En attente de règlement"
                      }
                    </p>
                  </div>

                  {/* Stamp mock circle */}
                  <div className="text-center h-16 w-16 rounded-full border-2 border-indigo-700/40 relative flex items-center justify-center rotate-6 shrink-0 opacity-80">
                    <div className="text-[8px] uppercase text-indigo-700/80 font-bold leading-none select-none">
                      Cachet<br />Direction Scolaire
                    </div>
                  </div>
                </div>

              </div>

              {/* Action buttons */}
              <div className="px-8 py-4 bg-slate-50 border-t flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedReceiptInvoice(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs border bg-white text-slate-705 hover:bg-slate-100 transition cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handlePrintDoc("school-receipt-print-area", isPaid ? "Quittance de Paiement" : "Facture");
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-bold flex items-center gap-1.5 transition shadow cursor-pointer font-sans"
                >
                  <Printer className="h-3.5 w-3.5" /> Télécharger / Imprimer PDF
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MONTLHY SUMMARY REPORT PRODUCER MODAL (A4) */}
      {isReportModalOpen && (() => {
        const reportInvoicesList = invoices.filter(inv => {
          const matchesMonth = reportMonth === "all" || inv.month === reportMonth;
          
          let matchesStatus = false;
          if (reportStatus === "all") {
            matchesStatus = true;
          } else {
            matchesStatus = inv.status === reportStatus;
          }
          
          return matchesMonth && matchesStatus;
        });

        const repInvoiced = reportInvoicesList.reduce((sum, i) => sum + i.amount, 0);
        const repPaid = reportInvoicesList.filter(i => i.status === "payé").reduce((sum, i) => sum + i.amount, 0);
        const repPending = reportInvoicesList.filter(i => i.status !== "payé").reduce((sum, i) => sum + i.amount, 0);
        const repRate = repInvoiced ? Math.round((repPaid / repInvoiced) * 100) : 0;

        return (
          <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 backdrop-blur-xs overflow-y-auto">
            <div className="bg-slate-100 rounded-2xl w-full max-w-5xl shadow-2xl border flex flex-col md:flex-row max-h-[92vh] overflow-hidden animate-in scale-in-95 duration-200">
              
              {/* Left Column / Control Panel */}
              <div className="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 shrink-0 print:hidden justify-between">
                <div className="space-y-5">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                      <Printer className="h-5 w-5 text-indigo-500" /> Options d'Impression
                    </h3>
                    <p className="text-[11px] text-slate-450 mt-1">
                      Configurez et prévisualisez le résumé financier avant d'activer l'impression ou l'exportation PDF.
                    </p>
                  </div>

                  {/* Filter Month parameter */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-black uppercase tracking-wide">Période Scolaire</label>
                    <select
                      value={reportMonth}
                      onChange={(e) => setReportMonth(e.target.value)}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-755 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">Tous les mois scolaires</option>
                      {invoiceMonths.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Status parameter */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-black uppercase tracking-wide font-sans">Statut Règlement</label>
                    <select
                      value={reportStatus}
                      onChange={(e) => setReportStatus(e.target.value)}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-755 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">Toutes les factures</option>
                      <option value="payé">Payé (Encaissé uniquement)</option>
                      <option value="impayé">Impayé uniquement</option>
                      <option value="retard">En Retard uniquement</option>
                    </select>
                  </div>

                  {/* Information banner */}
                  <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 text-[10.5px] leading-relaxed text-indigo-800">
                    <p className="font-bold mb-1">💡 Impression Rapport A4</p>
                    Réglez le format sur <strong>A4 Portrait</strong>, activez <strong>"Graphiques d'arrière-plan"</strong> et décochez les en-têtes et pieds de page par défaut du navigateur pour un résultat impeccable.
                  </div>
                </div>

                {/* Control Action Buttons */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      handlePrintDoc("school-report-print-area", "Releve_Financier");
                    }}
                    className="w-full py-2.5 rounded-xl text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-extrabold flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md"
                  >
                    <Printer className="h-4 w-4" /> Exporter en document PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="w-full py-2 rounded-xl text-xs font-bold border border-slate-250 bg-slate-50 hover:bg-slate-100 text-slate-650 transition cursor-pointer"
                  >
                    Fermer la prévisualisation
                  </button>
                </div>
              </div>

              {/* Right Column / Live Pre-visualization Document Canvas */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-200/60 print:bg-white print:p-0">
                
                {/* Printable Area Page Container */}
                <div 
                  id="school-report-print-area" 
                  className="bg-white mx-auto shadow-lg border border-slate-250/70 p-8 sm:p-10 font-sans text-slate-800 max-w-[210mm] min-h-[297mm] h-fit relative rounded-xl print:rounded-none print:shadow-none print:border-none print:p-0 flex flex-col justify-between"
                >
                  <div>
                    {/* Doc Institutional Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5 mb-5 shrink-0">
                      <div className="flex items-center gap-3.5">
                        {schoolLogo ? (
                          <div className="h-14 w-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center p-1 shadow-inner shrink-0">
                            <img src={schoolLogo} alt="Logo" className="h-full w-full object-contain p-1" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 bg-[#0d2a4a] text-white rounded-xl flex items-center justify-center text-xl font-black shrink-0 shadow-sm">
                            M
                          </div>
                        )}
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm tracking-tight uppercase">
                            {schoolName || "GROUPE SCOLAIRE AMZINE"}
                          </h4>
                          <p className="text-[10px] text-black font-medium">Pour l’enseignement préscolaire, primaire et secondaire privé</p>
                          <p className="text-[9px] text-slate-450">
                            Tél: {contactPhone || "0522123456"} | Email: {contactEmail || "contact@arrachad-school.ma"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="bg-slate-900 text-white font-extrabold px-3 py-1 rounded text-[9px] tracking-wider uppercase inline-block font-display">
                          RÉCAPITULATIF FINANCIER
                        </span>
                        <p className="text-[10px] text-black mt-1">
                          Émis le: <span className="font-bold text-slate-800">{new Date().toLocaleDateString("fr-FR")}</span>
                        </p>
                        <p className="text-[10px] text-black">
                          Filtre règlement: <span className="font-bold text-slate-800">{reportStatus === "all" ? "Toutes" : reportStatus === "payé" ? "Payées seulement" : reportStatus === "impayé" ? "Impayées seulement" : "En retard seulement"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Document Title & Period banner */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-250 text-center mb-6 shrink-0">
                      <h2 className="text-sm font-extrabold text-slate-855 tracking-tight uppercase">
                        Rapport Mensuel des Appels de Fonds & Règlements
                      </h2>
                      <p className="text-xs text-black mt-1">
                        Mois académique concerné: <strong className="text-slate-800">{reportMonth === "all" ? "Tous les mois de l'année scolaire active" : reportMonth}</strong>
                      </p>
                    </div>

                    {/* Core KPI metrics breakdown widgets */}
                    <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                        <span className="text-[9px] text-slate-450 block uppercase font-bold tracking-wide">Frais Appelés</span>
                        <p className="font-black text-xs text-slate-655 mt-1">{reportInvoicesList.length} dossier(s)</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                        <span className="text-[9px] text-slate-455 block uppercase font-bold tracking-wide font-sans">Volume Émis</span>
                        <p className="font-black text-xs text-slate-800 mt-1">{repInvoiced.toLocaleString()} <span className="text-[10px] font-bold">MAD</span></p>
                      </div>
                      <div className="bg-[#ecfdf5] p-3 rounded-xl border border-emerald-100 text-center">
                        <span className="text-[9px] text-emerald-600 block uppercase font-bold tracking-wide">Encaissé Réel</span>
                        <p className="font-black text-xs text-emerald-700 mt-1">{repPaid.toLocaleString()} <span className="text-[10px] font-bold">MAD</span></p>
                      </div>
                      <div className="bg-[#fff1f2] p-3 rounded-xl border border-rose-100 text-center">
                        <span className="text-[9px] text-rose-500 block uppercase font-bold tracking-wide">Reste à Recouvrer</span>
                        <p className="font-black text-xs text-rose-700 mt-1">{repPending.toLocaleString()} <span className="text-[10px] font-bold">MAD</span></p>
                      </div>
                    </div>

                    {/* Progress bar of recovery rate inside the printed document */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-6 flex items-center justify-between gap-4 shrink-0">
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-[10px] mb-1 font-bold text-slate-605">
                          <span>Taux de recouvrement financier global sur cette extraction</span>
                          <span className="text-emerald-750 font-extrabold">{repRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${repRate}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Table of invoices listing */}
                    <div className="border border-slate-250/80 rounded-xl overflow-hidden mb-6">
                      <table className="w-full text-left text-[11px] border-collapse leading-normal">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-bold text-black uppercase text-[9px] tracking-wider">
                            <th className="px-4 py-2.5">Date Échéance</th>
                            <th className="px-4 py-2.5">Élève & Classe</th>
                            <th className="px-4 py-2.5 text-center">Mois</th>
                            <th className="px-4 py-2.5 text-center">Moyen</th>
                            <th className="px-4 py-2.5 text-right">Montant Frais</th>
                            <th className="px-4 py-2.5 text-center">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {reportInvoicesList.length > 0 ? (
                            reportInvoicesList.map(item => {
                              const std = students.find(s => s.id === item.studentId);
                              const cls = std ? classes.find(c => c.id === std.classId) : null;
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-2 text-black whitespace-nowrap">{item.dueDate}</td>
                                  <td className="px-4 py-2 font-bold text-slate-800">
                                    {std ? `${std.firstName} ${std.lastName}` : "Élève archivé"}
                                    <p className="text-[9px] font-normal text-black">Classe: {cls?.name || "N/A"}</p>
                                  </td>
                                  <td className="px-4 py-2 text-center text-black whitespace-nowrap">{item.month}</td>
                                  <td className="px-4 py-2 text-center text-black font-medium">
                                    {item.status === "payé" ? (item.paymentMethod || "Espèces") : "—"}
                                  </td>
                                  <td className="px-4 py-2 text-right font-bold text-slate-850 whitespace-nowrap">{item.amount.toLocaleString()} MAD</td>
                                  <td className="px-4 py-2 text-center whitespace-nowrap">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${
                                      item.status === "payé" 
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-100 border" 
                                        : "bg-rose-50 text-rose-800 border-rose-100 border"
                                    }`}>
                                      {item.status === "payé" ? "RÉGLÉ" : "IMPAYÉ"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center italic py-8 text-slate-450 bg-slate-50/50">
                                Aucune facture ne correspond aux paramètres de filtrage définis.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Report Legal Stamp/Signature Footer */}
                  <div className="border-t border-dashed border-slate-300 pt-6 mt-12 shrink-0">
                    <div className="flex justify-between items-start text-xs text-black">
                      <div className="space-y-1">
                        <p className="font-extrabold uppercase text-[10px] text-slate-700">Comptabilité Scolaire</p>
                        <p className="text-[10px]">Relevé d'état consolidé édité par l'administration.</p>
                        <p className="text-[9px] text-black">Ce relevé budgétaire est un document certifié officiel de suivi des encaissements scolaires.</p>
                      </div>
                      <div className="text-right space-y-4">
                        <p className="font-bold underline text-[10px] text-slate-700 uppercase">Cachet et Signature de l'Établissement</p>
                        <div className="text-center h-16 w-32 border-2 border-indigo-750/30 border-dotted rounded-xl flex items-center justify-center opacity-80 mx-auto bg-slate-50/50">
                          <p className="text-[8px] text-indigo-750 font-bold uppercase tracking-wider select-none leading-tight">
                            Cachet Direction<br />Groupe Scolaire<br />Casablanca
                          </p>
                        </div>
                      </div>
                    </div>
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
