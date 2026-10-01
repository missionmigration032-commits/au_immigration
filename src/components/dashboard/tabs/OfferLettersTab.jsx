import React from "react";
import {
  copyToClipboard,
  generate8CharRef,
  generateNumericString,
  getInitialOfferLetterFormData,
  getOfferLetterMergedData,
  renderOriginBadge,
} from "../dashboardUtils";

export function OfferLettersTable({
  offerLettersList,
  companiesList,
  offerLetterCompanyFilter,
  setOfferLetterCompanyFilter,
  offerLetterSearch,
  setOfferLetterSearch,
  fetchOfferLetters,
  handleOpenOfferLetterPreview,
  handleDownloadOfferLetter,
  downloadingLetterId,
  handleStartEditOfferLetter,
  handleDeleteOfferLetter,
}) {
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
            {filteredOfferLetters.length > 0 ? (
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
                      {ol.createdAt ? (
                        new Date(ol.createdAt).toLocaleDateString()
                      ) : (
                        "-"
                      )}
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
            ) : (
              <tr>
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
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OfferLettersTab({
  offerLetterFormData,
  setOfferLetterFormData,
  offerLetterAlert,
  setOfferLetterAlert,
  isOfferLetterSubmitting,
  handleCreateOfferLetter,
  handleRegenerateOfferLetterVariables,
  handleOpenOfferLetterPreview,
  handleCompanySelectChange,
  handleUserSelectChange,
  companiesList,
  usersList,
  offerLettersList,
  fetchOfferLetters,
  offerLetterSearch,
  setOfferLetterSearch,
  offerLetterCompanyFilter,
  setOfferLetterCompanyFilter,
  handleStartEditOfferLetter,
  handleDownloadOfferLetter,
  downloadingLetterId,
  handleDeleteOfferLetter,
  setActiveTab,
}) {
  return (
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
              Create Offer Letter (Grant Letter of Sponsorship for Australia)
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
              onClick={() => handleOpenOfferLetterPreview(offerLetterFormData)}>
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
                <label style={{ fontWeight: "600", margin: 0 }}>Company *</label>
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
                    {comp.name} {comp.address ? `— ${comp.address}` : ""} ({comp.origin.toUpperCase()})
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
            <span>🏢 Sponsor & Official Quote Details (Page 1 Header)</span>
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
      <OfferLettersTable
        offerLettersList={offerLettersList}
        companiesList={companiesList}
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
      />
    </>
  );
}

export default OfferLettersTab;
