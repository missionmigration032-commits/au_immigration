import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";
import {
  generateOfferLetterBlob,
  downloadOfferLetterPDF,
} from "../components/OfferLetterPDF";
import {
  generateVisaGrantBlob,
  generateVisaGrantBase64,
  downloadVisaGrantPDF,
} from "../components/VisaGrantPDF";

const getFormattedTodayDate = () => {
  const options = { day: "2-digit", month: "long", year: "numeric" };
  return new Date().toLocaleDateString("en-GB", options);
};

const getFormattedExpiryDate = (months = 6) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  const options = { day: "2-digit", month: "long", year: "numeric" };
  return d.toLocaleDateString("en-GB", options);
};

const generateNumericString = (length) => {
  let res = "";
  for (let i = 0; i < length; i++) {
    res += Math.floor(Math.random() * 10).toString();
  }
  return res;
};

const generate8CharRef = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getInitialOfferLetterFormData = () => ({
  companyId: "",
  userId: "",
  refrenceNumber: `OL-AU-${generate8CharRef()}`,
  sponsorName: "",
  sponsorAddress: "54B Tidal Road, Sydney NSW 2000, Australia",
  clientId: generateNumericString(11),
  sponsorshipApprovalId: generateNumericString(10),
  fileNumber: `ABD2026/${generateNumericString(6)}`,
  sponsorshipFeeReceiptNumber: generateNumericString(12),
  dateOfApproval: getFormattedTodayDate(),
  applicantName: "",
  nationality: "Bangladeshi",
  status: "Issued",
  passportNumber: `A${generateNumericString(8)}`,
  sponsorshipNumber: `W${generateNumericString(7)}`,
  issueDate: getFormattedTodayDate(),
  validTill: getFormattedExpiryDate(6),
});

const initialVisaData = {
  userId: "",
  familyName: "",
  givenNames: "",
  documentNumber: "",
  visaClassSubclass: "",
  visaApplicant: "Primary",
  visaGrantDate: "",
  visaExpiryDate: "",
  visaStatus: "In Effect",
  visaGrantNumber: "",
  trn: "",
  entriesAllowed: "Multiple",
  mustNotArriveAfter: "",
  enterBeforeDate: "",
  periodOfStay: "Indefinite",
  visaType: "Temporary",
  dateOfBirth: "",
  nationality: "",
};

const getInitialVisaFormData = () => ({ ...initialVisaData });

const getInitialVisaGrantFormData = () => ({
  id: `VG-${Date.now()}`,
  refrenceNumber: `VG-AU-${generate8CharRef()}`,
  applicantName: "PATEL Chintankumar Ranchhodbhai",
  dateOfBirth: "25 September 1999",
  passportNumber: `U${generateNumericString(7)}IND`,
  passportCountry: "INDIA",

  visaName: "Transit (subclass 771)",
  applicationStatus: "Granted",
  visaGrantNumber: `1139500${generateNumericString(6)}`,
  applicationId: generateNumericString(9),
  trn: `EGP${generate8CharRef().slice(0, 7)}`,

  grantDate: getFormattedTodayDate(),
  mustNotArriveAfter: getFormattedExpiryDate(12),
  lengthOfStay: "3 day(s) from the date of each arrival",
  travel: "Multiple entries",

  conditions: "8101 - No work\n8201 - Maximum three months study",
  whyKeepNotice:
    "Airlines might ask for details in this notice so they can carry out checks to allow you to board the plane.",
  createdAt: new Date().toISOString(),
});

const getInitialPaymentData = () => ({
  selectedVisaId: "",
  visaType: "",
  name: "",
  referenceNumber: generate8CharRef(),
  transactionDate: new Date().toISOString().split("T")[0],
  issuingOffice: "New Delhi",
  internalRef: "",
  currency: "AUD",
  amount: "",
  status: "paid",
});

