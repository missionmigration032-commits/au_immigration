import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";
import {
  generateOfferLetterBlob,
  downloadOfferLetterPDF,
} from "../components/OfferLetterPDF";
import {
  generateVisaGrantBlob,
  downloadVisaGrantPDF,
} from "../components/VisaGrantPDF";
import {
  getFormattedTodayDate,
  getFormattedExpiryDate,
  generateNumericString,
  generate8CharRef,
  initialVisaData,
  getInitialVisaFormData,
  getInitialOfferLetterFormData,
  getInitialVisaGrantFormData,
  getInitialPaymentData,
  getVisaGrantMergedData,
  getOfferLetterMergedData,
  getInitialNominationFormData,
  getInitialSponsorshipFormData,
} from "../components/dashboard/dashboardUtils";

// Modals
import EditUserModal from "../components/dashboard/modals/EditUserModal";
import EditCompanyModal from "../components/dashboard/modals/EditCompanyModal";
import EditOfferLetterModal from "../components/dashboard/modals/EditOfferLetterModal";
import EditNominationModal from "../components/dashboard/modals/EditNominationModal";
import EditSponsorshipModal from "../components/dashboard/modals/EditSponsorshipModal";
import OfferLetterPreviewModal from "../components/dashboard/modals/OfferLetterPreviewModal";
import VisaPreviewModal from "../components/dashboard/modals/VisaPreviewModal";

// Tabs
import OverviewTab from "../components/dashboard/tabs/OverviewTab";
import VisasTab from "../components/dashboard/tabs/VisasTab";
import PaymentsTab from "../components/dashboard/tabs/PaymentsTab";
import AccountsTab from "../components/dashboard/tabs/AccountsTab";
import CompaniesTab from "../components/dashboard/tabs/CompaniesTab";
import OfferLettersTab from "../components/dashboard/tabs/OfferLettersTab";
import VisaGrantTab from "../components/dashboard/tabs/VisaGrantTab";
import NominationsTab from "../components/dashboard/tabs/NominationsTab";
import SponsorshipsTab from "../components/dashboard/tabs/SponsorshipsTab";

