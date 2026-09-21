import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./immiaccount.css";
import logoHA from "../assets/images/logo-ha.png";

function UserPortal({ initialSection }) {
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const storedUsername = localStorage.getItem("username") || "User";

  const [visas, setVisas] = useState([]);
  const [importedVisas, setImportedVisas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [sortBy, setSortBy] = useState("lastUpdated");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'list'

  // Dropdowns & Modals
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedVisa, setSelectedVisa] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Import form state
  const [importGrantNumber, setImportGrantNumber] = useState("");
  const [importTrn, setImportTrn] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");

  // Advanced filters
  const [advFilters, setAdvFilters] = useState({
    subclass: "",
    trn: "",
    status: "",
  });

  // Section Navigation: 'applications', 'manage-payments', or 'make-payment-section'
  const [activeSection, setActiveSection] = useState(() => {
    if (initialSection) return initialSection;
    if (typeof window !== "undefined" && window.location.pathname.endsWith("/payment")) {
      return "make-payment-section";
    }
    return "applications";
  });

  // Payments State
  const [payments, setPayments] = useState(() => {
    try {
      const saved = localStorage.getItem("au_payments");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse payments from localStorage:", e);
    }
    return [];
  });

  // Format full name as given name + family name (e.g. "Ankit Kumar")
  const formatApplicantFullName = (given, family) => {
    const parts = [given, family].map((s) => (s || "").trim()).filter(Boolean);
    if (parts.length === 0) return "";
    const fullName = parts.join(" ");
    if (fullName === fullName.toLowerCase()) {
      return fullName.replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return fullName;
  };

  // Keep payments in sync when activeSection changes or storage events fire
  useEffect(() => {
    const syncPaymentsFromStorage = () => {
      try {
        const saved = localStorage.getItem("au_payments");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setPayments(parsed);
          }
        }
      } catch (e) {
        console.error("Error syncing payments:", e);
      }
    };

    const fetchPaymentsFromAPI = async () => {
      try {
        const response = await fetch(`${API_URL}/api/payments?origin=au`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const list =
            Array.isArray(data) ? data : data.payments || data.data || [];
          if (list.length > 0) {
            const normalized = list.map((p) => {
              let applicantName = "";
              if (p.givenNames || p.familyName) {
                applicantName = formatApplicantFullName(
                  p.givenNames,
                  p.familyName,
                );
              } else if (
                p.visaId &&
                typeof p.visaId === "object" &&
                (p.visaId.givenNames || p.visaId.familyName)
              ) {
                applicantName = formatApplicantFullName(
                  p.visaId.givenNames,
                  p.visaId.familyName,
                );
              } else if (
                p.visa &&
                typeof p.visa === "object" &&
                (p.visa.givenNames || p.visa.familyName)
              ) {
                applicantName = formatApplicantFullName(
                  p.visa.givenNames,
                  p.visa.familyName,
                );
              } else if (p.name || p.applicantName) {
                const raw = p.name || p.applicantName;
                if (raw.includes(",")) {
                  const [last, ...firstParts] = raw.split(",");
                  const first = firstParts.join(" ").trim();
                  applicantName = formatApplicantFullName(first, last.trim());
                } else if (raw === raw.toLowerCase()) {
                  applicantName = raw.replace(/\b\w/g, (c) => c.toUpperCase());
                } else {
                  applicantName = raw;
                }
              } else if (
                allVisas.length > 0 &&
                (allVisas[0].givenNames || allVisas[0].familyName)
              ) {
                applicantName = formatApplicantFullName(
                  allVisas[0].givenNames,
                  allVisas[0].familyName,
                );
              } else {
                applicantName = storedUsername;
              }

              return {
                id: p._id || p.id,
                ref: p.referenceNumber || p.ref,
                type: p.visaType || p.type || "Visa Application Charge",
                name: applicantName,
                givenNames: p.givenNames || "",
                familyName: p.familyName || "",
                date:
                  p.transactionDate ?
                    new Date(p.transactionDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : p.date && p.date !== "—" ?
                    p.date
                  : "—",
                transactionDate: p.transactionDate || null,
                rawDate: p.transactionDate || p.rawDate,
                office: p.issuingOffice || p.office || "Online Payments Centre",
                internalRef: p.internalRef || "—",
                currency: p.currency || "AUD",
                amount: p.amount,
                status:
                  (p.status || "").toLowerCase() === "paid" ?
                    "Paid"
                  : "Pending",
                visaId: p.visaId || p.visa,
              };
            });
            setPayments(normalized);
            try {
              localStorage.setItem("au_payments", JSON.stringify(normalized));
            } catch (e) {}
            return;
          }
        }
      } catch (err) {
        console.error("Error fetching payments from API in UserPortal:", err);
      }
      syncPaymentsFromStorage();
    };

    if (activeSection === "manage-payments") {
      fetchPaymentsFromAPI();
    }

    const handleStorage = (e) => {
      if (e.key === "au_payments") {
        syncPaymentsFromStorage();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [activeSection, token, API_URL]);

  const [historyRange, setHistoryRange] = useState("7");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [showPaymentAdvSearch, setShowPaymentAdvSearch] = useState(false);
  const [paymentAdvFilters, setPaymentAdvFilters] = useState({
    ref: "",
    fromDate: "",
    toDate: "",
    status: "",
  });
  const [paymentSortCol, setPaymentSortCol] = useState("date");
  const [paymentSortDir, setPaymentSortDir] = useState("desc");

  // Payment Modals
  const [showPayInvoiceModal, setShowPayInvoiceModal] = useState(false);
  const [showPrePayModal, setShowPrePayModal] = useState(false);
  const [showPaymentHelpModal, setShowPaymentHelpModal] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  // Pay Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    clientId: "",
    name: "",
    email: "",
    amount: "385.00",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    paymentMethod: "credit-card",
    targetPaymentId: null,
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  // Pre-pay Paper Service Form State
  const [prePayForm, setPrePayForm] = useState({
    serviceType: "Form 1418 - Visitor Visa Paper Lodgement ($190.00 AUD)",
    givenNames: "",
    familyName: "",
    passportNumber: "",
    amount: "190.00",
  });
  const [prePaySuccessVoucher, setPrePaySuccessVoucher] = useState(null);

  // Make Payments Section State (Exact match to Home Affairs Pre-pay reference)
  const [makePaymentData, setMakePaymentData] = useState({
    paymentId: null,
    paymentRef: "HA84920155",
    paymentType: "Pre-pay Visa Application Charge Paper Application",
    processingOffice: "New Delhi",
    familyName: "Smith",
    givenNames: "John",
    dateOfBirth: "26 Aug 1995",
    visaSubclass: "600 Visitor",
    amount: "",
    backendAmount: "",
    isCalculated: false,
    comments: "cscsc",
    status: "Pending",
  });
  const [isEditingPaymentDetails, setIsEditingPaymentDetails] = useState(false);
  const [paymentEditForm, setPaymentEditForm] = useState({
    paymentId: null,
    paymentRef: "HA84920155",
    paymentType: "Pre-pay Visa Application Charge Paper Application",
    processingOffice: "New Delhi",
    familyName: "Smith",
    givenNames: "John",
    dateOfBirth: "26 Aug 1995",
    visaSubclass: "600 Visitor",
    amount: "",
    backendAmount: "",
    isCalculated: false,
    comments: "cscsc",
    status: "Pending",
  });
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentCompletedReceipt, setPaymentCompletedReceipt] = useState(null);
  const [calcNote, setCalcNote] = useState("");
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryMonth: "08",
    expiryYear: "28",
    nameOnCard: "",
    csc: "",
  });

  const formatDateDisplay = (dob) => {
    if (!dob) return "26 Aug 1995";
    if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(dob)) return dob;
    const d = new Date(dob);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const month = d.toLocaleString("en-GB", { month: "short" });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    }
    return dob;
  };

  const calculateFeeForSubclass = (subclass) => {
    const text = (subclass || "").toLowerCase();
    if (text.includes("600") || text.includes("visitor")) return "145.00";
    if (text.includes("500") || text.includes("student")) return "710.00";
    if (text.includes("482") || text.includes("skill shortage")) return "1455.00";
    if (text.includes("189") || text.includes("190")) return "4640.00";
    if (text.includes("820") || text.includes("309") || text.includes("partner")) return "8850.00";
    if (text.includes("417") || text.includes("working holiday")) return "635.00";
    if (text.includes("485") || text.includes("graduate")) return "1895.00";
    return "145.00";
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("user");
    navigate("/lusc/login");
  };

  // Fetch Visas for the logged in user
  const fetchUserApplications = async () => {
    if (!token || !userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/visas/user/${userId}?origin=au`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.visas)) {
          setVisas(data.visas);
        } else {
          setVisas([]);
        }
      } else {
        setVisas([]);
      }
    } catch (error) {
      console.error("Error fetching user applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/lusc/login");
      return;
    }
    fetchUserApplications();
  }, [token, userId]);

  // Combine fetched visas and any locally imported visas (avoiding duplicates)
  const allVisas = useMemo(() => {
    const combined = [...visas];
    for (const imp of importedVisas) {
      if (
        !combined.some(
          (v) =>
            v._id === imp._id ||
            (v.trn && v.trn === imp.trn) ||
            (v.visaGrantNumber && v.visaGrantNumber === imp.visaGrantNumber),
        )
      ) {
        combined.push(imp);
      }
    }
    return combined;
  }, [visas, importedVisas]);

  // Filter and Sort Visas
  const filteredVisas = useMemo(() => {
    let list = [...allVisas];

    // Quick search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (v) =>
          (v.visaClassSubclass &&
            v.visaClassSubclass.toLowerCase().includes(q)) ||
          (v.visaType && v.visaType.toLowerCase().includes(q)) ||
          (v.trn && v.trn.toLowerCase().includes(q)) ||
          (v.visaGrantNumber && v.visaGrantNumber.toLowerCase().includes(q)) ||
          (v.familyName && v.familyName.toLowerCase().includes(q)) ||
          (v.givenNames && v.givenNames.toLowerCase().includes(q)) ||
          (v.visaStatus && v.visaStatus.toLowerCase().includes(q)),
      );
    }

    // Advanced search filters
    if (advFilters.subclass.trim()) {
      const sub = advFilters.subclass.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.visaClassSubclass &&
          v.visaClassSubclass.toLowerCase().includes(sub),
      );
    }
    if (advFilters.trn.trim()) {
      const trn = advFilters.trn.toLowerCase().trim();
      list = list.filter(
        (v) =>
          (v.trn && v.trn.toLowerCase().includes(trn)) ||
          (v.visaGrantNumber && v.visaGrantNumber.toLowerCase().includes(trn)),
      );
    }
    if (advFilters.status.trim()) {
      const stat = advFilters.status.toLowerCase().trim();
      list = list.filter(
        (v) => v.visaStatus && v.visaStatus.toLowerCase() === stat,
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "lastUpdated") {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      }
      if (sortBy === "application") {
        return (a.visaClassSubclass || "").localeCompare(
          b.visaClassSubclass || "",
        );
      }
      if (sortBy === "reference") {
        return (a.trn || a.visaGrantNumber || "").localeCompare(
          b.trn || b.visaGrantNumber || "",
        );
      }
      if (sortBy === "applicant") {
        return (a.familyName || "").localeCompare(b.familyName || "");
      }
      if (sortBy === "status") {
        return (a.visaStatus || "").localeCompare(b.visaStatus || "");
      }
      return 0;
    });

    return list;
  }, [allVisas, searchQuery, advFilters, sortBy]);

  // Import Application Handler (by Grant Number or TRN)
  const handleImportApplication = async (e) => {
    e.preventDefault();
    setImportError("");
    if (!importGrantNumber.trim() && !importTrn.trim()) {
      setImportError(
        "Please enter a Visa Grant Number or Transaction Reference Number (TRN).",
      );
      return;
    }

    setImportLoading(true);
    try {
      let foundVisa = null;
      if (importGrantNumber.trim()) {
        const res = await fetch(
          `${API_URL}/api/visas/grant/${encodeURIComponent(importGrantNumber.trim())}?origin=au`,
        );
        if (res.ok) {
          foundVisa = await res.json();
        }
      }

      if (!foundVisa && importTrn.trim()) {
        const res = await fetch(`${API_URL}/api/visas/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            searchType: "trn",
            referenceNumber: importTrn.trim(),
            origin: "au",
          }),
        });
        if (res.ok) {
          foundVisa = await res.json();
        }
      }

      if (foundVisa) {
        setImportedVisas((prev) => [...prev, foundVisa]);
        setImportGrantNumber("");
        setImportTrn("");
        setShowImportModal(false);
        setSelectedVisa(foundVisa);
      } else {
        setImportError(
          "No matching application found with the provided details.",
        );
      }
    } catch (err) {
      setImportError(
        "Error searching for application. Please check backend connection.",
      );
    } finally {
      setImportLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Compute display name for top-right header: "SMITH, John"
  const headerDisplayName = useMemo(() => {
    if (allVisas.length > 0 && allVisas[0].familyName) {
      return `${allVisas[0].familyName.toUpperCase()}, ${allVisas[0].givenNames || ""}`;
    }
    return storedUsername.toUpperCase();
  }, [allVisas, storedUsername]);

  // Compute given name + family name for payment forms / displays: "John Smith"
  const paymentUserFullName = useMemo(() => {
    if (
      allVisas.length > 0 &&
      (allVisas[0].givenNames || allVisas[0].familyName)
    ) {
      return formatApplicantFullName(
        allVisas[0].givenNames,
        allVisas[0].familyName,
      );
    }
    return storedUsername;
  }, [allVisas, storedUsername]);

  // Helper to format payment applicant name as: given name + family name
  const getPaymentDisplayName = (payment) => {
    if (!payment) return "—";

    // 1. Direct givenNames / familyName
    if (payment.givenNames || payment.familyName) {
      const fn = formatApplicantFullName(
        payment.givenNames,
        payment.familyName,
      );
      if (fn) return fn;
    }

    // 2. Populated visaId object (from Mongoose .populate('visaId'))
    if (payment.visaId && typeof payment.visaId === "object") {
      if (payment.visaId.givenNames || payment.visaId.familyName) {
        const fn = formatApplicantFullName(
          payment.visaId.givenNames,
          payment.visaId.familyName,
        );
        if (fn) return fn;
      }
    }

    // 3. Populated visa object
    if (payment.visa && typeof payment.visa === "object") {
      if (payment.visa.givenNames || payment.visa.familyName) {
        const fn = formatApplicantFullName(
          payment.visa.givenNames,
          payment.visa.familyName,
        );
        if (fn) return fn;
      }
    }

    // 4. Linked visa in allVisas
    const vId =
      payment.visaId ?
        typeof payment.visaId === "object" ?
          payment.visaId._id
        : payment.visaId
      : payment.visa && typeof payment.visa === "object" ? payment.visa._id
      : payment.visa;

    if (vId && allVisas.length > 0) {
      const linked = allVisas.find((v) => String(v._id) === String(vId));
      if (linked && (linked.givenNames || linked.familyName)) {
        const fn = formatApplicantFullName(
          linked.givenNames,
          linked.familyName,
        );
        if (fn) return fn;
      }
    }

    // 5. Raw name string
    const raw = payment.name || payment.applicantName || "";
    if (raw) {
      if (raw.includes(",")) {
        const [last, ...firstParts] = raw.split(",");
        const first = firstParts.join(" ").trim();
        const fn = formatApplicantFullName(first, last.trim());
        if (fn) return fn;
      }
      if (raw === raw.toLowerCase()) {
        return raw.replace(/\b\w/g, (c) => c.toUpperCase());
      }
      return raw;
    }

    // 6. First visa fallback
    if (
      allVisas.length > 0 &&
      (allVisas[0].givenNames || allVisas[0].familyName)
    ) {
      return formatApplicantFullName(
        allVisas[0].givenNames,
        allVisas[0].familyName,
      );
    }

    return storedUsername || "—";
  };

  // Payment sort handler
  const handlePaymentSort = (column) => {
    if (paymentSortCol === column) {
      setPaymentSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setPaymentSortCol(column);
      setPaymentSortDir("desc");
    }
  };

  // Payment filtering & sorting calculation
  const filteredPayments = useMemo(() => {
    let list = [...payments];

    // Filter text input
    if (paymentFilter.trim()) {
      const q = paymentFilter.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.type && p.type.toLowerCase().includes(q)) ||
          (p.ref && p.ref.toLowerCase().includes(q)) ||
          getPaymentDisplayName(p).toLowerCase().includes(q) ||
          (p.office && p.office.toLowerCase().includes(q)) ||
          (p.internalRef && p.internalRef.toLowerCase().includes(q)) ||
          (p.currency && p.currency.toLowerCase().includes(q)) ||
          (p.status && p.status.toLowerCase().includes(q)) ||
          (p.amount && p.amount.toString().includes(q)),
      );
    }

    // Advanced search filters
    if (paymentAdvFilters.ref.trim()) {
      const r = paymentAdvFilters.ref.toLowerCase().trim();
      list = list.filter((p) => p.ref && p.ref.toLowerCase().includes(r));
    }
    if (paymentAdvFilters.status.trim()) {
      const s = paymentAdvFilters.status.toLowerCase().trim();
      list = list.filter((p) => p.status && p.status.toLowerCase() === s);
    }
    if (paymentAdvFilters.fromDate) {
      const from = new Date(paymentAdvFilters.fromDate);
      list = list.filter((p) => new Date(p.rawDate || p.date) >= from);
    }
    if (paymentAdvFilters.toDate) {
      const to = new Date(paymentAdvFilters.toDate);
      list = list.filter((p) => new Date(p.rawDate || p.date) <= to);
    }

    // Sorting
    list.sort((a, b) => {
      let valA = a[paymentSortCol] || "";
      let valB = b[paymentSortCol] || "";
      if (paymentSortCol === "name") {
        valA = getPaymentDisplayName(a);
        valB = getPaymentDisplayName(b);
      } else if (paymentSortCol === "date") {
        const dA = new Date(a.rawDate || a.date || 0);
        const dB = new Date(b.rawDate || b.date || 0);
        return paymentSortDir === "desc" ? dB - dA : dA - dB;
      }
      if (paymentSortCol === "amount") {
        const numA = parseFloat(a.amount) || 0;
        const numB = parseFloat(b.amount) || 0;
        return paymentSortDir === "desc" ? numB - numA : numA - numB;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return paymentSortDir === "desc" ?
          strB.localeCompare(strA)
        : strA.localeCompare(strB);
    });

    return list;
  }, [
    payments,
    paymentFilter,
    paymentAdvFilters,
    paymentSortCol,
    paymentSortDir,
    allVisas,
    storedUsername,
  ]);

  // Open Make Payment section page (Redirects to Make Payments section matching reference)
  const handleOpenMakePayment = (payment) => {
    let target = payment || {};
    let linkedVisa = null;
    if (target.visaId) {
      const vId =
        typeof target.visaId === "object" ?
          target.visaId._id || target.visaId.id
        : target.visaId;
      linkedVisa = allVisas.find(
        (v) =>
          v._id === vId ||
          v.id === vId ||
          (v.trn && v.trn === target.internalRef),
      );
    }
    if (!linkedVisa && allVisas.length > 0) {
      linkedVisa = allVisas[0];
    }

    let famName = target.familyName || linkedVisa?.familyName;
    let givName = target.givenNames || linkedVisa?.givenNames;
    if (!famName || !givName) {
      if (target.name && target.name !== "—") {
        const parts = target.name.trim().split(/\s+/);
        if (parts.length > 1) {
          givName = givName || parts.slice(0, -1).join(" ");
          famName = famName || parts.slice(-1)[0];
        } else {
          famName = famName || parts[0];
          givName = givName || "John";
        }
      }
    }
    famName = famName || "Smith";
    givName = givName || "John";

    const dob = formatDateDisplay(linkedVisa?.dateOfBirth || "1995-08-26");

    let subclassVal = "600 Visitor";
    if (linkedVisa?.visaClassSubclass) {
      subclassVal = linkedVisa.visaClassSubclass;
      if (
        !subclassVal.includes("600") &&
        !subclassVal.includes("Visitor") &&
        !subclassVal.includes("500") &&
        !subclassVal.includes("482")
      ) {
        subclassVal =
          `${linkedVisa.visaClassSubclass} ${linkedVisa.visaType || ""}`.trim();
      }
    } else if (
      target.type &&
      (target.type.includes("Visitor") || target.type.includes("600"))
    ) {
      subclassVal = "600 Visitor";
    }

    const prepayData = {
      paymentId: target.id || target._id || null,
      paymentRef:
        target.ref ||
        target.referenceNumber ||
        "HA" + Math.floor(10000000 + Math.random() * 90000000),
      paymentType: "Pre-pay Visa Application Charge Paper Application",
      processingOffice:
        target.office && target.office !== "Online Payments Centre" ?
          target.office
        : "New Delhi",
      familyName: famName,
      givenNames: givName,
      dateOfBirth: dob,
      visaSubclass: subclassVal || "600 Visitor",
      amount: "",
      backendAmount:
        target.amount !== undefined && target.amount !== null ?
          String(target.amount)
        : "",
      isCalculated: false,
      comments:
        target.comments ||
        (target.internalRef && target.internalRef !== "—" ?
          target.internalRef
        : "cscsc"),
      status: target.status || "Pending",
    };

    setMakePaymentData(prepayData);
    setPaymentEditForm(prepayData);
    setIsEditingPaymentDetails(false);
    setPaymentCompletedReceipt(null);
    setCalcNote("");
    setActiveSection("make-payment-section");
    navigate(
      `/user-portal/payment?paymentId=${target.id || target._id || ""}`,
    );
  };

  // Synchronize state when navigating directly to /user-portal/payment
  useEffect(() => {
    if (
      location.pathname.endsWith("/payment") ||
      initialSection === "make-payment-section"
    ) {
      setActiveSection("make-payment-section");
      const searchParams = new URLSearchParams(location.search);
      const qPayId = searchParams.get("paymentId");
      let matchedPay = null;
      if (qPayId && payments.length > 0) {
        matchedPay = payments.find(
          (p) => String(p.id || p._id) === String(qPayId),
        );
      }
      if (!matchedPay && payments.length > 0) {
        matchedPay =
          payments.find(
            (p) => (p.status || "").toLowerCase() === "pending",
          ) || payments[0];
      }

      const activeVisa = allVisas.length > 0 ? allVisas[0] : null;
      let famName = matchedPay?.familyName || activeVisa?.familyName;
      let givName = matchedPay?.givenNames || activeVisa?.givenNames;
      if (!famName || !givName) {
        if (matchedPay?.name && matchedPay.name !== "—") {
          const parts = matchedPay.name.trim().split(/\s+/);
          if (parts.length > 1) {
            givName = givName || parts.slice(0, -1).join(" ");
            famName = famName || parts.slice(-1)[0];
          } else {
            famName = famName || parts[0];
            givName = givName || "John";
          }
        }
      }
      famName = famName || "Smith";
      givName = givName || "John";

      const dob = formatDateDisplay(activeVisa?.dateOfBirth || "1995-08-26");
      let subVal = "600 Visitor";
      if (activeVisa?.visaClassSubclass) {
        subVal = activeVisa.visaClassSubclass;
        if (
          !subVal.includes("600") &&
          !subVal.includes("Visitor") &&
          !subVal.includes("500") &&
          !subVal.includes("482")
        ) {
          subVal =
            `${activeVisa.visaClassSubclass} ${activeVisa.visaType || ""}`.trim();
        }
      }

      const initialData = {
        paymentId: matchedPay?.id || matchedPay?._id || null,
        paymentRef:
          matchedPay?.ref ||
          matchedPay?.referenceNumber ||
          "HA" + Math.floor(10000000 + Math.random() * 90000000),
        paymentType: "Pre-pay Visa Application Charge Paper Application",
        processingOffice:
          matchedPay?.office &&
          matchedPay.office !== "Online Payments Centre" ?
            matchedPay.office
          : "New Delhi",
        familyName: famName,
        givenNames: givName,
        dateOfBirth: dob,
        visaSubclass: subVal || "600 Visitor",
        amount: "",
        backendAmount:
          matchedPay?.amount !== undefined && matchedPay?.amount !== null ?
            String(matchedPay.amount)
          : "",
        isCalculated: false,
        comments:
          matchedPay?.comments ||
          (matchedPay?.internalRef && matchedPay.internalRef !== "—" ?
            matchedPay.internalRef
          : "cscsc"),
        status: matchedPay?.status || "Pending",
      };

      setMakePaymentData(initialData);
      setPaymentEditForm(initialData);
    }
  }, [location.pathname, location.search, payments, allVisas, initialSection]);

  const handleCalculateAmount = async () => {
    const targetId = makePaymentData.paymentId;
    let backendAmount = makePaymentData.backendAmount;

    // Fetch directly from backend API for this specific payment record
    if (targetId && token) {
      try {
        const response = await fetch(
          `${API_URL}/api/payments/${targetId}?origin=au`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.ok) {
          const resData = await response.json();
          const pData = resData.payment || resData.data || resData;
          if (pData && pData.amount !== undefined && pData.amount !== null) {
            backendAmount = String(pData.amount);
          }
        }
      } catch (err) {
        console.error("Error fetching payment amount from backend:", err);
      }
    }

    // Fallback to payments array in state if needed
    if (!backendAmount && targetId) {
      const found = payments.find(
        (p) => String(p.id || p._id) === String(targetId),
      );
      if (found && found.amount !== undefined && found.amount !== null) {
        backendAmount = String(found.amount);
      }
    }

    if (!backendAmount && makePaymentData.backendAmount) {
      backendAmount = String(makePaymentData.backendAmount);
    }

    // If still empty, check first available payment with an amount
    if (!backendAmount && payments.length > 0) {
      const firstWithAmt = payments.find((p) => p.amount);
      if (firstWithAmt) backendAmount = String(firstWithAmt.amount);
    }

    const finalAmount =
      backendAmount ? parseFloat(backendAmount).toFixed(2) : "0.00";

    setMakePaymentData((prev) => ({
      ...prev,
      amount: finalAmount,
      backendAmount: finalAmount,
      isCalculated: true,
    }));
    setPaymentEditForm((prev) => ({
      ...prev,
      amount: finalAmount,
      backendAmount: finalAmount,
      isCalculated: true,
    }));
    setCalcNote(`Amount from payment record: $${finalAmount} AUD`);
    setTimeout(() => setCalcNote(""), 4000);
  };

  const handleSavePaymentDetails = async () => {
    setMakePaymentData({ ...paymentEditForm });
    setIsEditingPaymentDetails(false);

    const targetId = paymentEditForm.paymentId;
    if (targetId) {
      setPayments((prev) =>
        prev.map((p) => {
          if ((p.id || p._id) === targetId) {
            return {
              ...p,
              givenNames: paymentEditForm.givenNames,
              familyName: paymentEditForm.familyName,
              name: `${paymentEditForm.givenNames} ${paymentEditForm.familyName}`,
              amount: paymentEditForm.amount,
              office: paymentEditForm.processingOffice,
              type: paymentEditForm.paymentType,
              comments: paymentEditForm.comments,
            };
          }
          return p;
        }),
      );

      try {
        await fetch(`${API_URL}/api/payments/${targetId}?origin=au`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            givenNames: paymentEditForm.givenNames,
            familyName: paymentEditForm.familyName,
            amount: paymentEditForm.amount,
            issuingOffice: paymentEditForm.processingOffice,
            visaType: paymentEditForm.visaSubclass,
            internalRef: paymentEditForm.comments,
          }),
        });
      } catch (err) {
        console.error("Failed to update payment on backend:", err);
      }
    }
  };

  const handleSubmitPrePayment = () => {
    if (selectedPaymentMethod === "card") {
      if (!cardDetails.cardNumber.trim()) {
        alert("Please enter a valid debit/credit card number.");
        return;
      }
      if (!cardDetails.nameOnCard.trim()) {
        alert("Please enter the name on your card.");
        return;
      }
      if (!cardDetails.csc.trim()) {
        alert("Please enter the Card Security Code (CSC).");
        return;
      }
    }

    setIsPaymentProcessing(true);
    setTimeout(async () => {
      setIsPaymentProcessing(false);
      let targetId = makePaymentData.paymentId;
      if (!targetId && makePaymentData.paymentRef) {
        const found = payments.find(
          (p) =>
            p.ref === makePaymentData.paymentRef ||
            p.referenceNumber === makePaymentData.paymentRef,
        );
        if (found) targetId = found.id || found._id;
      }

      const now = new Date();
      const formattedDateOnly = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const formattedNow =
        formattedDateOnly +
        " " +
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
      const nowIso = now.toISOString();

      if (targetId) {
        try {
          const res = await fetch(`${API_URL}/api/payments/${targetId}?origin=au`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: "paid",
              transactionDate: nowIso,
            }),
          });
          if (!res.ok) {
            console.error(
              "Failed to update payment status on backend:",
              res.status,
              await res.text(),
            );
          }
        } catch (err) {
          console.error("Failed to update payment status on backend:", err);
        }
      }

      // Update state and localStorage immediately
      setPayments((prev) => {
        const next = prev.map((p) => {
          const isMatch =
            (targetId && (p.id === targetId || p._id === targetId)) ||
            (makePaymentData.paymentRef &&
              (p.ref === makePaymentData.paymentRef ||
                p.referenceNumber === makePaymentData.paymentRef));
          if (isMatch) {
            return {
              ...p,
              status: "Paid",
              date: formattedDateOnly,
              transactionDate: nowIso,
              rawDate: nowIso,
            };
          }
          return p;
        });
        try {
          localStorage.setItem("au_payments", JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      setMakePaymentData((prev) => ({
        ...prev,
        status: "Paid",
      }));

      setPaymentCompletedReceipt({
        receiptNumber:
          "RC" + Math.floor(100000000 + Math.random() * 900000000),
        voucherNumber:
          "VCH-" + Math.floor(10000000 + Math.random() * 90000000),
        ref: makePaymentData.paymentRef,
        payerName: `${makePaymentData.givenNames} ${makePaymentData.familyName}`,
        cardMask:
          selectedPaymentMethod === "card" ?
            `Card ending in ${cardDetails.cardNumber.slice(-4) || "8821"}`
          : selectedPaymentMethod.toUpperCase(),
        date: formattedNow,
        amount: parseFloat(makePaymentData.amount || 145).toFixed(2),
        subclass: makePaymentData.visaSubclass,
        office: makePaymentData.processingOffice,
        comments: makePaymentData.comments,
      });
    }, 1000);
  };

  // Handle Pay Invoice Submit
  const handlePayInvoiceSubmit = (e) => {
    e.preventDefault();
    if (!invoiceForm.invoiceNumber.trim()) {
      alert("Please enter an Invoice Reference Number.");
      return;
    }
    if (!invoiceForm.cardNumber.trim()) {
      alert("Please enter your card number.");
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(async () => {
      setIsProcessingPayment(false);
      const targetId = invoiceForm.targetPaymentId;
      const now = new Date();
      const formattedDateOnly = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const formattedNow =
        formattedDateOnly +
        " " +
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
      const nowIso = now.toISOString();

      if (targetId) {
        // Update on backend if target payment has a valid ID
        try {
          await fetch(`${API_URL}/api/payments/${targetId}?origin=au`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: "paid",
              transactionDate: nowIso,
            }),
          });
        } catch (err) {
          console.error("Failed to update payment status on backend:", err);
        }

        // Update local payments state
        setPayments((prev) => {
          const next = prev.map((p) => {
            if (
              (p._id || p.id) === targetId ||
              p.ref === invoiceForm.invoiceNumber
            ) {
              return {
                ...p,
                status: "Paid",
                date: formattedDateOnly,
                transactionDate: nowIso,
                rawDate: nowIso,
              };
            }
            return p;
          });
          try {
            localStorage.setItem("au_payments", JSON.stringify(next));
          } catch (err) {}
          return next;
        });

        const targetP = payments.find(
          (p) =>
            (p._id || p.id) === targetId || p.ref === invoiceForm.invoiceNumber,
        );
        const receiptData = {
          id: "TXN-" + Math.floor(100000 + Math.random() * 900000),
          type: targetP?.type || "Visa Application Charge",
          ref: invoiceForm.invoiceNumber.trim().toUpperCase(),
          name: invoiceForm.name || paymentUserFullName,
          date: formattedNow,
          rawDate: nowIso,
          office: targetP?.office || "Online Payments Centre",
          internalRef:
            targetP?.internalRef ||
            "AU-MMS-" + Math.floor(1000 + Math.random() * 9000),
          currency: targetP?.currency || "AUD",
          amount: parseFloat(invoiceForm.amount || targetP?.amount || "385.00"),
          status: "Completed",
          cardMask:
            "•••• •••• •••• " + (invoiceForm.cardNumber.slice(-4) || "4242"),
          payerEmail: invoiceForm.email || "applicant@homeaffairs.gov.au",
        };
        setPaymentSuccessData(receiptData);
      } else {
        const newReceipt = {
          id: "TXN-" + Math.floor(100000 + Math.random() * 900000),
          type: "Invoice Payment",
          ref: invoiceForm.invoiceNumber.trim().toUpperCase(),
          name: invoiceForm.name || paymentUserFullName,
          date: formattedNow,
          rawDate: nowIso,
          office: "Online Payments Centre",
          internalRef: "AU-MMS-" + Math.floor(1000 + Math.random() * 9000),
          currency: "AUD",
          amount: parseFloat(invoiceForm.amount || "385.00"),
          status: "Completed",
          cardMask:
            "•••• •••• •••• " + (invoiceForm.cardNumber.slice(-4) || "4242"),
          payerEmail: invoiceForm.email || "applicant@homeaffairs.gov.au",
        };
        setPaymentSuccessData(newReceipt);
        setPayments((prev) => {
          const next = [newReceipt, ...prev];
          try {
            localStorage.setItem("au_payments", JSON.stringify(next));
          } catch (err) {
            console.error(err);
          }
          return next;
        });
      }
    }, 1000);
  };

  // Handle Pre-pay Paper Service Submit
  const handlePrePaySubmit = (e) => {
    e.preventDefault();
    if (!prePayForm.familyName.trim()) {
      alert("Please enter the applicant family name.");
      return;
    }
    const applicantGivenFamilyName = [
      prePayForm.givenNames,
      prePayForm.familyName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    const voucher = {
      voucherNumber: "PPV-2026-" + Math.floor(100000 + Math.random() * 900000),
      serviceType: prePayForm.serviceType,
      applicantName: applicantGivenFamilyName,
      passportNumber: (
        prePayForm.passportNumber ||
        "E" + Math.floor(10000000 + Math.random() * 90000000)
      ).toUpperCase(),
      amount: prePayForm.amount,
      issueDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      validUntil: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
    setPrePaySuccessVoucher(voucher);
    const newTxn = {
      id: "TXN-" + Math.floor(100000 + Math.random() * 900000),
      type: "Paper Pre-pay",
      ref: voucher.voucherNumber,
      name: applicantGivenFamilyName,
      date:
        new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        " " +
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      rawDate: new Date().toISOString(),
      office: "Paper Lodgement Registry",
      internalRef: "VOUCH-" + Math.floor(1000 + Math.random() * 9000),
      currency: "AUD",
      amount: parseFloat(voucher.amount),
      status: "Completed",
    };
    setPayments((prev) => {
      const next = [newTxn, ...prev];
      try {
        localStorage.setItem("au_payments", JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".immi-nav-dropdown-wrapper")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const toggleDropdown = (name, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <div className="immi-application">
      {/* 1. Australian Government Department of Home Affairs & ImmiAccount / Online Payments Header */}
      <header className="immi-header">
        <div className="immi-header-left">
          <img
            src={logoHA}
            alt="Australian Government Department of Home Affairs"
          />
        </div>
        <div className="immi-header-right">
          <div className="immi-header-user-row">
            <span className="immi-header-username">{headerDisplayName}</span>
            <button
              type="button"
              className="immi-header-link"
              onClick={(e) => {
                e.stopPropagation();
                setShowAccountModal(true);
              }}>
              Manage Account
            </button>
            <button
              type="button"
              className="immi-header-link"
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}>
              Logout
            </button>
          </div>
          <h1>
            {activeSection === "manage-payments" ||
            activeSection === "make-payment-section" ?
              "Online payments"
            : "ImmiAccount"}
          </h1>
        </div>
      </header>

      {/* 2. Navigation Tabs Bar */}
      <nav className="immi-nav-bar">
        <div className="immi-nav-container">
          <button
            type="button"
            className={`immi-nav-tab ${activeSection === "applications" ? "active" : ""}`}
            onClick={() => {
              setActiveSection("applications");
              navigate("/user-portal");
            }}>
            My applications
          </button>

          <div className="immi-nav-dropdown-wrapper">
            <button
              type="button"
              className={`immi-nav-tab ${activeSection === "manage-payments" || activeSection === "make-payment-section" ? "active" : ""}`}
              onClick={(e) => toggleDropdown("payments", e)}>
              My payments <span className="caret">▾</span>
            </button>
            {openDropdown === "payments" && (
              <div
                className="immi-dropdown-menu"
                onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    setActiveSection("manage-payments");
                    navigate("/user-portal");
                  }}>
                  Manage Payments
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    handleOpenMakePayment(payments[0] || {});
                  }}>
                  Make Payments
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="immi-nav-tab"
            onClick={() =>
              alert(
                "Manage groups: No agent or organisation groups assigned to this account.",
              )
            }>
            Manage groups
          </button>

          <div className="immi-nav-dropdown-wrapper">
            <button
              type="button"
              className="immi-nav-tab"
              onClick={(e) => toggleDropdown("links", e)}>
              Related links <span className="caret">▾</span>
            </button>
            {openDropdown === "links" && (
              <div
                className="immi-dropdown-menu"
                onClick={(e) => e.stopPropagation()}>
                <a
                  href="https://immi.homeaffairs.gov.au"
                  target="_blank"
                  rel="noreferrer">
                  Department of Home Affairs Home
                </a>
                <a href="/evo/firstParty">Check Visa Details (VEVO)</a>
                <a href="/visas/already-have-a-visa/check-visa-details-and-conditions/overview">
                  Visa Conditions Overview
                </a>
              </div>
            )}
          </div>

          <div className="immi-nav-dropdown-wrapper">
            <button
              type="button"
              className="immi-nav-tab"
              onClick={(e) => toggleDropdown("help", e)}>
              Help and support <span className="caret">▾</span>
            </button>
            {openDropdown === "help" && (
              <div
                className="immi-dropdown-menu"
                onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    setShowHelpModal(true);
                  }}>
                  ImmiAccount Help
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    alert(
                      "Home Affairs Telephone Enquiry Line: 131 881 (within Australia)",
                    );
                  }}>
                  Contact Us
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 3. Main Dashboard Body */}
      <main className="immi-dashboard-wrapper">
        {activeSection === "make-payment-section" ?
          <div className="immi-make-payment-wrapper">
            {/* Dark navy subheader bar with "Make Payments" */}
            <div className="immi-make-payment-banner">Make Payments</div>

            <div className="immi-make-payment-card">
              {paymentCompletedReceipt ?
                <div>
                  <div style={{ textAlign: "center", padding: "10px 0 16px 0" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: "#e8f5e9",
                        color: "#2e7d32",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 10px auto",
                        fontSize: "24px",
                        fontWeight: "bold",
                      }}>
                      ✓
                    </div>
                    <h3
                      style={{
                        margin: "0 0 6px 0",
                        color: "#002b49",
                        fontSize: "18px",
                      }}>
                      Payment Successful &amp; Pre-payment Lodged
                    </h3>
                    <p
                      style={{ margin: 0, color: "#555555", fontSize: "12px" }}>
                      Your pre-payment charge has been successfully processed by
                      the Australian Department of Home Affairs.
                    </p>
                  </div>

                  <div className="immi-receipt-card">
                    <div className="immi-receipt-header">
                      <span className="immi-receipt-title">
                        Official Payment Receipt &amp; Pre-pay Paper Voucher
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "#2e7d32",
                        }}>
                        APPROVED
                      </span>
                    </div>

                    <table className="immi-receipt-table">
                      <tbody>
                        <tr>
                          <th>Receipt Number:</th>
                          <td>
                            <strong>
                              {paymentCompletedReceipt.receiptNumber}
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <th>Pre-pay Voucher Ref:</th>
                          <td>
                            <strong>
                              {paymentCompletedReceipt.voucherNumber}
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <th>Application Reference (TRN / Inv):</th>
                          <td>{paymentCompletedReceipt.ref}</td>
                        </tr>
                        <tr>
                          <th>Main Applicant:</th>
                          <td>{paymentCompletedReceipt.payerName}</td>
                        </tr>
                        <tr>
                          <th>Visa Subclass:</th>
                          <td>{paymentCompletedReceipt.subclass}</td>
                        </tr>
                        <tr>
                          <th>Processing Office:</th>
                          <td>{paymentCompletedReceipt.office}</td>
                        </tr>
                        <tr>
                          <th>Transaction Date / Time:</th>
                          <td>{paymentCompletedReceipt.date}</td>
                        </tr>
                        <tr>
                          <th>Payment Amount:</th>
                          <td>
                            <strong
                              style={{ fontSize: "15px", color: "#002b49" }}>
                              ${paymentCompletedReceipt.amount} AUD
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <th>Validity:</th>
                          <td>30 Days from date of payment</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="immi-barcode-box">
                      ||| | ||||| ||| |||| || ||||||| | ||||| |||
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#666",
                          marginTop: "4px",
                        }}>
                        *{paymentCompletedReceipt.voucherNumber}*
                      </div>
                    </div>
                  </div>

                  <div
                    className="immi-prepay-actions"
                    style={{ borderTop: "none" }}>
                    <button
                      type="button"
                      className="immi-btn-back-action"
                      onClick={() => {
                        setActiveSection("manage-payments");
                        navigate("/user-portal");
                      }}>
                      ← View in Transaction History
                    </button>
                    <button
                      type="button"
                      className="immi-btn-pay-action"
                      onClick={() => window.print()}>
                      🖨 Print / Save Receipt
                    </button>
                  </div>
                </div>
              : <div>
                  <div className="immi-prepay-alert-red">
                    Application must be lodged within 30 days of making the
                    payment.
                  </div>

                  <table className="immi-prepay-table">
                    <tbody>
                      <tr>
                        <td className="label-cell">
                          What payment are you making?
                        </td>
                        <td className="value-cell">
                          {isEditingPaymentDetails ?
                            <select
                              className="immi-prepay-select"
                              value={paymentEditForm.paymentType}
                              onChange={(e) =>
                                setPaymentEditForm({
                                  ...paymentEditForm,
                                  paymentType: e.target.value,
                                })
                              }>
                              <option value="Pre-pay Visa Application Charge Paper Application">
                                Pre-pay Visa Application Charge Paper
                                Application
                              </option>
                              <option value="Non-Internet Application Charge (NIAC)">
                                Non-Internet Application Charge (NIAC)
                              </option>
                              <option value="Sponsorship / Nomination Fee">
                                Sponsorship / Nomination Fee
                              </option>
                              <option value="Citizenship Application Fee">
                                Citizenship Application Fee
                              </option>
                            </select>
                          : <div className="immi-prepay-text-val">
                              <span>{makePaymentData.paymentType}</span>
                              <span
                                style={{ fontSize: "10px", color: "#555" }}>
                                ▼
                              </span>
                              <button
                                type="button"
                                className="immi-prepay-help-icon"
                                title="Pre-pay Visa Application Charge Paper Application help"
                                onClick={() =>
                                  setShowHelpTooltip(!showHelpTooltip)
                                }>
                                ?
                              </button>
                              {showHelpTooltip && (
                                <div className="immi-prepay-tooltip">
                                  Pre-payment charge for visa applications
                                  lodged using physical paper forms.
                                </div>
                              )}
                            </div>
                          }
                        </td>
                      </tr>

                      <tr>
                        <td className="label-cell">
                          Processing Office
                          <span className="immi-prepay-req">*</span>
                        </td>
                        <td className="value-cell">
                          {isEditingPaymentDetails ?
                            <select
                              className="immi-prepay-select"
                              value={paymentEditForm.processingOffice}
                              onChange={(e) =>
                                setPaymentEditForm({
                                  ...paymentEditForm,
                                  processingOffice: e.target.value,
                                })
                              }>
                              <option value="New Delhi">New Delhi</option>
                              <option value="Sydney">Sydney</option>
                              <option value="Melbourne">Melbourne</option>
                              <option value="Brisbane">Brisbane</option>
                              <option value="Perth">Perth</option>
                              <option value="London">London</option>
                              <option value="Beijing">Beijing</option>
                              <option value="Dubai">Dubai</option>
                              <option value="Online Payments Centre">
                                Online Payments Centre
                              </option>
                            </select>
                          : <div className="immi-prepay-text-val">
                              <span>{makePaymentData.processingOffice}</span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "#555",
                                  marginLeft: "24px",
                                }}>
                                ▼
                              </span>
                            </div>
                          }
                        </td>
                      </tr>

                      <tr>
                        <td
                          className="label-cell applicant-header-cell"
                          colSpan="2">
                          Main Applicant
                        </td>
                      </tr>

                      <tr>
                        <td className="label-cell">
                          Family Name<span className="immi-prepay-req">*</span>
                        </td>
                        <td className="value-cell">
                          {isEditingPaymentDetails ?
                            <input
                              type="text"
                              className="immi-prepay-input"
                              value={paymentEditForm.familyName}
                              onChange={(e) =>
                                setPaymentEditForm({
                                  ...paymentEditForm,
                                  familyName: e.target.value,
                                })
                              }
                            />
                          : <span>{makePaymentData.familyName}</span>}
                        </td>
                      </tr>

                      <tr>
                        <td className="label-cell">
                          Given Name<span className="immi-prepay-req">*</span>
                        </td>
                        <td className="value-cell">
                          {isEditingPaymentDetails ?
                            <input
                              type="text"
                              className="immi-prepay-input"
                              value={paymentEditForm.givenNames}
                              onChange={(e) =>
                                setPaymentEditForm({
                                  ...paymentEditForm,
                                  givenNames: e.target.value,
                                })
                              }
                            />
                          : <span>{makePaymentData.givenNames}</span>}
                        </td>
                      </tr>

                      <tr>
                        <td className="label-cell">
                          Date of birth<span className="immi-prepay-req">*</span>
                        </td>
                        <td className="value-cell">
                          {isEditingPaymentDetails ?
                            <input
                              type="text"
                              className="immi-prepay-input"
                              placeholder="e.g. 26 Aug 1995"
                              value={paymentEditForm.dateOfBirth}
                              onChange={(e) =>
                                setPaymentEditForm({
                                  ...paymentEditForm,
                                  dateOfBirth: e.target.value,
                                })
                              }
                            />
                          : <div className="immi-prepay-text-val">
                              <span>{makePaymentData.dateOfBirth}</span>
                              <span
                                style={{
                                  fontSize: "14px",
                                  marginLeft: "14px",
                                }}
                                title="Date of birth">
                                📅
                              </span>
                            </div>
                          }
                        </td>
                      </tr>

                      <tr>
                        <td className="label-cell">
                          Visa subclass
                          <span className="immi-prepay-req">*</span>
                        </td>
                        <td className="value-cell">
                          {isEditingPaymentDetails ?
                            <select
                              className="immi-prepay-select"
                              value={paymentEditForm.visaSubclass}
                              onChange={(e) => {
                                const sub = e.target.value;
                                const amt = calculateFeeForSubclass(sub);
                                setPaymentEditForm({
                                  ...paymentEditForm,
                                  visaSubclass: sub,
                                  amount: amt,
                                });
                              }}>
                              <option value="600 Visitor">600 Visitor</option>
                              <option value="500 Student">500 Student</option>
                              <option value="482 Temporary Skill Shortage">
                                482 Temporary Skill Shortage
                              </option>
                              <option value="189 Skilled Independent">
                                189 Skilled Independent
                              </option>
                              <option value="190 Skilled Nominated">
                                190 Skilled Nominated
                              </option>
                              <option value="309 Partner (Provisional)">
                                309 Partner (Provisional)
                              </option>
                              <option value="820 Partner (Temporary)">
                                820 Partner (Temporary)
                              </option>
                              <option value="417 Working Holiday">
                                417 Working Holiday
                              </option>
                              <option value="485 Temporary Graduate">
                                485 Temporary Graduate
                              </option>
                            </select>
                          : <div className="immi-prepay-text-val">
                              <span>{makePaymentData.visaSubclass}</span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "#555",
                                  marginLeft: "28px",
                                }}>
                                ▼
                              </span>
                            </div>
                          }
                        </td>
                      </tr>

                      <tr>
                        <td className="label-cell">
                          Amount (AUD)<span className="immi-prepay-req">*</span>
                        </td>
                        <td className="value-cell">
                          {isEditingPaymentDetails ?
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}>
                              <input
                                type="text"
                                className="immi-prepay-input"
                                style={{ width: "90px", minWidth: "90px" }}
                                value={paymentEditForm.amount}
                                onChange={(e) =>
                                  setPaymentEditForm({
                                    ...paymentEditForm,
                                    amount: e.target.value,
                                  })
                                }
                              />
                              <button
                                type="button"
                                className="immi-prepay-calc-btn"
                                onClick={handleCalculateAmount}>
                                Calculate
                              </button>
                            </div>
                          : <div className="immi-prepay-text-val">
                              {makePaymentData.isCalculated &&
                              makePaymentData.amount ?
                                <span
                                  style={{
                                    fontWeight: "500",
                                    marginRight: "6px",
                                  }}>
                                  {parseFloat(
                                    makePaymentData.amount,
                                  ).toFixed(2)}
                                </span>
                              : null}
                              <button
                                type="button"
                                className="immi-prepay-calc-btn"
                                style={{
                                  marginLeft:
                                    (
                                      makePaymentData.isCalculated &&
                                      makePaymentData.amount
                                    ) ?
                                      "6px"
                                    : "0px",
                                }}
                                onClick={handleCalculateAmount}>
                                Calculate
                              </button>
                              {calcNote && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "#00703c",
                                    marginLeft: "8px",
                                    fontWeight: "bold",
                                  }}>
                                  ✓ {calcNote}
                                </span>
                              )}
                            </div>
                          }
                        </td>
                      </tr>

                      <tr>
                        <td className="label-cell">Comments</td>
                        <td className="value-cell">
                          {isEditingPaymentDetails ?
                            <input
                              type="text"
                              className="immi-prepay-input"
                              value={paymentEditForm.comments}
                              onChange={(e) =>
                                setPaymentEditForm({
                                  ...paymentEditForm,
                                  comments: e.target.value,
                                })
                              }
                            />
                          : <span>{makePaymentData.comments || "cscsc"}</span>}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="immi-prepay-notes">
                    <p>
                      To estimate the amount for the pre-payment select the Visa
                      subclass then click on the Calculate button.
                    </p>
                    <p>
                      The non-internet application charge must be paid for
                      certain visa subclasses if you do not lodge your visa
                      application online. Certain exemptions may apply depending
                      on the visa subclass, for further information go to the{" "}
                      <a
                        href="https://immi.homeaffairs.gov.au/help-support/applying-online-or-on-paper/on-paper"
                        target="_blank"
                        rel="noopener noreferrer">
                        Non-internet application charge site
                      </a>
                    </p>
                  </div>

                  {/* Upper Section Edit Button on Right (Matching reference screenshot) */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: "16px",
                      paddingTop: "10px",
                    }}>
                    {isEditingPaymentDetails ?
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          className="immi-btn-classic"
                          onClick={() => {
                            setIsEditingPaymentDetails(false);
                            setPaymentEditForm({ ...makePaymentData });
                          }}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="immi-btn-classic"
                          style={{ fontWeight: "bold", color: "#004b87" }}
                          onClick={handleSavePaymentDetails}>
                          Save Changes
                        </button>
                      </div>
                    : <button
                        type="button"
                        className="immi-btn-classic"
                        onClick={() => {
                          setPaymentEditForm({ ...makePaymentData });
                          setIsEditingPaymentDetails(true);
                        }}>
                        Edit
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            {/* 2. Payment Options Section Below (Matching Reference Screenshot) */}
            {!paymentCompletedReceipt && (
              <div className="immi-payment-options-card">
                <div className="immi-options-title">Payment options</div>

                <div className="immi-options-notice">
                  Your decision to pay will be final, your payment cannot be
                  disputed, even if you change your mind.
                </div>

                <div className="immi-options-radios-row">
                  <span style={{ fontSize: "12px", color: "#222" }}>
                    Select a payment option
                  </span>
                  <label className="immi-options-radio-label">
                    <input
                      type="radio"
                      name="paymentOption"
                      value="card"
                      checked={selectedPaymentMethod === "card"}
                      onChange={() => setSelectedPaymentMethod("card")}
                    />
                    <span>Debit/credit card</span>
                  </label>
                  <label className="immi-options-radio-label">
                    <input
                      type="radio"
                      name="paymentOption"
                      value="paypal"
                      checked={selectedPaymentMethod === "paypal"}
                      onChange={() => setSelectedPaymentMethod("paypal")}
                    />
                    <span>PayPal</span>
                  </label>
                  <label className="immi-options-radio-label">
                    <input
                      type="radio"
                      name="paymentOption"
                      value="unionpay"
                      checked={selectedPaymentMethod === "unionpay"}
                      onChange={() => setSelectedPaymentMethod("unionpay")}
                    />
                    <span>UnionPay</span>
                  </label>
                </div>

                {selectedPaymentMethod === "card" ?
                  <div>
                    <div className="immi-options-subhead">
                      Payment by debit/credit card
                    </div>

                    {/* Card Logos: Visa, MasterCard, American Express, Diners Club, JCB */}
                    <div className="immi-card-badges-row">
                      {/* Visa */}
                      <span className="immi-card-badge" title="Visa">
                        <svg
                          width="44"
                          height="20"
                          viewBox="0 0 100 32"
                          fill="none">
                          <rect
                            width="100"
                            height="32"
                            rx="3"
                            fill="#ffffff"
                          />
                          <path
                            d="M38.5 24L43.8 8H48.4L43.1 24H38.5Z"
                            fill="#1A1F71"
                          />
                          <path
                            d="M62.6 8.3C61.4 7.8 59.5 7.4 57.3 7.4C52.1 7.4 48.4 10.2 48.4 14.1C48.4 17 51 18.6 53 19.6C55 20.6 55.7 21.2 55.7 22.1C55.7 23.5 54 24.1 52.5 24.1C50.4 24.1 49.3 23.8 47.7 23.1L47 22.8L46.2 26.6C47.4 27.2 49.7 27.6 52 27.6C57.6 27.6 61.2 24.8 61.2 20.8C61.2 17.5 59.1 16 56.6 14.8C54.8 13.9 53.7 13.3 53.7 12.3C53.7 11.2 55.1 10.7 56.4 10.7C57.9 10.7 59.2 11 60.4 11.5L60.9 11.7L62.6 8.3Z"
                            fill="#1A1F71"
                          />
                          <path
                            d="M70.8 24H75.1L71.4 8H67.4C66.5 8 65.7 8.5 65.4 9.3L58.8 24H63.4L64.3 21.5H69.9L70.8 24ZM65.5 18.1C66.1 16.5 67.4 12.9 67.4 12.9C67.4 12.9 67.8 11.9 68 11.3L69.2 18.1H65.5Z"
                            fill="#1A1F71"
                          />
                          <path
                            d="M34.7 8H30.4C29.4 8 28.7 8.5 28.3 9.4L20.2 24H24.8L25.7 21.5H31.3L32.2 24H36.8L34.7 8ZM22.4 14.7L25 8H20.4L16.2 24H20.8L22.4 14.7Z"
                            fill="#F7B600"
                          />
                          <path
                            d="M22.4 14.7L25 8H20.4L16.2 24H20.8L22.4 14.7Z"
                            fill="#1A1F71"
                          />
                        </svg>
                      </span>

                      {/* Mastercard */}
                      <span className="immi-card-badge" title="Mastercard">
                        <svg width="44" height="20" viewBox="0 0 70 40">
                          <rect
                            width="70"
                            height="40"
                            rx="3"
                            fill="#0A0A0A"
                          />
                          <circle cx="27" cy="20" r="14" fill="#EB001B" />
                          <circle
                            cx="43"
                            cy="20"
                            r="14"
                            fill="#F79E1B"
                            fillOpacity="0.9"
                          />
                        </svg>
                      </span>

                      {/* American Express */}
                      <span className="immi-card-badge" title="American Express">
                        <svg width="44" height="20" viewBox="0 0 60 40">
                          <rect
                            width="60"
                            height="40"
                            rx="3"
                            fill="#0077A6"
                          />
                          <text
                            x="30"
                            y="24"
                            fill="#ffffff"
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="Arial, sans-serif"
                            textAnchor="middle">
                            AMEX
                          </text>
                        </svg>
                      </span>

                      {/* Diners Club */}
                      <span className="immi-card-badge" title="Diners Club">
                        <svg width="44" height="20" viewBox="0 0 65 40">
                          <rect
                            width="65"
                            height="40"
                            rx="3"
                            fill="#ffffff"
                            stroke="#cbd5e1"
                          />
                          <circle cx="20" cy="20" r="11" fill="#004A97" />
                          <path
                            d="M20 12C24.4 12 28 15.6 28 20C28 24.4 24.4 28 20 28V12Z"
                            fill="#ffffff"
                          />
                          <text
                            x="35"
                            y="23"
                            fill="#004A97"
                            fontSize="7.5"
                            fontWeight="bold"
                            fontFamily="Arial, sans-serif">
                            Diners
                          </text>
                        </svg>
                      </span>

                      {/* JCB */}
                      <span className="immi-card-badge" title="JCB">
                        <svg width="44" height="20" viewBox="0 0 60 40">
                          <rect
                            width="60"
                            height="40"
                            rx="3"
                            fill="#ffffff"
                            stroke="#cbd5e1"
                          />
                          <rect
                            x="10"
                            y="8"
                            width="12"
                            height="24"
                            rx="2"
                            fill="#003580"
                          />
                          <rect
                            x="24"
                            y="8"
                            width="12"
                            height="24"
                            rx="2"
                            fill="#D31145"
                          />
                          <rect
                            x="38"
                            y="8"
                            width="12"
                            height="24"
                            rx="2"
                            fill="#008037"
                          />
                          <text
                            x="16"
                            y="23"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="bold"
                            textAnchor="middle">
                            J
                          </text>
                          <text
                            x="30"
                            y="23"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="bold"
                            textAnchor="middle">
                            C
                          </text>
                          <text
                            x="44"
                            y="23"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="bold"
                            textAnchor="middle">
                            B
                          </text>
                        </svg>
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "#333333",
                        marginBottom: "12px",
                      }}>
                      Required field{" "}
                      <span className="immi-prepay-req">*</span>
                    </div>

                    {/* Card input fields matching screenshot */}
                    <table className="immi-prepay-table">
                      <tbody>
                        <tr>
                          <td className="label-cell">
                            Debit/credit card number{" "}
                            <span className="immi-prepay-req">*</span>
                          </td>
                          <td className="value-cell">
                            <input
                              type="text"
                              className="immi-prepay-input"
                              placeholder="required"
                              maxLength="19"
                              style={{ width: "210px" }}
                              value={cardDetails.cardNumber}
                              onChange={(e) =>
                                setCardDetails({
                                  ...cardDetails,
                                  cardNumber: e.target.value,
                                })
                              }
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="label-cell">
                            Expiry date (MM/YY){" "}
                            <span className="immi-prepay-req">*</span>
                          </td>
                          <td className="value-cell">
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}>
                              <select
                                className="immi-prepay-select"
                                style={{ width: "65px" }}
                                value={cardDetails.expiryMonth}
                                onChange={(e) =>
                                  setCardDetails({
                                    ...cardDetails,
                                    expiryMonth: e.target.value,
                                  })
                                }>
                                {Array.from({ length: 12 }, (_, i) => {
                                  const val = String(i + 1).padStart(
                                    2,
                                    "0",
                                  );
                                  return (
                                    <option key={val} value={val}>
                                      {val}
                                    </option>
                                  );
                                })}
                              </select>
                              <select
                                className="immi-prepay-select"
                                style={{ width: "65px" }}
                                value={cardDetails.expiryYear}
                                onChange={(e) =>
                                  setCardDetails({
                                    ...cardDetails,
                                    expiryYear: e.target.value,
                                  })
                                }>
                                {Array.from({ length: 12 }, (_, i) => {
                                  const yr = String(25 + i);
                                  return (
                                    <option key={yr} value={yr}>
                                      {yr}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td className="label-cell">
                            Name on debit/credit card{" "}
                            <span className="immi-prepay-req">*</span>
                          </td>
                          <td className="value-cell">
                            <input
                              type="text"
                              className="immi-prepay-input"
                              placeholder="required"
                              style={{ width: "280px" }}
                              value={cardDetails.nameOnCard}
                              onChange={(e) =>
                                setCardDetails({
                                  ...cardDetails,
                                  nameOnCard: e.target.value,
                                })
                              }
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="label-cell">
                            Card security code (CSC){" "}
                            <span className="immi-prepay-req">*</span>
                          </td>
                          <td className="value-cell">
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "10px",
                              }}>
                              <input
                                type="password"
                                className="immi-prepay-input"
                                placeholder="required"
                                maxLength="4"
                                style={{ width: "70px", minWidth: "70px" }}
                                value={cardDetails.csc}
                                onChange={(e) =>
                                  setCardDetails({
                                    ...cardDetails,
                                    csc: e.target.value,
                                  })
                                }
                              />
                              <a
                                href="#csc"
                                onClick={(e) => {
                                  e.preventDefault();
                                  alert(
                                    "Card Security Code (CSC):\nFor Visa, MasterCard, JCB, and Diners Club, the CSC is the 3-digit number printed on the signature strip on the back of your card.\nFor American Express, it is the 4-digit code printed on the front above the account number.",
                                  );
                                }}
                                style={{
                                  color: "#004b87",
                                  textDecoration: "underline",
                                  fontSize: "11.5px",
                                }}>
                                What is a CSC?
                              </a>
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td className="label-cell">
                            Credit card surcharge (AUD)
                          </td>
                          <td className="value-cell">
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}>
                              <span style={{ fontWeight: "bold" }}>$</span>
                              <input
                                type="text"
                                readOnly
                                className="immi-prepay-input"
                                style={{
                                  width: "75px",
                                  minWidth: "75px",
                                  backgroundColor: "#eef5fc",
                                  color: "#004b87",
                                  fontWeight: "bold",
                                }}
                                value="0.00"
                              />
                              <a
                                href="#surcharge"
                                onClick={(e) => {
                                  e.preventDefault();
                                  alert(
                                    "Credit Card Surcharge:\nA surcharge is applied to payments made by credit card to reflect the costs of processing credit card transactions. Debit cards incur a $0.00 surcharge.",
                                  );
                                }}
                                style={{
                                  color: "#004b87",
                                  textDecoration: "underline",
                                  fontSize: "11.5px",
                                  marginLeft: "6px",
                                }}>
                                What is the surcharge?
                              </a>
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td
                            className="label-cell"
                            style={{
                              fontWeight: "bold",
                              paddingTop: "8px",
                            }}>
                            Total payment amount (AUD)
                          </td>
                          <td
                            className="value-cell"
                            style={{ paddingTop: "8px" }}>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}>
                              <span style={{ fontWeight: "bold" }}>$</span>
                              <span
                                style={{
                                  fontWeight: "bold",
                                  fontSize: "13px",
                                }}>
                                {makePaymentData.isCalculated &&
                                makePaymentData.amount ?
                                  parseFloat(
                                    makePaymentData.amount,
                                  ).toFixed(2)
                                : "0.00"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                : <div
                    style={{
                      padding: "16px 0",
                      fontSize: "12px",
                      color: "#444",
                    }}>
                    <p>
                      You will be securely redirected to{" "}
                      <strong>
                        {selectedPaymentMethod === "paypal" ?
                          "PayPal"
                        : "UnionPay"}
                      </strong>{" "}
                      to complete your payment of{" "}
                      <strong>
                        $
                        {makePaymentData.isCalculated && makePaymentData.amount ?
                          parseFloat(makePaymentData.amount).toFixed(2)
                        : parseFloat(makePaymentData.backendAmount || 0).toFixed(2)
                        }{" "}
                        AUD
                      </strong>
                      .
                    </p>
                  </div>
                }

                {/* Bottom actions: Cancel on left, Submit on right */}
                <div className="immi-options-actions">
                  <button
                    type="button"
                    className="immi-btn-classic"
                    onClick={() => {
                      setActiveSection("manage-payments");
                      navigate("/user-portal");
                    }}>
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="immi-btn-classic"
                    style={{ fontWeight: "bold", minWidth: "75px" }}
                    disabled={isPaymentProcessing}
                    onClick={handleSubmitPrePayment}>
                    {isPaymentProcessing ? "Processing..." : "Submit"}
                  </button>
                </div>
              </div>
            )}
          </div>
        : activeSection === "manage-payments" ?
          <div className="immi-dashboard-card immi-payments-card">
            {/* Subheader Banner */}
            <div className="immi-summary-banner">
              <span className="immi-summary-title">Manage Payments</span>
            </div>

            <div className="immi-payments-content">
              {/* Top buttons row */}
              <div className="immi-gov-top-actions">
                <div className="immi-gov-btn-group">
                  <button
                    type="button"
                    className="immi-gov-btn"
                    onClick={() => {
                      handleOpenMakePayment(payments[0] || {});
                    }}>
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                      <line x1="5" y1="15" x2="9" y2="15" strokeWidth="2" />
                    </svg>
                    <span>Pre-pay Paper Service</span>
                  </button>

                  <button
                    type="button"
                    className="immi-gov-btn"
                    onClick={() => {
                      setPaymentSuccessData(null);
                      setInvoiceForm((prev) => ({
                        ...prev,
                        name: paymentUserFullName,
                      }));
                      setShowPayInvoiceModal(true);
                    }}>
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                      <line x1="8" y1="16" x2="13" y2="16" />
                    </svg>
                    <span>Pay an Invoice</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="immi-help-circle"
                  title="Click for help on Manage Payments"
                  onClick={() => setShowPaymentHelpModal(true)}>
                  ?
                </button>
              </div>

              {/* Transaction History & Advanced Search row */}
              <div className="immi-history-search-row">
                <div className="immi-history-group">
                  <label htmlFor="tx-history" className="immi-history-label">
                    Transaction History
                  </label>
                  <select
                    id="tx-history"
                    className="immi-history-select"
                    value={historyRange}
                    onChange={(e) => setHistoryRange(e.target.value)}>
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="60">Last 60 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="365">Last 12 Months</option>
                    <option value="all">All</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="immi-adv-search-link"
                  onClick={() =>
                    setShowPaymentAdvSearch(!showPaymentAdvSearch)
                  }>
                  Advanced Search
                </button>
              </div>

              {/* Expandable Advanced Search Panel */}
              {showPaymentAdvSearch && (
                <div
                  className="immi-advanced-search-panel"
                  style={{ margin: "4px 0 12px 0" }}>
                  <div className="immi-adv-grid">
                    <div>
                      <label>Reference No.:</label>
                      <input
                        type="text"
                        value={paymentAdvFilters.ref}
                        onChange={(e) =>
                          setPaymentAdvFilters({
                            ...paymentAdvFilters,
                            ref: e.target.value,
                          })
                        }
                        placeholder="e.g. INV-2026..."
                      />
                    </div>
                    <div>
                      <label>From Date:</label>
                      <input
                        type="date"
                        value={paymentAdvFilters.fromDate}
                        onChange={(e) =>
                          setPaymentAdvFilters({
                            ...paymentAdvFilters,
                            fromDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label>To Date:</label>
                      <input
                        type="date"
                        value={paymentAdvFilters.toDate}
                        onChange={(e) =>
                          setPaymentAdvFilters({
                            ...paymentAdvFilters,
                            toDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label>Status:</label>
                      <select
                        value={paymentAdvFilters.status}
                        onChange={(e) =>
                          setPaymentAdvFilters({
                            ...paymentAdvFilters,
                            status: e.target.value,
                          })
                        }>
                        <option value="">All statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>
                  <div className="immi-adv-actions">
                    <button
                      type="button"
                      className="immi-btn-sm"
                      onClick={() => {
                        setPaymentAdvFilters({
                          ref: "",
                          fromDate: "",
                          toDate: "",
                          status: "",
                        });
                        setPaymentFilter("");
                      }}>
                      Reset
                    </button>
                    <button
                      type="button"
                      className="immi-btn-primary-sm"
                      onClick={() => setShowPaymentAdvSearch(false)}>
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Filter row (right aligned) */}
              <div className="immi-payments-filter-row">
                <label htmlFor="payments-filter" className="immi-filter-label">
                  Filter:
                </label>
                <input
                  id="payments-filter"
                  type="text"
                  className="immi-filter-input"
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                />
              </div>

              {/* Payments Data Table */}
              <div className="immi-payments-table-wrap">
                <table className="immi-payments-table">
                  <thead>
                    <tr>
                      <th
                        className={
                          paymentSortCol === "type" ? "col-sorted" : ""
                        }
                        onClick={() => handlePaymentSort("type")}>
                        Type{" "}
                        {paymentSortCol === "type" ?
                          paymentSortDir === "desc" ?
                            "▼"
                          : "▲"
                        : <span className="immi-sort-icon">◇</span>}
                      </th>
                      <th
                        className={paymentSortCol === "ref" ? "col-sorted" : ""}
                        onClick={() => handlePaymentSort("ref")}>
                        Reference No.{" "}
                        {paymentSortCol === "ref" ?
                          paymentSortDir === "desc" ?
                            "▼"
                          : "▲"
                        : <span className="immi-sort-icon">◇</span>}
                      </th>
                      <th
                        className={
                          paymentSortCol === "name" ? "col-sorted" : ""
                        }
                        onClick={() => handlePaymentSort("name")}>
                        Name{" "}
                        {paymentSortCol === "name" ?
                          paymentSortDir === "desc" ?
                            "▼"
                          : "▲"
                        : <span className="immi-sort-icon">◇</span>}
                      </th>
                      <th
                        className={
                          paymentSortCol === "date" ? "col-sorted" : ""
                        }
                        onClick={() => handlePaymentSort("date")}>
                        Transaction Date{" "}
                        {paymentSortCol === "date" ?
                          paymentSortDir === "desc" ?
                            "▼"
                          : "▲"
                        : <span className="immi-sort-icon">◇</span>}
                      </th>
                      <th
                        className={
                          paymentSortCol === "office" ? "col-sorted" : ""
                        }
                        onClick={() => handlePaymentSort("office")}>
                        Issuing Office{" "}
                        {paymentSortCol === "office" ?
                          paymentSortDir === "desc" ?
                            "▼"
                          : "▲"
                        : <span className="immi-sort-icon">◇</span>}
                      </th>
                      <th
                        className={
                          paymentSortCol === "internalRef" ? "col-sorted" : ""
                        }
                        onClick={() => handlePaymentSort("internalRef")}>
                        Internal Ref.{" "}
                        {paymentSortCol === "internalRef" ?
                          paymentSortDir === "desc" ?
                            "▼"
                          : "▲"
                        : <span className="immi-sort-icon">◇</span>}
                      </th>
                      <th
                        className={
                          paymentSortCol === "currency" ? "col-sorted" : ""
                        }
                        onClick={() => handlePaymentSort("currency")}>
                        Currency{" "}
                        {paymentSortCol === "currency" ?
                          paymentSortDir === "desc" ?
                            "▼"
                          : "▲"
                        : <span className="immi-sort-icon">◇</span>}
                      </th>
                      <th
                        className={
                          paymentSortCol === "amount" ? "col-sorted" : ""
                        }
                        onClick={() => handlePaymentSort("amount")}>
                        Amount{" "}
                        {paymentSortCol === "amount" ?
                          paymentSortDir === "desc" ?
                            "▼"
                          : "▲"
                        : ""}
                      </th>
                      <th
                        className={
                          paymentSortCol === "status" ? "col-sorted" : ""
                        }
                        onClick={() => handlePaymentSort("status")}>
                        Status{" "}
                        {paymentSortCol === "status" ?
                          paymentSortDir === "desc" ?
                            "▼"
                          : "▲"
                        : <span className="immi-sort-icon">◇</span>}
                      </th>
                      <th>Select Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ?
                      <tr className="empty-row">
                        <td colSpan="10">No data available in table</td>
                      </tr>
                    : filteredPayments.map((p, idx) => (
                        <tr key={p.id || p.ref || idx}>
                          <td>{p.type || "Invoice Payment"}</td>
                          <td>
                            <strong>{p.ref}</strong>
                          </td>
                          <td>{getPaymentDisplayName(p)}</td>
                          <td>{p.date}</td>
                          <td>{p.office || "Online Payments Centre"}</td>
                          <td>{p.internalRef || "—"}</td>
                          <td>{p.currency || "AUD"}</td>
                          <td>${Number(p.amount).toFixed(2)}</td>
                          <td>
                            <span
                              className={`immi-status-badge ${(p.status || "").toLowerCase() === "pending" ? "status-submitted" : "status-approved"}`}>
                              {p.status || "Paid"}
                            </span>
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              whiteSpace: "nowrap",
                            }}>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                              }}>
                              {(p.status || "").toLowerCase() === "pending" ?
                                <button
                                  type="button"
                                  className="immi-view-details-btn immi-pay-action-btn"
                                  onClick={() => handleOpenMakePayment(p)}
                                  title="Make payment for this invoice">
                                  Make payment
                                </button>
                              : <button
                                  type="button"
                                  className="immi-view-details-btn"
                                  onClick={() => setPaymentReceipt(p)}
                                  title="View payment receipt">
                                  View Receipt
                                </button>
                              }
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>

              {/* Table pagination and entries info */}
              <div className="immi-payments-foot-row">
                <div className="immi-dt-info">
                  {filteredPayments.length === 0 ?
                    "Showing 0 to 0 of 0 entries"
                  : `Showing 1 to ${filteredPayments.length} of ${filteredPayments.length} entries`
                  }
                </div>
                <div className="immi-paginate-buttons">
                  <button
                    type="button"
                    className={`immi-paginate-btn ${filteredPayments.length > 0 ? "active" : ""}`}
                    disabled={filteredPayments.length === 0}>
                    First
                  </button>
                  <button
                    type="button"
                    className={`immi-paginate-btn ${filteredPayments.length > 0 ? "active" : ""}`}
                    disabled={filteredPayments.length === 0}>
                    Previous
                  </button>
                  <button
                    type="button"
                    className={`immi-paginate-btn ${filteredPayments.length > 0 ? "active" : ""}`}
                    disabled={filteredPayments.length === 0}>
                    Next
                  </button>
                  <button
                    type="button"
                    className={`immi-paginate-btn ${filteredPayments.length > 0 ? "active" : ""}`}
                    disabled={filteredPayments.length === 0}>
                    Last
                  </button>
                </div>
              </div>
            </div>
          </div>
        : <div className="immi-dashboard-card">
            {/* Subheader Banner */}
            <div className="immi-summary-banner">
              <span className="immi-summary-title">
                My applications summary
              </span>
              <button
                className="immi-help-circle"
                title="Click for help on My applications summary"
                onClick={() => setShowHelpModal(true)}>
                ?
              </button>
            </div>

            {/* Action links */}
            <div className="immi-dashboard-actions">
              <button
                className="immi-action-link"
                onClick={() => setShowNewAppModal(true)}>
                <svg
                  className="immi-action-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <span>New application</span>
              </button>

              <button
                className="immi-action-link"
                onClick={() => setShowImportModal(true)}>
                <svg
                  className="immi-action-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  <polyline points="12 11 12 17 15 14"></polyline>
                  <line x1="9" y1="14" x2="15" y2="14"></line>
                </svg>
                <span>Import application</span>
              </button>

              <button
                className="immi-action-link"
                onClick={() =>
                  alert(
                    "No unsubmitted draft applications found in your queue.",
                  )
                }>
                <svg
                  className="immi-action-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                </svg>
                <span>Submit applications</span>
              </button>
            </div>

            {/* Quick & Advanced Search Bar */}
            <div className="immi-search-row">
              <div className="immi-search-box-wrapper">
                <button className="immi-search-icon-btn" title="Search">
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
                <input
                  type="text"
                  className="immi-quick-search-input"
                  placeholder="Quick search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                className="immi-advanced-search-toggle"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}>
                {showAdvancedSearch ?
                  "▴ Hide advanced search"
                : "▾ Advanced search"}
              </button>
            </div>

            {/* Advanced Search Filter Panel */}
            {showAdvancedSearch && (
              <div className="immi-advanced-search-panel">
                <div className="immi-adv-grid">
                  <div>
                    <label>Application / Subclass:</label>
                    <input
                      type="text"
                      value={advFilters.subclass}
                      onChange={(e) =>
                        setAdvFilters({
                          ...advFilters,
                          subclass: e.target.value,
                        })
                      }
                      placeholder="e.g. 600, 500"
                    />
                  </div>
                  <div>
                    <label>Reference (TRN or Grant):</label>
                    <input
                      type="text"
                      value={advFilters.trn}
                      onChange={(e) =>
                        setAdvFilters({ ...advFilters, trn: e.target.value })
                      }
                      placeholder="e.g. EGPC0..."
                    />
                  </div>
                  <div>
                    <label>Status:</label>
                    <select
                      value={advFilters.status}
                      onChange={(e) =>
                        setAdvFilters({ ...advFilters, status: e.target.value })
                      }>
                      <option value="">All statuses</option>
                      <option value="Received">Received</option>
                      <option value="In Effect">In Effect</option>
                      <option value="Finalised">Finalised</option>
                      <option value="Approved">Approved</option>
                    </select>
                  </div>
                </div>
                <div className="immi-adv-actions">
                  <button
                    className="immi-btn-sm"
                    onClick={() => {
                      setAdvFilters({ subclass: "", trn: "", status: "" });
                      setSearchQuery("");
                    }}>
                    Reset
                  </button>
                  <button
                    className="immi-btn-primary-sm"
                    onClick={() => setShowAdvancedSearch(false)}>
                    Apply Filters
                  </button>
                </div>
              </div>
            )}

            {/* Section title */}
            <div className="immi-list-heading-row">
              <h2 className="immi-list-title">List of applications</h2>
            </div>

            {/* Controls row */}
            <div className="immi-controls-row">
              <div className="immi-sort-section">
                <label>Sort by</label>
                <select
                  className="immi-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}>
                  <option value="lastUpdated">Last updated</option>
                  <option value="application">Application</option>
                  <option value="reference">Reference</option>
                  <option value="applicant">Primary applicant</option>
                  <option value="status">Status</option>
                </select>

                <div className="immi-view-toggles">
                  <button
                    className={`immi-view-btn ${viewMode === "table" ? "active" : ""}`}
                    onClick={() => setViewMode("table")}
                    title="Table view">
                    • | ☷
                  </button>
                </div>

                <button
                  className="immi-refresh-link"
                  onClick={fetchUserApplications}>
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Applications Table / Empty State */}
            <div className="immi-applications-container">
              {isLoading ?
                <div className="immi-loading">Loading applications...</div>
              : filteredVisas.length === 0 ?
                <div className="immi-no-results">No results found</div>
              : <table className="immi-applications-table">
                  <thead>
                    <tr>
                      <th>Application</th>
                      <th>Reference</th>
                      <th>Primary applicant</th>
                      <th>Status</th>
                      <th>Last updated</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisas.map((visa) => (
                      <tr
                        key={visa._id || visa.trn || Math.random()}
                        className="immi-app-row">
                        <td className="immi-cell-app">
                          <strong>{visa.visaType || "Visa"}</strong> (
                          {visa.visaClassSubclass || "Visitor"})
                        </td>
                        <td className="immi-cell-trn">
                          {visa.trn || visa.visaGrantNumber || "—"}
                        </td>
                        <td className="immi-cell-name">
                          {visa.familyName ?
                            `${visa.familyName.toUpperCase()}, ${visa.givenNames}`
                          : "—"}
                        </td>
                        <td className="immi-cell-status">
                          <span
                            className={`immi-status-badge status-${(visa.visaStatus || "received").toLowerCase().replace(/\s+/g, "-")}`}>
                            {visa.visaStatus || "Received"}
                          </span>
                        </td>
                        <td className="immi-cell-date">
                          {formatDate(
                            visa.updatedAt ||
                              visa.createdAt ||
                              visa.visaGrantDate,
                          )}
                        </td>
                        <td
                          className="immi-cell-actions"
                          style={{ textAlign: "center" }}>
                          <button
                            className="immi-view-details-btn"
                            onClick={() => setSelectedVisa(visa)}>
                            View details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          </div>
        }

        {/* Footer */}
        <footer
          className={`immi-dashboard-footer ${activeSection === "manage-payments" || activeSection === "make-payment-section" ? "payments-footer" : ""}`}>
          <ul className="immi-footer-links">
            <li>
              <a href="#accessibility" onClick={(e) => e.preventDefault()}>
                Accessibility
              </a>
            </li>
            <li>
              <a href="#copyright" onClick={(e) => e.preventDefault()}>
                Copyright &amp; Disclaimer
              </a>
            </li>
            <li>
              <a href="#security" onClick={(e) => e.preventDefault()}>
                Online Security
              </a>
            </li>
            <li>
              <a href="#privacy" onClick={(e) => e.preventDefault()}>
                Privacy
              </a>
            </li>
          </ul>
        </footer>
      </main>

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* 1. Visa Application Details Modal */}
      {selectedVisa && (
        <div
          className="immi-modal-backdrop"
          onClick={() => setSelectedVisa(null)}>
          <div
            className="immi-modal-content"
            onClick={(e) => e.stopPropagation()}>
            <div className="immi-modal-header">
              <h3>Application Details &amp; Summary</h3>
              <button
                className="immi-modal-close-btn"
                onClick={() => setSelectedVisa(null)}>
                ✕
              </button>
            </div>
            <div className="immi-modal-body">
              <table className="immi-details-table">
                <tbody>
                  <tr>
                    <th>Visa Type / Subclass</th>
                    <td>
                      {selectedVisa.visaType} ({selectedVisa.visaClassSubclass})
                    </td>
                  </tr>
                  <tr>
                    <th>Reference (TRN)</th>
                    <td>
                      <strong>{selectedVisa.trn || "—"}</strong>
                    </td>
                  </tr>
                  <tr>
                    <th>Visa Grant Number</th>
                    <td>{selectedVisa.visaGrantNumber || "—"}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>
                      <span
                        className={`immi-status-badge status-${(selectedVisa.visaStatus || "received").toLowerCase().replace(/\s+/g, "-")}`}>
                        {selectedVisa.visaStatus || "Received"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>Primary Applicant</th>
                    <td>
                      {selectedVisa.familyName ?
                        `${selectedVisa.familyName.toUpperCase()}, ${selectedVisa.givenNames}`
                      : "—"}
                    </td>
                  </tr>
                  <tr>
                    <th>Date of Birth</th>
                    <td>{selectedVisa.dateOfBirth || "—"}</td>
                  </tr>
                  <tr>
                    <th>Nationality</th>
                    <td>{selectedVisa.nationality || "—"}</td>
                  </tr>
                  <tr>
                    <th>Passport / Document Number</th>
                    <td>{selectedVisa.documentNumber || "—"}</td>
                  </tr>
                  <tr>
                    <th>Entries Allowed</th>
                    <td>{selectedVisa.entriesAllowed || "Multiple"}</td>
                  </tr>
                  <tr>
                    <th>Period of Stay</th>
                    <td>{selectedVisa.periodOfStay || "Indefinite"}</td>
                  </tr>
                  {selectedVisa.visaGrantDate && (
                    <tr>
                      <th>Grant Date</th>
                      <td>{formatDate(selectedVisa.visaGrantDate)}</td>
                    </tr>
                  )}
                  {selectedVisa.visaExpiryDate && (
                    <tr>
                      <th>Expiry Date</th>
                      <td>{formatDate(selectedVisa.visaExpiryDate)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Attached Documents / Grant Letter */}
              <div>
                <h4
                  style={{
                    margin: "15px 0 8px 0",
                    color: "#002b49",
                    fontSize: "13px",
                  }}>
                  Attached Documents &amp; Notices
                </h4>
                {selectedVisa.document && selectedVisa.document.length > 0 ?
                  <ul className="immi-docs-list">
                    {selectedVisa.document.map((doc, idx) => (
                      <li key={idx} className="immi-doc-item">
                        <span>
                          📄{" "}
                          {doc.name ||
                            doc.documentName ||
                            `Document ${idx + 1}`}
                        </span>
                        {doc.url ?
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="immi-doc-download-btn">
                            View / Download PDF
                          </a>
                        : <span style={{ color: "#888", fontSize: "11px" }}>
                            Processed
                          </span>
                        }
                      </li>
                    ))}
                  </ul>
                : <p style={{ color: "#666", fontStyle: "italic", margin: 0 }}>
                    No correspondence files attached to this application yet.
                  </p>
                }
              </div>
            </div>
            <div className="immi-modal-footer">
              <button
                className="immi-btn-cancel"
                onClick={() => setSelectedVisa(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Import Application Modal */}
      {showImportModal && (
        <div
          className="immi-modal-backdrop"
          onClick={() => setShowImportModal(false)}>
          <div
            className="immi-modal-content"
            onClick={(e) => e.stopPropagation()}>
            <div className="immi-modal-header">
              <h3>Import an Application to ImmiAccount</h3>
              <button
                className="immi-modal-close-btn"
                onClick={() => setShowImportModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleImportApplication}>
              <div className="immi-modal-body">
                <p style={{ marginTop: 0 }}>
                  Enter your Transaction Reference Number (TRN) or Visa Grant
                  Number to import and link an existing application to your
                  ImmiAccount.
                </p>

                {importError && (
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#ffebee",
                      color: "#c62828",
                      border: "1px solid #ffcdd2",
                      marginBottom: "14px",
                      borderRadius: "2px",
                    }}>
                    {importError}
                  </div>
                )}

                <div className="immi-form">
                  <div className="immi-form-row">
                    <div className="immi-label-col" style={{ width: "180px" }}>
                      <label>Visa Grant Number:</label>
                    </div>
                    <div className="immi-input-col">
                      <input
                        type="text"
                        value={importGrantNumber}
                        onChange={(e) => setImportGrantNumber(e.target.value)}
                        placeholder="e.g. 13-digit number"
                      />
                    </div>
                  </div>

                  <div className="immi-form-row">
                    <div className="immi-label-col" style={{ width: "180px" }}>
                      <label>Or Reference (TRN):</label>
                    </div>
                    <div className="immi-input-col">
                      <input
                        type="text"
                        value={importTrn}
                        onChange={(e) => setImportTrn(e.target.value)}
                        placeholder="e.g. EGPC0V1DUT"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="immi-modal-footer">
                <button
                  type="button"
                  className="immi-btn-cancel"
                  onClick={() => setShowImportModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="immi-btn-primary-sm"
                  disabled={importLoading}>
                  {importLoading ? "Searching..." : "Import Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. New Application Modal */}
      {showNewAppModal && (
        <div
          className="immi-modal-backdrop"
          onClick={() => setShowNewAppModal(false)}>
          <div
            className="immi-modal-content"
            onClick={(e) => e.stopPropagation()}>
            <div className="immi-modal-header">
              <h3>Start a New Application</h3>
              <button
                className="immi-modal-close-btn"
                onClick={() => setShowNewAppModal(false)}>
                ✕
              </button>
            </div>
            <div className="immi-modal-body">
              <p style={{ marginTop: 0 }}>
                Select the visa category you wish to apply for:
              </p>
              <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
                <li>
                  <strong>Visitor Visas</strong> — Subclass 600 (Tourist,
                  Business Visitor, Sponsored Family stream)
                </li>
                <li>
                  <strong>Student &amp; Training</strong> — Subclass 500
                  (Student Visa), Subclass 407 (Training)
                </li>
                <li>
                  <strong>Working Holiday</strong> — Subclass 417 / 462
                </li>
                <li>
                  <strong>Skilled Migration</strong> — Subclass 189 / 190 / 491
                </li>
                <li>
                  <strong>Family &amp; Partner</strong> — Subclass 820 / 801
                  Partner Visa
                </li>
              </ul>
              <div className="immi-info-box" style={{ marginTop: "15px" }}>
                <div className="immi-info-header">Online Lodgement Notice</div>
                <div className="immi-info-body">
                  Ensure all supporting identity documents and health
                  examination requirements are prepared before initiating
                  lodging.
                </div>
              </div>
            </div>
            <div className="immi-modal-footer">
              <button
                className="immi-btn-cancel"
                onClick={() => setShowNewAppModal(false)}>
                Cancel
              </button>
              <button
                className="immi-btn-primary-sm"
                onClick={() => {
                  setShowNewAppModal(false);
                  alert(
                    "New lodgement stream initialized. Please contact your registered migration agent or submit requested forms.",
                  );
                }}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Help and Support Modal */}
      {showHelpModal && (
        <div
          className="immi-modal-backdrop"
          onClick={() => setShowHelpModal(false)}>
          <div
            className="immi-modal-content"
            onClick={(e) => e.stopPropagation()}>
            <div className="immi-modal-header">
              <h3>My Applications Summary — Help</h3>
              <button
                className="immi-modal-close-btn"
                onClick={() => setShowHelpModal(false)}>
                ✕
              </button>
            </div>
            <div className="immi-modal-body">
              <h4 style={{ color: "#002b49", marginTop: 0 }}>
                Navigating Your Applications
              </h4>
              <p>
                The <strong>My applications summary</strong> page lists all visa
                applications and notices connected to your ImmiAccount:
              </p>
              <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
                <li>
                  <strong>New application:</strong> Begin an online visa or
                  citizenship application.
                </li>
                <li>
                  <strong>Import application:</strong> Connect an existing
                  application lodged elsewhere using your TRN or Grant Number.
                </li>
                <li>
                  <strong>List of applications:</strong> Shows status, reference
                  numbers, and allows downloading decision notices or
                  acknowledgment letters.
                </li>
                <li>
                  <strong>Refresh:</strong> Checks the Department's database for
                  real-time updates to your application status.
                </li>
              </ul>
            </div>
            <div className="immi-modal-footer">
              <button
                className="immi-btn-cancel"
                onClick={() => setShowHelpModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Manage Account Modal */}
      {showAccountModal && (
        <div
          className="immi-modal-backdrop"
          onClick={() => setShowAccountModal(false)}>
          <div
            className="immi-modal-content"
            onClick={(e) => e.stopPropagation()}>
            <div className="immi-modal-header">
              <h3>Manage ImmiAccount</h3>
              <button
                className="immi-modal-close-btn"
                onClick={() => setShowAccountModal(false)}>
                ✕
              </button>
            </div>
            <div className="immi-modal-body">
              <table className="immi-details-table">
                <tbody>
                  <tr>
                    <th>Account Username</th>
                    <td>{storedUsername}</td>
                  </tr>
                  <tr>
                    <th>User ID</th>
                    <td>
                      <small>{userId || "—"}</small>
                    </td>
                  </tr>
                  <tr>
                    <th>Account Type</th>
                    <td>Individual / Standard User</td>
                  </tr>
                  <tr>
                    <th>Department Origin</th>
                    <td>Australia (AU)</td>
                  </tr>
                  <tr>
                    <th>Session Status</th>
                    <td>
                      <span className="immi-status-badge status-approved">
                        Active
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="immi-modal-footer">
              <button
                className="immi-btn-cancel"
                onClick={() => setShowAccountModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Pay an Invoice Modal */}
      {showPayInvoiceModal && (
        <div
          className="immi-modal-backdrop"
          onClick={() => setShowPayInvoiceModal(false)}>
          <div
            className="immi-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "640px" }}>
            <div className="immi-modal-header">
              <h3>Pay an Invoice — Home Affairs Online Payments</h3>
              <button
                className="immi-modal-close-btn"
                onClick={() => setShowPayInvoiceModal(false)}>
                ✕
              </button>
            </div>
            {paymentSuccessData ?
              <div className="immi-modal-body">
                <div style={{ textAlign: "center", padding: "10px 0 16px 0" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "#e8f5e9",
                      color: "#2e7d32",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px auto",
                      fontSize: "24px",
                      fontWeight: "bold",
                    }}>
                    ✓
                  </div>
                  <h3 style={{ margin: "0 0 6px 0", color: "#002b49" }}>
                    Payment Successful
                  </h3>
                  <p style={{ margin: 0, color: "#666666", fontSize: "12px" }}>
                    Your payment has been processed through the Department of
                    Home Affairs payment gateway.
                  </p>
                </div>

                <div className="immi-receipt-card">
                  <div className="immi-receipt-header">
                    <span className="immi-receipt-title">
                      Official Payment Receipt
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "#2e7d32",
                      }}>
                      APPROVED
                    </span>
                  </div>
                  <table className="immi-receipt-table">
                    <tbody>
                      <tr>
                        <th>Receipt Number:</th>
                        <td>
                          <strong>{paymentSuccessData.id}</strong>
                        </td>
                      </tr>
                      <tr>
                        <th>Invoice / Reference No:</th>
                        <td>{paymentSuccessData.ref}</td>
                      </tr>
                      <tr>
                        <th>Internal Reference:</th>
                        <td>{paymentSuccessData.internalRef}</td>
                      </tr>
                      <tr>
                        <th>Payer Name:</th>
                        <td>{paymentSuccessData.name}</td>
                      </tr>
                      <tr>
                        <th>Transaction Date / Time:</th>
                        <td>{paymentSuccessData.date}</td>
                      </tr>
                      <tr>
                        <th>Payment Method:</th>
                        <td>{paymentSuccessData.cardMask}</td>
                      </tr>
                      <tr>
                        <th>Total Amount Paid:</th>
                        <td>
                          <strong
                            style={{ fontSize: "15px", color: "#002b49" }}>
                            ${paymentSuccessData.amount.toFixed(2)} AUD
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div
                  className="immi-modal-footer"
                  style={{ padding: "10px 0 0 0" }}>
                  <button
                    type="button"
                    className="immi-btn-sm"
                    onClick={() => window.print()}>
                    🖨 Print / Save Receipt
                  </button>
                  <button
                    type="button"
                    className="immi-btn-primary-sm"
                    onClick={() => {
                      setShowPayInvoiceModal(false);
                      setActiveSection("manage-payments");
                    }}>
                    View in Transaction History
                  </button>
                </div>
              </div>
            : <form onSubmit={handlePayInvoiceSubmit}>
                <div className="immi-modal-body">
                  <p
                    style={{ marginTop: 0, fontSize: "12.5px", color: "#444" }}>
                    Pay an outstanding Home Affairs invoice or fee using your
                    Invoice Reference Number.
                  </p>

                  <div className="immi-form">
                    <div className="immi-form-row">
                      <div
                        className="immi-label-col"
                        style={{ width: "180px" }}>
                        <label>Invoice Reference No.: *</label>
                      </div>
                      <div className="immi-input-col">
                        <input
                          type="text"
                          required
                          value={invoiceForm.invoiceNumber}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              invoiceNumber: e.target.value,
                            })
                          }
                          placeholder="e.g. INV-2026-89104"
                        />
                      </div>
                    </div>

                    <div className="immi-form-row">
                      <div
                        className="immi-label-col"
                        style={{ width: "180px" }}>
                        <label>Client ID / TRN (Optional):</label>
                      </div>
                      <div className="immi-input-col">
                        <input
                          type="text"
                          value={invoiceForm.clientId}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              clientId: e.target.value,
                            })
                          }
                          placeholder="e.g. AU-8921-394"
                        />
                      </div>
                    </div>

                    <div className="immi-form-row">
                      <div
                        className="immi-label-col"
                        style={{ width: "180px" }}>
                        <label>Payer Full Name: *</label>
                      </div>
                      <div className="immi-input-col">
                        <input
                          type="text"
                          required
                          value={invoiceForm.name}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="Full Name"
                        />
                      </div>
                    </div>

                    <div className="immi-form-row">
                      <div
                        className="immi-label-col"
                        style={{ width: "180px" }}>
                        <label>Receipt Email: *</label>
                      </div>
                      <div className="immi-input-col">
                        <input
                          type="email"
                          required
                          value={invoiceForm.email}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              email: e.target.value,
                            })
                          }
                          placeholder="email@address.com"
                        />
                      </div>
                    </div>

                    <div className="immi-form-row">
                      <div
                        className="immi-label-col"
                        style={{ width: "180px" }}>
                        <label>Amount (AUD $): *</label>
                      </div>
                      <div className="immi-input-col">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={invoiceForm.amount}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              amount: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div
                      className="immi-form-row"
                      style={{ marginTop: "12px" }}>
                      <div
                        className="immi-label-col"
                        style={{ width: "180px" }}>
                        <label>Card Number: *</label>
                      </div>
                      <div className="immi-input-col">
                        <input
                          type="text"
                          required
                          maxLength="19"
                          value={invoiceForm.cardNumber}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              cardNumber: e.target.value,
                            })
                          }
                          placeholder="•••• •••• •••• ••••"
                        />
                      </div>
                    </div>

                    <div className="immi-form-row">
                      <div
                        className="immi-label-col"
                        style={{ width: "180px" }}>
                        <label>Expiry &amp; CVV: *</label>
                      </div>
                      <div
                        className="immi-input-col"
                        style={{ display: "flex", gap: "10px" }}>
                        <input
                          type="text"
                          required
                          style={{ width: "90px" }}
                          placeholder="MM/YY"
                          value={invoiceForm.cardExpiry}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              cardExpiry: e.target.value,
                            })
                          }
                        />
                        <input
                          type="password"
                          required
                          maxLength="4"
                          style={{ width: "70px" }}
                          placeholder="CVV"
                          value={invoiceForm.cardCvv}
                          onChange={(e) =>
                            setInvoiceForm({
                              ...invoiceForm,
                              cardCvv: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="immi-modal-footer">
                  <button
                    type="button"
                    className="immi-btn-cancel"
                    onClick={() => setShowPayInvoiceModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="immi-btn-primary-sm"
                    disabled={isProcessingPayment}>
                    {isProcessingPayment ?
                      "Processing..."
                    : `Pay Now ($${parseFloat(invoiceForm.amount || 0).toFixed(2)} AUD)`
                    }
                  </button>
                </div>
              </form>
            }
          </div>
        </div>
      )}

      {/* 7. Pre-pay Paper Service Modal */}
      {showPrePayModal && (
        <div
          className="immi-modal-backdrop"
          onClick={() => setShowPrePayModal(false)}>
          <div
            className="immi-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "620px" }}>
            <div className="immi-modal-header">
              <h3>Pre-pay Paper Service — Home Affairs</h3>
              <button
                className="immi-modal-close-btn"
                onClick={() => setShowPrePayModal(false)}>
                ✕
              </button>
            </div>
            {prePaySuccessVoucher ?
              <div className="immi-modal-body">
                <div style={{ textAlign: "center", padding: "10px 0 16px 0" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "#e8f5e9",
                      color: "#2e7d32",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px auto",
                      fontSize: "24px",
                      fontWeight: "bold",
                    }}>
                    ✓
                  </div>
                  <h3 style={{ margin: "0 0 6px 0", color: "#002b49" }}>
                    Pre-payment Voucher Generated
                  </h3>
                  <p style={{ margin: 0, color: "#666666", fontSize: "12px" }}>
                    Attach this pre-payment voucher to the front page of your
                    physical paper visa application.
                  </p>
                </div>

                <div className="immi-receipt-card">
                  <div className="immi-receipt-header">
                    <span className="immi-receipt-title">
                      Department of Home Affairs — Paper Voucher
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "#005a9c",
                      }}>
                      VALID
                    </span>
                  </div>
                  <table className="immi-receipt-table">
                    <tbody>
                      <tr>
                        <th>Voucher Reference:</th>
                        <td>
                          <strong>{prePaySuccessVoucher.voucherNumber}</strong>
                        </td>
                      </tr>
                      <tr>
                        <th>Service Description:</th>
                        <td>{prePaySuccessVoucher.serviceType}</td>
                      </tr>
                      <tr>
                        <th>Applicant Name:</th>
                        <td>{prePaySuccessVoucher.applicantName}</td>
                      </tr>
                      <tr>
                        <th>Passport No.:</th>
                        <td>{prePaySuccessVoucher.passportNumber}</td>
                      </tr>
                      <tr>
                        <th>Fee Paid:</th>
                        <td>
                          <strong>
                            $
                            {parseFloat(prePaySuccessVoucher.amount).toFixed(2)}{" "}
                            AUD
                          </strong>
                        </td>
                      </tr>
                      <tr>
                        <th>Issue Date:</th>
                        <td>{prePaySuccessVoucher.issueDate}</td>
                      </tr>
                      <tr>
                        <th>Valid Until:</th>
                        <td>{prePaySuccessVoucher.validUntil} (30 Days)</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="immi-barcode-box">
                    ||| | ||||| ||| |||| || ||||||| | ||||| |||
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#666",
                        marginTop: "4px",
                      }}>
                      *{prePaySuccessVoucher.voucherNumber}*
                    </div>
                  </div>
                </div>

                <div
                  className="immi-modal-footer"
                  style={{ padding: "10px 0 0 0" }}>
                  <button
                    type="button"
                    className="immi-btn-sm"
                    onClick={() => window.print()}>
                    🖨 Print Voucher
                  </button>
                  <button
                    type="button"
                    className="immi-btn-primary-sm"
                    onClick={() => {
                      setShowPrePayModal(false);
                      setActiveSection("manage-payments");
                    }}>
                    View in Transaction History
                  </button>
                </div>
              </div>
            : <form onSubmit={handlePrePaySubmit}>
                <div className="immi-modal-body">
                  <p
                    style={{ marginTop: 0, fontSize: "12.5px", color: "#444" }}>
                    Generate an official pre-payment voucher before lodging
                    paper application forms or requesting certified biometrics.
                  </p>

                  <div className="immi-form">
                    <div className="immi-form-row">
                      <div
                        className="immi-label-col"
                        style={{ width: "180px" }}>
                        <label>Paper Service Type: *</label>
                      </div>
                      <div className="immi-input-col">
                        <select
                          value={prePayForm.serviceType}
                          onChange={(e) => {
                            const val = e.target.value;
                            let amt = "190.00";
                            if (val.includes("420.00")) amt = "420.00";
                            if (val.includes("85.00")) amt = "85.00";
                            if (val.includes("115.00")) amt = "115.00";
                            setPrePayForm({
                              ...prePayForm,
                              serviceType: val,
                              amount: amt,
                            });
                          }}>
                          <option value="Form 1418 - Visitor Visa Paper Lodgement ($190.00 AUD)">
                            Form 1418 - Visitor Visa Paper Lodgement ($190.00
                            AUD)
                          </option>
                          <option value="Non-Internet Application Charge (NIAC) Surcharge ($420.00 AUD)">
                            Non-Internet Application Charge (NIAC) Surcharge
                            ($420.00 AUD)
                          </option>
                          <option value="Document Certification & Legalisation ($85.00 AUD)">
                            Document Certification &amp; Legalisation ($85.00
                            AUD)
                          </option>
                          <option value="Health Examination Paper Lodgement Fee ($115.00 AUD)">
                            Health Examination Paper Lodgement Fee ($115.00 AUD)
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="immi-form-row">
                      <div
                        className="immi-label-col"
                        style={{ width: "180px" }}>
                        <label>Given Names:</label>
                      </div>
                      <div className="immi-input-col">
                        <input
                          type="text"
                          value={prePayForm.givenNames}
                          onChange={(e) =>
                            setPrePayForm({
                              ...prePayForm,
                              givenNames: e.target.value,
                            })
                          }
                          placeholder="e.g. John"
                        />
                      </div>
                    </div>

                    <div className="immi-form-row">
                      <div
                        className="immi-label-col"
                        style={{ width: "180px" }}>
                        <label>Family Name: *</label>
                      </div>
                      <div className="immi-input-col">
                        <input
                          type="text"
                          required
                          value={prePayForm.familyName}
                          onChange={(e) =>
                            setPrePayForm({
                              ...prePayForm,
                              familyName: e.target.value,
                            })
                          }
                          placeholder="e.g. Smith"
                        />
                      </div>
                    </div>

                    <div className="immi-form-row">
                      <div
                        className="immi-label-col"
                        style={{ width: "180px" }}>
                        <label>Passport / Document No.:</label>
                      </div>
                      <div className="immi-input-col">
                        <input
                          type="text"
                          value={prePayForm.passportNumber}
                          onChange={(e) =>
                            setPrePayForm({
                              ...prePayForm,
                              passportNumber: e.target.value,
                            })
                          }
                          placeholder="e.g. PA1829104"
                        />
                      </div>
                    </div>

                    <div className="immi-form-row">
                      <div
                        className="immi-label-col"
                        style={{ width: "180px" }}>
                        <label>Service Fee (AUD):</label>
                      </div>
                      <div className="immi-input-col">
                        <strong>
                          ${parseFloat(prePayForm.amount).toFixed(2)} AUD
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="immi-modal-footer">
                  <button
                    type="button"
                    className="immi-btn-cancel"
                    onClick={() => setShowPrePayModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="immi-btn-primary-sm">
                    Generate Voucher &amp; Pay
                  </button>
                </div>
              </form>
            }
          </div>
        </div>
      )}

      {/* 8. Payment Help Modal */}
      {showPaymentHelpModal && (
        <div
          className="immi-modal-backdrop"
          onClick={() => setShowPaymentHelpModal(false)}>
          <div
            className="immi-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}>
            <div className="immi-modal-header">
              <h3>Manage Payments — Help</h3>
              <button
                className="immi-modal-close-btn"
                onClick={() => setShowPaymentHelpModal(false)}>
                ✕
              </button>
            </div>
            <div className="immi-modal-body">
              <h4 style={{ color: "#002b49", marginTop: 0 }}>
                Online Payments Assistance
              </h4>
              <p>
                The <strong>Manage Payments</strong> section allows you to
                manage fees, pre-paid vouchers, and invoice transactions for
                Australian visa and citizenship services:
              </p>
              <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
                <li>
                  <strong>Pre-pay Paper Service:</strong> Settle charges for
                  paper-lodged applications and generate official pre-paid
                  barcodes prior to dispatch.
                </li>
                <li>
                  <strong>Pay an Invoice:</strong> Settle outstanding invoices
                  issued by the Department of Home Affairs using credit or debit
                  card.
                </li>
                <li>
                  <strong>Transaction History:</strong> View previous payment
                  transactions within 7, 30, 60, 90 days, or 12 months.
                </li>
                <li>
                  <strong>Payment Enquiries:</strong> If you experience any
                  issues with payments, contact the Home Affairs Payment Support
                  Centre at 131 881.
                </li>
              </ul>
            </div>
            <div className="immi-modal-footer">
              <button
                className="immi-btn-cancel"
                onClick={() => setShowPaymentHelpModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. View Receipt Modal */}
      {paymentReceipt && (
        <div
          className="immi-modal-backdrop"
          onClick={() => setPaymentReceipt(null)}>
          <div
            className="immi-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}>
            <div className="immi-modal-header">
              <h3>Payment Receipt — {paymentReceipt.ref}</h3>
              <button
                className="immi-modal-close-btn"
                onClick={() => setPaymentReceipt(null)}>
                ✕
              </button>
            </div>
            <div className="immi-modal-body">
              <div className="immi-receipt-card">
                <div className="immi-receipt-header">
                  <span className="immi-receipt-title">
                    Transaction Receipt
                  </span>
                  <span className="immi-status-badge status-approved">
                    {paymentReceipt.status || "Paid"}
                  </span>
                </div>
                <table className="immi-receipt-table">
                  <tbody>
                    <tr>
                      <th>Transaction ID:</th>
                      <td>
                        <strong>{paymentReceipt.id}</strong>
                      </td>
                    </tr>
                    <tr>
                      <th>Reference No.:</th>
                      <td>{paymentReceipt.ref}</td>
                    </tr>
                    <tr>
                      <th>Primary Name:</th>
                      <td>{getPaymentDisplayName(paymentReceipt)}</td>
                    </tr>
                    <tr>
                      <th>Date / Time:</th>
                      <td>{paymentReceipt.date}</td>
                    </tr>
                    <tr>
                      <th>Issuing Office:</th>
                      <td>{paymentReceipt.office}</td>
                    </tr>
                    <tr>
                      <th>Currency &amp; Amount:</th>
                      <td>
                        <strong>
                          ${Number(paymentReceipt.amount).toFixed(2)}{" "}
                          {paymentReceipt.currency || "AUD"}
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="immi-modal-footer">
              <button
                type="button"
                className="immi-btn-sm"
                onClick={() => window.print()}>
                🖨 Print
              </button>
              <button
                type="button"
                className="immi-btn-cancel"
                onClick={() => setPaymentReceipt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserPortal;
