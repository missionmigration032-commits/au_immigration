import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./immiaccount.css";
import logoStacked from "../assets/images/logostacked.png";
import {
  fetchRazorpayConfig,
  createRazorpayOrder,
  verifyRazorpayPayment,
  loadRazorpayScript,
} from "../services/razorpayService";

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
  const [nominations, setNominations] = useState([]);
  const [selectedNomination, setSelectedNomination] = useState(null);
  const [appCategoryFilter, setAppCategoryFilter] = useState("all"); // 'all', 'visas', 'nominations'
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [sortBy, setSortBy] = useState("lastUpdated");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'list'

  // Dropdowns & Modals
  const lastPaymentKeyRef = useRef("");
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
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);

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
      setIsPaymentsLoading(true);
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
      } finally {
        setIsPaymentsLoading(false);
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

  // Manage Groups State
  const [groups, setGroups] = useState(() => {
    try {
      const saved = localStorage.getItem("immi_groups");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [groupSortBy, setGroupSortBy] = useState("Expiry Date");
  const [groupSortAsc, setGroupSortAsc] = useState(true);
  const [showExpired, setShowExpired] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState("Organisation");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupExpiry, setNewGroupExpiry] = useState("");

  // Manage Account State - initialized dynamically from logged in user details
  const initialUserDetails = useMemo(() => {
    let uObj = {};
    try {
      uObj = JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {}

    const storedUname = localStorage.getItem("username") || "";

    // 1. Given names
    const gn =
      localStorage.getItem("givenNames") ||
      uObj.givenNames ||
      uObj.firstName ||
      "";

    // 2. Family name
    let fn =
      localStorage.getItem("familyName") ||
      uObj.familyName ||
      uObj.lastName ||
      "";
    if (!fn) {
      if (storedUname && storedUname !== "User" && !storedUname.includes("@")) {
        fn = storedUname.toUpperCase();
      } else {
        fn = "KUNAL";
      }
    }

    // 3. Email
    let em =
      localStorage.getItem("userEmail") ||
      localStorage.getItem("email") ||
      uObj.email ||
      "";
    if (!em) {
      if (storedUname && storedUname.includes("@")) {
        em = storedUname;
      } else {
        em = "kunalkhichy123@gmail.com";
      }
    }

    return { givenNames: gn, familyName: fn, email: em };
  }, []);

  const [manageAccountTab, setManageAccountTab] = useState("Summary");
  const [userGivenNames, setUserGivenNames] = useState(() => initialUserDetails.givenNames);
  const [userFamilyName, setUserFamilyName] = useState(() => initialUserDetails.familyName);
  const [userEmail, setUserEmail] = useState(() => initialUserDetails.email);
  const [userAlertsPref, setUserAlertsPref] = useState(true);
  const [editGivenNames, setEditGivenNames] = useState(() => initialUserDetails.givenNames);
  const [editFamilyName, setEditFamilyName] = useState(() => initialUserDetails.familyName);
  const [editEmail, setEditEmail] = useState(() => initialUserDetails.email);
  const [editConfirmEmail, setEditConfirmEmail] = useState(() => initialUserDetails.email);
  const [currentPasswordVal, setCurrentPasswordVal] = useState("");
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [confirmPasswordVal, setConfirmPasswordVal] = useState("");
  const [mfaOption, setMfaOption] = useState("app");
  const [secretQ1, setSecretQ1] = useState("What was your first pet's name?");
  const [secretA1, setSecretA1] = useState("");
  const [secretQ2, setSecretQ2] = useState("What is your favorite book?");
  const [secretA2, setSecretA2] = useState("");
  const [requestServiceType, setRequestServiceType] = useState("Organisation access");
  const [accountMessage, setAccountMessage] = useState("");

  // Helper to title-case words (e.g. "aman" -> "Aman", "john doe" -> "John Doe")
  const toTitleCase = (str) => {
    if (!str || typeof str !== "string") return "";
    return str
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  // Helper to format primary applicant name in "givenName familyName" format (e.g. "Aman Deep")
  const formatPrimaryApplicantName = (item) => {
    if (!item) return "—";

    let family =
      item.familyName ||
      item.family_name ||
      item.lastName ||
      (typeof item.userId === "object" ? item.userId?.familyName : "") ||
      "";

    let given =
      item.givenNames ||
      item.givenName ||
      item.given_name ||
      item.firstName ||
      (typeof item.userId === "object" ? item.userId?.givenName : "") ||
      "";

    // If both given and family names exist: "givenName familyName"
    if (given && given.trim() && family && family.trim()) {
      return `${toTitleCase(given)} ${toTitleCase(family)}`;
    }

    // If only given name exists
    if (given && given.trim()) {
      return toTitleCase(given);
    }

    // If only family name exists
    if (family && family.trim()) {
      return toTitleCase(family);
    }

    // Check full name or applicantName fields
    const full =
      item.fullName ||
      item.applicantName ||
      item.primaryApplicant ||
      item.name ||
      (typeof item.userId === "object" && item.userId?.name ? item.userId.name : "");

    if (full && typeof full === "string" && full.trim()) {
      const trimmed = full.trim();
      if (trimmed.includes(",")) {
        // e.g. "DEEP, Aman" -> "Aman Deep"
        const [famPart, ...givParts] = trimmed.split(",");
        const givStr = givParts.join(",").trim();
        if (givStr) {
          return `${toTitleCase(givStr)} ${toTitleCase(famPart)}`;
        }
        return toTitleCase(famPart);
      }
      return toTitleCase(trimmed);
    }

    // Check linked user username or account
    if (typeof item.userId === "object" && item.userId?.username) {
      const uname = item.userId.username.trim();
      if (uname && !uname.includes("@")) {
        return toTitleCase(uname);
      }
    }

    // Fallback: Check if user profile has given and/or family name
    const storedGiven = userGivenNames || localStorage.getItem("givenNames") || "";
    const storedFamily = userFamilyName || localStorage.getItem("familyName") || "";
    if (storedGiven && storedFamily) {
      return `${toTitleCase(storedGiven)} ${toTitleCase(storedFamily)}`;
    }
    if (storedGiven) return toTitleCase(storedGiven);
    if (storedFamily) return toTitleCase(storedFamily);

    const uName = storedUsername || localStorage.getItem("username") || "";
    if (uName && uName !== "User" && !uName.includes("@")) {
      return toTitleCase(uName);
    }

    return "—";
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup = {
      id: "GRP-" + Date.now().toString().slice(-6),
      name: newGroupName.trim(),
      type: newGroupType,
      description: newGroupDescription.trim(),
      createdDate: new Date().toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      expiryDate: newGroupExpiry || "Never",
      status: "Active",
    };
    const updated = [newGroup, ...groups];
    setGroups(updated);
    try {
      localStorage.setItem("immi_groups", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    setShowCreateGroupModal(false);
    setNewGroupName("");
    setNewGroupDescription("");
  };

  const handleRefreshGroups = () => {
    try {
      const saved = localStorage.getItem("immi_groups");
      setGroups(saved ? JSON.parse(saved) : []);
    } catch {
      setGroups([]);
    }
  };

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
    paymentType: "Pay for online(s) application",
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
  const [isEditingPaymentDetails, setIsEditingPaymentDetails] = useState(true);
  const [paymentEditForm, setPaymentEditForm] = useState({
    paymentId: null,
    paymentRef: "HA84920155",
    paymentType: "Pay for online(s) application",
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
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const isStripeLoading = isPaymentLoading; // Compatibility alias
  const setIsStripeLoading = setIsPaymentLoading;
  const [razorpayConfig, setRazorpayConfig] = useState({ keyId: "", isConfigured: false });
  const stripeConfig = razorpayConfig; // Compatibility alias
  const [paymentCompletedReceipt, setPaymentCompletedReceipt] = useState(null);
  const [calcNote, setCalcNote] = useState("");
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("razorpay");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  useEffect(() => {
    fetchRazorpayConfig().then((cfg) => {
      if (cfg && (cfg.isConfigured || cfg.keyId)) {
        setRazorpayConfig(cfg);
      }
    });
  }, []);
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

  // Fetch Visas & Nominations for the logged in user
  const fetchUserApplications = async () => {
    if (!token || !userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // 1. Fetch Visas
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

      // 2. Fetch Nominations for user
      try {
        const nomResponse = await fetch(
          `${API_URL}/api/nominations/user/${userId}?origin=au`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (nomResponse.ok) {
          const nomData = await nomResponse.json();
          if (nomData && Array.isArray(nomData.nominations)) {
            setNominations(nomData.nominations);
          } else if (Array.isArray(nomData)) {
            setNominations(nomData);
          }
        }
      } catch (nomErr) {
        console.error("Error fetching user nominations:", nomErr);
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

  // Sync manage-account details with primary visa or nomination application if not manually overridden
  useEffect(() => {
    const primaryApp =
      allVisas && allVisas.length > 0
        ? allVisas[0]
        : nominations && nominations.length > 0
        ? nominations[0]
        : null;

    if (primaryApp) {
      const gName = primaryApp.givenNames || primaryApp.givenName;
      const fName = primaryApp.familyName;
      if (!localStorage.getItem("givenNames") && gName) {
        setUserGivenNames(gName);
        setEditGivenNames(gName);
      }
      if (!localStorage.getItem("familyName") && fName) {
        setUserFamilyName(fName.toUpperCase());
        setEditFamilyName(fName.toUpperCase());
      }
      if (!localStorage.getItem("userEmail")) {
        const vEmail =
          primaryApp.email ||
          primaryApp.applicantEmail ||
          primaryApp.contactEmail ||
          (typeof primaryApp.userId === "object" ? primaryApp.userId?.email : null);
        if (vEmail) {
          setUserEmail(vEmail);
          setEditEmail(vEmail);
          setEditConfirmEmail(vEmail);
        }
      }
    }
  }, [allVisas, nominations]);

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
        return formatPrimaryApplicantName(a).localeCompare(
          formatPrimaryApplicantName(b),
        );
      }
      if (sortBy === "status") {
        return (a.visaStatus || "").localeCompare(b.visaStatus || "");
      }
      return 0;
    });

    return list;
  }, [allVisas, searchQuery, advFilters, sortBy]);

  // Filter and Sort Nominations
  const filteredNominations = useMemo(() => {
    let list = [...nominations];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          (n.visaProgram && n.visaProgram.toLowerCase().includes(q)) ||
          (n.nominationTrn && n.nominationTrn.toLowerCase().includes(q)) ||
          (n.applicationId && n.applicationId.toLowerCase().includes(q)) ||
          (n.fileNumber && n.fileNumber.toLowerCase().includes(q)) ||
          (n.familyName && n.familyName.toLowerCase().includes(q)) ||
          (n.givenName && n.givenName.toLowerCase().includes(q)),
      );
    }

    // Advanced search filters
    if (advFilters.trn.trim()) {
      const trn = advFilters.trn.toLowerCase().trim();
      list = list.filter(
        (n) =>
          (n.nominationTrn && n.nominationTrn.toLowerCase().includes(trn)) ||
          (n.fileNumber && n.fileNumber.toLowerCase().includes(trn)) ||
          (n.applicationId && n.applicationId.toLowerCase().includes(trn)),
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "lastUpdated") {
        const dateA = new Date(a.updatedAt || a.createdAt || a.approvedDate || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || b.approvedDate || 0);
        return dateB - dateA;
      }
      if (sortBy === "application") {
        return (a.visaProgram || "").localeCompare(b.visaProgram || "");
      }
      if (sortBy === "reference") {
        return (a.nominationTrn || a.fileNumber || "").localeCompare(
          b.nominationTrn || b.fileNumber || "",
        );
      }
      if (sortBy === "applicant") {
        return formatPrimaryApplicantName(a).localeCompare(
          formatPrimaryApplicantName(b),
        );
      }
      return 0;
    });

    return list;
  }, [nominations, searchQuery, advFilters, sortBy]);

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
      paymentType: target.type || target.paymentType || "Pay for online(s) application",
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

    const targetPayId = target.id || target._id || "";
    if (targetPayId) {
      localStorage.removeItem(`calc_amount_${targetPayId}`);
    }
    localStorage.removeItem("last_calculated_amount");
    lastPaymentKeyRef.current = `/user-portal/payment?paymentId=${targetPayId}`;
    setMakePaymentData(prepayData);
    setPaymentEditForm(prepayData);
    setIsEditingPaymentDetails(true);
    setPaymentCompletedReceipt(null);
    setCalcNote("");
    setActiveSection("make-payment-section");
    navigate(
      `/user-portal/payment?paymentId=${targetPayId}`,
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
      const qPayId = searchParams.get("paymentId") || "";
      const qCalculatedAmt = searchParams.get("calculatedAmount");
      const currentKey = `${location.pathname}?paymentId=${qPayId}${qCalculatedAmt ? `&amt=${qCalculatedAmt}` : ""}`;

      // Check if we have a calculated amount in localStorage or query
      const storedCalc = qPayId ? localStorage.getItem(`calc_amount_${qPayId}`) : null;
      const latestCalc = qCalculatedAmt || storedCalc;

      // If already initialized for this payment key, do not overwrite or reset isEditingPaymentDetails
      if (lastPaymentKeyRef.current === currentKey && makePaymentData?.paymentId) {
        return;
      }
      lastPaymentKeyRef.current = currentKey;

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

      const isActuallyCalculated = Boolean(latestCalc);
      const effectiveAmt = isActuallyCalculated ? parseFloat(latestCalc).toFixed(2) : "";

      const initialData = {
        paymentId: matchedPay?.id || matchedPay?._id || null,
        paymentRef:
          matchedPay?.ref ||
          matchedPay?.referenceNumber ||
          "HA" + Math.floor(10000000 + Math.random() * 90000000),
        paymentType: matchedPay?.type || matchedPay?.paymentType || "Pay for online(s) application",
        processingOffice:
          matchedPay?.office &&
          matchedPay.office !== "Online Payments Centre" ?
            matchedPay.office
          : "New Delhi",
        familyName: famName,
        givenNames: givName,
        dateOfBirth: dob,
        visaSubclass: subVal || "600 Visitor",
        amount: effectiveAmt,
        backendAmount: matchedPay?.amount !== undefined && matchedPay?.amount !== null ? String(matchedPay.amount) : "",
        isCalculated: isActuallyCalculated,
        comments:
          matchedPay?.comments ||
          (matchedPay?.internalRef && matchedPay.internalRef !== "—" ?
            matchedPay.internalRef
          : "cscsc"),
        status: matchedPay?.status || "Pending",
      };

      setMakePaymentData(initialData);
      setPaymentEditForm(initialData);
      setIsEditingPaymentDetails(true);

      if (isActuallyCalculated) {
        setCalcNote(`Amount calculated: $${effectiveAmt} AUD`);
        setTimeout(() => setCalcNote(""), 5000);
      }
    }
  }, [location.pathname, location.search, payments, allVisas, initialSection]);

  const handleCalculateAmount = () => {
    const targetId = makePaymentData.paymentId || paymentEditForm.paymentId || "";
    const sub = paymentEditForm.visaSubclass || makePaymentData.visaSubclass || "600 Visitor/Tourist outside Australia";
    navigate(`/user-portal/calculate-payment?paymentId=${targetId}&subclass=${encodeURIComponent(sub)}`);
  };

  const handleSavePaymentDetails = async () => {
    if (!paymentEditForm.isCalculated || !paymentEditForm.amount || parseFloat(paymentEditForm.amount) <= 0) {
      alert("Please calculate the payment amount first by clicking the Calculate button.");
      return;
    }
    setIsConfirmingPayment(true);
    try {
      const currentAmount = parseFloat(paymentEditForm.amount).toFixed(2);
      const updatedData = {
        ...paymentEditForm,
        amount: currentAmount,
        isCalculated: true,
      };

      const searchParams = new URLSearchParams(location.search);
      const qPayId = searchParams.get("paymentId") || "";
      const qCalculatedAmt = searchParams.get("calculatedAmount");
      const currentKey = `${location.pathname}?paymentId=${qPayId}${qCalculatedAmt ? `&amt=${qCalculatedAmt}` : ""}`;
      lastPaymentKeyRef.current = currentKey;

      setMakePaymentData(updatedData);
      setPaymentEditForm(updatedData);
      setIsEditingPaymentDetails(false);

      // Smoothly scroll down to the revealed payment options
      setTimeout(() => {
        const paymentOptionsEl = document.querySelector(".immi-payment-options-card");
        if (paymentOptionsEl) {
          paymentOptionsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);

      const targetId = updatedData.paymentId;
      if (targetId) {
        setPayments((prev) =>
          prev.map((p) => {
            if ((p.id || p._id) === targetId) {
              return {
                ...p,
                givenNames: updatedData.givenNames,
                familyName: updatedData.familyName,
                name: `${updatedData.givenNames} ${updatedData.familyName}`,
                amount: updatedData.amount,
                office: updatedData.processingOffice,
                type: updatedData.paymentType,
                comments: updatedData.comments,
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
              givenNames: updatedData.givenNames,
              familyName: updatedData.familyName,
              amount: updatedData.amount,
              issuingOffice: updatedData.processingOffice,
              visaType: updatedData.visaSubclass,
              internalRef: updatedData.comments,
            }),
          });
        } catch (err) {
          console.error("Failed to update payment on backend:", err);
        }
      }
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleInitiateRazorpayPayment = async (targetPayment) => {
    if (!token) {
      alert("Your session has expired. Please log in again to proceed with payment.");
      navigate("/lusc/login");
      return;
    }

    try {
      setIsPaymentLoading(true);

      const pObj = targetPayment || makePaymentData || {};
      const targetId = pObj.paymentId || pObj._id || pObj.id || null;

      // Determine amount
      let amt = parseFloat(pObj.amount || 0);
      if (!amt || isNaN(amt) || amt <= 0) {
        alert("Please calculate the payment amount before proceeding with payment.");
        setIsPaymentLoading(false);
        return;
      }

      // Determine customer email
      let email = localStorage.getItem("userEmail") || localStorage.getItem("email");
      if (!email) {
        try {
          const uObj = JSON.parse(localStorage.getItem("user") || "{}");
          email = uObj.email;
        } catch (e) {}
      }
      if (!email || !email.includes("@")) {
        email = `${(storedUsername || "applicant").toLowerCase().replace(/[^a-z0-9]/g, "") || "applicant"}@immiaccount.homeaffairs.gov.au`;
      }

      // Determine linked visaId if targetId is not available
      let vId = pObj.visaId || (allVisas.length > 0 ? allVisas[0]._id || allVisas[0].id : null);
      if (vId && typeof vId === "object") {
        vId = vId._id || vId.id;
      }

      const payload = {
        amount: amt,
        currency: "AUD",
        origin: "au",
        customerEmail: email,
        comments: pObj.comments || pObj.internalRef || pObj.ref || `Visa Application Charge (${pObj.visaSubclass || "Visitor 600"})`,
      };

      if (targetId) {
        payload.paymentId = targetId;
      } else if (vId) {
        payload.visaId = vId;
      }

      // Ensure Razorpay SDK script is loaded
      await loadRazorpayScript();
      if (typeof window === "undefined" || !window.Razorpay) {
        alert("Failed to load Razorpay Checkout SDK. Please check your network connection and try again.");
        setIsPaymentLoading(false);
        return;
      }

      // Create Razorpay order on backend
      const orderData = await createRazorpayOrder(payload, token);
      if (!orderData || !orderData.orderId) {
        alert("Failed to create Razorpay order: No order ID returned from server.");
        setIsPaymentLoading(false);
        return;
      }

      const keyToUse = orderData.keyId || razorpayConfig.keyId;
      if (!keyToUse) {
        alert("Razorpay Key ID is not configured on the backend. Please check RAZORPAY_KEY_ID in your server configuration.");
        setIsPaymentLoading(false);
        return;
      }

      const options = {
        key: keyToUse,
        amount: orderData.amount,
        currency: orderData.currency || "AUD",
        name: "Australian Government",
        description: `ImmiAccount Fee - ${orderData.referenceNumber || pObj.visaSubclass || "Visitor 600"}`,
        image: "https://immi.homeaffairs.gov.au/Style%20Library/images/logo-ha.png",
        order_id: orderData.orderId,
        method: {
          card: true,
          netbanking: false,
          wallet: false,
          upi: false,
          paylater: false,
          emi: false,
        },
        config: {
          display: {
            blocks: {
              cards: {
                name: "Pay with Card",
                instruments: [
                  {
                    method: "card",
                  },
                ],
              },
            },
            sequence: ["block.cards"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        prefill: {
          name: (storedUsername || "Applicant").toUpperCase(),
          email: email,
        },
        notes: {
          paymentId: orderData.paymentId || "",
          referenceNumber: orderData.referenceNumber || "",
          origin: "au",
        },
        theme: {
          color: "#004b87",
        },
        handler: async function (response) {
          try {
            setIsPaymentLoading(true);
            const verifyRes = await verifyRazorpayPayment(
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: orderData.paymentId,
              },
              token
            );

            if (verifyRes && verifyRes.verified) {
              navigate(
                `/payment/success?order_id=${response.razorpay_order_id}&payment_id=${orderData.paymentId}&razorpay_payment_id=${response.razorpay_payment_id}`
              );
            } else {
              alert(verifyRes?.message || "Payment signature verification failed.");
            }
          } catch (verifyErr) {
            console.error("Razorpay verification error:", verifyErr);
            alert(verifyErr.message || "Failed to verify Razorpay payment on server.");
          } finally {
            setIsPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsPaymentLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        console.error("Razorpay payment failed:", response.error);
        alert(`Payment failed: ${response.error?.description || response.error?.reason || "Transaction was declined."}`);
        setIsPaymentLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error("Razorpay Checkout Error:", err);
      alert(err.message || "An error occurred while connecting to Razorpay Checkout.");
      setIsPaymentLoading(false);
    }
  };

  const handleInitiateStripeCheckout = handleInitiateRazorpayPayment;

  const handleSubmitPrePayment = () => {
    if (selectedPaymentMethod === "paypal") {
      alert(
        "Technical Error: The PayPal payment service is temporarily unavailable due to a technical error. Please select an alternative payment option (such as Credit / Debit Card) to complete your transaction."
      );
      return;
    }
    handleInitiateRazorpayPayment(makePaymentData);
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
      {/* 1. Top Utility Header Bar (Dark Navy) */}
      <div className="immi-header-top-bar">
        <div className="immi-header-user-row">
          <span className="immi-header-username">
            {(userFamilyName || (storedUsername && storedUsername !== "User" ? storedUsername : "") || "KUNAL").toUpperCase()}
          </span>
          {activeSection === "manage-account" ? (
            <button
              type="button"
              className="immi-header-link"
              onClick={() => {
                setActiveSection("applications");
                navigate("/user-portal");
              }}>
              Return to Online Lodgement
            </button>
          ) : (
            <button
              type="button"
              className="immi-header-link"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSection("manage-account");
              }}>
              Manage Account
            </button>
          )}
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
      </div>

      {/* 2. Main Branding Header Banner (Blue Gradient) */}
      <header className="immi-header">
        <div className="immi-header-left">
          <img
            src={logoStacked}
            alt="Australian Government Department of Home Affairs"
            className="immi-header-logo-stacked"
          />
        </div>
        <div className="immi-header-right">
          <h1>
            {activeSection === "manage-account" ?
              "Manage my ImmiAccount"
            : activeSection === "manage-payments" ||
              activeSection === "make-payment-section" ?
              "Online Payments"
            : "ImmiAccount"}
          </h1>
        </div>
      </header>

      {/* 2. Navigation Tabs Bar */}
      <nav className="immi-nav-bar">
        <div className="immi-nav-container">
          {activeSection === "manage-account" ? (
            <>
              {[
                "Summary",
                "Account details",
                "Email address",
                "Password",
                "Secret questions",
                "Multi-factor authentication",
                "Alert preferences",
                "Request access",
              ].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`immi-nav-tab ${manageAccountTab === tab ? "active" : ""}`}
                  onClick={() => setManageAccountTab(tab)}>
                  {tab}
                </button>
              ))}
            </>
          ) : (
            <>
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
                  className={`immi-nav-tab ${activeSection === "manage-payments" || activeSection === "make-payment-section" ? "active" : ""} ${openDropdown === "payments" ? "dropdown-open" : ""}`}
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
                className={`immi-nav-tab ${activeSection === "groups" ? "active" : ""}`}
                onClick={() => {
                  setActiveSection("groups");
                  navigate("/user-portal");
                }}>
                Manage groups
              </button>

              <div className="immi-nav-dropdown-wrapper">
                <button
                  type="button"
                  className={`immi-nav-tab ${openDropdown === "links" ? "dropdown-open" : ""}`}
                  onClick={(e) => toggleDropdown("links", e)}>
                  Related links <span className="caret">▾</span>
                </button>
                {openDropdown === "links" && (
                  <div
                    className="immi-dropdown-menu"
                    onClick={(e) => e.stopPropagation()}>
                    <a
                      href="https://www.mara.gov.au"
                      target="_blank"
                      rel="noreferrer">
                      MARA
                    </a>
                    <a
                      href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder"
                      target="_blank"
                      rel="noreferrer">
                      Visa finder
                    </a>
                    <a
                      href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/fees-and-charges/visa-pricing-estimator"
                      target="_blank"
                      rel="noreferrer">
                      Pricing estimator
                    </a>
                    <a
                      href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/fees-and-charges/current-visa-pricing"
                      target="_blank"
                      rel="noreferrer">
                      Visa pricing table
                    </a>
                    <a href="/evo/firstParty">
                      Visa entitlements (VEVO)
                    </a>
                    <a
                      href="https://immi.homeaffairs.gov.au/help-support/departmental-forms"
                      target="_blank"
                      rel="noreferrer">
                      Forms
                    </a>
                    <a
                      href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/maritime-crew-988/status-enquiry"
                      target="_blank"
                      rel="noreferrer">
                      Maritime Crew visa status enquiry
                    </a>
                    <a
                      href="https://immi.homeaffairs.gov.au/citizenship/test-and-interview/our-common-bond"
                      target="_blank"
                      rel="noreferrer">
                      Prepare for the citizenship test
                    </a>
                  </div>
                )}
              </div>

              <div className="immi-nav-dropdown-wrapper">
                <button
                  type="button"
                  className={`immi-nav-tab ${openDropdown === "help" ? "dropdown-open" : ""}`}
                  onClick={(e) => toggleDropdown("help", e)}>
                  Help and support <span className="caret">▾</span>
                </button>
                {openDropdown === "help" && (
                  <div
                    className="immi-dropdown-menu"
                    onClick={(e) => e.stopPropagation()}>
                    <a
                      href="https://immi.homeaffairs.gov.au/settling-in-australia/help-with-english/learn-english/free-translating-service"
                      target="_blank"
                      rel="noreferrer">
                      Translation services
                    </a>
                    <a
                      href="https://immi.homeaffairs.gov.au/help-support/departmental-forms/online-forms/complaints-compliments-and-feedback"
                      target="_blank"
                      rel="noreferrer">
                      Client feedback
                    </a>
                    <a
                      href="https://immi.homeaffairs.gov.au/help-support/contact-us"
                      target="_blank"
                      rel="noreferrer">
                      Contact us
                    </a>
                    <a
                      href="https://immi.homeaffairs.gov.au/help-support/applying-online-or-on-paper/online"
                      target="_blank"
                      rel="noreferrer">
                      ImmiAccount support
                    </a>
                    <a
                      href="https://immi.homeaffairs.gov.au/about-us/our-commitments/client-service-charter"
                      target="_blank"
                      rel="noreferrer">
                      Client service charter
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* 3. Main Dashboard Body */}
      <main className="immi-dashboard-wrapper">
        {activeSection === "manage-account" ? (
          <div className="immi-dashboard-card immi-manage-account-card">
            <div className="immi-groups-banner">
              <span className="immi-groups-banner-title">{manageAccountTab}</span>
            </div>
            <div className="immi-manage-account-body">
              {accountMessage && (
                <div
                  style={{
                    backgroundColor: "#e8f5e9",
                    color: "#2e7d32",
                    border: "1px solid #c8e6c9",
                    padding: "8px 12px",
                    fontSize: "12px",
                    marginBottom: "16px",
                  }}>
                  ✓ {accountMessage}
                </div>
              )}

              {manageAccountTab === "Summary" && (
                <div>
                  <h2 className="immi-account-section-heading">My services</h2>
                  <p className="immi-account-service-intro">
                    You have access to the following services and can request access to additional services from the{" "}
                    <button
                      type="button"
                      className="immi-inline-link"
                      onClick={() => setManageAccountTab("Request access")}>
                      Request access tab
                    </button>
                    .
                  </p>

                  <ul className="immi-account-services-list">
                    <li>
                      <a
                        href="#detention-visitor"
                        onClick={(e) => {
                          e.preventDefault();
                          alert("Detention Visitor Application service is active.");
                        }}>
                        Detention Visitor Application
                      </a>
                    </li>
                    <li>
                      <a
                        href="#manage-payments"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveSection("manage-payments");
                        }}>
                        Manage Payments
                      </a>
                    </li>
                    <li>
                      <a
                        href="#online-lodgement"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveSection("applications");
                        }}>
                        Online Lodgement (Apply for a visa or citizenship including sponsorship and nomination) - Individual
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://legend.homeaffairs.gov.au"
                        target="_blank"
                        rel="noreferrer">
                        LEGENDcom
                      </a>
                    </li>
                  </ul>

                  <div className="immi-account-grid">
                    <div className="immi-account-row">
                      <span className="immi-account-label">Given names</span>
                      <span className="immi-account-value">
                        {userGivenNames ? `${userGivenNames} ` : ""}
                        <button
                          type="button"
                          className="immi-inline-link"
                          onClick={() => {
                            setEditGivenNames(userGivenNames);
                            setEditFamilyName(userFamilyName);
                            setManageAccountTab("Account details");
                          }}>
                          (edit given name)
                        </button>
                      </span>
                    </div>
                    <div className="immi-account-row">
                      <span className="immi-account-label">Family name</span>
                      <span className="immi-account-value">
                        {userFamilyName ? `${userFamilyName} ` : ""}
                        <button
                          type="button"
                          className="immi-inline-link"
                          onClick={() => {
                            setEditGivenNames(userGivenNames);
                            setEditFamilyName(userFamilyName);
                            setManageAccountTab("Account details");
                          }}>
                          (edit family name)
                        </button>
                      </span>
                    </div>
                    <div className="immi-account-row">
                      <span className="immi-account-label">Email address</span>
                      <span className="immi-account-value">
                        {userEmail ? `${userEmail} ` : ""}
                        <button
                          type="button"
                          className="immi-inline-link"
                          onClick={() => {
                            setEditEmail(userEmail);
                            setEditConfirmEmail(userEmail);
                            setManageAccountTab("Email address");
                          }}>
                          (edit email address)
                        </button>
                      </span>
                    </div>
                    <div className="immi-account-row">
                      <span className="immi-account-label">Username</span>
                      <span className="immi-account-value">{userEmail || (storedUsername !== "User" ? storedUsername : "")}</span>
                    </div>

                    <div className="immi-account-row-divider" />

                    <div className="immi-account-row">
                      <span className="immi-account-label">Alerts</span>
                      <span className="immi-account-value">
                        {userAlertsPref ? "I will receive account alerts" : "Account alerts disabled"}{" "}
                        <button
                          type="button"
                          className="immi-inline-link"
                          onClick={() => setManageAccountTab("Alert preferences")}>
                          (change my account alert preferences)
                        </button>
                      </span>
                    </div>
                    <div className="immi-account-row">
                      <span className="immi-account-label">Password</span>
                      <span className="immi-account-value">
                        Password saved{" "}
                        <button
                          type="button"
                          className="immi-inline-link"
                          onClick={() => setManageAccountTab("Password")}>
                          (change my password)
                        </button>
                      </span>
                    </div>
                    <div className="immi-account-row">
                      <span className="immi-account-label">Account multi-factor authentication</span>
                      <span className="immi-account-value">
                        {mfaOption === "app" ? "App authentication enabled" : mfaOption === "email" ? "Email authentication enabled" : "SMS authentication enabled"}{" "}
                        <button
                          type="button"
                          className="immi-inline-link"
                          onClick={() => setManageAccountTab("Multi-factor authentication")}>
                          (change method)
                        </button>
                      </span>
                    </div>
                    <div className="immi-account-row">
                      <span className="immi-account-label">Secret questions</span>
                      <span className="immi-account-value">
                        Secret questions saved{" "}
                        <button
                          type="button"
                          className="immi-inline-link"
                          onClick={() => setManageAccountTab("Secret questions")}>
                          (change my secret questions)
                        </button>
                      </span>
                    </div>
                    <div className="immi-account-row">
                      <span className="immi-account-label">Terms and conditions</span>
                      <span className="immi-account-value">
                        <a
                          href="https://immi.homeaffairs.gov.au/help-support/applying-online-or-on-paper/online/terms-and-conditions"
                          target="_blank"
                          rel="noreferrer"
                          className="immi-inline-link">
                          View the ImmiAccount terms and conditions (opens in a new window)
                        </a>
                      </span>
                    </div>
                    <div className="immi-account-row">
                      <span className="immi-account-label">Delete account</span>
                      <span className="immi-account-value">
                        <button
                          type="button"
                          className="immi-inline-link"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete your ImmiAccount? This action cannot be undone.")) {
                              alert("Account deletion request submitted.");
                            }
                          }}>
                          Delete my ImmiAccount
                        </button>
                      </span>
                    </div>
                  </div>

                  <div className="immi-account-bottom-bar">
                    <button
                      type="button"
                      className="immi-btn-classic"
                      onClick={() => {
                        setActiveSection("applications");
                        navigate("/user-portal");
                      }}>
                      Return to Online Lodgement
                    </button>
                  </div>
                </div>
              )}

              {manageAccountTab === "Account details" && (
                <div>
                  <h2 className="immi-account-section-heading">Account details</h2>
                  <p className="immi-account-service-intro">
                    Update your name and personal details associated with your ImmiAccount.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setUserGivenNames(editGivenNames);
                      setUserFamilyName(editFamilyName);
                      try {
                        localStorage.setItem("givenNames", editGivenNames);
                        localStorage.setItem("familyName", editFamilyName);
                      } catch (err) {
                        console.error(err);
                      }
                      setAccountMessage("Account details updated successfully.");
                      setManageAccountTab("Summary");
                    }}>
                    <div style={{ maxWidth: "460px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          Given names
                        </label>
                        <input
                          type="text"
                          className="immi-input"
                          value={editGivenNames}
                          onChange={(e) => setEditGivenNames(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}
                          placeholder="Given name(s)"
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          Family name *
                        </label>
                        <input
                          type="text"
                          required
                          className="immi-input"
                          value={editFamilyName}
                          onChange={(e) => setEditFamilyName(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}
                          placeholder="Family name"
                        />
                      </div>
                    </div>
                    <div className="immi-account-bottom-bar" style={{ display: "flex", gap: "10px" }}>
                      <button type="submit" className="immi-btn-classic" style={{ fontWeight: "bold" }}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="immi-btn-classic"
                        onClick={() => setManageAccountTab("Summary")}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {manageAccountTab === "Email address" && (
                <div>
                  <h2 className="immi-account-section-heading">Email address</h2>
                  <p className="immi-account-service-intro">
                    Update your ImmiAccount login and notification email address.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editEmail !== editConfirmEmail) {
                        alert("Email addresses do not match.");
                        return;
                      }
                      setUserEmail(editEmail);
                      try {
                        localStorage.setItem("userEmail", editEmail);
                      } catch (err) {
                        console.error(err);
                      }
                      setAccountMessage("Email address updated successfully.");
                      setManageAccountTab("Summary");
                    }}>
                    <div style={{ maxWidth: "460px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                      <div>
                        <span style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          Current email address
                        </span>
                        <span style={{ fontSize: "12px", color: "#333" }}>{userEmail}</span>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          New email address *
                        </label>
                        <input
                          type="email"
                          required
                          className="immi-input"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          Confirm new email address *
                        </label>
                        <input
                          type="email"
                          required
                          className="immi-input"
                          value={editConfirmEmail}
                          onChange={(e) => setEditConfirmEmail(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                    <div className="immi-account-bottom-bar" style={{ display: "flex", gap: "10px" }}>
                      <button type="submit" className="immi-btn-classic" style={{ fontWeight: "bold" }}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="immi-btn-classic"
                        onClick={() => setManageAccountTab("Summary")}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {manageAccountTab === "Password" && (
                <div>
                  <h2 className="immi-account-section-heading">Password</h2>
                  <p className="immi-account-service-intro">
                    Change your ImmiAccount password. Passwords must be at least 14 characters long and include a mix of letters, numbers, and symbols.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newPasswordVal !== confirmPasswordVal) {
                        alert("New passwords do not match.");
                        return;
                      }
                      setAccountMessage("Password changed successfully.");
                      setNewPasswordVal("");
                      setConfirmPasswordVal("");
                      setCurrentPasswordVal("");
                      setManageAccountTab("Summary");
                    }}>
                    <div style={{ maxWidth: "460px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          Current password *
                        </label>
                        <input
                          type="password"
                          required
                          className="immi-input"
                          value={currentPasswordVal}
                          onChange={(e) => setCurrentPasswordVal(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          New password *
                        </label>
                        <input
                          type="password"
                          required
                          className="immi-input"
                          value={newPasswordVal}
                          onChange={(e) => setNewPasswordVal(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          Confirm new password *
                        </label>
                        <input
                          type="password"
                          required
                          className="immi-input"
                          value={confirmPasswordVal}
                          onChange={(e) => setConfirmPasswordVal(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                    <div className="immi-account-bottom-bar" style={{ display: "flex", gap: "10px" }}>
                      <button type="submit" className="immi-btn-classic" style={{ fontWeight: "bold" }}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="immi-btn-classic"
                        onClick={() => setManageAccountTab("Summary")}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {manageAccountTab === "Secret questions" && (
                <div>
                  <h2 className="immi-account-section-heading">Secret questions</h2>
                  <p className="immi-account-service-intro">
                    Secret questions help verify your identity if you forget your password or need to recover your account.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setAccountMessage("Secret questions updated successfully.");
                      setManageAccountTab("Summary");
                    }}>
                    <div style={{ maxWidth: "460px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          Question 1 *
                        </label>
                        <select
                          className="immi-input"
                          value={secretQ1}
                          onChange={(e) => setSecretQ1(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}>
                          <option value="What was your first pet's name?">What was your first pet's name?</option>
                          <option value="What city was your mother born in?">What city was your mother born in?</option>
                          <option value="What was the name of your first school?">What was the name of your first school?</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          Answer 1 *
                        </label>
                        <input
                          type="text"
                          required
                          className="immi-input"
                          value={secretA1}
                          onChange={(e) => setSecretA1(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          Question 2 *
                        </label>
                        <select
                          className="immi-input"
                          value={secretQ2}
                          onChange={(e) => setSecretQ2(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}>
                          <option value="What is your favorite book?">What is your favorite book?</option>
                          <option value="What was your dream job as a child?">What was your dream job as a child?</option>
                          <option value="What was the model of your first car?">What was the model of your first car?</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          Answer 2 *
                        </label>
                        <input
                          type="text"
                          required
                          className="immi-input"
                          value={secretA2}
                          onChange={(e) => setSecretA2(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                    <div className="immi-account-bottom-bar" style={{ display: "flex", gap: "10px" }}>
                      <button type="submit" className="immi-btn-classic" style={{ fontWeight: "bold" }}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="immi-btn-classic"
                        onClick={() => setManageAccountTab("Summary")}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {manageAccountTab === "Multi-factor authentication" && (
                <div>
                  <h2 className="immi-account-section-heading">Multi-factor authentication</h2>
                  <p className="immi-account-service-intro">
                    Manage how you authenticate when logging into your ImmiAccount.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setAccountMessage("Multi-factor authentication method saved.");
                      setManageAccountTab("Summary");
                    }}>
                    <div style={{ maxWidth: "550px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="mfaOption"
                          value="app"
                          checked={mfaOption === "app"}
                          onChange={() => setMfaOption("app")}
                        />
                        <span><strong>App authentication (recommended)</strong> - Authenticator app generates a 6-digit code</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="mfaOption"
                          value="email"
                          checked={mfaOption === "email"}
                          onChange={() => setMfaOption("email")}
                        />
                        <span><strong>Email one-time password</strong> - Verification code sent to {userEmail}</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="mfaOption"
                          value="sms"
                          checked={mfaOption === "sms"}
                          onChange={() => setMfaOption("sms")}
                        />
                        <span><strong>SMS one-time password</strong> - Verification code sent to your registered mobile number</span>
                      </label>
                    </div>
                    <div className="immi-account-bottom-bar" style={{ display: "flex", gap: "10px" }}>
                      <button type="submit" className="immi-btn-classic" style={{ fontWeight: "bold" }}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="immi-btn-classic"
                        onClick={() => setManageAccountTab("Summary")}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {manageAccountTab === "Alert preferences" && (
                <div>
                  <h2 className="immi-account-section-heading">Alert preferences</h2>
                  <p className="immi-account-service-intro">
                    Configure how and when you receive alerts from your ImmiAccount.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setAccountMessage("Alert preferences saved.");
                      setManageAccountTab("Summary");
                    }}>
                    <div style={{ maxWidth: "550px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={userAlertsPref}
                          onChange={(e) => setUserAlertsPref(e.target.checked)}
                        />
                        <span>I will receive account alerts</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          defaultChecked
                        />
                        <span>Receive notification when an application status changes</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          defaultChecked
                        />
                        <span>Receive notification when correspondence or messages are received</span>
                      </label>
                    </div>
                    <div className="immi-account-bottom-bar" style={{ display: "flex", gap: "10px" }}>
                      <button type="submit" className="immi-btn-classic" style={{ fontWeight: "bold" }}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="immi-btn-classic"
                        onClick={() => setManageAccountTab("Summary")}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {manageAccountTab === "Request access" && (
                <div>
                  <h2 className="immi-account-section-heading">Request access</h2>
                  <p className="immi-account-service-intro">
                    Request access to additional services, organisation accounts, or agent representation.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setAccountMessage("Access request submitted successfully.");
                      setManageAccountTab("Summary");
                    }}>
                    <div style={{ maxWidth: "460px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          Service / Account Type *
                        </label>
                        <select
                          className="immi-input"
                          value={requestServiceType}
                          onChange={(e) => setRequestServiceType(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}>
                          <option value="Organisation access">Organisation access</option>
                          <option value="Legal Practitioner / Migration Agent">Legal Practitioner / Migration Agent</option>
                          <option value="Sponsor / Family access">Sponsor / Family access</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                          Organisation ID / MARN (if applicable)
                        </label>
                        <input
                          type="text"
                          className="immi-input"
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}
                          placeholder="e.g. ORG-123456"
                        />
                      </div>
                    </div>
                    <div className="immi-account-bottom-bar" style={{ display: "flex", gap: "10px" }}>
                      <button type="submit" className="immi-btn-classic" style={{ fontWeight: "bold" }}>
                        Submit Request
                      </button>
                      <button
                        type="button"
                        className="immi-btn-classic"
                        onClick={() => setManageAccountTab("Summary")}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        ) : activeSection === "make-payment-section" ?
          <div className="immi-make-payment-wrapper">
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
                              value={paymentEditForm.paymentType || "Pay for online(s) application"}
                              onChange={(e) =>
                                setPaymentEditForm({
                                  ...paymentEditForm,
                                  paymentType: e.target.value,
                                })
                              }>
                              <option value="Pay for online(s) application">
                                Pay for online(s) application
                              </option>
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
                              <span>{makePaymentData.paymentType || "Pay for online(s) application"}</span>
                              <span
                                style={{ fontSize: "10px", color: "#555" }}>
                                ▼
                              </span>
                              <button
                                type="button"
                                className="immi-prepay-help-icon"
                                title={`${makePaymentData.paymentType || "Payment"} help`}
                                onClick={() =>
                                  setShowHelpTooltip(!showHelpTooltip)
                                }>
                                ?
                              </button>
                              {showHelpTooltip && (
                                <div className="immi-prepay-tooltip">
                                  {makePaymentData.paymentType === "Pay for online(s) application"
                                    ? "Payment charge for online visa applications lodged through ImmiAccount."
                                    : "Pre-payment charge for visa applications lodged using physical paper forms."}
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
                          <span style={{ fontWeight: "500", color: "#333" }}>
                            {paymentEditForm.familyName || makePaymentData.familyName}
                          </span>
                        </td>
                      </tr>

                      <tr>
                        <td className="label-cell">
                          Given Name<span className="immi-prepay-req">*</span>
                        </td>
                        <td className="value-cell">
                          <span style={{ fontWeight: "500", color: "#333" }}>
                            {paymentEditForm.givenNames || makePaymentData.givenNames}
                          </span>
                        </td>
                      </tr>

                      <tr>
                        <td className="label-cell">
                          Date of birth<span className="immi-prepay-req">*</span>
                        </td>
                        <td className="value-cell">
                          <div className="immi-prepay-text-val">
                            <span>{paymentEditForm.dateOfBirth || makePaymentData.dateOfBirth}</span>
                            <span
                              style={{
                                fontSize: "14px",
                                marginLeft: "14px",
                              }}
                              title="Date of birth">
                              📅
                            </span>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="label-cell">
                          Visa subclass
                          <span className="immi-prepay-req">*</span>
                        </td>
                        <td className="value-cell">
                          <div className="immi-prepay-text-val">
                            <span>{paymentEditForm.visaSubclass || makePaymentData.visaSubclass}</span>
                            <span
                              style={{
                                fontSize: "10px",
                                color: "#555",
                                marginLeft: "28px",
                              }}>
                              ▼
                            </span>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="label-cell">
                          Amount (AUD)<span className="immi-prepay-req">*</span>
                        </td>
                        <td className="value-cell">
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                            }}>
                            {/* Don't show amount without calculation; show amount only after calculation */}
                            {(isEditingPaymentDetails ? paymentEditForm.isCalculated && paymentEditForm.amount : makePaymentData.isCalculated && makePaymentData.amount) ? (
                              <span
                                style={{
                                  fontWeight: "600",
                                  fontSize: "13px",
                                  color: "#222",
                                }}>
                                {parseFloat(
                                  isEditingPaymentDetails ? paymentEditForm.amount : makePaymentData.amount,
                                ).toFixed(2)}
                              </span>
                            ) : null}

                            <button
                              type="button"
                              className="immi-prepay-calc-btn"
                              disabled={isCalculating}
                              style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                              onClick={handleCalculateAmount}>
                              {isCalculating && <span className="immi-btn-spinner" />}
                              {isCalculating ? "Calculating..." : "Calculate"}
                            </button>

                            {calcNote && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#00703c",
                                  marginLeft: "6px",
                                  fontWeight: "bold",
                                }}>
                                ✓ {calcNote}
                              </span>
                            )}
                          </div>
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
                    {isEditingPaymentDetails ? (
                      <button
                        type="button"
                        className="immi-btn-classic"
                        style={{ fontWeight: "bold", minWidth: "95px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        disabled={isConfirmingPayment}
                        onClick={handleSavePaymentDetails}>
                        {isConfirmingPayment && <span className="immi-btn-spinner" />}
                        {isConfirmingPayment ? "Confirming..." : "Confirm"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="immi-btn-classic"
                        onClick={() => {
                          setPaymentEditForm({ ...makePaymentData });
                          setIsEditingPaymentDetails(true);
                        }}>
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              }
            </div>

            {/* 2. Payment Options Section Below (Razorpay Online Gateway) */}
            {!paymentCompletedReceipt && !isEditingPaymentDetails && (
              <div className="immi-payment-options-card">
                <div className="immi-options-title">Payment options</div>

                <div className="immi-options-notice">
                  Your decision to pay will be final, your payment cannot be
                  disputed, even if you change your mind.
                </div>

                <div className="immi-options-radios-row" style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", color: "#222" }}>
                    Select a payment option:
                  </span>
                  <label className="immi-options-radio-label" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <input
                      type="radio"
                      name="paymentOption"
                      value="razorpay"
                      checked={selectedPaymentMethod === "razorpay"}
                      onChange={() => setSelectedPaymentMethod("razorpay")}
                    />
                    <span style={{ fontWeight: selectedPaymentMethod === "razorpay" ? "bold" : "normal", color: "#004b87" }}>
                      Credit / Debit Card (Razorpay)
                    </span>
                  </label>

                  <label className="immi-options-radio-label" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <input
                      type="radio"
                      name="paymentOption"
                      value="paypal"
                      checked={selectedPaymentMethod === "paypal"}
                      onChange={() => setSelectedPaymentMethod("paypal")}
                    />
                    <span style={{ fontWeight: selectedPaymentMethod === "paypal" ? "bold" : "normal", color: "#004b87" }}>
                      PayPal
                    </span>
                  </label>
                </div>

                <div>
                  <div className="immi-options-subhead">
                    {selectedPaymentMethod === "paypal"
                      ? "Payment by PayPal"
                      : "Payment by debit/credit card"}
                  </div>

                  {/* Payment Badges Row */}
                  {selectedPaymentMethod === "paypal" ? (
                    <div className="immi-card-badges-row" style={{ margin: "10px 0 14px 0" }}>
                      <span className="immi-card-badge" title="PayPal" style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", backgroundColor: "#fff", border: "1px solid #cbd5e1", borderRadius: "3px" }}>
                        <svg width="68" height="22" viewBox="0 0 100 32" fill="none">
                          <path d="M12.5 4H24c4.5 0 7.8 1.1 9.5 3.2 1.6 1.9 1.7 4.5.6 7.8-1.5 4.5-4.8 7.3-9.5 8.2-1 .2-2.2.3-3.6.3h-3.4c-.8 0-1.5.6-1.6 1.4L14 30.5c-.1.5-.5.9-1 .9H6.5c-.7 0-1.1-.6-.9-1.2L11 4.9c.1-.5.7-.9 1.5-.9z" fill="#003087"/>
                          <path d="M18.5 10.5H30c4.5 0 7.8 1.1 9.5 3.2 1.6 1.9 1.7 4.5.6 7.8-1.5 4.5-4.8 7.3-9.5 8.2-1 .2-2.2.3-3.6.3h-3.4c-.8 0-1.5.6-1.6 1.4L20 37c-.1.5-.5.9-1 .9h-6.5c-.7 0-1.1-.6-.9-1.2l5.4-25.3c.1-.5.7-.9 1.5-.9z" fill="#0079C1"/>
                          <path d="M19 10.5c.3-1.6 1.7-2.8 3.3-2.8h11.2c3.5 0 6.3.8 8.1 2.5 1.5 1.4 2 3.3 1.5 5.5-1.2 5.1-4.8 8.2-10.1 8.8-1 .1-2.1.2-3.3.2H24.3c-.8 0-1.5.6-1.6 1.4l-1.8 11.2h-4.3c-.7 0-1.1-.6-.9-1.2L19 10.5z" fill="#00457C"/>
                          <text x="44" y="23" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#003087">Pay</text>
                          <text x="74" y="23" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#0079C1">Pal</text>
                        </svg>
                      </span>
                    </div>
                  ) : (
                    /* Card Logos: Visa, MasterCard, American Express, Diners Club, JCB */
                    <div className="immi-card-badges-row" style={{ margin: "10px 0 14px 0" }}>
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
                            rx="3"
                            fill="#0079C1"
                          />
                          <rect
                            x="24"
                            y="8"
                            width="12"
                            height="24"
                            rx="3"
                            fill="#E60012"
                          />
                          <rect
                            x="38"
                            y="8"
                            width="12"
                            height="24"
                            rx="3"
                            fill="#00873C"
                          />
                          <text
                            x="16"
                            y="24"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="bold"
                            fontFamily="Arial, sans-serif"
                            textAnchor="middle">
                            J
                          </text>
                          <text
                            x="30"
                            y="24"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="bold"
                            fontFamily="Arial, sans-serif"
                            textAnchor="middle">
                            C
                          </text>
                          <text
                            x="44"
                            y="24"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="bold"
                            fontFamily="Arial, sans-serif"
                            textAnchor="middle">
                            B
                          </text>
                        </svg>
                      </span>
                    </div>
                  )}

                  <div className="immi-prepay-notes" style={{ marginBottom: "12px" }}>
                    {selectedPaymentMethod === "paypal" ? (
                      <p>
                        Payments via PayPal are processed securely. You will be redirected to complete your PayPal payment.
                      </p>
                    ) : (
                      <p>
                        Payments are processed securely via the official <strong>Razorpay Payment Gateway</strong>.
                        Cardholder authentication (3D Secure / OTP) is supported.
                      </p>
                    )}
                  </div>

                  {/* Payment Details Table */}
                  <div className="immi-card-table-wrap">
                    <table className="immi-prepay-table">
                      <tbody>
                        <tr>
                          <td className="label-cell" style={{ width: "240px" }}>Payment method</td>
                          <td className="value-cell">
                            <span style={{ fontWeight: "600", color: "#004b87", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              {selectedPaymentMethod === "paypal" ? (
                                <span>PayPal</span>
                              ) : (
                                <span>💳 Credit / Debit Card (Razorpay)</span>
                              )}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="label-cell">Credit card surcharge (AUD)</td>
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
                              <span style={{ fontSize: "11px", color: "#666" }}>
                                (No surcharge applied)
                              </span>
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
                              <span style={{ fontWeight: "bold", fontSize: "14px", color: "#004b87" }}>$</span>
                              <span
                                style={{
                                  fontWeight: "bold",
                                  fontSize: "14px",
                                  color: "#004b87",
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

                  <div
                    style={{
                      margin: "16px 0 12px 0",
                      padding: "12px 16px",
                      backgroundColor: "#f4f6fb",
                      border: "1px solid #c7d2fe",
                      borderRadius: "4px",
                      fontSize: "12px",
                      color: "#1e1b4b",
                      lineHeight: "1.5",
                    }}>
                    {selectedPaymentMethod === "paypal" ? (
                      <span>
                        When you click <strong>Pay</strong>, you will be redirected to PayPal to complete your payment.
                      </span>
                    ) : (
                      <span>
                        When you click <strong>Pay</strong>, the secure card payment checkout will open to process your payment. Once approved, your official Department of Home Affairs receipt will be generated automatically.
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom actions: Cancel on left, Pay on right */}
                <div
                  className="immi-options-actions"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}>
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
                    style={{ fontWeight: "bold", minWidth: "85px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    disabled={isPaymentLoading}
                    onClick={() => {
                      if (selectedPaymentMethod === "paypal") {
                        alert(
                          "Technical Error: The PayPal payment service is temporarily unavailable due to a technical error. Please select an alternative payment option (such as Credit / Debit Card) to complete your transaction."
                        );
                        return;
                      }
                      handleInitiateRazorpayPayment(makePaymentData);
                    }}>
                    {isPaymentLoading && <span className="immi-btn-spinner" />}
                    {isPaymentLoading ? "Processing..." : "Pay"}
                  </button>
                </div>
              </div>
            )}
          </div>
        : activeSection === "manage-payments" ?
          <div className="immi-dashboard-card immi-payments-card">
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
                    {isPaymentsLoading ? (
                      <tr className="loading-row">
                        <td colSpan="10" style={{ padding: "40px 20px", textAlign: "center", backgroundColor: "#ffffff" }}>
                          <div className="immi-loading-container" style={{ margin: "0 auto", padding: "10px" }}>
                            <div className="immi-spinner-gov"></div>
                            <div className="immi-loading-text">
                              <strong>Loading payment records...</strong>
                              <span>Please wait while your payments are retrieved from the Department server.</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredPayments.length === 0 ? (
                      <tr className="empty-row">
                        <td colSpan="10">No data available in table</td>
                      </tr>
                    ) : filteredPayments.map((p, idx) => (
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
                    disabled={filteredPayments.length === 0}
                    title="First">
                    «
                  </button>
                  <button
                    type="button"
                    className={`immi-paginate-btn ${filteredPayments.length > 0 ? "active" : ""}`}
                    disabled={filteredPayments.length === 0}
                    title="Previous">
                    ‹
                  </button>
                  <button
                    type="button"
                    className={`immi-paginate-btn ${filteredPayments.length > 0 ? "active" : ""}`}
                    disabled={filteredPayments.length === 0}
                    title="Next">
                    ›
                  </button>
                  <button
                    type="button"
                    className={`immi-paginate-btn ${filteredPayments.length > 0 ? "active" : ""}`}
                    disabled={filteredPayments.length === 0}
                    title="Last">
                    »
                  </button>
                </div>
              </div>
            </div>
          </div>
        : activeSection === "groups" ?
          <div className="immi-dashboard-card">
            {/* Dark navy subheader bar with "Manage groups" */}
            <div className="immi-groups-banner">
              <span className="immi-groups-banner-title">Manage groups</span>
              <button
                type="button"
                className="immi-help-circle"
                title="Click for help on Manage groups"
                onClick={() => setShowHelpModal(true)}>
                ?
              </button>
            </div>

            <div className="immi-groups-body">
              {/* Action Link: Create a new group */}
              <div className="immi-groups-actions">
                <button
                  type="button"
                  className="immi-group-action-link"
                  onClick={() => setShowCreateGroupModal(true)}>
                  <svg
                    className="immi-group-action-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  <span>Create a new group</span>
                </button>
              </div>

              {/* Subheading: Group list */}
              <h2 className="immi-groups-heading">Group list</h2>

              {/* Toolbar */}
              <div className="immi-groups-toolbar">
                <div className="immi-groups-sort-group">
                  <label htmlFor="group-sort-select" className="immi-groups-label">
                    Sort by
                  </label>
                  <select
                    id="group-sort-select"
                    className="immi-groups-select"
                    value={groupSortBy}
                    onChange={(e) => setGroupSortBy(e.target.value)}>
                    <option value="Expiry Date">Expiry Date</option>
                    <option value="Group Name">Group Name</option>
                    <option value="Date Created">Date Created</option>
                  </select>
                  <button
                    type="button"
                    className="immi-groups-sort-direction-btn"
                    title="Toggle sort direction"
                    onClick={() => setGroupSortAsc(!groupSortAsc)}>
                    ⇅
                  </button>
                </div>

                <button
                  type="button"
                  className="immi-groups-refresh-link"
                  onClick={handleRefreshGroups}>
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    style={{ verticalAlign: "middle" }}>
                    <path d="M23 4v6h-6"></path>
                    <path d="M1 20v-6h6"></path>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  <span>Refresh</span>
                </button>

                <label className="immi-groups-checkbox-label">
                  <input
                    type="checkbox"
                    checked={showExpired}
                    onChange={(e) => setShowExpired(e.target.checked)}
                    className="immi-groups-checkbox"
                  />
                  <span>Show expired</span>
                </label>
              </div>

              {/* Empty state or Group table */}
              {groups.filter((g) => showExpired || g.status !== "Expired").length === 0 ? (
                <div className="immi-groups-empty-text">
                  No results found
                </div>
              ) : (
                <div className="immi-table-wrapper" style={{ marginTop: "10px" }}>
                  <table className="immi-apps-table">
                    <thead>
                      <tr>
                        <th>Group Name</th>
                        <th>Type</th>
                        <th>Date Created</th>
                        <th>Expiry Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups
                        .filter((g) => showExpired || g.status !== "Expired")
                        .sort((a, b) => {
                          let valA = a.name;
                          let valB = b.name;
                          if (groupSortBy === "Expiry Date") {
                            valA = a.expiryDate;
                            valB = b.expiryDate;
                          } else if (groupSortBy === "Date Created") {
                            valA = a.createdDate;
                            valB = b.createdDate;
                          }
                          return groupSortAsc
                            ? valA.localeCompare(valB)
                            : valB.localeCompare(valA);
                        })
                        .map((grp) => (
                          <tr key={grp.id}>
                            <td><strong>{grp.name}</strong></td>
                            <td>{grp.type}</td>
                            <td>{grp.createdDate}</td>
                            <td>{grp.expiryDate}</td>
                            <td>
                              <span className="immi-badge immi-badge-approved">
                                {grp.status}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="immi-btn-details"
                                onClick={() => {
                                  const rem = groups.filter((g) => g.id !== grp.id);
                                  setGroups(rem);
                                  try {
                                    localStorage.setItem("immi_groups", JSON.stringify(rem));
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}>
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        : <div className="immi-dashboard-card">
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
            <div
              className="immi-list-heading-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}>
              <h2 className="immi-list-title" style={{ margin: 0 }}>
                List of applications
              </h2>

              {/* Category Filter Pills */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button
                  type="button"
                  className={`immi-btn-sm ${appCategoryFilter === "all" ? "immi-btn-primary-sm" : ""}`}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: appCategoryFilter === "all" ? "600" : "normal",
                  }}
                  onClick={() => setAppCategoryFilter("all")}>
                  All ({filteredVisas.length + filteredNominations.length})
                </button>
                <button
                  type="button"
                  className={`immi-btn-sm ${appCategoryFilter === "visas" ? "immi-btn-primary-sm" : ""}`}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: appCategoryFilter === "visas" ? "600" : "normal",
                  }}
                  onClick={() => setAppCategoryFilter("visas")}>
                  Visas ({filteredVisas.length})
                </button>
                <button
                  type="button"
                  className={`immi-btn-sm ${appCategoryFilter === "nominations" ? "immi-btn-primary-sm" : ""}`}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: appCategoryFilter === "nominations" ? "600" : "normal",
                  }}
                  onClick={() => setAppCategoryFilter("nominations")}>
                  Nominations ({filteredNominations.length})
                </button>
              </div>
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
                  type="button"
                  className="immi-refresh-link"
                  disabled={isLoading}
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                  onClick={fetchUserApplications}>
                  <svg
                    className={isLoading ? "immi-spin" : ""}
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                  </svg>
                  <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
                </button>
              </div>
            </div>

            {/* Applications Table / Empty State */}
            <div className="immi-applications-container">
              {isLoading ?
                <div className="immi-loading-container" style={{ border: "1px solid #ccd4db", margin: "16px 0" }}>
                  <div className="immi-spinner-gov"></div>
                  <div className="immi-loading-text">
                    <strong>Loading applications...</strong>
                    <span>Please wait while your ImmiAccount application data is retrieved.</span>
                  </div>
                </div>
              : (appCategoryFilter === "all" && filteredVisas.length === 0 && filteredNominations.length === 0) ||
                (appCategoryFilter === "visas" && filteredVisas.length === 0) ||
                (appCategoryFilter === "nominations" && filteredNominations.length === 0) ?
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
                    {/* Render Visas */}
                    {(appCategoryFilter === "all" || appCategoryFilter === "visas") &&
                      filteredVisas.map((visa) => (
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
                            {formatPrimaryApplicantName(visa)}
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

                    {/* Render Nominations */}
                    {(appCategoryFilter === "all" || appCategoryFilter === "nominations") &&
                      filteredNominations.map((nom) => (
                        <tr
                          key={nom._id || nom.nominationTrn || Math.random()}
                          className="immi-app-row"
                          style={{ backgroundColor: "#fafcff" }}>
                          <td className="immi-cell-app">
                            <span
                              style={{
                                display: "inline-block",
                                fontSize: "10px",
                                fontWeight: "700",
                                color: "#0369a1",
                                backgroundColor: "#e0f2fe",
                                padding: "1px 6px",
                                borderRadius: "3px",
                                marginBottom: "3px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}>
                              Nomination
                            </span>
                            <div>
                              <strong>{nom.visaProgram || "Nomination Application"}</strong>
                            </div>
                          </td>
                          <td className="immi-cell-trn">
                            <strong>{nom.nominationTrn || "—"}</strong>
                            {nom.fileNumber && (
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                File: {nom.fileNumber}
                              </div>
                            )}
                            {nom.applicationId && (
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                ID: {nom.applicationId}
                              </div>
                            )}
                          </td>
                          <td className="immi-cell-name">
                            {formatPrimaryApplicantName(nom)}
                          </td>
                          <td className="immi-cell-status">
                            <span className="immi-status-badge status-approved">
                              Approved
                            </span>
                          </td>
                          <td className="immi-cell-date">
                            {nom.approvedDate ||
                              formatDate(nom.updatedAt || nom.createdAt)}
                          </td>
                          <td
                            className="immi-cell-actions"
                            style={{ textAlign: "center" }}>
                            <button
                              className="immi-view-details-btn"
                              onClick={() => setSelectedNomination(nom)}>
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

      </main>

      {/* Full-width Government Footer */}
      <footer className="immi-dashboard-footer">
        <div className="immi-footer-inner">
          <a href="#accessibility" onClick={(e) => e.preventDefault()}>
            Accessibility
          </a>
          <span className="immi-footer-sep">|</span>
          <a href="#copyright" onClick={(e) => e.preventDefault()}>
            Copyright &amp; Disclaimer
          </a>
          <span className="immi-footer-sep">|</span>
          <a href="#security" onClick={(e) => e.preventDefault()}>
            Online Security
          </a>
          <span className="immi-footer-sep">|</span>
          <a href="#privacy" onClick={(e) => e.preventDefault()}>
            Privacy
          </a>
          {activeSection === "manage-account" && userEmail && (
            <>
              <span className="immi-footer-sep">|</span>
              <span>{userEmail}</span>
            </>
          )}
        </div>
      </footer>

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
                      {formatPrimaryApplicantName(selectedVisa)}
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
                            <svg
                              viewBox="0 0 24 24"
                              width="13"
                              height="13"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{ verticalAlign: "middle" }}>
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>View / Download PDF</span>
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

      {/* Nomination Application Details Modal */}
      {selectedNomination && (
        <div
          className="immi-modal-backdrop"
          onClick={() => setSelectedNomination(null)}>
          <div
            className="immi-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "680px" }}>
            <div className="immi-modal-header">
              <h3>Nomination Details &amp; Summary</h3>
              <button
                className="immi-modal-close-btn"
                type="button"
                onClick={() => setSelectedNomination(null)}>
                ✕
              </button>
            </div>
            <div className="immi-modal-body">
              <table className="immi-details-table">
                <tbody>
                  <tr>
                    <th>Application Type</th>
                    <td>
                      <span
                        style={{
                          backgroundColor: "#e0f2fe",
                          color: "#0369a1",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "3px",
                          fontSize: "11px",
                          letterSpacing: "0.5px",
                        }}>
                        NOMINATION APPLICATION
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>Visa Program</th>
                    <td>
                      <strong>{selectedNomination.visaProgram || "—"}</strong>
                    </td>
                  </tr>
                  <tr>
                    <th>Nomination Reference (TRN)</th>
                    <td>
                      <strong style={{ color: "#004b87", letterSpacing: "0.5px" }}>
                        {selectedNomination.nominationTrn || "—"}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <th>Application ID</th>
                    <td>{selectedNomination.applicationId || "—"}</td>
                  </tr>
                  <tr>
                    <th>File Number</th>
                    <td>
                      <code
                        style={{
                          backgroundColor: "#f1f5f9",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          fontSize: "11px",
                        }}>
                        {selectedNomination.fileNumber || "—"}
                      </code>
                    </td>
                  </tr>
                  <tr>
                    <th>Primary Nominated Applicant</th>
                    <td>
                      {formatPrimaryApplicantName(selectedNomination)}
                    </td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>
                      <span className="immi-status-badge status-approved">
                        Approved
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>Approval Date</th>
                    <td>
                      {selectedNomination.approvedDate ||
                        formatDate(
                          selectedNomination.updatedAt ||
                            selectedNomination.createdAt,
                        )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Attached Documents / Approval Notice */}
              <div style={{ marginTop: "20px" }}>
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    color: "#002b49",
                    fontSize: "13px",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: "6px",
                  }}>
                  Attached Documents &amp; Notices
                </h4>
                {selectedNomination.document &&
                Array.isArray(selectedNomination.document) &&
                selectedNomination.document.length > 0 ? (
                  <ul className="immi-docs-list">
                    {selectedNomination.document.map((doc, idx) => (
                      <li key={idx} className="immi-doc-item">
                        <span>
                          📄 {doc.name || "Nomination Approval Notice"}
                        </span>
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="immi-doc-download-btn">
                            <svg
                              viewBox="0 0 24 24"
                              width="13"
                              height="13"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{ verticalAlign: "middle" }}>
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>View / Download PDF</span>
                          </a>
                        ) : (
                          <span style={{ color: "#888", fontSize: "11px" }}>
                            Processed
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#666", fontStyle: "italic", margin: 0 }}>
                    No correspondence files attached to this nomination application yet.
                  </p>
                )}
              </div>
            </div>
            <div className="immi-modal-footer">
              <button
                type="button"
                className="immi-btn-cancel"
                onClick={() => setSelectedNomination(null)}>
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
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  disabled={importLoading}>
                  {importLoading && <span className="immi-btn-spinner-white" />}
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
                type="button"
                className="immi-btn-cancel"
                style={{ backgroundColor: "#fef2f2", color: "#dc2626", borderColor: "#fca5a5", marginRight: "auto" }}
                onClick={() => {
                  setShowAccountModal(false);
                  handleLogout();
                }}>
                Logout
              </button>
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

      {/* Create New Group Modal */}
      {showCreateGroupModal && (
        <div
          className="immi-modal-backdrop"
          onClick={() => setShowCreateGroupModal(false)}>
          <div
            className="immi-modal-content"
            style={{ maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="immi-modal-header">
              <h3>Create a new group</h3>
              <button
                type="button"
                className="immi-modal-close-btn"
                onClick={() => setShowCreateGroupModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="immi-modal-body">
                <div className="immi-field-group" style={{ marginBottom: "14px" }}>
                  <label
                    className="immi-field-label"
                    style={{ display: "block", marginBottom: "4px", fontWeight: "bold", fontSize: "12.5px" }}>
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="immi-input"
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                  />
                </div>
                <div className="immi-field-group" style={{ marginBottom: "14px" }}>
                  <label
                    className="immi-field-label"
                    style={{ display: "block", marginBottom: "4px", fontWeight: "bold", fontSize: "12.5px" }}>
                    Group Type
                  </label>
                  <select
                    className="immi-input"
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}
                    value={newGroupType}
                    onChange={(e) => setNewGroupType(e.target.value)}>
                    <option value="Organisation">Organisation</option>
                    <option value="Legal Representative / Migration Agent">Legal Representative / Migration Agent</option>
                    <option value="Family / Sponsor">Family / Sponsor</option>
                  </select>
                </div>
                <div className="immi-field-group" style={{ marginBottom: "14px" }}>
                  <label
                    className="immi-field-label"
                    style={{ display: "block", marginBottom: "4px", fontWeight: "bold", fontSize: "12.5px" }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="immi-input"
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid #bcc5cc", boxSizing: "border-box" }}
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Optional group description"
                  />
                </div>
              </div>
              <div
                className="immi-modal-footer"
                style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "12px 16px", background: "#f8f9fa", borderTop: "1px solid #e9ecef" }}>
                <button
                  type="button"
                  className="immi-btn-sm"
                  onClick={() => setShowCreateGroupModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="immi-btn-primary"
                  style={{ backgroundColor: "#004b87", color: "#fff", border: "none", padding: "6px 14px", cursor: "pointer", fontWeight: "bold", borderRadius: "2px" }}>
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserPortal;
