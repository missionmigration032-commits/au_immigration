import React, { useState } from "react";
import {
  generate8CharRef,
  getInitialPaymentData,
  getPaymentApplicantDisplayName,
  getPaymentCategory,
} from "../dashboardUtils";

export function PaymentsTable({
  paymentsList = [],
  visasList = [],
  sponsorshipsList = [],
  nominationsList = [],
  usersList = [],
  fetchPayments,
  paymentSearch = "",
  setPaymentSearch,
  paymentStatusFilter = "all",
  setPaymentStatusFilter,
  paymentTypeFilter,
  setPaymentTypeFilter,
  handleTogglePaymentStatus,
  handleDeletePayment,
}) {
  const [internalCategoryFilter, setInternalCategoryFilter] = useState("all");
  const currentCategoryFilter =
    paymentTypeFilter !== undefined ? paymentTypeFilter : internalCategoryFilter;
  const handleCategoryFilterChange =
    setPaymentTypeFilter || setInternalCategoryFilter;

  const filteredPayments = paymentsList.filter((p) => {
    const category = getPaymentCategory(p);

    const matchesStatus =
      paymentStatusFilter === "all"
        ? true
        : (p.status || "").toLowerCase() === paymentStatusFilter.toLowerCase();

    const matchesCategory =
      currentCategoryFilter === "all"
        ? true
        : category === currentCategoryFilter.toLowerCase();

    const q = (paymentSearch || "").toLowerCase().trim();
    const pRef = p.referenceNumber || p.ref || "";
    const pName = getPaymentApplicantDisplayName(
      p,
      visasList,
      usersList,
      sponsorshipsList,
      nominationsList
    );
    const pType = p.visaType || p.type || "";
    const pOffice = p.issuingOffice || p.office || "";
    const pInternalRef = p.internalRef || "";
    const pAmount = p.amount !== undefined && p.amount !== null ? p.amount.toString() : "";
    const pCategory = category;

    const matchesSearch =
      !q ||
      pRef.toLowerCase().includes(q) ||
      pName.toLowerCase().includes(q) ||
      pType.toLowerCase().includes(q) ||
      pOffice.toLowerCase().includes(q) ||
      pInternalRef.toLowerCase().includes(q) ||
      pAmount.includes(q) ||
      pCategory.includes(q);

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const totalPaid = paymentsList.filter(
    (p) => (p.status || "").toLowerCase() === "paid"
  ).length;
  const totalPending = paymentsList.filter(
    (p) => (p.status || "").toLowerCase() === "pending"
  ).length;
  const totalRevenue = paymentsList
    .filter((p) => (p.status || "").toLowerCase() === "paid")
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const totalVisa = paymentsList.filter(
    (p) => getPaymentCategory(p) === "visa"
  ).length;
  const totalSponsorship = paymentsList.filter(
    (p) => getPaymentCategory(p) === "sponsorship"
  ).length;
  const totalNomination = paymentsList.filter(
    (p) => getPaymentCategory(p) === "nomination"
  ).length;

  const renderCategoryBadge = (category) => {
    switch (category) {
      case "sponsorship":
        return (
          <span
            className="status-badge category-badge-sponsorship"
            title="Sponsorship Payment"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            🤝 Sponsorship
          </span>
        );
      case "nomination":
        return (
          <span
            className="status-badge category-badge-nomination"
            title="Nomination Payment"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            📋 Nomination
          </span>
        );
      case "visa":
      default:
        return (
          <span
            className="status-badge category-badge-visa"
            title="Visa Payment"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            🛂 Visa
          </span>
        );
    }
  };

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
            Payments ({paymentsList.length})
          </h2>
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              marginTop: "4px",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              alignItems: "center",
            }}>
            <span>
              Paid: <strong style={{ color: "#10b981" }}>{totalPaid}</strong>
            </span>
            <span>|</span>
            <span>
              Pending: <strong style={{ color: "#f59e0b" }}>{totalPending}</strong>
            </span>
            <span>|</span>
            <span>
              Total Collected:{" "}
              <strong style={{ color: "var(--primary-color)" }}>
                ${totalRevenue.toFixed(2)} AUD
              </strong>
            </span>
            <span>|</span>
            <span style={{ color: "#0369a1" }}>Visas: <strong>{totalVisa}</strong></span>
            <span>|</span>
            <span style={{ color: "#7e22ce" }}>Sponsorships: <strong>{totalSponsorship}</strong></span>
            <span>|</span>
            <span style={{ color: "#0f766e" }}>Nominations: <strong>{totalNomination}</strong></span>
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
            value={currentCategoryFilter}
            onChange={(e) => handleCategoryFilterChange(e.target.value)}
            style={{
              width: "160px",
              padding: "6px 10px",
              fontSize: "0.85rem",
              fontWeight: "500",
            }}>
            <option value="all">All Categories</option>
            <option value="visa">🛂 Visas ({totalVisa})</option>
            <option value="sponsorship">🤝 Sponsorships ({totalSponsorship})</option>
            <option value="nomination">📋 Nominations ({totalNomination})</option>
          </select>
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
              <th>Category</th>
              <th>Type / Program</th>
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
            {filteredPayments.length > 0 ? (
              filteredPayments.map((p) => {
                const paymentId = p._id || p.id || p.referenceNumber || p.ref;
                const refNum = p.referenceNumber || p.ref || "-";
                const pCategory = getPaymentCategory(p);
                const pType = p.visaType || p.type || "-";
                const pName = getPaymentApplicantDisplayName(
                  p,
                  visasList,
                  usersList,
                  sponsorshipsList,
                  nominationsList
                );
                const pDate =
                  p.date && p.date !== "—"
                    ? p.date
                    : p.transactionDate
                    ? new Date(p.transactionDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";
                const pOffice = p.issuingOffice || p.office || "-";
                const pInternalRef = p.internalRef || "-";
                const pCurrency = p.currency || "AUD";
                const pAmount =
                  typeof p.amount === "number"
                    ? p.amount.toFixed(2)
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
                    <td>{renderCategoryBadge(pCategory)}</td>
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
            ) : (
              <tr>
                <td
                  colSpan="11"
                  style={{
                    textAlign: "center",
                    padding: "24px",
                    color: "var(--text-secondary)",
                  }}>
                  {paymentsList.length === 0
                    ? "No payments created yet. Use the form above to record a payment."
                    : "No payments match the search criteria."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsTab({
  paymentData,
  setPaymentData,
  handleCreatePayment,
  visasList = [],
  sponsorshipsList = [],
  nominationsList = [],
  handleVisaSelectForPayment,
  handleEntitySelectForPayment,
  handlePaymentTypeChange,
  handlePaymentChange,
  paymentsList = [],
  usersList = [],
  fetchPayments,
  paymentSearch,
  setPaymentSearch,
  paymentStatusFilter,
  setPaymentStatusFilter,
  paymentTypeFilter,
  setPaymentTypeFilter,
  handleTogglePaymentStatus,
  handleDeletePayment,
}) {
  const currentPaymentType = paymentData.paymentType || "visa";

  // Fallback handlers if not provided from parent
  const onPaymentTypeSelect = (type) => {
    if (handlePaymentTypeChange) {
      handlePaymentTypeChange(type);
    } else {
      setPaymentData((prev) => ({
        ...getInitialPaymentData(),
        paymentType: type,
        referenceNumber: prev.referenceNumber || generate8CharRef(),
        currency: prev.currency || "AUD",
        issuingOffice: prev.issuingOffice || "New Delhi",
        status: prev.status || "paid",
      }));
    }
  };

  const onEntitySelect = (e) => {
    if (handleEntitySelectForPayment) {
      handleEntitySelectForPayment(e);
    } else if (handleVisaSelectForPayment && currentPaymentType === "visa") {
      handleVisaSelectForPayment(e);
    }
  };

  return (
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
              Create Payment
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
              }}>
              Create payment records for Visas, Sponsorships, or Nominations. Select an existing record to auto-populate details.
            </p>
          </div>
        </div>

        {/* 1. Payment Category Selection Tabs */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>
            Payment Category / Target *
          </label>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`btn ${currentPaymentType === "visa" ? "btn-primary" : "btn-secondary"}`}
              style={{
                padding: "8px 18px",
                fontSize: "0.9rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: currentPaymentType === "visa" ? 700 : 500,
              }}
              onClick={() => onPaymentTypeSelect("visa")}>
              🛂 Visa Payment
            </button>
            <button
              type="button"
              className={`btn ${currentPaymentType === "sponsorship" ? "btn-primary" : "btn-secondary"}`}
              style={{
                padding: "8px 18px",
                fontSize: "0.9rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: currentPaymentType === "sponsorship" ? 700 : 500,
              }}
              onClick={() => onPaymentTypeSelect("sponsorship")}>
              🤝 Sponsorship Payment
            </button>
            <button
              type="button"
              className={`btn ${currentPaymentType === "nomination" ? "btn-primary" : "btn-secondary"}`}
              style={{
                padding: "8px 18px",
                fontSize: "0.9rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: currentPaymentType === "nomination" ? 700 : 500,
              }}
              onClick={() => onPaymentTypeSelect("nomination")}>
              📋 Nomination Payment
            </button>
          </div>
        </div>

        <form onSubmit={handleCreatePayment}>
          {/* 2. Database Record Selector based on chosen category */}
          <div className="form-row" style={{ marginBottom: "15px" }}>
            <div className="form-group" style={{ flex: "1 1 100%" }}>
              {currentPaymentType === "visa" && (
                <>
                  <label
                    style={{
                      fontWeight: "600",
                      color: "var(--secondary-color)",
                    }}>
                    Select Visa Record from Database *
                  </label>
                  <select
                    className="form-control"
                    value={paymentData.selectedVisaId || ""}
                    onChange={onEntitySelect}
                    required
                    style={{
                      backgroundColor: "#f8fafc",
                      borderColor: "#cbd5e1",
                    }}>
                    <option value="">
                      -- Choose Visa Record (Auto-fills Visa Type & Applicant Name) --
                    </option>
                    {visasList.map((v) => (
                      <option key={v._id} value={v._id}>
                        {[v.givenNames, v.familyName].filter(Boolean).join(" ") ||
                          "Applicant"}{" "}
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
                    <strong>Visa Type</strong>, <strong>Applicant Name</strong>, and{" "}
                    <strong>Internal Ref. (TRN)</strong>.
                  </small>
                </>
              )}

              {currentPaymentType === "sponsorship" && (
                <>
                  <label
                    style={{
                      fontWeight: "600",
                      color: "var(--secondary-color)",
                    }}>
                    Select Sponsorship Record from Database *
                  </label>
                  <select
                    className="form-control"
                    value={paymentData.selectedSponsorshipId || ""}
                    onChange={onEntitySelect}
                    required
                    style={{
                      backgroundColor: "#f8fafc",
                      borderColor: "#cbd5e1",
                    }}>
                    <option value="">
                      -- Choose Sponsorship Record (Auto-fills Program & Applicant Name) --
                    </option>
                    {sponsorshipsList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {[s.givenName, s.familyName].filter(Boolean).join(" ") ||
                          "Applicant"}{" "}
                        — {s.visaProgram || "Sponsorship"} [TRN:{" "}
                        {s.sponsorshipTrn || "N/A"}, App ID: {s.applicationId || "N/A"},
                        File: {s.fileNumber || "N/A"}]
                      </option>
                    ))}
                  </select>
                  <small
                    style={{
                      color: "var(--text-secondary)",
                      display: "block",
                      marginTop: "4px",
                    }}>
                    Selecting a sponsorship automatically extracts the{" "}
                    <strong>Program</strong>, <strong>Name</strong>, and{" "}
                    <strong>Internal Ref. (TRN / App ID)</strong>.
                  </small>
                </>
              )}

              {currentPaymentType === "nomination" && (
                <>
                  <label
                    style={{
                      fontWeight: "600",
                      color: "var(--secondary-color)",
                    }}>
                    Select Nomination Record from Database *
                  </label>
                  <select
                    className="form-control"
                    value={paymentData.selectedNominationId || ""}
                    onChange={onEntitySelect}
                    required
                    style={{
                      backgroundColor: "#f8fafc",
                      borderColor: "#cbd5e1",
                    }}>
                    <option value="">
                      -- Choose Nomination Record (Auto-fills Program & Nominee Name) --
                    </option>
                    {nominationsList.map((n) => (
                      <option key={n._id} value={n._id}>
                        {[n.givenName, n.familyName].filter(Boolean).join(" ") ||
                          "Nominee"}{" "}
                        — {n.visaProgram || "Nomination"} [TRN:{" "}
                        {n.nominationTrn || "N/A"}, App ID: {n.applicationId || "N/A"},
                        File: {n.fileNumber || "N/A"}]
                      </option>
                    ))}
                  </select>
                  <small
                    style={{
                      color: "var(--text-secondary)",
                      display: "block",
                      marginTop: "4px",
                    }}>
                    Selecting a nomination automatically extracts the{" "}
                    <strong>Program</strong>, <strong>Nominee Name</strong>, and{" "}
                    <strong>Internal Ref. (TRN / App ID)</strong>.
                  </small>
                </>
              )}
            </div>
          </div>

          {/* 3. Form Fields */}
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
                  value={paymentData.referenceNumber || ""}
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

            {/* Program / Visa Type */}
            <div className="form-group">
              <label style={{ fontWeight: "600" }}>
                {currentPaymentType === "sponsorship"
                  ? "Sponsorship Program / Type *"
                  : currentPaymentType === "nomination"
                  ? "Nomination Program / Type *"
                  : "Visa Type / Subclass *"}
              </label>
              <input
                type="text"
                className="form-control"
                name="visaType"
                value={paymentData.visaType || ""}
                onChange={handlePaymentChange}
                placeholder={
                  currentPaymentType === "sponsorship"
                    ? "e.g. Standard Business Sponsorship (SBS)"
                    : currentPaymentType === "nomination"
                    ? "e.g. Subclass 482 Nomination"
                    : "e.g. Visitor (subclass 600) or Tourist"
                }
                required
              />
            </div>

            {/* Name */}
            <div className="form-group">
              <label style={{ fontWeight: "600" }}>
                {currentPaymentType === "sponsorship"
                  ? "Applicant / Sponsor Name *"
                  : currentPaymentType === "nomination"
                  ? "Nominee Name *"
                  : "Applicant Name *"}
              </label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={paymentData.name || ""}
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
                value={paymentData.status || "paid"}
                onChange={handlePaymentChange}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Transaction Date - Only asked if status is Paid */}
            {paymentData.status === "paid" && (
              <div className="form-group">
                <label style={{ fontWeight: "600" }}>Transaction Date *</label>
                <input
                  type="date"
                  className="form-control"
                  name="transactionDate"
                  value={paymentData.transactionDate || ""}
                  onChange={handlePaymentChange}
                  required
                />
              </div>
            )}

            {/* Issuing Office */}
            <div className="form-group">
              <label style={{ fontWeight: "600" }}>Issuing Office *</label>
              <input
                type="text"
                className="form-control"
                name="issuingOffice"
                list="issuingOffices"
                value={paymentData.issuingOffice || ""}
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
                value={paymentData.internalRef || ""}
                onChange={handlePaymentChange}
                placeholder={
                  currentPaymentType === "sponsorship"
                    ? "e.g. SPON-TRN or File No."
                    : currentPaymentType === "nomination"
                    ? "e.g. NOM-TRN or File No."
                    : "e.g. AU-MMS-1024 or TRN"
                }
              />
            </div>

            {/* Currency */}
            <div className="form-group">
              <label style={{ fontWeight: "600" }}>Currency *</label>
              <select
                className="form-control"
                name="currency"
                value={paymentData.currency || "AUD"}
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
                value={paymentData.amount || ""}
                onChange={handlePaymentChange}
                placeholder="e.g. 385.00"
                required
              />
            </div>
          </div>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button type="submit" className="btn btn-primary">
              💳 Create{" "}
              {currentPaymentType === "sponsorship"
                ? "Sponsorship"
                : currentPaymentType === "nomination"
                ? "Nomination"
                : "Visa"}{" "}
              Payment
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

      <PaymentsTable
        paymentsList={paymentsList}
        visasList={visasList}
        sponsorshipsList={sponsorshipsList}
        nominationsList={nominationsList}
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
    </>
  );
}

export default PaymentsTab;
