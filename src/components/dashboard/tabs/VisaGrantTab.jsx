import React from "react";
import {
  generate8CharRef,
  generateNumericString,
  getInitialVisaGrantFormData,
} from "../dashboardUtils";

export function SavedVisaGrantsTable({
  savedVisaGrants,
  visaGrantSearch,
  setVisaGrantSearch,
  setVisaGrantFormData,
  setVisaGrantAlert,
  handleLoadSavedVisaGrant,
  handleOpenVisaGrantPreview,
  handleDownloadVisaGrantPDF,
  downloadingVisaId,
  handleDeleteSavedVisaGrant,
}) {
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
}

function VisaGrantTab({
  visaGrantFormData,
  setVisaGrantFormData,
  visaGrantAlert,
  setVisaGrantAlert,
  handleRegenerateVisaGrantVariables,
  handleOpenVisaGrantPreview,
  handleDownloadVisaGrantPDF,
  handleSaveVisaGrant,
  handleVisaGrantChange,
  usersList,
  visasList,
  downloadingVisaId,
  savedVisaGrants,
  visaGrantSearch,
  setVisaGrantSearch,
  handleLoadSavedVisaGrant,
  handleDeleteSavedVisaGrant,
}) {
  return (
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
          {/* Quick Autofill Toolbar */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}>
            <span
              style={{
                fontWeight: "600",
                fontSize: "0.85rem",
                color: "#334155",
              }}>
              ⚡ Quick Autofill from Registered User:
            </span>
            <select
              className="form-control"
              style={{
                maxWidth: "340px",
                fontSize: "0.85rem",
                padding: "6px 10px",
              }}
              value=""
              onChange={(e) => {
                const uId = e.target.value;
                if (!uId) return;
                const u = usersList.find(
                  (usr) => String(usr._id) === String(uId),
                );
                if (!u) return;
                const existingVisa = visasList.find(
                  (v) =>
                    String(
                      typeof v.userId === "object" ?
                        v.userId._id
                      : v.userId,
                    ) === String(uId),
                );
                const fullName =
                  [u.givenName, u.familyName]
                    .filter(Boolean)
                    .join(" ") || u.username;
                setVisaGrantFormData((prev) => ({
                  ...prev,
                  applicantName: fullName.toUpperCase(),
                  passportNumber:
                    u.passport ||
                    existingVisa?.documentNumber ||
                    prev.passportNumber,
                  dateOfBirth:
                    existingVisa?.dateOfBirth || prev.dateOfBirth,
                  trn: existingVisa?.trn || prev.trn,
                  visaGrantNumber:
                    existingVisa?.visaGrantNumber ||
                    prev.visaGrantNumber,
                }));
                setVisaGrantAlert({
                  type: "info",
                  message: `Autofilled details from "${u.username}".`,
                });
              }}>
              <option value="">
                -- Choose User Account to Autofill --
              </option>
              {usersList.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.username}
                  {u.givenName ?
                    ` (${u.givenName} ${u.familyName || ""})`
                  : ""}
                </option>
              ))}
            </select>
          </div>

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

      <SavedVisaGrantsTable
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
      />
    </>
  );
}

export default VisaGrantTab;
