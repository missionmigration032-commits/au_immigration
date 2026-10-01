import React from "react";

export function VisasTable({ visasList, fetchVisas, handleDeleteVisa }) {
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
              <th>Employer / Sponsor</th>
              <th>Grant Number</th>
              <th>Passport</th>
              <th>Status</th>
              <th>User Account</th>
              <th>Documents</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visasList.length > 0 ? (
              visasList.map((visa) => (
                <tr key={visa._id}>
                  <td>{visa.givenNames || "-"}</td>
                  <td>{visa.familyName || "-"}</td>
                  <td>
                    {visa.employer ? (
                      <span style={{ fontWeight: "500", color: "#334155" }}>
                        🏢 {visa.employer}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{visa.visaGrantNumber || "-"}</td>
                  <td>{visa.documentNumber || "-"}</td>
                  <td>
                    <span
                      className={`status-badge ${visa.visaStatus === "In Effect" ? "active" : ""}`}>
                      {visa.visaStatus || "Unknown"}
                    </span>
                  </td>
                  <td>
                    {visa.userId ? (
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
                    ) : (
                      <span style={{ color: "#999", fontSize: "0.8rem" }}>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td>
                    {visa.document &&
                    Array.isArray(visa.document) &&
                    visa.document.length > 0 ? (
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
                    ) : (
                      <span style={{ color: "#999", fontSize: "0.8rem" }}>
                        None
                      </span>
                    )}
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
            ) : (
              <tr>
                <td
                  colSpan="9"
                  style={{ textAlign: "center", padding: "20px" }}>
                  No visas found for this origin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VisasTab({
  visaData,
  visaAlert,
  handleCreateVisa,
  handleUserSelectForVisa,
  usersList,
  selectedVisaCompanyId,
  handleCompanySelectForVisa,
  companiesList,
  handleVisaChange,
  uploadedDocs,
  removeDocumentFromList,
  currentDocName,
  setCurrentDocName,
  documentKey,
  handleFileChange,
  addDocumentToList,
  isVisaSubmitting,
  visasList,
  fetchVisas,
  handleDeleteVisa,
}) {
  return (
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
            <div
              className="form-group"
              style={{ flex: "1 1 48%", minWidth: "260px" }}>
              <label
                style={{
                  fontWeight: "600",
                  color: "var(--secondary-color)",
                }}>
                👤 Assign to User Account (Autofills Applicant Details)
              </label>
              <select
                className="form-control"
                name="userId"
                value={visaData.userId || ""}
                onChange={handleUserSelectForVisa}>
                <option value="">
                  -- Select User Account (Optional / Unassigned) --
                </option>
                {usersList.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.username}
                    {u.givenName ?
                      ` (${u.givenName} ${u.familyName || ""})`
                    : ""}
                    {u.role ? ` [${u.role.toUpperCase()}]` : ""}
                  </option>
                ))}
              </select>
              <small
                style={{
                  color: "var(--text-secondary)",
                  display: "block",
                  marginTop: "4px",
                }}>
                Automatically populates given name, family name, passport, and linked records.
              </small>
            </div>

            <div
              className="form-group"
              style={{ flex: "1 1 48%", minWidth: "260px" }}>
              <label
                style={{
                  fontWeight: "600",
                  color: "var(--secondary-color)",
                }}>
                🏢 Select Sponsoring Company / Employer (Autofills Company Details)
              </label>
              <select
                className="form-control"
                name="companyId"
                value={selectedVisaCompanyId || ""}
                onChange={handleCompanySelectForVisa}>
                <option value="">
                  -- Select Sponsoring Company (Optional) --
                </option>
                {companiesList.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {c.address ? ` — ${c.address}` : ""}
                  </option>
                ))}
              </select>
              <small
                style={{
                  color: "var(--text-secondary)",
                  display: "block",
                  marginTop: "4px",
                }}>
                Automatically fills employer and sponsoring company details.
              </small>
            </div>

            {Object.keys(visaData)
              .filter((key) => key !== "userId")
              .map((key) => (
                <div className="form-group" key={key}>
                  <label>
                    {key === "trn" ?
                      "Transaction Reference Number (TRN)"
                    : key === "employer" ?
                      "Employer / Sponsoring Company"
                    : key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())
                    }
                  </label>
                  <input
                    type={
                      key.toLowerCase().includes("date") ||
                      key === "mustNotArriveAfter" ?
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
      <VisasTable
        visasList={visasList}
        fetchVisas={fetchVisas}
        handleDeleteVisa={handleDeleteVisa}
      />
    </>
  );
}

export default VisasTab;