function Dashboard() {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [activeTab, setActiveTab] = useState("visas"); // 'overview', 'visas', 'payments', 'accounts', 'companies', 'offer-letters', 'visa-grant'
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Payments state
  const [paymentsList, setPaymentsList] = useState(() => {
    try {
      const saved = localStorage.getItem("au_payments");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse payments from localStorage:", e);
    }
    return [];
  });
  const [paymentData, setPaymentData] = useState(getInitialPaymentData);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");

  // Account creation & management state
  const [accountFormData, setAccountFormData] = useState({
    username: "",
    password: "",
    email: "",
    givenName: "",
    familyName: "",
    passport: "",
    dob: "",
  });
  const [userSearch, setUserSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);

  // Visa creation state
  const [visaData, setVisaData] = useState(initialVisaData);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [currentDocName, setCurrentDocName] = useState("");
  const [currentDocBase64, setCurrentDocBase64] = useState("");
  const [currentDocFileName, setCurrentDocFileName] = useState("");
  const [documentKey, setDocumentKey] = useState(Date.now());
  const [previewVisaData, setPreviewVisaData] = useState(null);
  const [isVisaPreviewOpen, setIsVisaPreviewOpen] = useState(false);
  const [visaPreviewPdfUrl, setVisaPreviewPdfUrl] = useState(null);
  const [isVisaPreviewGenerating, setIsVisaPreviewGenerating] = useState(false);
  const [downloadingVisaId, setDownloadingVisaId] = useState(null);
  const [isVisaSubmitting, setIsVisaSubmitting] = useState(false);
  const [visaAlert, setVisaAlert] = useState(null);

  const [usersList, setUsersList] = useState([]);
  const [visasList, setVisasList] = useState([]);

  // Companies state
  const [companiesList, setCompaniesList] = useState([]);
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    address: "",
  });
  const [companySearch, setCompanySearch] = useState("");
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyAlert, setCompanyAlert] = useState(null);
  const [isCompanySubmitting, setIsCompanySubmitting] = useState(false);
  const [selectedVisaCompanyId, setSelectedVisaCompanyId] = useState("");

  // Offer Letters state
  const [offerLettersList, setOfferLettersList] = useState([]);
  const [offerLetterFormData, setOfferLetterFormData] = useState(
    getInitialOfferLetterFormData(),
  );
  const [offerLetterSearch, setOfferLetterSearch] = useState("");
  const [offerLetterCompanyFilter, setOfferLetterCompanyFilter] =
    useState("all");
  const [editingOfferLetter, setEditingOfferLetter] = useState(null);
  const [offerLetterAlert, setOfferLetterAlert] = useState(null);
  const [isOfferLetterSubmitting, setIsOfferLetterSubmitting] = useState(false);

  // Nominations state
  const [nominationsList, setNominationsList] = useState([]);
  const [nominationFormData, setNominationFormData] = useState(
    getInitialNominationFormData,
  );
  const [nominationSearch, setNominationSearch] = useState("");
  const [editingNomination, setEditingNomination] = useState(null);
  const [nominationAlert, setNominationAlert] = useState(null);
  const [isNominationSubmitting, setIsNominationSubmitting] = useState(false);
  const [isUpdatingNomination, setIsUpdatingNomination] = useState(false);

  // Sponsorships state
  const [sponsorshipsList, setSponsorshipsList] = useState([]);
  const [sponsorshipFormData, setSponsorshipFormData] = useState(
    getInitialSponsorshipFormData,
  );
  const [sponsorshipSearch, setSponsorshipSearch] = useState("");
  const [editingSponsorship, setEditingSponsorship] = useState(null);
  const [sponsorshipAlert, setSponsorshipAlert] = useState(null);
  const [isSponsorshipSubmitting, setIsSponsorshipSubmitting] = useState(false);
  const [isUpdatingSponsorship, setIsUpdatingSponsorship] = useState(false);

  // PDF Preview & Download state
  const [previewOfferLetterData, setPreviewOfferLetterData] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);
  const [downloadingLetterId, setDownloadingLetterId] = useState(null);

  // Dedicated Visa Grant Letter state
  const [visaGrantFormData, setVisaGrantFormData] = useState(
    getInitialVisaGrantFormData(),
  );
  const [savedVisaGrants, setSavedVisaGrants] = useState(() => {
    try {
      const saved = localStorage.getItem("au_saved_visa_grants");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to read saved visa grants:", e);
    }
    return [
      {
        id: "VG-SAMPLE-01",
        refrenceNumber: "VG-AU-EGP6QH59",
        applicantName: "PATEL Chintankumar Ranchhodbhai",
        dateOfBirth: "25 September 1999",
        passportNumber: "U4019655IND",
        passportCountry: "INDIA",
        visaName: "Transit (subclass 771)",
        applicationStatus: "Granted",
        visaGrantNumber: "1139500159106",
        applicationId: "106951626",
        trn: "EGP6QH59AO",
        grantDate: "04 February 2025",
        mustNotArriveAfter: "04 February 2026",
        lengthOfStay: "3 day(s) from the date of each arrival",
        travel: "Multiple entries",
        conditions: "8101 - No work\n8201 - Maximum three months study",
        whyKeepNotice:
          "Airlines might ask for details in this notice so they can carry out checks to allow you to board the plane.",
        savedAt: "Sample Template",
      },
    ];
  });
  const [visaGrantSearch, setVisaGrantSearch] = useState("");
  const [visaGrantAlert, setVisaGrantAlert] = useState(null);

  // API Fetch functions
  const fetchVisas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/visas?origin=au`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (data.visas) setVisasList(data.visas);
      }
    } catch (error) {
      console.error("Failed to fetch visas:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/users?origin=au`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) setUsersList(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payments?origin=au`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        let list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.payments)) {
          list = data.payments;
        } else if (data && Array.isArray(data.data)) {
          list = data.data;
        }
        setPaymentsList(list);
        try {
          localStorage.setItem("au_payments", JSON.stringify(list));
        } catch (e) {}
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/companies?origin=au`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.companies)) {
          setCompaniesList(data.companies);
        } else if (Array.isArray(data)) {
          setCompaniesList(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const fetchOfferLetters = async () => {
    try {
      const response = await fetch(`${API_URL}/api/offer-letters?origin=au`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.offerLetters)) {
          setOfferLettersList(data.offerLetters);
        } else if (Array.isArray(data)) {
          setOfferLettersList(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch offer letters:", error);
    }
  };

  const fetchNominations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/nominations?origin=au`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.nominations)) {
          setNominationsList(data.nominations);
        } else if (Array.isArray(data)) {
          setNominationsList(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch nominations:", error);
    }
  };

  const fetchSponsorships = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sponsorships?origin=au`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.sponsorships)) {
          setSponsorshipsList(data.sponsorships);
        } else if (Array.isArray(data)) {
          setSponsorshipsList(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch sponsorships:", error);
    }
  };

  useEffect(() => {
    const activeToken = localStorage.getItem("token") || token;
    const activeRole = localStorage.getItem("role") || role;
    if (!activeToken) {
      navigate("/lusc/login");
      return;
    }
    if (activeRole === "admin" || activeRole === "employe") {
      fetchUsers();
      fetchVisas();
      fetchPayments();
      if (activeRole === "admin") {
        fetchCompanies();
        fetchOfferLetters();
        fetchNominations();
        fetchSponsorships();
      }
    }
  }, [role, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/lusc/login");
  };

  // User management handlers
  const handleCreateAccount = async (type) => {
    if (!accountFormData.username.trim() || !accountFormData.password) {
      alert("Please provide both username and password");
      return;
    }
    setIsAccountSubmitting(true);
    try {
      const endpoint =
        type === "employe" ?
          "/api/auth/employe?origin=au"
        : "/api/auth/user?origin=au";
      const payload = {
        username: accountFormData.username.trim(),
        password: accountFormData.password,
        origin: "au",
      };
      if (accountFormData.email.trim()) {
        payload.email = accountFormData.email.trim().toLowerCase();
      }
      if (accountFormData.givenName.trim()) {
        payload.givenName = accountFormData.givenName.trim();
      }
      if (accountFormData.familyName.trim()) {
        payload.familyName = accountFormData.familyName.trim();
      }
      if (accountFormData.passport.trim()) {
        payload.passport = accountFormData.passport.trim();
      }
      if (accountFormData.dob && accountFormData.dob.trim()) {
        payload.dob = accountFormData.dob.trim();
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        alert(
          `${type === "employe" ? "Employee" : "User"} created successfully!`,
        );
        setAccountFormData({
          username: "",
          password: "",
          email: "",
          givenName: "",
          familyName: "",
          passport: "",
          dob: "",
        });
        fetchUsers();
      } else if (response.status === 401) {
        handleLogout();
      } else {
        const error = await response.json().catch(() => ({}));
        alert(
          `Failed to create ${type}: ${error.message || "Failed to create account"}`,
        );
      }
    } catch (error) {
      alert("Error creating account");
      console.error(error);
    } finally {
      setIsAccountSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingUser(true);
    try {
      const payload = {
        username: editingUser.username?.trim(),
        origin: "au",
      };
      if (editingUser.email !== undefined) {
        payload.email = editingUser.email.trim().toLowerCase();
      }
      if (editingUser.givenName !== undefined) {
        payload.givenName = editingUser.givenName.trim();
      }
      if (editingUser.familyName !== undefined) {
        payload.familyName = editingUser.familyName.trim();
      }
      if (editingUser.passport !== undefined) {
        payload.passport = editingUser.passport.trim();
      }
      if (editingUser.dob !== undefined) {
        payload.dob = editingUser.dob.trim();
      }
      if (editingUser.password && editingUser.password.trim()) {
        payload.password = editingUser.password.trim();
      }

      const response = await fetch(
        `${API_URL}/api/auth/users/${editingUser._id}?origin=au`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        alert("User updated successfully!");
        setEditingUser(null);
        fetchUsers();
      } else if (response.status === 401) {
        handleLogout();
      } else {
        const error = await response.json().catch(() => ({}));
        alert(`Failed to update user: ${error.message || "Server error"}`);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user");
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await fetch(
        `${API_URL}/api/auth/users/${id}?origin=au`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        alert("User deleted successfully!");
        fetchUsers();
      } else {
        const error = await response.json();
        alert(`Failed to delete user: ${error.message}`);
      }
    } catch (error) {
      alert("Error deleting user");
      console.error(error);
    }
  };

  // Visa Document upload handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentDocFileName(file.name);
      if (!currentDocName.trim()) {
        const defaultName = file.name.replace(/\.[^/.]+$/, "");
        setCurrentDocName(defaultName);
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentDocBase64(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setCurrentDocBase64("");
      setCurrentDocFileName("");
    }
  };

  const addDocumentToList = () => {
    if (!currentDocBase64) {
      alert("Please select a file first");
      return;
    }
    const docName = currentDocName.trim() || currentDocFileName || "Document";
    setUploadedDocs((prev) => [
      ...prev,
      {
        document: currentDocBase64,
        documentName: docName,
        name: docName,
        fileName: currentDocFileName,
      },
    ]);
    setCurrentDocBase64("");
    setCurrentDocName("");
    setCurrentDocFileName("");
    setDocumentKey(Date.now());
  };

  const removeDocumentFromList = (index) => {
    setUploadedDocs((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Visa Grant Generator handlers
  const handleVisaGrantChange = (e) => {
    setVisaGrantFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegenerateVisaGrantVariables = () => {
    setVisaGrantFormData((prev) => ({
      ...prev,
      visaGrantNumber: `1139500${generateNumericString(6)}`,
      applicationId: generateNumericString(9),
      trn: `EGP${generate8CharRef().slice(0, 7)}`,
      passportNumber: `U${generateNumericString(7)}IND`,
      refrenceNumber: `VG-AU-${generate8CharRef()}`,
      grantDate: getFormattedTodayDate(),
      mustNotArriveAfter: getFormattedExpiryDate(12),
    }));
  };

  const handleOpenVisaGrantPreview = async (dataToPreview) => {
    const merged = getVisaGrantMergedData(dataToPreview || visaGrantFormData);
    setPreviewVisaData(merged);
    setIsVisaPreviewOpen(true);
    setIsVisaPreviewGenerating(true);
    setVisaPreviewPdfUrl(null);
    try {
      const blob = await generateVisaGrantBlob(merged);
      const url = URL.createObjectURL(blob);
      setVisaPreviewPdfUrl(url);
    } catch (err) {
      console.error("Failed to generate Visa PDF preview:", err);
      alert("Error generating Visa PDF preview");
    } finally {
      setIsVisaPreviewGenerating(false);
    }
  };

  const handleCloseVisaGrantPreview = () => {
    setIsVisaPreviewOpen(false);
    if (visaPreviewPdfUrl) {
      URL.revokeObjectURL(visaPreviewPdfUrl);
      setVisaPreviewPdfUrl(null);
    }
    setPreviewVisaData(null);
  };

  const handleDownloadVisaGrantPDF = async (data, id) => {
    const merged = getVisaGrantMergedData(data || visaGrantFormData);
    setDownloadingVisaId(id || "form");
    try {
      await downloadVisaGrantPDF(
        merged,
        `Visa_Grant_${merged.visaGrantNumber || merged.trn || "AU"}.pdf`,
      );
    } catch (err) {
      console.error("Failed to download Visa PDF:", err);
      alert("Failed to generate Visa PDF for download");
    } finally {
      setDownloadingVisaId(null);
    }
  };

  const handleSaveVisaGrant = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const merged = getVisaGrantMergedData(visaGrantFormData);
    const updated = [
      {
        ...merged,
        id: merged.id || `VG-${Date.now()}`,
        savedAt: new Date().toLocaleString(),
      },
      ...savedVisaGrants.filter((item) => item.id !== merged.id),
    ];
    setSavedVisaGrants(updated);
    try {
      localStorage.setItem("au_saved_visa_grants", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
    }
    setVisaGrantAlert({
      type: "success",
      message: `Visa Grant Notice for "${merged.applicantName}" saved to records!`,
    });
  };

  const handleDeleteSavedVisaGrant = (id) => {
    if (!window.confirm("Remove this saved Visa Grant Notice?")) return;
    const updated = savedVisaGrants.filter((item) => item.id !== id);
    setSavedVisaGrants(updated);
    try {
      localStorage.setItem("au_saved_visa_grants", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
    }
  };

  const handleLoadSavedVisaGrant = (item) => {
    setVisaGrantFormData(getVisaGrantMergedData(item));
    window.scrollTo({ top: 0, behavior: "smooth" });
    setVisaGrantAlert({
      type: "info",
      message: `Loaded grant notice for ${item.applicantName} into editor.`,
    });
  };

  // Visa handlers
  const handleVisaChange = (e) => {
    setVisaData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUserSelectForVisa = (e) => {
    const selectedUid = e.target.value;
    if (!selectedUid) {
      setVisaData((prev) => ({
        ...prev,
        userId: "",
      }));
      return;
    }

    const selectedUser = usersList.find(
      (u) => String(u._id) === String(selectedUid),
    );
    if (!selectedUser) {
      setVisaData((prev) => ({ ...prev, userId: selectedUid }));
      return;
    }

    // Check existing visas for this user
    const existingVisa = visasList.find(
      (v) =>
        String(typeof v.userId === "object" ? v.userId._id : v.userId) ===
        String(selectedUid),
    );

    // Check existing offer letters for this user
    const existingOfferLetter = offerLettersList.find(
      (ol) =>
        String(typeof ol.userId === "object" ? ol.userId._id : ol.userId) ===
        String(selectedUid),
    );

    // Determine values to autofill
    const autoGiven =
      selectedUser.givenName ||
      existingVisa?.givenNames ||
      existingOfferLetter?.applicantName ||
      selectedUser.username;
    const autoFamily =
      selectedUser.familyName || existingVisa?.familyName || "";
    const autoDoc =
      selectedUser.passport ||
      existingVisa?.documentNumber ||
      existingOfferLetter?.passportNumber ||
      "";
    const autoNationality =
      existingVisa?.nationality || existingOfferLetter?.nationality || "";
    const autoDob = existingVisa?.dateOfBirth || "";
    const autoEmployer =
      existingVisa?.employer || existingOfferLetter?.sponsorName || "";

    // Auto-select company if matched
    if (existingOfferLetter?.companyId) {
      const compId =
        typeof existingOfferLetter.companyId === "object" ?
          existingOfferLetter.companyId._id
        : existingOfferLetter.companyId;
      setSelectedVisaCompanyId(compId || "");
    }

    setVisaData((prev) => ({
      ...prev,
      userId: selectedUid,
      givenNames: autoGiven || prev.givenNames,
      familyName: autoFamily || prev.familyName,
      documentNumber: autoDoc || prev.documentNumber,
      nationality: autoNationality || prev.nationality,
      dateOfBirth: autoDob || prev.dateOfBirth,
      employer: autoEmployer || prev.employer,
    }));

    setVisaAlert({
      type: "info",
      message: `Autofilled details from user "${selectedUser.username}"${autoEmployer ? ` and company "${autoEmployer}"` : ""}.`,
    });
  };

  const handleCompanySelectForVisa = (e) => {
    const compId = e.target.value;
    setSelectedVisaCompanyId(compId);
    if (!compId) {
      return;
    }

    const selectedComp = companiesList.find(
      (c) => String(c._id) === String(compId),
    );
    if (selectedComp) {
      setVisaData((prev) => ({
        ...prev,
        employer: selectedComp.name,
      }));
      setVisaAlert({
        type: "info",
        message: `Autofilled company as "${selectedComp.name}"${selectedComp.address ? ` (${selectedComp.address})` : ""}.`,
      });
    }
  };

  const handleCreateVisa = async (e) => {
    e.preventDefault();
    setIsVisaSubmitting(true);
    setVisaAlert(null);
    try {
      let finalDocs = [...uploadedDocs];
      const isAlreadyInList = uploadedDocs.some(
        (d) =>
          d.document === currentDocBase64 ||
          (currentDocFileName && d.fileName === currentDocFileName),
      );
      if (currentDocBase64 && !isAlreadyInList) {
        if (!currentDocName.trim()) {
          setVisaAlert({
            type: "danger",
            message: "Document name is required for all uploaded files",
          });
          setIsVisaSubmitting(false);
          return;
        }
        finalDocs.push({
          document: currentDocBase64,
          documentName: currentDocName.trim(),
          name: currentDocName.trim(),
          fileName: currentDocFileName,
        });
      }

      for (const doc of finalDocs) {
        if (!doc.documentName || !doc.documentName.trim()) {
          setVisaAlert({
            type: "danger",
            message: "Document name is required for all uploaded files",
          });
          setIsVisaSubmitting(false);
          return;
        }
      }

      const docsArray = finalDocs.map((doc) => ({
        document: doc.document,
        documentName: doc.documentName.trim(),
        name: doc.name ? doc.name.trim() : doc.documentName.trim(),
        fileName: doc.fileName || "document.pdf",
      }));

      const payload = {
        ...visaData,
        origin: "au",
        document: docsArray,
      };

      if (!payload.userId) {
        delete payload.userId;
      }
      delete payload.documentName;

      const response = await fetch(`${API_URL}/api/visas?origin=au`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        alert("Visa created successfully!");
        setVisaData(getInitialVisaFormData());
        setUploadedDocs([]);
        setCurrentDocBase64("");
        setCurrentDocName("");
        setCurrentDocFileName("");
        setDocumentKey(Date.now());
        fetchVisas();
      } else if (response.status === 401) {
        handleLogout();
      } else {
        const error = await response.json();
        setVisaAlert({
          type: "danger",
          message: error.message || "Failed to create visa",
        });
        alert(`Failed to create visa: ${error.message}`);
      }
    } catch (error) {
      setVisaAlert({ type: "danger", message: "Error creating visa" });
      alert("Error creating visa");
      console.error(error);
    } finally {
      setIsVisaSubmitting(false);
    }
  };

  const handleDeleteVisa = async (id) => {
    if (!window.confirm("Are you sure you want to delete this visa?")) return;
    try {
      const response = await fetch(`${API_URL}/api/visas/${id}?origin=au`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        alert("Visa deleted successfully!");
        fetchVisas();
      } else {
        const error = await response.json();
        alert(`Failed to delete visa: ${error.message}`);
      }
    } catch (error) {
      alert("Error deleting visa");
      console.error(error);
    }
  };

  // Payment handlers
  const handlePaymentTypeChange = (type) => {
    setPaymentData((prev) => ({
      ...getInitialPaymentData(),
      paymentType: type,
      referenceNumber: prev.referenceNumber || generate8CharRef(),
      currency: prev.currency || "AUD",
      issuingOffice: prev.issuingOffice || "New Delhi",
      status: prev.status || "paid",
    }));
  };

  const handleEntitySelectForPayment = (e) => {
    const selectedId = e.target.value;
    const currentType = paymentData.paymentType || "visa";

    if (!selectedId) {
      setPaymentData((prev) => ({
        ...prev,
        selectedVisaId: "",
        selectedSponsorshipId: "",
        selectedNominationId: "",
        visaType: "",
        name: "",
        internalRef: "",
      }));
      return;
    }

    if (currentType === "visa") {
      const visa = visasList.find((v) => v._id === selectedId);
      if (visa) {
        const applicantName =
          [visa.givenNames, visa.familyName].filter(Boolean).join(" ") ||
          "Unknown Applicant";

        const extractedVisaType =
          visa.visaType || visa.visaClassSubclass || "Visitor (subclass 600)";

        const extractedInternalRef =
          visa.trn ||
          (visa.visaGrantNumber
            ? `GRN-${visa.visaGrantNumber.slice(-6)}`
            : `AU-MMS-${Math.floor(1000 + Math.random() * 9000)}`);

        setPaymentData((prev) => ({
          ...prev,
          selectedVisaId: selectedId,
          selectedSponsorshipId: "",
          selectedNominationId: "",
          visaType: extractedVisaType,
          name: applicantName,
          internalRef: prev.internalRef || extractedInternalRef,
          referenceNumber: prev.referenceNumber || generate8CharRef(),
        }));
      }
    } else if (currentType === "sponsorship") {
      const spon = sponsorshipsList.find((s) => s._id === selectedId);
      if (spon) {
        const applicantName =
          [spon.givenName, spon.familyName].filter(Boolean).join(" ") ||
          "Applicant";

        const extractedProg =
          spon.visaProgram || "Standard Business Sponsorship (SBS)";

        const extractedInternalRef =
          spon.sponsorshipTrn ||
          spon.applicationId ||
          spon.fileNumber ||
          `SPON-${Math.floor(1000 + Math.random() * 9000)}`;

        setPaymentData((prev) => ({
          ...prev,
          selectedVisaId: "",
          selectedSponsorshipId: selectedId,
          selectedNominationId: "",
          visaType: extractedProg,
          name: applicantName,
          internalRef: prev.internalRef || extractedInternalRef,
          referenceNumber: prev.referenceNumber || generate8CharRef(),
        }));
      }
    } else if (currentType === "nomination") {
      const nom = nominationsList.find((n) => n._id === selectedId);
      if (nom) {
        const nomineeName =
          [nom.givenName, nom.familyName].filter(Boolean).join(" ") ||
          "Nominee";

        const extractedProg =
          nom.visaProgram || "Nomination Application";

        const extractedInternalRef =
          nom.nominationTrn ||
          nom.applicationId ||
          nom.fileNumber ||
          `NOM-${Math.floor(1000 + Math.random() * 9000)}`;

        setPaymentData((prev) => ({
          ...prev,
          selectedVisaId: "",
          selectedSponsorshipId: "",
          selectedNominationId: selectedId,
          visaType: extractedProg,
          name: nomineeName,
          internalRef: prev.internalRef || extractedInternalRef,
          referenceNumber: prev.referenceNumber || generate8CharRef(),
        }));
      }
    }
  };

  const handleVisaSelectForPayment = handleEntitySelectForPayment;

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "status") {
        if (value === "paid") {
          if (!prev.transactionDate) {
            updated.transactionDate = new Date().toISOString().split("T")[0];
          }
        } else if (value === "pending") {
          updated.transactionDate = "";
        }
      }
      return updated;
    });
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!paymentData.referenceNumber || !paymentData.referenceNumber.trim()) {
      alert("Reference number is required.");
      return;
    }

    const currentType = paymentData.paymentType || "visa";

    if (currentType === "visa" && !paymentData.selectedVisaId) {
      alert("Please select a Visa record from the database to link this payment.");
      return;
    }
    if (currentType === "sponsorship" && !paymentData.selectedSponsorshipId) {
      alert("Please select a Sponsorship record from the database to link this payment.");
      return;
    }
    if (currentType === "nomination" && !paymentData.selectedNominationId) {
      alert("Please select a Nomination record from the database to link this payment.");
      return;
    }

    if (!paymentData.name || !paymentData.name.trim()) {
      alert("Name is required.");
      return;
    }
    if (
      !paymentData.amount ||
      isNaN(parseFloat(paymentData.amount)) ||
      parseFloat(paymentData.amount) <= 0
    ) {
      alert("Please enter a valid payment amount.");
      return;
    }

    let formattedDate = "—";
    let rawDateVal = null;

    if (paymentData.status === "paid") {
      if (!paymentData.transactionDate) {
        alert("Please enter the transaction date for a paid payment.");
        return;
      }
      const txnDateObj = new Date(paymentData.transactionDate);
      formattedDate =
        !isNaN(txnDateObj.getTime())
          ? txnDateObj.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : paymentData.transactionDate;
      rawDateVal = paymentData.transactionDate;
    }

    let selectedVisa = null;
    let selectedSponsorship = null;
    let selectedNomination = null;
    let givenNames = "";
    let familyName = "";

    if (currentType === "visa") {
      selectedVisa = visasList.find(
        (v) => v._id === paymentData.selectedVisaId
      );
      if (selectedVisa) {
        givenNames = selectedVisa.givenNames || "";
        familyName = selectedVisa.familyName || "";
      }
    } else if (currentType === "sponsorship") {
      selectedSponsorship = sponsorshipsList.find(
        (s) => s._id === paymentData.selectedSponsorshipId
      );
      if (selectedSponsorship) {
        givenNames = selectedSponsorship.givenName || "";
        familyName = selectedSponsorship.familyName || "";
      }
    } else if (currentType === "nomination") {
      selectedNomination = nominationsList.find(
        (n) => n._id === paymentData.selectedNominationId
      );
      if (selectedNomination) {
        givenNames = selectedNomination.givenName || "";
        familyName = selectedNomination.familyName || "";
      }
    }

    const payload = {
      paymentType: currentType,
      visaId: currentType === "visa" ? paymentData.selectedVisaId || null : null,
      visa: currentType === "visa" ? paymentData.selectedVisaId || null : null,
      sponsorshipId:
        currentType === "sponsorship"
          ? paymentData.selectedSponsorshipId || null
          : null,
      sponsorship:
        currentType === "sponsorship"
          ? paymentData.selectedSponsorshipId || null
          : null,
      nominationId:
        currentType === "nomination"
          ? paymentData.selectedNominationId || null
          : null,
      nomination:
        currentType === "nomination"
          ? paymentData.selectedNominationId || null
          : null,
      visaType:
        paymentData.visaType.trim() ||
        (currentType === "sponsorship"
          ? "Sponsorship Application Fee"
          : currentType === "nomination"
          ? "Nomination Application Fee"
          : "Visa Application Charge"),
      type:
        paymentData.visaType.trim() ||
        (currentType === "sponsorship"
          ? "Sponsorship Application Fee"
          : currentType === "nomination"
          ? "Nomination Application Fee"
          : "Visa Application Charge"),
      name: paymentData.name.trim(),
      applicantName: paymentData.name.trim(),
      givenNames:
        givenNames || (paymentData.name.trim().split(" ")[0] || ""),
      familyName:
        familyName ||
        (paymentData.name.trim().split(" ").slice(1).join(" ") || ""),
      referenceNumber: paymentData.referenceNumber.trim().toUpperCase(),
      ref: paymentData.referenceNumber.trim().toUpperCase(),
      transactionDate: rawDateVal,
      date: formattedDate,
      issuingOffice: paymentData.issuingOffice.trim() || "New Delhi",
      office: paymentData.issuingOffice.trim() || "New Delhi",
      internalRef:
        paymentData.internalRef.trim() ||
        (currentType === "sponsorship"
          ? "SPON-"
          : currentType === "nomination"
          ? "NOM-"
          : "AU-") + Math.floor(1000 + Math.random() * 9000),
      currency: paymentData.currency || "AUD",
      amount: parseFloat(paymentData.amount),
      status: paymentData.status,
      origin: "au",
    };

    try {
      const response = await fetch(`${API_URL}/api/payments?origin=au`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(
          `Payment record "${payload.referenceNumber}" created successfully!`
        );
        setPaymentData(getInitialPaymentData());
        fetchPayments();
      } else if (response.status === 401) {
        handleLogout();
      } else {
        const error = await response.json().catch(() => ({}));
        alert(`Failed to create payment: ${error.message || "Server error"}`);
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      alert("Error creating payment on server");
    }
  };

  const handleTogglePaymentStatus = async (payment) => {
    const isCurrentlyPaid = (payment.status || "").toLowerCase() === "paid";
    const nextStatus = isCurrentlyPaid ? "pending" : "paid";
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const rawDateVal =
      nextStatus === "paid" ? now.toISOString().split("T")[0] : null;

    const paymentId = payment._id || payment.id;
    const payload = {
      status: nextStatus,
      transactionDate: rawDateVal,
      date: nextStatus === "paid" ? formattedDate : "—",
    };

    try {
      const response = await fetch(
        `${API_URL}/api/payments/${paymentId}?origin=au`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        fetchPayments();
      } else if (response.status === 401) {
        handleLogout();
      } else {
        const err = await response.json().catch(() => ({}));
        alert(`Failed to update status: ${err.message || "Server error"}`);
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payment record?"))
      return;
    try {
      const response = await fetch(`${API_URL}/api/payments/${id}?origin=au`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("Payment deleted successfully!");
        fetchPayments();
      } else if (response.status === 401) {
        handleLogout();
      } else {
        const error = await response.json().catch(() => ({}));
        alert(`Failed to delete payment: ${error.message || "Server error"}`);
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("Error deleting payment");
    }
  };

  // Company handlers
  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!companyFormData.name.trim()) {
      setCompanyAlert({ type: "danger", message: "Company name is required." });
      return;
    }
    setIsCompanySubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/companies?origin=au`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: companyFormData.name.trim(),
          address:
            companyFormData.address ? companyFormData.address.trim() : "",
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setCompanyAlert({
          type: "success",
          message: "Company created successfully!",
        });
        setCompanyFormData({ name: "", address: "" });
        fetchCompanies();
      } else {
        setCompanyAlert({
          type: "danger",
          message: data.message || "Failed to create company",
        });
      }
    } catch (error) {
      setCompanyAlert({
        type: "danger",
        message: "Network error creating company",
      });
    } finally {
      setIsCompanySubmitting(false);
    }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    if (!editingCompany || !editingCompany.name.trim()) {
      alert("Company name is required.");
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/api/companies/${editingCompany._id}?origin=au`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editingCompany.name.trim(),
            address:
              editingCompany.address !== undefined ?
                editingCompany.address.trim()
              : "",
          }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        alert("Company updated successfully!");
        setEditingCompany(null);
        fetchCompanies();
      } else {
        alert(data.message || "Failed to update company");
      }
    } catch (error) {
      alert("Network error updating company");
    }
  };

  const handleDeleteCompany = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to delete company "${name || id}"?`,
      )
    )
      return;
    try {
      const response = await fetch(`${API_URL}/api/companies/${id}?origin=au`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        alert("Company deleted successfully!");
        fetchCompanies();
      } else {
        alert(data.message || "Failed to delete company");
      }
    } catch (error) {
      alert("Network error deleting company");
    }
  };

  // Offer Letter handlers
  const handleOpenOfferLetterPreview = async (letterData) => {
    const merged = getOfferLetterMergedData(letterData);
    setPreviewOfferLetterData(merged);
    setIsPreviewGenerating(true);
    try {
      const blob = await generateOfferLetterBlob(merged);
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
    } catch (err) {
      console.error("Failed to generate PDF preview:", err);
      alert("Could not generate PDF preview: " + (err.message || err));
    } finally {
      setIsPreviewGenerating(false);
    }
  };

  const handleCloseOfferLetterPreview = () => {
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
    }
    setPreviewPdfUrl(null);
    setPreviewOfferLetterData(null);
  };

  const handleDownloadOfferLetter = async (letterData, olId = null) => {
    if (olId) setDownloadingLetterId(olId);
    const merged = getOfferLetterMergedData(letterData);
    try {
      await downloadOfferLetterPDF(
        merged,
        `Grant_Letter_${merged.sponsorshipNumber || merged.refrenceNumber || "AU"}.pdf`,
      );
    } catch (err) {
      console.error("Failed to download PDF:", err);
      alert("Could not download PDF: " + (err.message || err));
    } finally {
      if (olId) setDownloadingLetterId(null);
    }
  };

  const handleRegenerateOfferLetterVariables = () => {
    setOfferLetterFormData((prev) => ({
      ...prev,
      refrenceNumber: `OL-AU-${generate8CharRef()}`,
      clientId: generateNumericString(11),
      sponsorshipApprovalId: generateNumericString(10),
      fileNumber: `ABD2026/${generateNumericString(6)}`,
      sponsorshipFeeReceiptNumber: generateNumericString(12),
      dateOfApproval: getFormattedTodayDate(),
      passportNumber: `A${generateNumericString(8)}`,
      sponsorshipNumber: `W${generateNumericString(7)}`,
      issueDate: getFormattedTodayDate(),
      validTill: getFormattedExpiryDate(6),
    }));
  };

  const handleCompanySelectChange = (e) => {
    const compId = e.target.value;
    const selectedComp = companiesList.find((c) => c._id === compId);
    setOfferLetterFormData((prev) => ({
      ...prev,
      companyId: compId,
      sponsorName: selectedComp ? selectedComp.name : prev.sponsorName,
      sponsorAddress:
        selectedComp?.address ? selectedComp.address : prev.sponsorAddress,
    }));
  };

  const handleUserSelectChange = (e) => {
    const uId = e.target.value;
    const selectedUser = usersList.find((u) => u._id === uId);
    const fullName =
      selectedUser ?
        [selectedUser.givenName, selectedUser.familyName]
          .filter(Boolean)
          .join(" ") || selectedUser.username
      : "";
    setOfferLetterFormData((prev) => ({
      ...prev,
      userId: uId,
      applicantName: fullName || prev.applicantName,
      passportNumber: selectedUser?.passport || prev.passportNumber,
    }));
  };

  const handleCreateOfferLetter = async (e) => {
    e.preventDefault();
    if (!offerLetterFormData.companyId) {
      setOfferLetterAlert({
        type: "danger",
        message: "Please select a company.",
      });
      return;
    }
    if (!offerLetterFormData.userId) {
      setOfferLetterAlert({
        type: "danger",
        message: "Please select a user account.",
      });
      return;
    }
    if (!offerLetterFormData.refrenceNumber.trim()) {
      setOfferLetterAlert({
        type: "danger",
        message: "Reference number is required.",
      });
      return;
    }
    setIsOfferLetterSubmitting(true);
    try {
      const details = {
        sponsorName:
          offerLetterFormData.sponsorName ||
          companiesList.find((c) => c._id === offerLetterFormData.companyId)
            ?.name ||
          "HD Contractor Limited",
        sponsorAddress:
          offerLetterFormData.sponsorAddress ||
          "54B Tidal Road, Sydney NSW 2000, Australia",
        clientId: offerLetterFormData.clientId || "15622175210",
        sponsorshipApprovalId:
          offerLetterFormData.sponsorshipApprovalId || "1740568430",
        fileNumber: offerLetterFormData.fileNumber || "ABD2026/420367",
        sponsorshipFeeReceiptNumber:
          offerLetterFormData.sponsorshipFeeReceiptNumber || "100001750031",
        dateOfApproval:
          offerLetterFormData.dateOfApproval || getFormattedTodayDate(),
        applicantName:
          offerLetterFormData.applicantName ||
          usersList.find((u) => u._id === offerLetterFormData.userId)
            ?.username ||
          "MD Shaminuzzaman",
        nationality: offerLetterFormData.nationality || "Bangladeshi",
        status: offerLetterFormData.status || "Issued",
        passportNumber: offerLetterFormData.passportNumber || "A09820252",
        sponsorshipNumber:
          offerLetterFormData.sponsorshipNumber ||
          offerLetterFormData.refrenceNumber.trim(),
        issueDate: offerLetterFormData.issueDate || getFormattedTodayDate(),
        validTill: offerLetterFormData.validTill || getFormattedExpiryDate(6),
      };

      const response = await fetch(`${API_URL}/api/offer-letters?origin=au`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: offerLetterFormData.companyId,
          userId: offerLetterFormData.userId,
          refrenceNumber: offerLetterFormData.refrenceNumber.trim(),
          details,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setOfferLetterAlert({
          type: "success",
          message: "Offer letter created successfully!",
        });
        setOfferLetterFormData(getInitialOfferLetterFormData());
        fetchOfferLetters();
      } else {
        setOfferLetterAlert({
          type: "danger",
          message: data.message || "Failed to create offer letter",
        });
      }
    } catch (error) {
      setOfferLetterAlert({
        type: "danger",
        message: "Network error creating offer letter",
      });
    } finally {
      setIsOfferLetterSubmitting(false);
    }
  };

  const handleStartEditOfferLetter = (ol) => {
    const merged = getOfferLetterMergedData(ol);
    setEditingOfferLetter({
      _id: ol._id,
      companyId: ol.companyId?._id || ol.companyId || "",
      userId: ol.userId?._id || ol.userId || "",
      refrenceNumber: ol.refrenceNumber || "",
      sponsorName: merged.sponsorName,
      sponsorAddress: merged.sponsorAddress,
      clientId: merged.clientId,
      sponsorshipApprovalId: merged.sponsorshipApprovalId,
      fileNumber: merged.fileNumber,
      sponsorshipFeeReceiptNumber: merged.sponsorshipFeeReceiptNumber,
      dateOfApproval: merged.dateOfApproval,
      applicantName: merged.applicantName,
      nationality: merged.nationality,
      status: merged.status,
      passportNumber: merged.passportNumber,
      sponsorshipNumber: merged.sponsorshipNumber,
      issueDate: merged.issueDate,
      validTill: merged.validTill,
    });
  };

  const handleUpdateOfferLetter = async (e) => {
    e.preventDefault();
    if (!editingOfferLetter || !editingOfferLetter.refrenceNumber.trim()) {
      alert("Reference number is required.");
      return;
    }
    const compId =
      editingOfferLetter.companyId?._id || editingOfferLetter.companyId;
    const usrId = editingOfferLetter.userId?._id || editingOfferLetter.userId;
    try {
      const details = {
        sponsorName: editingOfferLetter.sponsorName || "",
        sponsorAddress: editingOfferLetter.sponsorAddress || "",
        clientId: editingOfferLetter.clientId || "",
        sponsorshipApprovalId: editingOfferLetter.sponsorshipApprovalId || "",
        fileNumber: editingOfferLetter.fileNumber || "",
        sponsorshipFeeReceiptNumber:
          editingOfferLetter.sponsorshipFeeReceiptNumber || "",
        dateOfApproval: editingOfferLetter.dateOfApproval || "",
        applicantName: editingOfferLetter.applicantName || "",
        nationality: editingOfferLetter.nationality || "",
        status: editingOfferLetter.status || "Issued",
        passportNumber: editingOfferLetter.passportNumber || "",
        sponsorshipNumber:
          editingOfferLetter.sponsorshipNumber ||
          editingOfferLetter.refrenceNumber.trim(),
        issueDate: editingOfferLetter.issueDate || "",
        validTill: editingOfferLetter.validTill || "",
      };

      const response = await fetch(
        `${API_URL}/api/offer-letters/${editingOfferLetter._id}?origin=au`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            companyId: compId,
            userId: usrId,
            refrenceNumber: editingOfferLetter.refrenceNumber.trim(),
            details,
          }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        alert("Offer letter updated successfully!");
        setEditingOfferLetter(null);
        fetchOfferLetters();
      } else {
        alert(data.message || "Failed to update offer letter");
      }
    } catch (error) {
      alert("Network error updating offer letter");
    }
  };

  const handleDeleteOfferLetter = async (id, refNo) => {
    if (
      !window.confirm(
        `Are you sure you want to delete offer letter "${refNo || id}"?`,
      )
    )
      return;
    try {
      const response = await fetch(
        `${API_URL}/api/offer-letters/${id}?origin=au`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (response.ok) {
        alert("Offer letter deleted successfully!");
        fetchOfferLetters();
      } else {
        alert(data.message || "Failed to delete offer letter");
      }
    } catch (error) {
      alert("Network error deleting offer letter");
    }
  };

  // Nomination handlers
  const handleCreateNomination = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsNominationSubmitting(true);
    setNominationAlert(null);

    try {
      const formData = new FormData();
      formData.append("origin", nominationFormData.origin || "au");

      if (nominationFormData.userId) {
        formData.append("userId", nominationFormData.userId);
      }
      if (nominationFormData.applicationId) {
        formData.append(
          "applicationId",
          nominationFormData.applicationId.trim(),
        );
      }
      if (nominationFormData.nominationTrn) {
        formData.append(
          "nominationTrn",
          nominationFormData.nominationTrn.trim(),
        );
      }
      if (nominationFormData.visaProgram) {
        formData.append("visaProgram", nominationFormData.visaProgram.trim());
      }
      if (nominationFormData.fileNumber) {
        formData.append("fileNumber", nominationFormData.fileNumber.trim());
      }
      if (nominationFormData.givenName) {
        formData.append("givenName", nominationFormData.givenName.trim());
      }
      if (nominationFormData.familyName) {
        formData.append("familyName", nominationFormData.familyName.trim());
      }
      if (nominationFormData.approvedDate) {
        formData.append("approvedDate", nominationFormData.approvedDate.trim());
      }

      if (nominationFormData.file) {
        formData.append("document", nominationFormData.file);
        if (nominationFormData.documentName) {
          formData.append(
            "documentName",
            nominationFormData.documentName.trim(),
          );
        }
      }

      const response = await fetch(`${API_URL}/api/nominations?origin=au`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const resData = await response.json();

      if (response.ok) {
        setNominationAlert({
          type: "success",
          message: "Nomination created and recorded successfully!",
        });
        setNominationFormData(getInitialNominationFormData());
        fetchNominations();
      } else {
        setNominationAlert({
          type: "danger",
          message: resData.message || "Failed to create nomination",
        });
      }
    } catch (error) {
      console.error("Error creating nomination:", error);
      setNominationAlert({
        type: "danger",
        message: "Network error occurred while creating nomination",
      });
    } finally {
      setIsNominationSubmitting(false);
    }
  };

  const handleUpdateNomination = async (
    updatedNomination,
    newFile,
    newDocName,
  ) => {
    setIsUpdatingNomination(true);
    try {
      let response;
      if (newFile) {
        const formData = new FormData();
        formData.append("origin", updatedNomination.origin || "au");
        formData.append("document", newFile);
        if (newDocName) formData.append("documentName", newDocName.trim());

        const uid =
          typeof updatedNomination.userId === "object" ?
            updatedNomination.userId?._id
          : updatedNomination.userId;
        if (uid) {
          formData.append("userId", uid);
        } else {
          formData.append("userId", "");
        }

        if (updatedNomination.applicationId)
          formData.append(
            "applicationId",
            updatedNomination.applicationId.trim(),
          );
        if (updatedNomination.nominationTrn)
          formData.append(
            "nominationTrn",
            updatedNomination.nominationTrn.trim(),
          );
        if (updatedNomination.visaProgram)
          formData.append("visaProgram", updatedNomination.visaProgram.trim());
        if (updatedNomination.fileNumber)
          formData.append("fileNumber", updatedNomination.fileNumber.trim());
        if (updatedNomination.givenName)
          formData.append("givenName", updatedNomination.givenName.trim());
        if (updatedNomination.familyName)
          formData.append("familyName", updatedNomination.familyName.trim());
        if (updatedNomination.approvedDate)
          formData.append(
            "approvedDate",
            updatedNomination.approvedDate.trim(),
          );

        response = await fetch(
          `${API_URL}/api/nominations/${updatedNomination._id}?origin=au`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );
      } else {
        const payload = {
          ...updatedNomination,
          userId:
            typeof updatedNomination.userId === "object" ?
              updatedNomination.userId?._id
            : updatedNomination.userId || null,
        };
        response = await fetch(
          `${API_URL}/api/nominations/${updatedNomination._id}?origin=au`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          },
        );
      }

      const resData = await response.json();
      if (response.ok) {
        alert("Nomination updated successfully!");
        setEditingNomination(null);
        fetchNominations();
      } else {
        alert(resData.message || "Failed to update nomination");
      }
    } catch (error) {
      console.error("Error updating nomination:", error);
      alert("Network error updating nomination");
    } finally {
      setIsUpdatingNomination(false);
    }
  };

  const handleDeleteNomination = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this nomination record?")
    )
      return;
    try {
      const response = await fetch(
        `${API_URL}/api/nominations/${id}?origin=au`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        alert("Nomination deleted successfully");
        fetchNominations();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete nomination");
      }
    } catch (error) {
      console.error("Error deleting nomination:", error);
      alert("Network error deleting nomination");
    }
  };

  // Sponsorship handlers
  const handleCreateSponsorship = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSponsorshipSubmitting(true);
    setSponsorshipAlert(null);

    try {
      const formData = new FormData();
      formData.append("origin", sponsorshipFormData.origin || "au");

      if (sponsorshipFormData.userId) {
        formData.append("userId", sponsorshipFormData.userId);
      }
      if (sponsorshipFormData.applicationId) {
        formData.append(
          "applicationId",
          sponsorshipFormData.applicationId.trim(),
        );
      }
      if (sponsorshipFormData.sponsorshipTrn) {
        formData.append(
          "sponsorshipTrn",
          sponsorshipFormData.sponsorshipTrn.trim(),
        );
      }
      if (sponsorshipFormData.visaProgram) {
        formData.append("visaProgram", sponsorshipFormData.visaProgram.trim());
      }
      if (sponsorshipFormData.fileNumber) {
        formData.append("fileNumber", sponsorshipFormData.fileNumber.trim());
      }
      if (sponsorshipFormData.givenName) {
        formData.append("givenName", sponsorshipFormData.givenName.trim());
      }
      if (sponsorshipFormData.familyName) {
        formData.append("familyName", sponsorshipFormData.familyName.trim());
      }
      if (sponsorshipFormData.approvedDate) {
        formData.append(
          "approvedDate",
          sponsorshipFormData.approvedDate.trim(),
        );
      }

      if (sponsorshipFormData.file) {
        formData.append("document", sponsorshipFormData.file);
        if (sponsorshipFormData.documentName) {
          formData.append(
            "documentName",
            sponsorshipFormData.documentName.trim(),
          );
        }
      }

      const response = await fetch(`${API_URL}/api/sponsorships?origin=au`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const resData = await response.json();

      if (response.ok) {
        setSponsorshipAlert({
          type: "success",
          message: "Sponsorship created and recorded successfully!",
        });
        setSponsorshipFormData(getInitialSponsorshipFormData());
        fetchSponsorships();
      } else {
        setSponsorshipAlert({
          type: "danger",
          message: resData.message || "Failed to create sponsorship",
        });
      }
    } catch (error) {
      console.error("Error creating sponsorship:", error);
      setSponsorshipAlert({
        type: "danger",
        message: "Network error occurred while creating sponsorship",
      });
    } finally {
      setIsSponsorshipSubmitting(false);
    }
  };

  const handleUpdateSponsorship = async (
    updatedSponsorship,
    newFile,
    newDocName,
  ) => {
    setIsUpdatingSponsorship(true);
    try {
      let response;
      if (newFile) {
        const formData = new FormData();
        formData.append("origin", updatedSponsorship.origin || "au");
        formData.append("document", newFile);
        if (newDocName) formData.append("documentName", newDocName.trim());

        const uid =
          typeof updatedSponsorship.userId === "object" ?
            updatedSponsorship.userId?._id
          : updatedSponsorship.userId;
        if (uid) {
          formData.append("userId", uid);
        } else {
          formData.append("userId", "");
        }

        if (updatedSponsorship.applicationId)
          formData.append(
            "applicationId",
            updatedSponsorship.applicationId.trim(),
          );
        if (updatedSponsorship.sponsorshipTrn)
          formData.append(
            "sponsorshipTrn",
            updatedSponsorship.sponsorshipTrn.trim(),
          );
        if (updatedSponsorship.visaProgram)
          formData.append("visaProgram", updatedSponsorship.visaProgram.trim());
        if (updatedSponsorship.fileNumber)
          formData.append("fileNumber", updatedSponsorship.fileNumber.trim());
        if (updatedSponsorship.givenName)
          formData.append("givenName", updatedSponsorship.givenName.trim());
        if (updatedSponsorship.familyName)
          formData.append("familyName", updatedSponsorship.familyName.trim());
        if (updatedSponsorship.approvedDate)
          formData.append(
            "approvedDate",
            updatedSponsorship.approvedDate.trim(),
          );

        response = await fetch(
          `${API_URL}/api/sponsorships/${updatedSponsorship._id}?origin=au`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );
      } else {
        const payload = {
          ...updatedSponsorship,
          userId:
            typeof updatedSponsorship.userId === "object" ?
              updatedSponsorship.userId?._id
            : updatedSponsorship.userId || null,
        };
        response = await fetch(
          `${API_URL}/api/sponsorships/${updatedSponsorship._id}?origin=au`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          },
        );
      }

      const resData = await response.json();
      if (response.ok) {
        alert("Sponsorship updated successfully!");
        setEditingSponsorship(null);
        fetchSponsorships();
      } else {
        alert(resData.message || "Failed to update sponsorship");
      }
    } catch (error) {
      console.error("Error updating sponsorship:", error);
      alert("Network error updating sponsorship");
    } finally {
      setIsUpdatingSponsorship(false);
    }
  };

  const handleDeleteSponsorship = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this sponsorship record?",
      )
    )
      return;
    try {
      const response = await fetch(
        `${API_URL}/api/sponsorships/${id}?origin=au`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        alert("Sponsorship deleted successfully");
        fetchSponsorships();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete sponsorship");
      }
    } catch (error) {
      console.error("Error deleting sponsorship:", error);
      alert("Network error deleting sponsorship");
    }
  };

  if (role !== "admin" && role !== "employe") {
    return (
      <div style={{ padding: "2rem" }}>
        Access Denied. Only Admin and Employee roles can access this dashboard.
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Mobile Topbar */}
      <div className="dashboard-mobile-nav">
        <button
          type="button"
          className="dashboard-hamburger-btn"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          aria-label="Toggle Navigation">
          <span>☰</span>
        </button>
        <span className="dashboard-mobile-title">Admin Portal</span>
        <button
          type="button"
          className="dashboard-mobile-logout"
          onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isMobileNavOpen && (
        <div
          className="dashboard-sidebar-backdrop"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isMobileNavOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Admin Portal</h2>
          {isMobileNavOpen && (
            <button
              type="button"
              className="dashboard-sidebar-close-btn"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Close sidebar">
              ✕
            </button>
          )}
        </div>
        <div className="sidebar-menu">
          {role === "admin" && (
            <div
              className={`menu-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("overview");
                setIsMobileNavOpen(false);
              }}>
              <span>📊</span> Overview
            </div>
          )}
          <div
            className={`menu-item ${activeTab === "visas" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("visas");
              setIsMobileNavOpen(false);
            }}>
            <span>📄</span> Visa Management
          </div>
          <div
            className={`menu-item ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("payments");
              setIsMobileNavOpen(false);
            }}>
            <span>💳</span> Payments
          </div>
          <div
            className={`menu-item ${activeTab === "accounts" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("accounts");
              setIsMobileNavOpen(false);
            }}>
            <span>👥</span> Account Management
          </div>
          {role === "admin" && (
            <>
              <div
                className={`menu-item ${activeTab === "companies" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("companies");
                  setIsMobileNavOpen(false);
                }}>
                <span>🏢</span> Companies
              </div>
              <div
                className={`menu-item ${activeTab === "offer-letters" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("offer-letters");
                  setIsMobileNavOpen(false);
                }}>
                <span>✉️</span> Offer Letters
              </div>
              <div
                className={`menu-item ${activeTab === "visa-grant" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("visa-grant");
                  setIsMobileNavOpen(false);
                }}>
                <span>🪪</span> Visa Grant Letter
              </div>
              <div
                className={`menu-item ${activeTab === "nominations" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("nominations");
                  setIsMobileNavOpen(false);
                }}>
                <span>📑</span> Nominations
              </div>
              <div
                className={`menu-item ${activeTab === "sponsorships" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("sponsorships");
                  setIsMobileNavOpen(false);
                }}>
                <span>🤝</span> Sponsorships
              </div>
            </>
          )}
        </div>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
            }}>
            <div>
              <h1>Welcome, {role.toUpperCase()}</h1>
              <p
                style={{
                  margin: "5px 0 0 0",
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                }}>
                ImmiAccount Administration Portal (Origin: AU)
              </p>
            </div>
            {role === "admin" && (
              <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                <div
                  onClick={() => setActiveTab("visas")}
                  style={{
                    cursor: "pointer",
                    background: "white",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                    borderLeft: "4px solid var(--primary-color)",
                    minWidth: "110px",
                  }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}>
                    Total Visas
                  </div>
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: "var(--primary-color)",
                    }}>
                    {visasList.length}
                  </div>
                </div>
                <div
                  onClick={() => setActiveTab("payments")}
                  style={{
                    cursor: "pointer",
                    background: "white",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                    borderLeft: "4px solid #f59e0b",
                    minWidth: "110px",
                  }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}>
                    Total Payments
                  </div>
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: "#f59e0b",
                    }}>
                    {paymentsList.length}
                  </div>
                </div>
                <div
                  onClick={() => setActiveTab("accounts")}
                  style={{
                    cursor: "pointer",
                    background: "white",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                    borderLeft: "4px solid #10b981",
                    minWidth: "110px",
                  }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}>
                    Total Accounts
                  </div>
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: "#10b981",
                    }}>
                    {usersList.length}
                  </div>
                </div>
                <div
                  onClick={() => setActiveTab("companies")}
                  style={{
                    cursor: "pointer",
                    background: "white",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                    borderLeft: "4px solid #8b5cf6",
                    minWidth: "110px",
                  }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}>
                    Companies
                  </div>
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: "#8b5cf6",
                    }}>
                    {companiesList.length}
                  </div>
                </div>
                <div
                  onClick={() => setActiveTab("offer-letters")}
                  style={{
                    cursor: "pointer",
                    background: "white",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                    borderLeft: "4px solid #06b6d4",
                    minWidth: "110px",
                  }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}>
                    Offer Letters
                  </div>
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: "#06b6d4",
                    }}>
                    {offerLettersList.length}
                  </div>
                </div>
                <div
                  onClick={() => setActiveTab("visa-grant")}
                  style={{
                    cursor: "pointer",
                    background: "white",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                    borderLeft: "4px solid #059669",
                    minWidth: "110px",
                  }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}>
                    Grant Letters
                  </div>
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: "#059669",
                    }}>
                    {savedVisaGrants.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {activeTab === "overview" && role === "admin" && (
          <OverviewTab
            visasList={visasList}
            sponsorshipsList={sponsorshipsList}
            nominationsList={nominationsList}
            fetchVisas={fetchVisas}
            handleDeleteVisa={handleDeleteVisa}
            paymentsList={paymentsList}
            usersList={usersList}
            fetchPayments={fetchPayments}
            paymentSearch={paymentSearch}
            setPaymentSearch={setPaymentSearch}
            paymentStatusFilter={paymentStatusFilter}
            setPaymentStatusFilter={setPaymentStatusFilter}
            paymentTypeFilter={paymentTypeFilter}
            setPaymentTypeFilter={setPaymentTypeFilter}
            handleTogglePaymentStatus={handleTogglePaymentStatus}
            handleDeletePayment={handleDeletePayment}
            companiesList={companiesList}
            companySearch={companySearch}
            setCompanySearch={setCompanySearch}
            fetchCompanies={fetchCompanies}
            setEditingCompany={setEditingCompany}
            handleDeleteCompany={handleDeleteCompany}
            offerLettersList={offerLettersList}
            offerLetterCompanyFilter={offerLetterCompanyFilter}
            setOfferLetterCompanyFilter={setOfferLetterCompanyFilter}
            offerLetterSearch={offerLetterSearch}
            setOfferLetterSearch={setOfferLetterSearch}
            fetchOfferLetters={fetchOfferLetters}
            handleOpenOfferLetterPreview={handleOpenOfferLetterPreview}
            handleDownloadOfferLetter={handleDownloadOfferLetter}
            downloadingLetterId={downloadingLetterId}
            handleStartEditOfferLetter={handleStartEditOfferLetter}
            handleDeleteOfferLetter={handleDeleteOfferLetter}
            savedVisaGrants={savedVisaGrants}
            visaGrantSearch={visaGrantSearch}
            setVisaGrantSearch={setVisaGrantSearch}
            setVisaGrantFormData={setVisaGrantFormData}
            setVisaGrantAlert={setVisaGrantAlert}
            handleLoadSavedVisaGrant={handleLoadSavedVisaGrant}
            handleOpenVisaGrantPreview={handleOpenVisaGrantPreview}
            handleDownloadVisaGrantPDF={handleDownloadVisaGrantPDF}
            downloadingVisaId={downloadingVisaId}
            handleDeleteSavedVisaGrant={handleDeleteSavedVisaGrant}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            fetchUsers={fetchUsers}
            setEditingUser={setEditingUser}
            handleDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === "accounts" && (
          <AccountsTab
            accountFormData={accountFormData}
            setAccountFormData={setAccountFormData}
            isAccountSubmitting={isAccountSubmitting}
            handleCreateAccount={handleCreateAccount}
            role={role}
            usersList={usersList}
            fetchUsers={fetchUsers}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            setEditingUser={setEditingUser}
            handleDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === "visas" && (
          <VisasTab
            visaData={visaData}
            visaAlert={visaAlert}
            handleCreateVisa={handleCreateVisa}
            handleUserSelectForVisa={handleUserSelectForVisa}
            usersList={usersList}
            selectedVisaCompanyId={selectedVisaCompanyId}
            handleCompanySelectForVisa={handleCompanySelectForVisa}
            companiesList={companiesList}
            handleVisaChange={handleVisaChange}
            uploadedDocs={uploadedDocs}
            removeDocumentFromList={removeDocumentFromList}
            currentDocName={currentDocName}
            setCurrentDocName={setCurrentDocName}
            documentKey={documentKey}
            handleFileChange={handleFileChange}
            addDocumentToList={addDocumentToList}
            isVisaSubmitting={isVisaSubmitting}
            visasList={visasList}
            fetchVisas={fetchVisas}
            handleDeleteVisa={handleDeleteVisa}
          />
        )}

        {activeTab === "payments" && (
          <PaymentsTab
            paymentData={paymentData}
            setPaymentData={setPaymentData}
            handleCreatePayment={handleCreatePayment}
            visasList={visasList}
            sponsorshipsList={sponsorshipsList}
            nominationsList={nominationsList}
            handleVisaSelectForPayment={handleEntitySelectForPayment}
            handleEntitySelectForPayment={handleEntitySelectForPayment}
            handlePaymentTypeChange={handlePaymentTypeChange}
            handlePaymentChange={handlePaymentChange}
            paymentsList={paymentsList}
            usersList={usersList}
            fetchPayments={fetchPayments}
            paymentSearch={paymentSearch}
            setPaymentSearch={setPaymentSearch}
            paymentStatusFilter={paymentStatusFilter}
            setPaymentStatusFilter={setPaymentStatusFilter}
            paymentTypeFilter={paymentTypeFilter}
            setPaymentTypeFilter={setPaymentTypeFilter}
            handleTogglePaymentStatus={handleTogglePaymentStatus}
            handleDeletePayment={handleDeletePayment}
          />
        )}

        {activeTab === "companies" && role === "admin" && (
          <CompaniesTab
            companyFormData={companyFormData}
            setCompanyFormData={setCompanyFormData}
            companyAlert={companyAlert}
            setCompanyAlert={setCompanyAlert}
            isCompanySubmitting={isCompanySubmitting}
            handleCreateCompany={handleCreateCompany}
            companiesList={companiesList}
            fetchCompanies={fetchCompanies}
            companySearch={companySearch}
            setCompanySearch={setCompanySearch}
            setEditingCompany={setEditingCompany}
            handleDeleteCompany={handleDeleteCompany}
          />
        )}

        {activeTab === "offer-letters" && role === "admin" && (
          <OfferLettersTab
            offerLetterFormData={offerLetterFormData}
            setOfferLetterFormData={setOfferLetterFormData}
            offerLetterAlert={offerLetterAlert}
            setOfferLetterAlert={setOfferLetterAlert}
            isOfferLetterSubmitting={isOfferLetterSubmitting}
            handleCreateOfferLetter={handleCreateOfferLetter}
            handleRegenerateOfferLetterVariables={
              handleRegenerateOfferLetterVariables
            }
            handleOpenOfferLetterPreview={handleOpenOfferLetterPreview}
            handleCompanySelectChange={handleCompanySelectChange}
            handleUserSelectChange={handleUserSelectChange}
            companiesList={companiesList}
            usersList={usersList}
            offerLettersList={offerLettersList}
            fetchOfferLetters={fetchOfferLetters}
            offerLetterSearch={offerLetterSearch}
            setOfferLetterSearch={setOfferLetterSearch}
            offerLetterCompanyFilter={offerLetterCompanyFilter}
            setOfferLetterCompanyFilter={setOfferLetterCompanyFilter}
            handleStartEditOfferLetter={handleStartEditOfferLetter}
            handleDownloadOfferLetter={handleDownloadOfferLetter}
            downloadingLetterId={downloadingLetterId}
            handleDeleteOfferLetter={handleDeleteOfferLetter}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "visa-grant" && (
          <VisaGrantTab
            visaGrantFormData={visaGrantFormData}
            setVisaGrantFormData={setVisaGrantFormData}
            visaGrantAlert={visaGrantAlert}
            setVisaGrantAlert={setVisaGrantAlert}
            handleRegenerateVisaGrantVariables={
              handleRegenerateVisaGrantVariables
            }
            handleOpenVisaGrantPreview={handleOpenVisaGrantPreview}
            handleDownloadVisaGrantPDF={handleDownloadVisaGrantPDF}
            handleSaveVisaGrant={handleSaveVisaGrant}
            handleVisaGrantChange={handleVisaGrantChange}
            usersList={usersList}
            visasList={visasList}
            downloadingVisaId={downloadingVisaId}
            savedVisaGrants={savedVisaGrants}
            visaGrantSearch={visaGrantSearch}
            setVisaGrantSearch={setVisaGrantSearch}
            handleLoadSavedVisaGrant={handleLoadSavedVisaGrant}
            handleDeleteSavedVisaGrant={handleDeleteSavedVisaGrant}
          />
        )}

        {activeTab === "nominations" && role === "admin" && (
          <NominationsTab
            nominationsList={nominationsList}
            fetchNominations={fetchNominations}
            nominationFormData={nominationFormData}
            setNominationFormData={setNominationFormData}
            nominationSearch={nominationSearch}
            setNominationSearch={setNominationSearch}
            nominationAlert={nominationAlert}
            setNominationAlert={setNominationAlert}
            isNominationSubmitting={isNominationSubmitting}
            handleCreateNomination={handleCreateNomination}
            setEditingNomination={setEditingNomination}
            handleDeleteNomination={handleDeleteNomination}
            usersList={usersList}
          />
        )}

        {activeTab === "sponsorships" && role === "admin" && (
          <SponsorshipsTab
            sponsorshipsList={sponsorshipsList}
            fetchSponsorships={fetchSponsorships}
            sponsorshipFormData={sponsorshipFormData}
            setSponsorshipFormData={setSponsorshipFormData}
            sponsorshipSearch={sponsorshipSearch}
            setSponsorshipSearch={setSponsorshipSearch}
            sponsorshipAlert={sponsorshipAlert}
            setSponsorshipAlert={setSponsorshipAlert}
            isSponsorshipSubmitting={isSponsorshipSubmitting}
            handleCreateSponsorship={handleCreateSponsorship}
            setEditingSponsorship={setEditingSponsorship}
            handleDeleteSponsorship={handleDeleteSponsorship}
            usersList={usersList}
          />
        )}
      </main>

      {/* Modals */}
      <EditUserModal
        editingUser={editingUser}
        setEditingUser={setEditingUser}
        handleUpdateUser={handleUpdateUser}
        isUpdatingUser={isUpdatingUser}
      />
      <EditCompanyModal
        editingCompany={editingCompany}
        setEditingCompany={setEditingCompany}
        handleUpdateCompany={handleUpdateCompany}
      />
      <EditOfferLetterModal
        editingOfferLetter={editingOfferLetter}
        setEditingOfferLetter={setEditingOfferLetter}
        handleUpdateOfferLetter={handleUpdateOfferLetter}
        handleOpenOfferLetterPreview={handleOpenOfferLetterPreview}
        companiesList={companiesList}
        usersList={usersList}
      />
      <EditNominationModal
        editingNomination={editingNomination}
        setEditingNomination={setEditingNomination}
        handleUpdateNomination={handleUpdateNomination}
        isUpdatingNomination={isUpdatingNomination}
        usersList={usersList}
      />
      <EditSponsorshipModal
        editingSponsorship={editingSponsorship}
        setEditingSponsorship={setEditingSponsorship}
        handleUpdateSponsorship={handleUpdateSponsorship}
        isUpdatingSponsorship={isUpdatingSponsorship}
        usersList={usersList}
      />
      <OfferLetterPreviewModal
        previewOfferLetterData={previewOfferLetterData}
        previewPdfUrl={previewPdfUrl}
        isPreviewGenerating={isPreviewGenerating}
        handleCloseOfferLetterPreview={handleCloseOfferLetterPreview}
        handleDownloadOfferLetter={handleDownloadOfferLetter}
      />
      <VisaPreviewModal
        isVisaPreviewOpen={isVisaPreviewOpen}
        previewVisaData={previewVisaData}
        visaPreviewPdfUrl={visaPreviewPdfUrl}
        isVisaPreviewGenerating={isVisaPreviewGenerating}
        handleCloseVisaGrantPreview={handleCloseVisaGrantPreview}
        handleDownloadVisaGrantPDF={handleDownloadVisaGrantPDF}
      />
    </div>
  );
}

export default Dashboard;
