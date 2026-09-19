import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./immiaccount.css";
import logoHA from "../assets/images/logo-ha.png";

function UserPortal() {
  const navigate = useNavigate();
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

  // Section Navigation: 'applications' or 'manage-payments'
  const [activeSection, setActiveSection] = useState("applications");

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
                  p.date && p.date !== "—" ? p.date
                  : p.transactionDate ?
                    new Date(p.transactionDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
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

  // Open Make Payment modal pre-filled for a specific pending payment
  const handleOpenMakePayment = (payment) => {
    setPaymentSuccessData(null);
    setInvoiceForm({
      targetPaymentId: payment._id || payment.id || null,
      invoiceNumber: payment.ref || payment.referenceNumber || "",
      clientId:
        payment.internalRef && payment.internalRef !== "—" ?
          payment.internalRef
        : "",
      name: getPaymentDisplayName(payment),
      email: payment.payerEmail || "",
      amount: String(payment.amount || "385.00"),
      cardNumber: "",
      cardExpiry: "",
      cardCvv: "",
      paymentMethod: "credit-card",
    });
    setShowPayInvoiceModal(true);
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
      const formattedNow =
        new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        " " +
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
      const nowIso = new Date().toISOString();

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
                date: formattedNow,
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
            {activeSection === "manage-payments" ?
              "Online Payments"
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
            onClick={() => setActiveSection("applications")}>
            My applications
          </button>

          <div className="immi-nav-dropdown-wrapper">
            <button
              type="button"
              className={`immi-nav-tab ${activeSection === "manage-payments" ? "active" : ""}`}
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
                  }}>
                  Manage Payments
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    setPaymentSuccessData(null);
                    setInvoiceForm((prev) => ({
                      ...prev,
                      name: paymentUserFullName,
                      email: "",
                    }));
                    setShowPayInvoiceModal(true);
                  }}>
                  Pay an invoice
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
        {activeSection === "manage-payments" ?
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
                      setPrePaySuccessVoucher(null);
                      const defaultGiven =
                        allVisas.length > 0 ? allVisas[0].givenNames || "" : "";
                      const defaultFamily =
                        allVisas.length > 0 ? allVisas[0].familyName || "" : "";
                      setPrePayForm((prev) => ({
                        ...prev,
                        givenNames: prev.givenNames || defaultGiven,
                        familyName: prev.familyName || defaultFamily,
                      }));
                      setShowPrePayModal(true);
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
                              <select
                                className="immi-history-select"
                                style={{
                                  height: "24px",
                                  fontSize: "11.5px",
                                  padding: "1px 6px",
                                  borderRadius: "2px",
                                  borderColor: "#7f9db9",
                                  color: "#004b87",
                                  backgroundColor: "#ffffff",
                                  cursor: "pointer",
                                }}
                                value=""
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "make_payment") {
                                    handleOpenMakePayment(p);
                                  } else if (val === "view_receipt") {
                                    setPaymentReceipt(p);
                                  }
                                }}>
                                <option value="">Select payment</option>
                                {(p.status || "").toLowerCase() === "pending" ?
                                  <option value="make_payment">
                                    Make payment
                                  </option>
                                : <option value="view_receipt">
                                    View receipt
                                  </option>
                                }
                              </select>
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
          className={`immi-dashboard-footer ${activeSection === "manage-payments" ? "payments-footer" : ""}`}>
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
          <div className="immi-footer-ha-badge">HA</div>
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