function Dashboard() {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [activeTab, setActiveTab] = useState("visas"); // 'overview', 'visas', 'payments', or 'accounts'

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

  // Account creation state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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
  });
  const [companySearch, setCompanySearch] = useState("");
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyAlert, setCompanyAlert] = useState(null);
  const [isCompanySubmitting, setIsCompanySubmitting] = useState(false);

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

  useEffect(() => {
    if (role === "admin" || role === "employe") {
      fetchUsers();
      fetchVisas();
      fetchPayments();
      if (role === "admin") {
        fetchCompanies();
        fetchOfferLetters();
      }
    }
  }, [role, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/lusc/login");
  };

  const handleCreateAccount = async (type) => {
    try {
      const endpoint =
        type === "employe" ?
          "/api/auth/employe?origin=au"
        : "/api/auth/user?origin=au";
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, password, origin: "au" }),
      });
      if (response.ok) {
        alert(`${type} created successfully!`);
        setUsername("");
        setPassword("");
        fetchUsers();
      } else if (response.status === 401) {
        handleLogout();
      } else {
        const error = await response.json();
        alert(`Failed to create ${type}: ${error.message}`);
      }
    } catch (error) {
      alert("Error creating account");
      console.error(error);
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

  const getVisaGrantMergedData = (v) => {
    if (!v) return {};
    return {
      id: v.id || `VG-${Date.now()}`,
      refrenceNumber: v.refrenceNumber || `VG-AU-${generate8CharRef()}`,
      applicantName: v.applicantName || "PATEL Chintankumar Ranchhodbhai",
      dateOfBirth: v.dateOfBirth || "25 September 1999",
      passportNumber: v.passportNumber || "U4019655IND",
      passportCountry: v.passportCountry || "INDIA",
      visaName: v.visaName || "Transit (subclass 771)",
      applicationStatus: v.applicationStatus || "Granted",
      visaGrantNumber: v.visaGrantNumber || "1139500159106",
      applicationId: v.applicationId || "106951626",
      trn: v.trn || "EGP6QH59AO",
      grantDate: v.grantDate || getFormattedTodayDate(),
      mustNotArriveAfter: v.mustNotArriveAfter || getFormattedExpiryDate(12),
      lengthOfStay: v.lengthOfStay || "3 day(s) from the date of each arrival",
      travel: v.travel || "Multiple entries",
      conditions: v.conditions || "8101 - No work\n8201 - Maximum three months study",
      whyKeepNotice:
        v.whyKeepNotice ||
        "Airlines might ask for details in this notice so they can carry out checks to allow you to board the plane.",
      createdAt: v.createdAt || new Date().toISOString(),
    };
  };

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
        `Visa_Grant_${merged.visaGrantNumber || merged.trn || "AU"}.pdf`
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

  const handleVisaChange = (e) => {
    setVisaData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

      // Verify document name is present for all documents
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

      // Format document array specifically as expected by createVisa in backend:
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
        delete payload.userId; // Let it be unassigned
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
        fetchVisas(); // Refresh visa list
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

  const renderUsersTable = () => (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
          flexWrap: "wrap",
          gap: "10px",
        }}>
        <h2 style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
          Created Accounts ({usersList.length})
        </h2>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: "6px 14px", fontSize: "0.85rem" }}
          onClick={fetchUsers}>
          🔄 Refresh Users
        </button>
      </div>
      <div className="table-container">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Origin</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersList.length > 0 ?
              usersList.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: "600" }}>{u.username}</td>
                  <td>
                    <span
                      className={`status-badge role-badge-${u.role || "user"}`}>
                      {u.role ? u.role.toUpperCase() : "USER"}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge">
                      {u.origin ? u.origin.toUpperCase() : "AU"}
                    </span>
                  </td>
                  <td
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}>
                    {u.createdAt ?
                      new Date(u.createdAt).toLocaleDateString()
                    : "-"}
                  </td>
                  <td>
                    {u.role !== "admin" ?
                      <button
                        className="btn btn-danger"
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                        onClick={() => handleDeleteUser(u._id)}>
                        Delete
                      </button>
                    : <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                        }}>
                        Protected
                      </span>
                    }
                  </td>
                </tr>
              ))
            : <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "20px" }}>
                  No created accounts found.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderVisasTable = () => (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
          flexWrap: "wrap",
          gap: "10px",
        }}>
        <h2 style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
          Visa List ({visasList.length})
        </h2>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: "6px 14px", fontSize: "0.85rem" }}
          onClick={fetchVisas}>
          🔄 Refresh Visas
        </button>
      </div>
      <div className="table-container">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Given Names</th>
              <th>Family Name</th>
              <th>Grant Number</th>
              <th>Passport</th>
              <th>Status</th>
              <th>User Account</th>
              <th>Documents</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visasList.length > 0 ?
              visasList.map((visa) => (
                <tr key={visa._id}>
                  <td>{visa.givenNames || "-"}</td>
                  <td>{visa.familyName || "-"}</td>
                  <td>{visa.visaGrantNumber || "-"}</td>
                  <td>{visa.documentNumber || "-"}</td>
                  <td>
                    <span
                      className={`status-badge ${visa.visaStatus === "In Effect" ? "active" : ""}`}>
                      {visa.visaStatus || "Unknown"}
                    </span>
                  </td>
                  <td>
                    {visa.userId ?
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: "#e0f2fe",
                          color: "#0369a1",
                        }}>
                        👤{" "}
                        {typeof visa.userId === "object" ?
                          visa.userId.username
                        : visa.userId}
                      </span>
                    : <span style={{ color: "#999", fontSize: "0.8rem" }}>
                        Unassigned
                      </span>
                    }
                  </td>
                  <td>
                    {(
                      visa.document &&
                      Array.isArray(visa.document) &&
                      visa.document.length > 0
                    ) ?
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}>
                        {visa.document.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--primary-color)",
                              textDecoration: "none",
                            }}>
                            📄 {doc.name || `Document ${idx + 1}`}
                          </a>
                        ))}
                      </div>
                    : <span style={{ color: "#999", fontSize: "0.8rem" }}>
                        None
                      </span>
                    }
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteVisa(visa._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            : <tr>
                <td
                  colSpan="8"
                  style={{ textAlign: "center", padding: "20px" }}>
                  No visas found for this origin.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  );

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

  // Helper to format payment applicant name as: given name + family name
  const getPaymentApplicantDisplayName = (payment) => {
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

    // 4. Linked visa in visasList by visaId
    const vId =
      payment.visaId ?
        typeof payment.visaId === "object" ?
          payment.visaId._id
        : payment.visaId
      : payment.visa && typeof payment.visa === "object" ? payment.visa._id
      : payment.visa;

    if (vId && Array.isArray(visasList) && visasList.length > 0) {
      const linked = visasList.find((v) => String(v._id) === String(vId));
      if (linked && (linked.givenNames || linked.familyName)) {
        const fn = formatApplicantFullName(
          linked.givenNames,
          linked.familyName,
        );
        if (fn) return fn;
      }
    }

    // 5. Check populated userId object
    if (payment.userId && typeof payment.userId === "object") {
      if (payment.userId.givenNames || payment.userId.familyName) {
        const fn = formatApplicantFullName(
          payment.userId.givenNames,
          payment.userId.familyName,
        );
        if (fn) return fn;
      }
      if (payment.userId.name || payment.userId.fullName) {
        return payment.userId.name || payment.userId.fullName;
      }
    }

    // 6. Match userId with visasList (find visa belonging to this user)
    const uId =
      payment.userId ?
        typeof payment.userId === "object" ?
          payment.userId._id
        : payment.userId
      : null;

    if (uId && Array.isArray(visasList) && visasList.length > 0) {
      const userVisa = visasList.find(
        (v) =>
          String(v.userId) === String(uId) && (v.givenNames || v.familyName),
      );
      if (userVisa) {
        const fn = formatApplicantFullName(
          userVisa.givenNames,
          userVisa.familyName,
        );
        if (fn) return fn;
      }
    }

    // 7. Match userId with usersList
    if (uId && Array.isArray(usersList) && usersList.length > 0) {
      const linkedUser = usersList.find((u) => String(u._id) === String(uId));
      if (linkedUser) {
        if (linkedUser.name || linkedUser.fullName)
          return linkedUser.name || linkedUser.fullName;
        if (linkedUser.username) return linkedUser.username;
      }
    }

    // 8. Raw name string
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

    // 9. Populated userId username
    if (
      payment.userId &&
      typeof payment.userId === "object" &&
      payment.userId.username
    ) {
      return payment.userId.username;
    }

    return "—";
  };

  const handleVisaSelectForPayment = (e) => {
    const visaId = e.target.value;
    if (!visaId) {
      setPaymentData((prev) => ({
        ...prev,
        selectedVisaId: "",
        visaType: "",
        name: "",
        internalRef: "",
      }));
      return;
    }

    const visa = visasList.find((v) => v._id === visaId);
    if (visa) {
      // Extract applicant name as given name + family name
      const applicantName =
        formatApplicantFullName(visa.givenNames, visa.familyName) ||
        "Unknown Applicant";

      // Extract visa type
      const extractedVisaType =
        visa.visaType || visa.visaClassSubclass || "Visitor (subclass 600)";

      // Auto-extract internal ref from trn or visa grant number or fallback
      const extractedInternalRef =
        visa.trn ||
        (visa.visaGrantNumber ?
          `GRN-${visa.visaGrantNumber.slice(-6)}`
        : `AU-MMS-${Math.floor(1000 + Math.random() * 9000)}`);

      setPaymentData((prev) => ({
        ...prev,
        selectedVisaId: visaId,
        visaType: extractedVisaType,
        name: applicantName,
        internalRef: prev.internalRef || extractedInternalRef,
        referenceNumber: prev.referenceNumber || generate8CharRef(),
      }));
    }
  };

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
    if (!paymentData.referenceNumber.trim()) {
      alert("Reference number is required.");
      return;
    }
    if (!paymentData.name.trim()) {
      alert("Applicant Name is required.");
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
        !isNaN(txnDateObj.getTime()) ?
          txnDateObj.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : paymentData.transactionDate;
      rawDateVal = paymentData.transactionDate;
    }

    const selectedVisa = visasList.find(
      (v) => v._id === paymentData.selectedVisaId,
    );
    const payload = {
      visaId: paymentData.selectedVisaId || null,
      visa: paymentData.selectedVisaId || null,
      visaType: paymentData.visaType.trim() || "Visa Application Charge",
      type: paymentData.visaType.trim() || "Visa Application Charge",
      name: paymentData.name.trim(),
      applicantName: paymentData.name.trim(),
      givenNames: selectedVisa ? selectedVisa.givenNames || "" : "",
      familyName: selectedVisa ? selectedVisa.familyName || "" : "",
      referenceNumber: paymentData.referenceNumber.trim().toUpperCase(),
      ref: paymentData.referenceNumber.trim().toUpperCase(),
      transactionDate: rawDateVal,
      date: formattedDate,
      issuingOffice: paymentData.issuingOffice.trim() || "New Delhi",
      office: paymentData.issuingOffice.trim() || "New Delhi",
      internalRef:
        paymentData.internalRef.trim() ||
        "AU-" + Math.floor(1000 + Math.random() * 9000),
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
          `Payment record "${payload.referenceNumber}" created successfully!`,
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

  const renderPaymentsTable = () => {
    const filteredPayments = paymentsList.filter((p) => {
      const matchesStatus =
        paymentStatusFilter === "all" ? true : (
          (p.status || "").toLowerCase() === paymentStatusFilter.toLowerCase()
        );

      const q = paymentSearch.toLowerCase().trim();
      const pRef = p.referenceNumber || p.ref || "";
      const pName = getPaymentApplicantDisplayName(p);
      const pType = p.visaType || p.type || "";
      const pOffice = p.issuingOffice || p.office || "";
      const matchesSearch =
        !q ||
        pRef.toLowerCase().includes(q) ||
        pName.toLowerCase().includes(q) ||
        pType.toLowerCase().includes(q) ||
        pOffice.toLowerCase().includes(q) ||
        (p.internalRef && p.internalRef.toLowerCase().includes(q)) ||
        (p.amount && p.amount.toString().includes(q));
      return matchesStatus && matchesSearch;
    });

    const totalPaid = paymentsList.filter(
      (p) => (p.status || "").toLowerCase() === "paid",
    ).length;
    const totalPending = paymentsList.filter(
      (p) => (p.status || "").toLowerCase() === "pending",
    ).length;
    const totalRevenue = paymentsList
      .filter((p) => (p.status || "").toLowerCase() === "paid")
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    return (
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
            flexWrap: "wrap",
            gap: "10px",
          }}>
          <div>
            <h2 style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
              Visa Payments ({paymentsList.length})
            </h2>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginTop: "4px",
              }}>
              Paid: <strong style={{ color: "#10b981" }}>{totalPaid}</strong>{" "}
              &nbsp;|&nbsp; Pending:{" "}
              <strong style={{ color: "#f59e0b" }}>{totalPending}</strong>{" "}
              &nbsp;|&nbsp; Total Collected:{" "}
              <strong style={{ color: "var(--primary-color)" }}>
                ${totalRevenue.toFixed(2)} AUD
              </strong>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={fetchPayments}>
              🔄 Refresh Payments
            </button>
            <input
              type="text"
              className="form-control"
              placeholder="Search payments..."
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
              style={{
                width: "180px",
                padding: "6px 12px",
                fontSize: "0.85rem",
              }}
            />
            <select
              className="form-control"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              style={{
                width: "130px",
                padding: "6px 10px",
                fontSize: "0.85rem",
              }}>
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Reference No.</th>
                <th>Type</th>
                <th>Name</th>
                <th>Transaction Date</th>
                <th>Issuing Office</th>
                <th>Internal Ref.</th>
                <th>Currency</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ?
                filteredPayments.map((p) => {
                  const paymentId = p._id || p.id || p.referenceNumber || p.ref;
                  const refNum = p.referenceNumber || p.ref || "-";
                  const pType = p.visaType || p.type || "-";
                  const pName = getPaymentApplicantDisplayName(p);
                  const pDate =
                    p.date && p.date !== "—" ? p.date
                    : p.transactionDate ?
                      new Date(p.transactionDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";
                  const pOffice = p.issuingOffice || p.office || "-";
                  const pInternalRef = p.internalRef || "-";
                  const pCurrency = p.currency || "AUD";
                  const pAmount =
                    typeof p.amount === "number" ?
                      p.amount.toFixed(2)
                    : parseFloat(p.amount || 0).toFixed(2);
                  const isPaid = (p.status || "").toLowerCase() === "paid";

                  return (
                    <tr key={paymentId}>
                      <td>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            backgroundColor: "#f1f5f9",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            border: "1px solid #cbd5e1",
                            letterSpacing: "1px",
                          }}>
                          {refNum}
                        </span>
                      </td>
                      <td style={{ fontWeight: "500" }}>{pType}</td>
                      <td>{pName}</td>
                      <td
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-secondary)",
                        }}>
                        {pDate}
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>{pOffice}</td>
                      <td
                        style={{
                          fontSize: "0.85rem",
                          fontFamily: "monospace",
                        }}>
                        {pInternalRef}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: "600",
                            fontSize: "0.85rem",
                            color: "#475569",
                          }}>
                          {pCurrency}
                        </span>
                      </td>
                      <td
                        style={{
                          fontWeight: "700",
                          color: isPaid ? "#047857" : "#b45309",
                        }}>
                        ${pAmount}
                      </td>
                      <td>
                        <span
                          onClick={() => handleTogglePaymentStatus(p)}
                          title="Click to toggle status"
                          className={`status-badge ${isPaid ? "paid" : "pending"}`}
                          style={{
                            cursor: "pointer",
                            display: "inline-block",
                          }}>
                          {isPaid ? "✓ Paid" : "⏳ Pending"}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                          }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleTogglePaymentStatus(p)}
                            title="Toggle between Paid and Pending">
                            Toggle
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeletePayment(paymentId)}
                            title="Delete Payment Record">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              : <tr>
                  <td
                    colSpan="10"
                    style={{
                      textAlign: "center",
                      padding: "24px",
                      color: "var(--text-secondary)",
                    }}>
                    {paymentsList.length === 0 ?
                      "No payments created yet. Use the form to create a payment."
                    : "No payments match the search criteria."}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Helper origin badge
  const renderOriginBadge = (origin) => {
    const code = (origin || "").toLowerCase();
    const label = origin ? origin.toUpperCase() : "AU";
    let flag = "🇦🇺";
    if (code === "nz") flag = "🇳🇿";
    if (code === "ca") flag = "🇨🇦";
    return (
      <span className={`origin-badge origin-badge-${code || "au"}`}>
        {flag} {label}
      </span>
    );
  };

  const copyToClipboard = (text, label = "Text") => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard!`);
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
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setCompanyAlert({
          type: "success",
          message: "Company created successfully!",
        });
        setCompanyFormData({ name: "" });
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

  // Offer Letter helpers & handlers
  const getOfferLetterMergedData = (ol) => {
    if (!ol) return {};
    const details = ol.details || {};
    return {
      ...details,
      companyId: ol.companyId,
      userId: ol.userId,
      refrenceNumber: ol.refrenceNumber || "",
      sponsorName:
        details.sponsorName ||
        ol.companyId?.name ||
        ol.sponsorName ||
        "HD Contractor Limited",
      sponsorAddress:
        details.sponsorAddress ||
        ol.sponsorAddress ||
        "54B Tidal Road, Sydney NSW 2000, Australia",
      clientId: details.clientId || ol.clientId || "15622175210",
      sponsorshipApprovalId:
        details.sponsorshipApprovalId ||
        ol.sponsorshipApprovalId ||
        "1740568430",
      fileNumber: details.fileNumber || ol.fileNumber || "ABD2026/420367",
      sponsorshipFeeReceiptNumber:
        details.sponsorshipFeeReceiptNumber ||
        ol.sponsorshipFeeReceiptNumber ||
        "100001750031",
      dateOfApproval:
        details.dateOfApproval || ol.dateOfApproval || getFormattedTodayDate(),
      applicantName:
        details.applicantName ||
        ol.userId?.username ||
        ol.applicantName ||
        "MD Shaminuzzaman",
      nationality: details.nationality || ol.nationality || "Bangladeshi",
      status: details.status || ol.status || "Issued",
      passportNumber:
        details.passportNumber || ol.passportNumber || "A09820252",
      sponsorshipNumber:
        details.sponsorshipNumber ||
        ol.sponsorshipNumber ||
        ol.refrenceNumber ||
        "W8420862",
      issueDate: details.issueDate || ol.issueDate || getFormattedTodayDate(),
      validTill: details.validTill || ol.validTill || getFormattedExpiryDate(6),
    };
  };

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
    }));
  };

  const handleUserSelectChange = (e) => {
    const uId = e.target.value;
    const selectedUser = usersList.find((u) => u._id === uId);
    setOfferLetterFormData((prev) => ({
      ...prev,
      userId: uId,
      applicantName: selectedUser ? selectedUser.username : prev.applicantName,
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

  // Render Companies Table
  const renderCompaniesTable = () => {
    const filteredCompanies = companiesList.filter((comp) => {
      const q = companySearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (comp.name && comp.name.toLowerCase().includes(q)) ||
        (comp._id && comp._id.toLowerCase().includes(q));
      return matchesSearch;
    });

    return (
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
            flexWrap: "wrap",
            gap: "10px",
          }}>
          <div>
            <h2 style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
              Registered Companies ({companiesList.length})
            </h2>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginTop: "4px",
              }}>
              Origin: <strong>AU</strong> &nbsp;|&nbsp; Total:{" "}
              <strong>{companiesList.length}</strong>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={fetchCompanies}>
              🔄 Refresh Companies
            </button>
            <input
              type="text"
              className="form-control"
              placeholder="Search companies..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              style={{
                width: "200px",
                padding: "6px 12px",
                fontSize: "0.85rem",
              }}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Origin</th>
                <th>Company ID</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length > 0 ?
                filteredCompanies.map((c) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: "600" }}>{c.name}</td>
                    <td>{renderOriginBadge(c.origin)}</td>
                    <td>
                      <span className="ref-badge">
                        {c._id.slice(-8)}
                        <button
                          type="button"
                          className="copy-icon-btn"
                          title="Copy Full ID"
                          onClick={() => copyToClipboard(c._id, "Company ID")}>
                          📋
                        </button>
                      </span>
                    </td>
                    <td
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                      }}>
                      {c.createdAt ?
                        new Date(c.createdAt).toLocaleDateString()
                      : "-"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingCompany({ ...c })}>
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteCompany(c._id, c.name)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "24px",
                      color: "var(--text-secondary)",
                    }}>
                    {companiesList.length === 0 ?
                      "No companies registered yet. Use the form above to add a company."
                    : "No companies match the search criteria."}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Offer Letters Table
  const renderOfferLettersTable = () => {
    const filteredOfferLetters = offerLettersList.filter((ol) => {
      const olCompanyId = ol.companyId?._id || ol.companyId || "";
      const matchesCompany =
        offerLetterCompanyFilter === "all" ? true : (
          olCompanyId === offerLetterCompanyFilter
        );

      const q = offerLetterSearch.toLowerCase().trim();
      const refNo = (ol.refrenceNumber || "").toLowerCase();
      const compName = (ol.companyId?.name || "").toLowerCase();
      const usrName = (ol.userId?.username || "").toLowerCase();
      const matchesSearch =
        !q ||
        refNo.includes(q) ||
        compName.includes(q) ||
        usrName.includes(q) ||
        (ol._id && ol._id.toLowerCase().includes(q));

      return matchesCompany && matchesSearch;
    });

    return (
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
            flexWrap: "wrap",
            gap: "10px",
          }}>
          <div>
            <h2 style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
              Offer Letters ({offerLettersList.length})
            </h2>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginTop: "4px",
              }}>
              Total Issued Letters: <strong>{offerLettersList.length}</strong>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={fetchOfferLetters}>
              🔄 Refresh Letters
            </button>
            <input
              type="text"
              className="form-control"
              placeholder="Search ref #, user, company..."
              value={offerLetterSearch}
              onChange={(e) => setOfferLetterSearch(e.target.value)}
              style={{
                width: "210px",
                padding: "6px 12px",
                fontSize: "0.85rem",
              }}
            />
            <select
              className="form-control"
              value={offerLetterCompanyFilter}
              onChange={(e) => setOfferLetterCompanyFilter(e.target.value)}
              style={{
                width: "160px",
                padding: "6px 10px",
                fontSize: "0.85rem",
              }}>
              <option value="all">All Companies</option>
              {companiesList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Reference Number</th>
                <th>Sponsor / Company</th>
                <th>Applicant</th>
                <th>Passport / Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOfferLetters.length > 0 ?
                filteredOfferLetters.map((ol) => {
                  const merged = getOfferLetterMergedData(ol);
                  const companyName =
                    merged.sponsorName ||
                    ol.companyId?.name ||
                    "Unknown Company";
                  const companyOrigin = ol.companyId?.origin || "au";
                  const applicantName =
                    merged.applicantName || ol.userId?.username || "Unknown";
                  const userRole = ol.userId?.role || "user";

                  return (
                    <tr key={ol._id}>
                      <td>
                        <span className="ref-badge">
                          <strong>{ol.refrenceNumber}</strong>
                          <button
                            type="button"
                            className="copy-icon-btn"
                            title="Copy Ref Number"
                            onClick={() =>
                              copyToClipboard(
                                ol.refrenceNumber,
                                "Reference Number",
                              )
                            }>
                            📋
                          </button>
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}>
                          <span style={{ fontWeight: "600" }}>
                            {companyName}
                          </span>
                          {renderOriginBadge(companyOrigin)}
                        </div>
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-secondary)",
                          }}>
                          Approval ID: {merged.sponsorshipApprovalId}
                        </div>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontWeight: "600" }}>
                            {applicantName}
                          </span>
                          <span
                            className={`status-badge role-badge-${userRole}`}
                            style={{ marginLeft: "6px", fontSize: "0.75rem" }}>
                            {merged.nationality || userRole.toUpperCase()}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-secondary)",
                          }}>
                          User: {ol.userId?.username || "-"}
                        </div>
                      </td>
                      <td>
                        <div>
                          <span
                            style={{ fontWeight: "500", fontSize: "0.85rem" }}>
                            {merged.passportNumber || "-"}
                          </span>
                          <span
                            className="status-badge"
                            style={{
                              marginLeft: "6px",
                              backgroundColor: "#e0f2fe",
                              color: "#0369a1",
                              fontSize: "0.72rem",
                              fontWeight: "600",
                            }}>
                            {merged.status || "Issued"}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-secondary)",
                          }}>
                          Valid: {merged.validTill || "-"}
                        </div>
                      </td>
                      <td
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-secondary)",
                        }}>
                        {ol.createdAt ?
                          new Date(ol.createdAt).toLocaleDateString()
                        : "-"}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            title="Preview Offer Letter PDF"
                            onClick={() => handleOpenOfferLetterPreview(ol)}>
                            👁️ View
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            title="Download PDF Document"
                            disabled={downloadingLetterId === ol._id}
                            onClick={() =>
                              handleDownloadOfferLetter(ol, ol._id)
                            }>
                            {downloadingLetterId === ol._id ?
                              "⏳..."
                            : "📥 PDF"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            title="Edit all variables"
                            onClick={() => handleStartEditOfferLetter(ol)}>
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            title="Delete offer letter"
                            onClick={() =>
                              handleDeleteOfferLetter(ol._id, ol.refrenceNumber)
                            }>
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              : <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "24px",
                      color: "var(--text-secondary)",
                    }}>
                    {offerLettersList.length === 0 ?
                      "No offer letters created yet. Use the form above to generate an offer letter."
                    : "No offer letters match the search criteria."}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Saved Visa Grants Table
  const renderSavedVisaGrantsTable = () => {
    const q = visaGrantSearch.toLowerCase().trim();
    const filtered = savedVisaGrants.filter((item) => {
      if (!q) return true;
      return (
        (item.applicantName && item.applicantName.toLowerCase().includes(q)) ||
        (item.visaGrantNumber && item.visaGrantNumber.toLowerCase().includes(q)) ||
        (item.passportNumber && item.passportNumber.toLowerCase().includes(q)) ||
        (item.trn && item.trn.toLowerCase().includes(q)) ||
        (item.visaName && item.visaName.toLowerCase().includes(q)) ||
        (item.refrenceNumber && item.refrenceNumber.toLowerCase().includes(q))
      );
    });

    return (
      <div className="card" style={{ marginTop: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "10px",
          }}>
          <div>
            <h2 style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
              Saved Visa Grant Letters ({filtered.length})
            </h2>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginTop: "4px",
              }}>
              Standalone Australian Visa Grant Notice records saved in your admin portal.
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search name, grant #, passport, TRN..."
              value={visaGrantSearch}
              onChange={(e) => setVisaGrantSearch(e.target.value)}
              style={{ width: "260px", padding: "6px 12px", fontSize: "0.85rem" }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={() => {
                setVisaGrantFormData(getInitialVisaGrantFormData());
                setVisaGrantAlert({
                  type: "info",
                  message: "Editor reset with fresh generated sample variables.",
                });
              }}>
              ➕ New Grant Letter
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Visa Subclass</th>
                <th>Grant Number</th>
                <th>Passport / Country</th>
                <th>Grant Date</th>
                <th>Must Not Arrive After</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ color: "var(--primary-color)" }}>
                        {item.applicantName || "Unnamed"}
                      </strong>
                      {item.refrenceNumber && (
                        <div style={{ fontSize: "0.75rem", color: "#888" }}>
                          Ref: {item.refrenceNumber}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}>
                        {item.visaName || "Transit (subclass 771)"}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: "0.85rem" }}>
                        {item.visaGrantNumber || "-"}
                      </code>
                    </td>
                    <td>
                      <div>{item.passportNumber || "-"}</div>
                      <small style={{ color: "#777" }}>{item.passportCountry || ""}</small>
                    </td>
                    <td>{item.grantDate || "-"}</td>
                    <td>{item.mustNotArriveAfter || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          title="Load into Editor"
                          onClick={() => handleLoadSavedVisaGrant(item)}>
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          title="Preview PDF"
                          onClick={() => handleOpenVisaGrantPreview(item)}>
                          👁️ Preview
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          title="Download PDF Document"
                          disabled={downloadingVisaId === item.id}
                          onClick={() => handleDownloadVisaGrantPDF(item, item.id)}>
                          {downloadingVisaId === item.id ? "⏳..." : "📥 PDF"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          title="Delete from Saved"
                          onClick={() => handleDeleteSavedVisaGrant(item.id)}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary)" }}>
                    No visa grant records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Modals
  const renderEditCompanyModal = () => {
    if (!editingCompany) return null;
    return (
      <div
        className="dashboard-modal-backdrop"
        onClick={() => setEditingCompany(null)}>
        <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
          <div className="dashboard-modal-header">
            <h3>Edit Company</h3>
            <button
              className="dashboard-modal-close"
              onClick={() => setEditingCompany(null)}>
              ✕
            </button>
          </div>
          <form onSubmit={handleUpdateCompany}>
            <div className="dashboard-modal-body">
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingCompany.name || ""}
                  onChange={(e) =>
                    setEditingCompany({
                      ...editingCompany,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
            <div className="dashboard-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingCompany(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderEditOfferLetterModal = () => {
    if (!editingOfferLetter) return null;
    const currentCompId =
      editingOfferLetter.companyId?._id || editingOfferLetter.companyId || "";
    const currentUserId =
      editingOfferLetter.userId?._id || editingOfferLetter.userId || "";

    return (
      <div
        className="dashboard-modal-backdrop"
        onClick={() => setEditingOfferLetter(null)}>
        <div
          className="dashboard-modal dashboard-modal-wide"
          onClick={(e) => e.stopPropagation()}>
          <div className="dashboard-modal-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h3 style={{ margin: 0 }}>Edit Offer Letter & Variables</h3>
              <span className="variable-badge">
                {editingOfferLetter.refrenceNumber || "Editing"}
              </span>
            </div>
            <button
              className="dashboard-modal-close"
              onClick={() => setEditingOfferLetter(null)}>
              ✕
            </button>
          </div>
          <form onSubmit={handleUpdateOfferLetter}>
            <div className="dashboard-modal-body">
              {/* Account Linking */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "14px",
                  marginBottom: "10px",
                }}>
                <div className="form-group">
                  <label style={{ fontWeight: "600" }}>Company *</label>
                  <select
                    className="form-control"
                    value={currentCompId}
                    onChange={(e) => {
                      const compId = e.target.value;
                      const selectedComp = companiesList.find(
                        (c) => c._id === compId,
                      );
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        companyId: compId,
                        sponsorName:
                          selectedComp ?
                            selectedComp.name
                          : editingOfferLetter.sponsorName,
                      });
                    }}
                    required>
                    <option value="">-- Select Company --</option>
                    {companiesList.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.origin.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: "600" }}>Assigned User *</label>
                  <select
                    className="form-control"
                    value={currentUserId}
                    onChange={(e) => {
                      const uId = e.target.value;
                      const selectedUser = usersList.find((u) => u._id === uId);
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        userId: uId,
                        applicantName:
                          selectedUser ?
                            selectedUser.username
                          : editingOfferLetter.applicantName,
                      });
                    }}
                    required>
                    <option value="">-- Select User --</option>
                    {usersList.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username} ({u.role || "user"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: "600" }}>
                    Reference Number *
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="form-control"
                      value={editingOfferLetter.refrenceNumber || ""}
                      onChange={(e) =>
                        setEditingOfferLetter({
                          ...editingOfferLetter,
                          refrenceNumber: e.target.value,
                        })
                      }
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ whiteSpace: "nowrap" }}
                      onClick={() =>
                        setEditingOfferLetter({
                          ...editingOfferLetter,
                          refrenceNumber: `OL-AU-${generate8CharRef()}`,
                        })
                      }>
                      🎲 Gen
                    </button>
                  </div>
                </div>
              </div>

              {/* Section: Sponsor Quote Details */}
              <div className="offer-letter-section-header">
                <span>🏢 Sponsor & Official Quote Details (Page 1 Header)</span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "14px",
                }}>
                <div className="form-group">
                  <label>Name of Sponsor</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingOfferLetter.sponsorName || ""}
                    onChange={(e) =>
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        sponsorName: e.target.value,
                      })
                    }
                    placeholder="e.g. HD Contractor Limited"
                  />
                </div>
                <div className="form-group">
                  <label>Sponsor Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingOfferLetter.sponsorAddress || ""}
                    onChange={(e) =>
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        sponsorAddress: e.target.value,
                      })
                    }
                    placeholder="e.g. 54B Tidal Road, Sydney NSW 2000, Australia"
                  />
                </div>
                <div className="form-group">
                  <label>Client ID</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="form-control"
                      value={editingOfferLetter.clientId || ""}
                      onChange={(e) =>
                        setEditingOfferLetter({
                          ...editingOfferLetter,
                          clientId: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        setEditingOfferLetter({
                          ...editingOfferLetter,
                          clientId: generateNumericString(11),
                        })
                      }>
                      🎲
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Sponsorship Approval ID</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="form-control"
                      value={editingOfferLetter.sponsorshipApprovalId || ""}
                      onChange={(e) =>
                        setEditingOfferLetter({
                          ...editingOfferLetter,
                          sponsorshipApprovalId: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        setEditingOfferLetter({
                          ...editingOfferLetter,
                          sponsorshipApprovalId: generateNumericString(10),
                        })
                      }>
                      🎲
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>File Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingOfferLetter.fileNumber || ""}
                    onChange={(e) =>
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        fileNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Sponsorship Fee Receipt Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingOfferLetter.sponsorshipFeeReceiptNumber || ""}
                    onChange={(e) =>
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        sponsorshipFeeReceiptNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Date of Sponsorship Approval</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingOfferLetter.dateOfApproval || ""}
                    onChange={(e) =>
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        dateOfApproval: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Section: Applicant & Status Details */}
              <div className="offer-letter-section-header">
                <span>
                  👤 Applicant & Status Details (Page 1 & 2 Grant Info)
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "14px",
                }}>
                <div className="form-group">
                  <label>Applicant Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingOfferLetter.applicantName || ""}
                    onChange={(e) =>
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        applicantName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Nationality</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingOfferLetter.nationality || ""}
                    onChange={(e) =>
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        nationality: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingOfferLetter.status || ""}
                    onChange={(e) =>
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        status: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Passport Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingOfferLetter.passportNumber || ""}
                    onChange={(e) =>
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        passportNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Sponsorship Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingOfferLetter.sponsorshipNumber || ""}
                    onChange={(e) =>
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        sponsorshipNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Issue Date</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingOfferLetter.issueDate || ""}
                    onChange={(e) =>
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        issueDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Valid Till</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingOfferLetter.validTill || ""}
                    onChange={(e) =>
                      setEditingOfferLetter({
                        ...editingOfferLetter,
                        validTill: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="dashboard-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  handleOpenOfferLetterPreview(editingOfferLetter)
                }>
                👁️ Preview PDF
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingOfferLetter(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderOfferLetterPreviewModal = () => {
    if (!previewOfferLetterData && !previewPdfUrl && !isPreviewGenerating)
      return null;

    return (
      <div
        className="dashboard-modal-backdrop"
        onClick={handleCloseOfferLetterPreview}>
        <div
          className="dashboard-modal dashboard-modal-pdf"
          onClick={(e) => e.stopPropagation()}>
          <div className="dashboard-modal-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h3 style={{ margin: 0 }}>
                📄 Australian Offer Letter PDF Preview
              </h3>
              <span className="variable-badge">
                {previewOfferLetterData?.sponsorshipNumber ||
                  previewOfferLetterData?.refrenceNumber ||
                  "Grant Letter"}
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {previewOfferLetterData && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() =>
                    handleDownloadOfferLetter(previewOfferLetterData)
                  }>
                  📥 Download PDF
                </button>
              )}
              <button
                className="dashboard-modal-close"
                onClick={handleCloseOfferLetterPreview}>
                ✕
              </button>
            </div>
          </div>
          <div
            className="dashboard-modal-body"
            style={{ position: "relative", minHeight: "500px" }}>
            {isPreviewGenerating ?
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "500px",
                  color: "#ffffff",
                  gap: "14px",
                }}>
                <div style={{ fontSize: "2.4rem" }}>⏳</div>
                <div style={{ fontSize: "1.05rem", fontWeight: "500" }}>
                  Generating 2-page Offer Letter PDF with React-PDF...
                </div>
              </div>
            : previewPdfUrl ?
              <iframe
                src={previewPdfUrl}
                title="Offer Letter PDF Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "500px",
                  border: "none",
                }}
              />
            : <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#cbd5e1",
                }}>
                No preview available.
              </div>
            }
          </div>
        </div>
      </div>
    );
  };

  const renderVisaPreviewModal = () => {
    if (!isVisaPreviewOpen) return null;

    return (
      <div
        className="dashboard-modal-backdrop"
        onClick={handleCloseVisaGrantPreview}>
        <div
          className="dashboard-modal dashboard-modal-pdf"
          onClick={(e) => e.stopPropagation()}>
          <div className="dashboard-modal-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h3 style={{ margin: 0 }}>
                📄 Australian Visa Grant Notice PDF Preview
              </h3>
              <span className="variable-badge">
                {previewVisaData?.visaGrantNumber ||
                  previewVisaData?.trn ||
                  "Grant Notice"}
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {previewVisaData && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleDownloadVisaGrantPDF(previewVisaData)}>
                  📥 Download PDF
                </button>
              )}
              <button
                className="dashboard-modal-close"
                onClick={handleCloseVisaGrantPreview}>
                ✕
              </button>
            </div>
          </div>
          <div
            className="dashboard-modal-body"
            style={{ position: "relative", minHeight: "500px" }}>
            {isVisaPreviewGenerating ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "500px",
                  color: "#ffffff",
                  gap: "14px",
                }}>
                <div style={{ fontSize: "2.4rem" }}>⏳</div>
                <div style={{ fontSize: "1.05rem", fontWeight: "500" }}>
                  Generating official Australian Visa Grant Notice PDF...
                </div>
              </div>
            ) : visaPreviewPdfUrl ? (
              <iframe
                src={visaPreviewPdfUrl}
                title="Visa Grant Notice PDF Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "500px",
                  border: "none",
                }}
              />
            ) : (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#cbd5e1",
                }}>
                No preview available.
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Admin Portal</h2>
        </div>
        <div className="sidebar-menu">
          {role === "admin" && (
            <div
              className={`menu-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}>
              <span>📊</span> Overview
            </div>
          )}
          <div
            className={`menu-item ${activeTab === "visas" ? "active" : ""}`}
            onClick={() => setActiveTab("visas")}>
            <span>📄</span> Visa Management
          </div>
          <div
            className={`menu-item ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}>
            <span>💳</span> Payments
          </div>
          <div
            className={`menu-item ${activeTab === "accounts" ? "active" : ""}`}
            onClick={() => setActiveTab("accounts")}>
            <span>👥</span> Account Management
          </div>
          {role === "admin" && (
            <>
              <div
                className={`menu-item ${activeTab === "companies" ? "active" : ""}`}
                onClick={() => setActiveTab("companies")}>
                <span>🏢</span> Companies
              </div>
              <div
                className={`menu-item ${activeTab === "offer-letters" ? "active" : ""}`}
                onClick={() => setActiveTab("offer-letters")}>
                <span>✉️</span> Offer Letters
              </div>
              <div
                className={`menu-item ${activeTab === "visa-grant" ? "active" : ""}`}
                onClick={() => setActiveTab("visa-grant")}>
                <span>🪪</span> Visa Grant Letter
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
          <>
            {renderVisasTable()}
            {renderPaymentsTable()}
            {renderCompaniesTable()}
            {renderOfferLettersTable()}
            {renderSavedVisaGrantsTable()}
            {renderUsersTable()}
          </>
        )}

        {activeTab === "accounts" && (
          <>
            <div className="card">
              <h2>Create Account</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <div style={{ marginTop: "10px" }}>
                {role === "admin" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleCreateAccount("employe")}
                    style={{ marginRight: "10px" }}>
                    Create Employee
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => handleCreateAccount("user")}>
                  Create User
                </button>
              </div>
            </div>
            {renderUsersTable()}
          </>
        )}

        {activeTab === "visas" && (
          <>
            <div className="card">
              <h2>Create New Visa</h2>
              {visaAlert && (
                <div
                  className={`alert alert-${visaAlert.type}`}
                  style={{ marginBottom: "16px" }}>
                  {visaAlert.message}
                </div>
              )}
              <form onSubmit={handleCreateVisa}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: "1 1 100%" }}>
                    <label
                      style={{
                        fontWeight: "600",
                        color: "var(--secondary-color)",
                      }}>
                      Assign to User Account (User ID)
                    </label>
                    <select
                      className="form-control"
                      name="userId"
                      value={visaData.userId || ""}
                      onChange={handleVisaChange}>
                      <option value="">
                        -- Select User Account (Optional / Unassigned) --
                      </option>
                      {usersList.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.username} ({u.role ? u.role.toUpperCase() : "USER"}
                          ) — ID: {u._id}
                        </option>
                      ))}
                    </select>
                    <small
                      style={{
                        color: "var(--text-secondary)",
                        display: "block",
                        marginTop: "4px",
                      }}>
                      Link this visa to an existing user account fetched from
                      the API.
                    </small>
                  </div>

                  {Object.keys(visaData)
                    .filter((key) => key !== "userId")
                    .map((key) => (
                      <div className="form-group" key={key}>
                        <label>
                          {key === "trn" ?
                            "Transaction Reference Number (TRN)"
                          : key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())
                          }
                        </label>
                        <input
                          type={
                            (
                              key.toLowerCase().includes("date") ||
                              key === "mustNotArriveAfter"
                            ) ?
                              "date"
                            : "text"
                          }
                          className="form-control"
                          name={key}
                          value={visaData[key]}
                          onChange={handleVisaChange}
                          placeholder={`Enter ${key}`}
                        />
                      </div>
                    ))}
                </div>

                {/* Documents Array Section */}
                <div
                  style={{
                    marginTop: "20px",
                    padding: "16px",
                    border: "1px dashed var(--border-color)",
                    borderRadius: "6px",
                    backgroundColor: "#fafbfc",
                  }}>
                  <label
                    style={{
                      fontWeight: "600",
                      fontSize: "1rem",
                      color: "var(--secondary-color)",
                      display: "block",
                      marginBottom: "8px",
                    }}>
                    Upload Documents (Passport, Offer Letter, Proof of Funds,
                    etc.)
                  </label>

                  {uploadedDocs.length > 0 ? (
                    <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                      {uploadedDocs.map((doc, idx) => (
                        <li key={idx} style={{ marginBottom: "6px" }}>
                          <strong>{doc.documentName || doc.name}</strong>
                          <span
                            style={{
                              fontSize: "0.85rem",
                              color: "#666",
                              marginLeft: "6px",
                            }}>
                            ({doc.fileName || "file"})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDocumentFromList(idx)}
                            style={{
                              marginLeft: "10px",
                              color: "#d9534f",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}>
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "#777",
                        marginBottom: "12px",
                      }}>
                      No documents added yet. Select a file, give it a name, and
                      click "Add to List".
                    </p>
                  )}

                  <div className="form-row" style={{ alignItems: "flex-end" }}>
                    <div
                      className="form-group"
                      style={{ flex: 1, minWidth: "200px" }}>
                      <label>Document Name (e.g. Passport Copy)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Applicant Passport Copy"
                        value={currentDocName}
                        onChange={(e) => setCurrentDocName(e.target.value)}
                      />
                    </div>
                    <div
                      className="form-group"
                      style={{ flex: 1, minWidth: "200px" }}>
                      <label>Select File</label>
                      <input
                        key={documentKey}
                        type="file"
                        className="form-control"
                        onChange={handleFileChange}
                      />
                    </div>
                    <div
                      className="form-group"
                      style={{ flex: 0, minWidth: "120px" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={addDocumentToList}
                        style={{ width: "100%", marginBottom: "0" }}>
                        Add to List
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "20px" }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isVisaSubmitting}>
                    {isVisaSubmitting ? "Creating Visa..." : "Create Visa"}
                  </button>
                </div>
              </form>
            </div>
            {renderVisasTable()}
          </>
        )}

        {activeTab === "payments" && (
          <>
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      borderBottom: "none",
                      paddingBottom: 0,
                    }}>
                    Create Visa Payment
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                    }}>
                    Select an existing visa from the database to automatically
                    populate visa details, or enter manually.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreatePayment}>
                {/* 1. Database Visa Selector */}
                <div className="form-row" style={{ marginBottom: "15px" }}>
                  <div className="form-group" style={{ flex: "1 1 100%" }}>
                    <label
                      style={{
                        fontWeight: "600",
                        color: "var(--secondary-color)",
                      }}>
                      Select Visa from Database (Auto-extracts Visa Type &
                      Applicant Name)
                    </label>
                    <select
                      className="form-control"
                      value={paymentData.selectedVisaId}
                      onChange={handleVisaSelectForPayment}
                      style={{
                        backgroundColor: "#f8fafc",
                        borderColor: "#cbd5e1",
                      }}>
                      <option value="">
                        -- Choose Visa Record (Optional or select to auto-fill)
                        --
                      </option>
                      {visasList.map((v) => (
                        <option key={v._id} value={v._id}>
                          {[v.givenNames, v.familyName]
                            .filter(Boolean)
                            .join(" ") || "Applicant"}{" "}
                          — {v.visaClassSubclass || v.visaType || "Visa"} [TRN:{" "}
                          {v.trn || "N/A"}, Grant: {v.visaGrantNumber || "N/A"},
                          Passport: {v.documentNumber || "N/A"}]
                        </option>
                      ))}
                    </select>
                    <small
                      style={{
                        color: "var(--text-secondary)",
                        display: "block",
                        marginTop: "4px",
                      }}>
                      Selecting a visa automatically extracts the{" "}
                      <strong>Visa Type</strong>, <strong>Name</strong>, and
                      suggests an <strong>Internal Ref.</strong>
                    </small>
                  </div>
                </div>

                {/* 2. Form Fields */}
                <div className="form-row">
                  {/* Reference Number (8-char auto generated) */}
                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>
                      Reference Number (8-char Auto-generated) *
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="form-control"
                        name="referenceNumber"
                        value={paymentData.referenceNumber}
                        onChange={handlePaymentChange}
                        maxLength={8}
                        placeholder="8-char code"
                        style={{
                          fontFamily: "monospace",
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                        }}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setPaymentData((prev) => ({
                            ...prev,
                            referenceNumber: generate8CharRef(),
                          }))
                        }
                        title="Generate a new 8-character reference number"
                        style={{
                          whiteSpace: "nowrap",
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                        }}>
                        🔄 New Ref
                      </button>
                    </div>
                  </div>

                  {/* Visa Type */}
                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Visa Type *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="visaType"
                      value={paymentData.visaType}
                      onChange={handlePaymentChange}
                      placeholder="e.g. Visitor (subclass 600) or Tourist"
                      required
                    />
                  </div>

                  {/* Name */}
                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={paymentData.name}
                      onChange={handlePaymentChange}
                      placeholder="e.g. John Smith"
                      required
                    />
                  </div>

                  {/* Status */}
                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>
                      Status (Pending / Paid) *
                    </label>
                    <select
                      className="form-control"
                      name="status"
                      value={paymentData.status}
                      onChange={handlePaymentChange}>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  {/* Transaction Date - Only asked if status is Paid */}
                  {paymentData.status === "paid" && (
                    <div className="form-group">
                      <label style={{ fontWeight: "600" }}>
                        Transaction Date *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        name="transactionDate"
                        value={paymentData.transactionDate}
                        onChange={handlePaymentChange}
                        required
                      />
                    </div>
                  )}

                  {/* Issuing Office */}
                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>
                      Issuing Office *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="issuingOffice"
                      list="issuingOffices"
                      value={paymentData.issuingOffice}
                      onChange={handlePaymentChange}
                      placeholder="e.g. New Delhi"
                      required
                    />
                    <datalist id="issuingOffices">
                      <option value="New Delhi" />
                      <option value="Sydney" />
                      <option value="Melbourne" />
                      <option value="Brisbane" />
                      <option value="Perth" />
                      <option value="London" />
                      <option value="Beijing" />
                      <option value="Dubai" />
                      <option value="Department of Home Affairs" />
                      <option value="Canberra Processing Centre" />
                    </datalist>
                  </div>

                  {/* Internal Ref. */}
                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Internal Ref.</label>
                    <input
                      type="text"
                      className="form-control"
                      name="internalRef"
                      value={paymentData.internalRef}
                      onChange={handlePaymentChange}
                      placeholder="e.g. AU-MMS-1024 or TRN"
                    />
                  </div>

                  {/* Currency */}
                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Currency *</label>
                    <select
                      className="form-control"
                      name="currency"
                      value={paymentData.currency}
                      onChange={handlePaymentChange}>
                      <option value="AUD">AUD (Australian Dollar)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                      <option value="NZD">NZD (New Zealand Dollar)</option>
                      <option value="CAD">CAD (Canadian Dollar)</option>
                      <option value="SGD">SGD (Singapore Dollar)</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      name="amount"
                      value={paymentData.amount}
                      onChange={handlePaymentChange}
                      placeholder="e.g. 385.00"
                      required
                    />
                  </div>
                </div>

                <div
                  style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                  <button type="submit" className="btn btn-primary">
                    💳 Create Payment
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPaymentData(getInitialPaymentData())}>
                    Reset Form
                  </button>
                </div>
              </form>
            </div>

            {renderPaymentsTable()}
          </>
        )}

        {activeTab === "companies" && role === "admin" && (
          <>
            <div className="card">
              <h2>Create New Company</h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  marginTop: "-10px",
                  marginBottom: "20px",
                }}>
                Add an employer or sponsor company registered in Australia, New
                Zealand, or Canada.
              </p>
              {companyAlert && (
                <div
                  className={`dashboard-alert dashboard-alert-${companyAlert.type}`}>
                  <span>{companyAlert.message}</span>
                  <button
                    type="button"
                    onClick={() => setCompanyAlert(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}>
                    ✕
                  </button>
                </div>
              )}
              <form onSubmit={handleCreateCompany}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: "1 1 100%" }}>
                    <label style={{ fontWeight: "600" }}>Company Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={companyFormData.name}
                      onChange={(e) =>
                        setCompanyFormData({
                          ...companyFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. Atlassian Australia Pty Ltd"
                      required
                    />
                  </div>
                </div>
                <div
                  style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isCompanySubmitting}>
                    {isCompanySubmitting ? "Creating..." : "🏢 Create Company"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setCompanyFormData({ name: "" });
                      setCompanyAlert(null);
                    }}>
                    Reset Form
                  </button>
                </div>
              </form>
            </div>
            {renderCompaniesTable()}
          </>
        )}

        {activeTab === "offer-letters" && role === "admin" && (
          <>
            <div className="card" style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "16px",
                }}>
                <div>
                  <h2 style={{ margin: 0, paddingBottom: "4px" }}>
                    Create Offer Letter (Grant Letter of Sponsorship for
                    Australia)
                  </h2>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                      margin: 0,
                    }}>
                    Generate high-fidelity Australian Department of Home Affairs
                    sponsorship grant letters with custom variables.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                    onClick={handleRegenerateOfferLetterVariables}
                    title="Generate new random reference, client ID, approval ID, receipt number, and dates">
                    🎲 Randomize IDs
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                    onClick={() =>
                      handleOpenOfferLetterPreview(offerLetterFormData)
                    }>
                    👁️ Preview Live PDF
                  </button>
                </div>
              </div>

              {offerLetterAlert && (
                <div
                  className={`dashboard-alert dashboard-alert-${offerLetterAlert.type}`}>
                  <span>{offerLetterAlert.message}</span>
                  <button
                    type="button"
                    onClick={() => setOfferLetterAlert(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}>
                    ✕
                  </button>
                </div>
              )}

              <form onSubmit={handleCreateOfferLetter}>
                {/* Core Assignment */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "14px",
                    marginBottom: "8px",
                  }}>
                  <div className="form-group">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}>
                      <label style={{ fontWeight: "600", margin: 0 }}>
                        Company *
                      </label>
                      {companiesList.length === 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("companies")}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--primary-color)",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            textDecoration: "underline",
                            padding: 0,
                          }}>
                          + Add Company first
                        </button>
                      )}
                    </div>
                    <select
                      className="form-control"
                      value={offerLetterFormData.companyId}
                      onChange={handleCompanySelectChange}
                      required>
                      <option value="">-- Select Company --</option>
                      {companiesList.map((comp) => (
                        <option key={comp._id} value={comp._id}>
                          {comp.name} ({comp.origin.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600", marginBottom: "6px" }}>
                      Applicant / User Account *
                    </label>
                    <select
                      className="form-control"
                      value={offerLetterFormData.userId}
                      onChange={handleUserSelectChange}
                      required>
                      <option value="">-- Select User Account --</option>
                      {usersList.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.username} ({u.role || "user"}){" "}
                          {u.origin ? `[${u.origin.toUpperCase()}]` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600", marginBottom: "6px" }}>
                      Reference Number *
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="form-control"
                        value={offerLetterFormData.refrenceNumber}
                        onChange={(e) =>
                          setOfferLetterFormData({
                            ...offerLetterFormData,
                            refrenceNumber: e.target.value,
                          })
                        }
                        placeholder="e.g. OL-AU-847291"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setOfferLetterFormData((prev) => ({
                            ...prev,
                            refrenceNumber: `OL-AU-${generate8CharRef()}`,
                          }))
                        }
                        title="Auto-generate reference number"
                        style={{ whiteSpace: "nowrap", padding: "8px 14px" }}>
                        🎲 Gen
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 1: Sponsor Quote Details */}
                <div className="offer-letter-section-header">
                  <span>
                    🏢 Sponsor & Official Quote Details (Page 1 Header)
                  </span>
                  <span className="variable-badge">Header Variables</span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "14px",
                  }}>
                  <div className="form-group">
                    <label>Name of Sponsor</label>
                    <input
                      type="text"
                      className="form-control"
                      value={offerLetterFormData.sponsorName}
                      onChange={(e) =>
                        setOfferLetterFormData({
                          ...offerLetterFormData,
                          sponsorName: e.target.value,
                        })
                      }
                      placeholder="e.g. HD Contractor Limited"
                    />
                  </div>

                  <div className="form-group">
                    <label>Sponsor Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={offerLetterFormData.sponsorAddress}
                      onChange={(e) =>
                        setOfferLetterFormData({
                          ...offerLetterFormData,
                          sponsorAddress: e.target.value,
                        })
                      }
                      placeholder="e.g. 54B Tidal Road, Sydney NSW 2000, Australia"
                    />
                  </div>

                  <div className="form-group">
                    <label>Client ID (11 digits)</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="form-control"
                        value={offerLetterFormData.clientId}
                        onChange={(e) =>
                          setOfferLetterFormData({
                            ...offerLetterFormData,
                            clientId: e.target.value,
                          })
                        }
                        placeholder="e.g. 15622175210"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setOfferLetterFormData((prev) => ({
                            ...prev,
                            clientId: generateNumericString(11),
                          }))
                        }>
                        🎲
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Sponsorship Approval ID (10 digits)</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="form-control"
                        value={offerLetterFormData.sponsorshipApprovalId}
                        onChange={(e) =>
                          setOfferLetterFormData({
                            ...offerLetterFormData,
                            sponsorshipApprovalId: e.target.value,
                          })
                        }
                        placeholder="e.g. 1740568430"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setOfferLetterFormData((prev) => ({
                            ...prev,
                            sponsorshipApprovalId: generateNumericString(10),
                          }))
                        }>
                        🎲
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>File Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={offerLetterFormData.fileNumber}
                      onChange={(e) =>
                        setOfferLetterFormData({
                          ...offerLetterFormData,
                          fileNumber: e.target.value,
                        })
                      }
                      placeholder="e.g. ABD2026/420367"
                    />
                  </div>

                  <div className="form-group">
                    <label>Sponsorship Fee Receipt Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={offerLetterFormData.sponsorshipFeeReceiptNumber}
                      onChange={(e) =>
                        setOfferLetterFormData({
                          ...offerLetterFormData,
                          sponsorshipFeeReceiptNumber: e.target.value,
                        })
                      }
                      placeholder="e.g. 100001750031"
                    />
                  </div>

                  <div className="form-group">
                    <label>Date of Sponsorship Approval</label>
                    <input
                      type="text"
                      className="form-control"
                      value={offerLetterFormData.dateOfApproval}
                      onChange={(e) =>
                        setOfferLetterFormData({
                          ...offerLetterFormData,
                          dateOfApproval: e.target.value,
                        })
                      }
                      placeholder="e.g. 03 September 2026"
                    />
                  </div>
                </div>

                {/* Section 2: Applicant & Grant Details */}
                <div className="offer-letter-section-header">
                  <span>
                    👤 Applicant & Status Details (Page 1 & 2 Grant Info)
                  </span>
                  <span className="variable-badge">Recipient Variables</span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "14px",
                  }}>
                  <div className="form-group">
                    <label>Applicant Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={offerLetterFormData.applicantName}
                      onChange={(e) =>
                        setOfferLetterFormData({
                          ...offerLetterFormData,
                          applicantName: e.target.value,
                        })
                      }
                      placeholder="e.g. MD Shaminuzzaman"
                    />
                  </div>

                  <div className="form-group">
                    <label>Nationality</label>
                    <input
                      type="text"
                      className="form-control"
                      value={offerLetterFormData.nationality}
                      onChange={(e) =>
                        setOfferLetterFormData({
                          ...offerLetterFormData,
                          nationality: e.target.value,
                        })
                      }
                      placeholder="e.g. Bangladeshi"
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <input
                      type="text"
                      className="form-control"
                      value={offerLetterFormData.status}
                      onChange={(e) =>
                        setOfferLetterFormData({
                          ...offerLetterFormData,
                          status: e.target.value,
                        })
                      }
                      placeholder="e.g. Issued"
                    />
                  </div>

                  <div className="form-group">
                    <label>Passport Number</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="form-control"
                        value={offerLetterFormData.passportNumber}
                        onChange={(e) =>
                          setOfferLetterFormData({
                            ...offerLetterFormData,
                            passportNumber: e.target.value,
                          })
                        }
                        placeholder="e.g. A09820252"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setOfferLetterFormData((prev) => ({
                            ...prev,
                            passportNumber: `A${generateNumericString(8)}`,
                          }))
                        }>
                        🎲
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Sponsorship Number</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="form-control"
                        value={offerLetterFormData.sponsorshipNumber}
                        onChange={(e) =>
                          setOfferLetterFormData({
                            ...offerLetterFormData,
                            sponsorshipNumber: e.target.value,
                          })
                        }
                        placeholder="e.g. W8420862"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setOfferLetterFormData((prev) => ({
                            ...prev,
                            sponsorshipNumber: `W${generateNumericString(7)}`,
                          }))
                        }>
                        🎲
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Issue Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={offerLetterFormData.issueDate}
                      onChange={(e) =>
                        setOfferLetterFormData({
                          ...offerLetterFormData,
                          issueDate: e.target.value,
                        })
                      }
                      placeholder="e.g. 03 September 2026"
                    />
                  </div>

                  <div className="form-group">
                    <label>Valid Till</label>
                    <input
                      type="text"
                      className="form-control"
                      value={offerLetterFormData.validTill}
                      onChange={(e) =>
                        setOfferLetterFormData({
                          ...offerLetterFormData,
                          validTill: e.target.value,
                        })
                      }
                      placeholder="e.g. 03 March 2027"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isOfferLetterSubmitting}>
                    {isOfferLetterSubmitting ?
                      "Creating..."
                    : "✉️ Create Offer Letter"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      handleOpenOfferLetterPreview(offerLetterFormData)
                    }>
                    👁️ Preview Offer Letter
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setOfferLetterFormData(getInitialOfferLetterFormData());
                      setOfferLetterAlert(null);
                    }}>
                    Reset Form
                  </button>
                </div>
              </form>
            </div>
            {renderOfferLettersTable()}
          </>
        )}

        {activeTab === "visa-grant" && (
          <>
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}>
                <div>
                  <h2 style={{ margin: 0, paddingBottom: "4px" }}>
                    Australian Visa Grant Letter Generator
                  </h2>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                      margin: 0,
                    }}>
                    Official Australian Department of Home Affairs Visa Grant Notice PDF. All variables are managed directly by the admin without requiring backend user or company records.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                    onClick={handleRegenerateVisaGrantVariables}
                    title="Generate new random Grant Number, Application ID, TRN, and dates">
                    🎲 Randomize IDs
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                    onClick={() => handleOpenVisaGrantPreview(visaGrantFormData)}>
                    👁️ Live Preview
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                    onClick={() => handleDownloadVisaGrantPDF(visaGrantFormData)}>
                    📥 Download PDF
                  </button>
                </div>
              </div>

              {visaGrantAlert && (
                <div
                  className={`alert alert-${visaGrantAlert.type}`}
                  style={{ marginBottom: "16px" }}>
                  <span>{visaGrantAlert.message}</span>
                  <button
                    type="button"
                    onClick={() => setVisaGrantAlert(null)}
                    style={{
                      float: "right",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}>
                    ✕
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveVisaGrant}>
                {/* Section 1: Applicant & Identity Details */}
                <div className="offer-letter-section-header">
                  <span>👤 Applicant & Recipient Details</span>
                  <span className="variable-badge">Personal Information</span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "14px",
                  }}>
                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Applicant Full Legal Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="applicantName"
                      value={visaGrantFormData.applicantName || ""}
                      onChange={handleVisaGrantChange}
                      placeholder="e.g. PATEL Chintankumar Ranchhodbhai"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Date of Birth *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="dateOfBirth"
                      value={visaGrantFormData.dateOfBirth || ""}
                      onChange={handleVisaGrantChange}
                      placeholder="e.g. 25 September 1999"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>
                      Passport / Travel Document Number *
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="form-control"
                        name="passportNumber"
                        value={visaGrantFormData.passportNumber || ""}
                        onChange={handleVisaGrantChange}
                        placeholder="e.g. U4019655IND"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setVisaGrantFormData((prev) => ({
                            ...prev,
                            passportNumber: `U${generateNumericString(7)}IND`,
                          }))
                        }
                        title="Randomize Passport #">
                        🎲
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>
                      Country of Passport / Nationality *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="passportCountry"
                      value={visaGrantFormData.passportCountry || ""}
                      onChange={handleVisaGrantChange}
                      placeholder="e.g. INDIA"
                      required
                    />
                  </div>
                </div>

                {/* Section 2: Visa Application & Grant Identifiers */}
                <div className="offer-letter-section-header">
                  <span>📄 Visa Application & Grant Identifiers</span>
                  <span className="variable-badge">Official Identifiers</span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "14px",
                  }}>
                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Visa Class / Subclass *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="visaName"
                      value={visaGrantFormData.visaName || ""}
                      onChange={handleVisaGrantChange}
                      placeholder="e.g. Transit (subclass 771)"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Application Status *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="applicationStatus"
                      value={visaGrantFormData.applicationStatus || "Granted"}
                      onChange={handleVisaGrantChange}
                      placeholder="e.g. Granted"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>
                      Visa Grant Number (13 digits) *
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="form-control"
                        name="visaGrantNumber"
                        value={visaGrantFormData.visaGrantNumber || ""}
                        onChange={handleVisaGrantChange}
                        placeholder="e.g. 1139500159106"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setVisaGrantFormData((prev) => ({
                            ...prev,
                            visaGrantNumber: `1139500${generateNumericString(6)}`,
                          }))
                        }
                        title="Randomize Grant #">
                        🎲
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Application ID (9 digits) *</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="form-control"
                        name="applicationId"
                        value={visaGrantFormData.applicationId || ""}
                        onChange={handleVisaGrantChange}
                        placeholder="e.g. 106951626"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setVisaGrantFormData((prev) => ({
                            ...prev,
                            applicationId: generateNumericString(9),
                          }))
                        }
                        title="Randomize App ID">
                        🎲
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>
                      Transaction Reference Number (TRN) *
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="form-control"
                        name="trn"
                        value={visaGrantFormData.trn || ""}
                        onChange={handleVisaGrantChange}
                        placeholder="e.g. EGP6QH59AO"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setVisaGrantFormData((prev) => ({
                            ...prev,
                            trn: `EGP${generate8CharRef().slice(0, 7)}`,
                          }))
                        }
                        title="Randomize TRN">
                        🎲
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 3: Duration & Travel Details */}
                <div className="offer-letter-section-header">
                  <span>✈️ Stay Duration & Travel Details</span>
                  <span className="variable-badge">Travel Limits</span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "14px",
                  }}>
                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Visa Grant Date *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="grantDate"
                      value={visaGrantFormData.grantDate || ""}
                      onChange={handleVisaGrantChange}
                      placeholder="e.g. 04 February 2025"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Must Not Arrive After *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="mustNotArriveAfter"
                      value={visaGrantFormData.mustNotArriveAfter || ""}
                      onChange={handleVisaGrantChange}
                      placeholder="e.g. 04 February 2026"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Length of Stay *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lengthOfStay"
                      value={visaGrantFormData.lengthOfStay || ""}
                      onChange={handleVisaGrantChange}
                      placeholder="e.g. 3 day(s) from the date of each arrival"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Travel / Entries Allowed *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="travel"
                      value={visaGrantFormData.travel || ""}
                      onChange={handleVisaGrantChange}
                      placeholder="e.g. Multiple entries"
                      required
                    />
                  </div>
                </div>

                {/* Section 4: Conditions & Notice */}
                <div className="offer-letter-section-header">
                  <span>📋 Visa Conditions & Airline Notice</span>
                  <span className="variable-badge">Conditions Text</span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "14px",
                  }}>
                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>
                      Visa Conditions (One per line)
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      name="conditions"
                      value={visaGrantFormData.conditions || ""}
                      onChange={handleVisaGrantChange}
                      placeholder="8101 - No work&#10;8201 - Maximum three months study"
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600" }}>Why Keep This Notice (Bullet text)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      name="whyKeepNotice"
                      value={visaGrantFormData.whyKeepNotice || ""}
                      onChange={handleVisaGrantChange}
                      placeholder="Airlines might ask for details in this notice so they can carry out checks to allow you to board the plane."
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "20px",
                    flexWrap: "wrap",
                  }}>
                  <button
                    type="submit"
                    className="btn btn-primary">
                    💾 Save to Records
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleOpenVisaGrantPreview(visaGrantFormData)}>
                    👁️ Preview Visa PDF
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={downloadingVisaId === "form"}
                    onClick={() => handleDownloadVisaGrantPDF(visaGrantFormData, "form")}>
                    {downloadingVisaId === "form" ? "⏳ Generating..." : "📥 Download PDF"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleRegenerateVisaGrantVariables}>
                    🎲 Randomize IDs
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setVisaGrantFormData(getInitialVisaGrantFormData());
                      setVisaGrantAlert({
                        type: "info",
                        message: "Reset to default sample variables.",
                      });
                    }}>
                    Reset Defaults
                  </button>
                </div>
              </form>
            </div>
            {renderSavedVisaGrantsTable()}
          </>
        )}
      </main>
      {renderEditCompanyModal()}
      {renderEditOfferLetterModal()}
      {renderOfferLetterPreviewModal()}
      {renderVisaPreviewModal()}
    </div>
  );
}

export default Dashboard;
