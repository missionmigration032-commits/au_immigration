import React from "react";
import {
  generate8CharRef,
  getInitialPaymentData,
  getPaymentApplicantDisplayName,
} from "../dashboardUtils";

export function PaymentsTable({
  paymentsList,
  visasList,
  usersList,
  fetchPayments,
  paymentSearch,
  setPaymentSearch,
  paymentStatusFilter,
  setPaymentStatusFilter,
  handleTogglePaymentStatus,
  handleDeletePayment,
}) {
  const filteredPayments = paymentsList.filter((p) => {
    const matchesStatus =
      paymentStatusFilter === "all" ? true : (
        (p.status || "").toLowerCase() === paymentStatusFilter.toLowerCase()
      );

    const q = paymentSearch.toLowerCase().trim();
    const pRef = p.referenceNumber || p.ref || "";
    const pName = getPaymentApplicantDisplayName(p, visasList, usersList);
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
            {filteredPayments.length > 0 ? (
              filteredPayments.map((p) => {
                const paymentId = p._id || p.id || p.referenceNumber || p.ref;
                const refNum = p.referenceNumber || p.ref || "-";
                const pType = p.visaType || p.type || "-";
                const pName = getPaymentApplicantDisplayName(p, visasList, usersList);
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
            ) : (
              <tr>
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
  visasList,
  handleVisaSelectForPayment,
  handlePaymentChange,
  paymentsList,
  usersList,
  fetchPayments,
  paymentSearch,
  setPaymentSearch,
  paymentStatusFilter,
  setPaymentStatusFilter,
  handleTogglePaymentStatus,
  handleDeletePayment,
}) {
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
              Create Visa Payment
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
              }}>
              Select an existing visa from the database to automatically populate
              visa details, or enter manually.
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
                Select Visa from Database (Auto-extracts Visa Type & Applicant Name)
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
                  -- Choose Visa Record (Optional or select to auto-fill) --
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
                <strong>Visa Type</strong>, <strong>Name</strong>, and suggests an{" "}
                <strong>Internal Ref.</strong>
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
                <label style={{ fontWeight: "600" }}>Transaction Date *</label>
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
              <label style={{ fontWeight: "600" }}>Issuing Office *</label>
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

          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
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

      <PaymentsTable
        paymentsList={paymentsList}
        visasList={visasList}
        usersList={usersList}
        fetchPayments={fetchPayments}
        paymentSearch={paymentSearch}
        setPaymentSearch={setPaymentSearch}
        paymentStatusFilter={paymentStatusFilter}
        setPaymentStatusFilter={setPaymentStatusFilter}
        handleTogglePaymentStatus={handleTogglePaymentStatus}
        handleDeletePayment={handleDeletePayment}
      />
    </>
  );
}

export default PaymentsTab;
