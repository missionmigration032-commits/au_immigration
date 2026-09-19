import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

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

const generate8CharRef = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getInitialPaymentData = () => ({
  selectedVisaId: "",
  visaType: "",
  name: "",
  referenceNumber: generate8CharRef(),
  transactionDate: new Date().toISOString().split("T")[0],
  issuingOffice: "Online Payments Centre",
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

  const [usersList, setUsersList] = useState([]);
  const [visasList, setVisasList] = useState([]);

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

  useEffect(() => {
    if (role === "admin" || role === "employe") {
      fetchUsers();
      fetchVisas();
      fetchPayments();
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

  const handleVisaChange = (e) => {
    setVisaData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateVisa = async (e) => {
    e.preventDefault();
    try {
      let finalDocs = [...uploadedDocs];
      const isAlreadyInList = uploadedDocs.some(
        (d) =>
          d.document === currentDocBase64 ||
          (currentDocFileName && d.fileName === currentDocFileName),
      );
      if (currentDocBase64 && !isAlreadyInList) {
        if (!currentDocName.trim()) {
          alert("Document name is required for all uploaded files");
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
          alert("Document name is required for all uploaded files");
          return;
        }
      }

      // Format document array specifically as expected by createVisa in backend:
      // each item has `document` (base64 data URI) and `documentName` (string)
      const docsArray = finalDocs.map((doc) => ({
        document: doc.document,
        documentName: doc.documentName.trim(),
        name: doc.documentName.trim(),
      }));

      const payload = {
        ...visaData,
        origin: "au",
        document: docsArray,
      };

      if (!payload.userId) {
        delete payload.userId; // Let it be null
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
        setVisaData(initialVisaData);
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
        alert(`Failed to create visa: ${error.message}`);
      }
    } catch (error) {
      alert("Error creating visa");
      console.error(error);
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
                      className="btn btn-danger"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
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
      issuingOffice:
        paymentData.issuingOffice.trim() || "Online Payments Centre",
      office: paymentData.issuingOffice.trim() || "Online Payments Centre",
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
              <div style={{ display: "flex", gap: "15px" }}>
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
              </div>
            )}
          </div>
        </div>

        {activeTab === "overview" && role === "admin" && (
          <>
            {renderVisasTable()}
            {renderPaymentsTable()}
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
                    Attach Documents (Sent to backend in array)
                  </label>

                  {uploadedDocs.length > 0 ?
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
                  : <p
                      style={{
                        fontSize: "0.9rem",
                        color: "#777",
                        marginBottom: "12px",
                      }}>
                      No documents attached yet.
                    </p>
                  }

                  <div className="form-row" style={{ alignItems: "flex-end" }}>
                    <div
                      className="form-group"
                      style={{ flex: 1, minWidth: "200px" }}>
                      <label>Document Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Passport Copy"
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
                  <button type="submit" className="btn btn-primary">
                    Create Visa
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
                      placeholder="e.g. Online Payments Centre"
                      required
                    />
                    <datalist id="issuingOffices">
                      <option value="Online Payments Centre" />
                      <option value="Department of Home Affairs" />
                      <option value="Canberra Processing Centre" />
                      <option value="Sydney CBD Registry" />
                      <option value="Melbourne Visa Centre" />
                      <option value="Brisbane Service Centre" />
                      <option value="Perth Office" />
                      <option value="Paper Lodgement Registry" />
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
      </main>
    </div>
  );
}

export default Dashboard;
