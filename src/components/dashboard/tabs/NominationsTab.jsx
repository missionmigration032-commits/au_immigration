import React, { useRef } from "react";
import {
  renderOriginBadge,
  copyToClipboard,
  COMMON_VISA_PROGRAMS,
  generateNumericString,
  generate8CharRef,
  getFormattedTodayDate,
} from "../dashboardUtils";

export function NominationsTable({
  nominationsList,
  fetchNominations,
  nominationSearch,
  setNominationSearch,
  setEditingNomination,
  handleDeleteNomination,
}) {
  const filteredNominations = nominationsList.filter((nom) => {
    const q = nominationSearch.toLowerCase().trim();
    if (!q) return true;
    const appId = (nom.applicationId || "").toLowerCase();
    const trn = (nom.nominationTrn || "").toLowerCase();
    const prog = (nom.visaProgram || "").toLowerCase();
    const fileNo = (nom.fileNumber || "").toLowerCase();
    const gName = (nom.givenName || "").toLowerCase();
    const fName = (nom.familyName || "").toLowerCase();
    const username = (
      typeof nom.userId === "object"
        ? nom.userId?.username || ""
        : ""
    ).toLowerCase();

    return (
      appId.includes(q) ||
      trn.includes(q) ||
      prog.includes(q) ||
      fileNo.includes(q) ||
      gName.includes(q) ||
      fName.includes(q) ||
      username.includes(q)
    );
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
            Nomination Records ({nominationsList.length})
          </h2>
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              marginTop: "4px",
            }}>
            Total Registered: <strong>{nominationsList.length}</strong> &nbsp;|&nbsp;
            Showing: <strong>{filteredNominations.length}</strong>
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
            onClick={fetchNominations}>
            🔄 Refresh Nominations
          </button>
          <input
            type="text"
            className="form-control"
            placeholder="Search by TRN, ID, Name..."
            value={nominationSearch}
            onChange={(e) => setNominationSearch(e.target.value)}
            style={{
              width: "220px",
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
              <th>Application &amp; TRN</th>
              <th>Applicant Name</th>
              <th>Visa Program</th>
              <th>File Number</th>
              <th>Approved Date</th>
              <th>User Account</th>
              <th>Documents</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredNominations.length > 0 ? (
              filteredNominations.map((nom) => (
                <tr key={nom._id}>
                  <td>
                    <div>
                      <strong
                        style={{
                          cursor: "pointer",
                          color: "var(--primary-color)",
                        }}
                        title="Click to copy TRN"
                        onClick={() =>
                          copyToClipboard(nom.nominationTrn, "Nomination TRN")
                        }>
                        {nom.nominationTrn || "—"}
                      </strong>
                    </div>
                    {nom.applicationId && (
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "#64748b",
                          cursor: "pointer",
                        }}
                        title="Click to copy Application ID"
                        onClick={() =>
                          copyToClipboard(
                            nom.applicationId,
                            "Application ID"
                          )
                        }>
                        ID: {nom.applicationId}
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>
                      {[
                        nom.givenName
                          ? nom.givenName
                              .trim()
                              .split(/\s+/)
                              .map(
                                (w) =>
                                  w.charAt(0).toUpperCase() +
                                  w.slice(1).toLowerCase(),
                              )
                              .join(" ")
                          : "",
                        nom.familyName
                          ? nom.familyName
                              .trim()
                              .split(/\s+/)
                              .map(
                                (w) =>
                                  w.charAt(0).toUpperCase() +
                                  w.slice(1).toLowerCase(),
                              )
                              .join(" ")
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </strong>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#334155",
                        fontWeight: "500",
                      }}>
                      {nom.visaProgram || "—"}
                    </span>
                  </td>
                  <td>
                    <code
                      style={{
                        backgroundColor: "#f1f5f9",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                      }}>
                      {nom.fileNumber || "—"}
                    </code>
                  </td>
                  <td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                    {nom.approvedDate || "—"}
                  </td>
                  <td>
                    {nom.userId ? (
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: "#e0f2fe",
                          color: "#0369a1",
                        }}>
                        👤{" "}
                        {typeof nom.userId === "object"
                          ? nom.userId.username || nom.userId.email
                          : nom.userId}
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td>
                    {nom.document &&
                    Array.isArray(nom.document) &&
                    nom.document.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}>
                        {nom.document.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--primary-color)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              textDecoration: "underline",
                            }}>
                            📎 {doc.name || "Document"}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                        No files
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                        onClick={() => setEditingNomination(nom)}>
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                        onClick={() => handleDeleteNomination(nom._id)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                  {nominationSearch
                    ? "No nominations found matching your search."
                    : "No nomination records added yet. Fill the form below to create one."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function NominationsTab({
  nominationsList,
  fetchNominations,
  nominationFormData,
  setNominationFormData,
  nominationSearch,
  setNominationSearch,
  nominationAlert,
  setNominationAlert,
  isNominationSubmitting,
  handleCreateNomination,
  setEditingNomination,
  handleDeleteNomination,
  usersList,
}) {
  const fileInputRef = useRef(null);

  const handleUserSelect = (e) => {
    const uid = e.target.value;
    if (!uid) {
      setNominationFormData((prev) => ({
        ...prev,
        userId: "",
      }));
      return;
    }
    const foundUser = usersList.find((u) => u._id === uid);
    setNominationFormData((prev) => ({
      ...prev,
      userId: uid,
      givenName: foundUser?.givenName || prev.givenName,
      familyName: foundUser?.familyName || prev.familyName,
    }));
  };

  const handleQuickGenAppId = () => {
    setNominationFormData((prev) => ({
      ...prev,
      applicationId: generateNumericString(9),
    }));
  };

  const handleQuickGenTrn = () => {
    setNominationFormData((prev) => ({
      ...prev,
      nominationTrn: `NOM${generate8CharRef().slice(0, 7)}`,
    }));
  };

  const handleQuickGenFileNo = () => {
    setNominationFormData((prev) => ({
      ...prev,
      fileNumber: `BCC2026/${generateNumericString(7)}`,
    }));
  };

  const handleQuickTodayDate = () => {
    setNominationFormData((prev) => ({
      ...prev,
      approvedDate: getFormattedTodayDate(),
    }));
  };

  return (
    <>
      <div className="card">
        <h2>Add Nomination Record</h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
            marginTop: "-10px",
            marginBottom: "20px",
          }}>
          Create and assign an official Australian employer/state nomination approval notice to a registered user.
        </p>

        {nominationAlert && (
          <div
            className={`dashboard-alert dashboard-alert-${nominationAlert.type}`}>
            <span>{nominationAlert.message}</span>
            <button
              type="button"
              onClick={() => setNominationAlert(null)}
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

        <form onSubmit={handleCreateNomination}>
          {/* User Account Selection */}
          <div
            style={{
              padding: "15px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              marginBottom: "20px",
            }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontWeight: "600" }}>
                👤 Assign to Registered User Account
              </label>
              <select
                className="form-control"
                value={nominationFormData.userId || ""}
                onChange={handleUserSelect}>
                <option value="">-- Select Registered User (Optional) --</option>
                {usersList.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.username} (
                    {[user.givenName, user.familyName].filter(Boolean).join(" ") ||
                      user.email}
                    )
                  </option>
                ))}
              </select>
              <small style={{ color: "#64748b", fontSize: "0.75rem" }}>
                Linking an account automatically makes this nomination visible in the user's "My Applications" portal.
              </small>
            </div>
          </div>

          {/* Applicant Details */}
          <div className="form-row">
            <div className="form-group" style={{ flex: "1" }}>
              <label style={{ fontWeight: "600" }}>Given Name</label>
              <input
                type="text"
                className="form-control"
                value={nominationFormData.givenName || ""}
                onChange={(e) =>
                  setNominationFormData({
                    ...nominationFormData,
                    givenName: e.target.value,
                  })
                }
                placeholder="e.g. John"
              />
            </div>
            <div className="form-group" style={{ flex: "1" }}>
              <label style={{ fontWeight: "600" }}>Family Name</label>
              <input
                type="text"
                className="form-control"
                value={nominationFormData.familyName || ""}
                onChange={(e) =>
                  setNominationFormData({
                    ...nominationFormData,
                    familyName: e.target.value,
                  })
                }
                placeholder="e.g. Doe"
              />
            </div>
          </div>

          {/* Application ID & Nomination TRN */}
          <div className="form-row">
            <div className="form-group" style={{ flex: "1" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}>
                <label style={{ fontWeight: "600", margin: 0 }}>
                  Application ID
                </label>
                <button
                  type="button"
                  onClick={handleQuickGenAppId}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary-color)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    textDecoration: "underline",
                  }}>
                  ⚡ Generate
                </button>
              </div>
              <input
                type="text"
                className="form-control"
                value={nominationFormData.applicationId || ""}
                onChange={(e) =>
                  setNominationFormData({
                    ...nominationFormData,
                    applicationId: e.target.value,
                  })
                }
                placeholder="e.g. 106951626"
              />
            </div>

            <div className="form-group" style={{ flex: "1" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}>
                <label style={{ fontWeight: "600", margin: 0 }}>
                  Nomination TRN
                </label>
                <button
                  type="button"
                  onClick={handleQuickGenTrn}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary-color)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    textDecoration: "underline",
                  }}>
                  ⚡ Generate
                </button>
              </div>
              <input
                type="text"
                className="form-control"
                value={nominationFormData.nominationTrn || ""}
                onChange={(e) =>
                  setNominationFormData({
                    ...nominationFormData,
                    nominationTrn: e.target.value,
                  })
                }
                placeholder="e.g. NOM-AU-82917402"
              />
            </div>
          </div>

          {/* Visa Program & File Number */}
          <div className="form-row">
            <div className="form-group" style={{ flex: "1" }}>
              <label style={{ fontWeight: "600" }}>Visa Program</label>
              <input
                type="text"
                className="form-control"
                list="visa-programs-list"
                value={nominationFormData.visaProgram || ""}
                onChange={(e) =>
                  setNominationFormData({
                    ...nominationFormData,
                    visaProgram: e.target.value,
                  })
                }
                placeholder="Select or enter visa program"
              />
              <datalist id="visa-programs-list">
                {COMMON_VISA_PROGRAMS.map((prog) => (
                  <option key={prog} value={prog} />
                ))}
              </datalist>
            </div>

            <div className="form-group" style={{ flex: "1" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}>
                <label style={{ fontWeight: "600", margin: 0 }}>
                  File Number
                </label>
                <button
                  type="button"
                  onClick={handleQuickGenFileNo}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary-color)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    textDecoration: "underline",
                  }}>
                  ⚡ Generate
                </button>
              </div>
              <input
                type="text"
                className="form-control"
                value={nominationFormData.fileNumber || ""}
                onChange={(e) =>
                  setNominationFormData({
                    ...nominationFormData,
                    fileNumber: e.target.value,
                  })
                }
                placeholder="e.g. BCC2026/1234567"
              />
            </div>
          </div>

          {/* Approved Date */}
          <div className="form-row">
            <div className="form-group" style={{ flex: "1" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}>
                <label style={{ fontWeight: "600", margin: 0 }}>
                  Approved Date
                </label>
                <button
                  type="button"
                  onClick={handleQuickTodayDate}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary-color)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    textDecoration: "underline",
                  }}>
                  📅 Today
                </button>
              </div>
              <input
                type="text"
                className="form-control"
                value={nominationFormData.approvedDate || ""}
                onChange={(e) =>
                  setNominationFormData({
                    ...nominationFormData,
                    approvedDate: e.target.value,
                  })
                }
                placeholder="e.g. 12 October 2026"
              />
            </div>
          </div>

          {/* Document Upload Section */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              border: "1px dashed #cbd5e1",
              marginTop: "15px",
              marginBottom: "20px",
            }}>
            <h4
              style={{
                margin: "0 0 10px 0",
                fontSize: "0.95rem",
                color: "#1e293b",
              }}>
              📎 Attach Document / Approval Notice (Optional)
            </h4>

            <div className="form-row">
              <div className="form-group" style={{ flex: "1" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "500" }}>
                  Document Name / Label
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={nominationFormData.documentName || ""}
                  onChange={(e) =>
                    setNominationFormData({
                      ...nominationFormData,
                      documentName: e.target.value,
                    })
                  }
                  placeholder="e.g. Nomination Approval Notice"
                />
              </div>

              <div className="form-group" style={{ flex: "1" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "500" }}>
                  Upload File (PDF / Images / Docs)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="form-control"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={(e) =>
                    setNominationFormData({
                      ...nominationFormData,
                      file: e.target.files[0] || null,
                    })
                  }
                />
              </div>
            </div>

            <small style={{ color: "#64748b", fontSize: "0.75rem" }}>
              Uploaded documents will be securely stored and linked to the nomination for applicant review and download.
            </small>
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isNominationSubmitting}>
              {isNominationSubmitting ? "Creating..." : "📑 Create Nomination"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setNominationFormData(getInitialNominationFormData());
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}>
              Reset Form
            </button>
          </div>
        </form>
      </div>

      <NominationsTable
        nominationsList={nominationsList}
        fetchNominations={fetchNominations}
        nominationSearch={nominationSearch}
        setNominationSearch={setNominationSearch}
        setEditingNomination={setEditingNomination}
        handleDeleteNomination={handleDeleteNomination}
      />
    </>
  );
}
