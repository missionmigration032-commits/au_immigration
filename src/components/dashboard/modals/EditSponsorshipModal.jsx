import React, { useState } from "react";
import { COMMON_SPONSORSHIP_PROGRAMS } from "../dashboardUtils";

function EditSponsorshipModal({
  editingSponsorship,
  setEditingSponsorship,
  handleUpdateSponsorship,
  isUpdatingSponsorship,
  usersList,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [docName, setDocName] = useState(
    editingSponsorship?.document?.[0]?.name || "Sponsorship Approval Notice"
  );

  if (!editingSponsorship) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    handleUpdateSponsorship(editingSponsorship, selectedFile, docName);
  };

  const handleUserSelect = (e) => {
    const uid = e.target.value;
    if (!uid) {
      setEditingSponsorship({
        ...editingSponsorship,
        userId: "",
      });
      return;
    }
    const foundUser = usersList.find((u) => u._id === uid);
    setEditingSponsorship({
      ...editingSponsorship,
      userId: uid,
      givenName: foundUser?.givenName || editingSponsorship.givenName || "",
      familyName: foundUser?.familyName || editingSponsorship.familyName || "",
    });
  };

  return (
    <div
      className="dashboard-modal-backdrop"
      onClick={() => setEditingSponsorship(null)}>
      <div
        className="dashboard-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "750px" }}>
        <div className="dashboard-modal-header">
          <h3>Edit Sponsorship</h3>
          <button
            className="dashboard-modal-close"
            type="button"
            onClick={() => setEditingSponsorship(null)}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dashboard-modal-body">
            {/* User Account Selection */}
            <div className="form-group" style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "600" }}>Linked User Account</label>
              <select
                className="form-control"
                value={
                  typeof editingSponsorship.userId === "object"
                    ? editingSponsorship.userId?._id || ""
                    : editingSponsorship.userId || ""
                }
                onChange={handleUserSelect}>
                <option value="">-- Unassigned (No User Link) --</option>
                {usersList.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.username} (
                    {[user.givenName, user.familyName].filter(Boolean).join(" ") ||
                      user.email}
                    )
                  </option>
                ))}
              </select>
            </div>

            {/* Applicant Names */}
            <div className="form-row">
              <div className="form-group">
                <label style={{ fontWeight: "600" }}>Given Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingSponsorship.givenName || ""}
                  onChange={(e) =>
                    setEditingSponsorship({
                      ...editingSponsorship,
                      givenName: e.target.value,
                    })
                  }
                  placeholder="e.g. John"
                />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: "600" }}>Family Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingSponsorship.familyName || ""}
                  onChange={(e) =>
                    setEditingSponsorship({
                      ...editingSponsorship,
                      familyName: e.target.value,
                    })
                  }
                  placeholder="e.g. Doe"
                />
              </div>
            </div>

            {/* Application ID & Sponsorship TRN */}
            <div className="form-row">
              <div className="form-group">
                <label style={{ fontWeight: "600" }}>Application ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingSponsorship.applicationId || ""}
                  onChange={(e) =>
                    setEditingSponsorship({
                      ...editingSponsorship,
                      applicationId: e.target.value,
                    })
                  }
                  placeholder="e.g. 106951626"
                />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: "600" }}>Sponsorship TRN</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingSponsorship.sponsorshipTrn || ""}
                  onChange={(e) =>
                    setEditingSponsorship({
                      ...editingSponsorship,
                      sponsorshipTrn: e.target.value,
                    })
                  }
                  placeholder="e.g. SPON-AU-82917402"
                />
              </div>
            </div>

            {/* Visa Program & File Number */}
            <div className="form-row">
              <div className="form-group">
                <label style={{ fontWeight: "600" }}>Visa Program</label>
                <input
                  type="text"
                  className="form-control"
                  list="edit-sponsorship-programs-list"
                  value={editingSponsorship.visaProgram || ""}
                  onChange={(e) =>
                    setEditingSponsorship({
                      ...editingSponsorship,
                      visaProgram: e.target.value,
                    })
                  }
                  placeholder="Select or enter visa program"
                />
                <datalist id="edit-sponsorship-programs-list">
                  {COMMON_SPONSORSHIP_PROGRAMS.map((prog) => (
                    <option key={prog} value={prog} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: "600" }}>File Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingSponsorship.fileNumber || ""}
                  onChange={(e) =>
                    setEditingSponsorship({
                      ...editingSponsorship,
                      fileNumber: e.target.value,
                    })
                  }
                  placeholder="e.g. BCC2026/1234567"
                />
              </div>
            </div>

            {/* Approved Date */}
            <div className="form-group">
              <label style={{ fontWeight: "600" }}>Approved Date</label>
              <input
                type="text"
                className="form-control"
                value={editingSponsorship.approvedDate || ""}
                onChange={(e) =>
                  setEditingSponsorship({
                    ...editingSponsorship,
                    approvedDate: e.target.value,
                  })
                }
                placeholder="e.g. 12 October 2026"
              />
            </div>

            {/* Document section */}
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              }}>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>
                Attached Document
              </label>

              {editingSponsorship.document &&
                Array.isArray(editingSponsorship.document) &&
                editingSponsorship.document.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Current document: </span>
                    {editingSponsorship.document.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          color: "var(--primary-color)",
                          fontWeight: "500",
                          marginLeft: "6px",
                          fontSize: "0.85rem",
                          textDecoration: "underline",
                        }}>
                        📎 {doc.name || "Document"} (View / Download)
                      </a>
                    ))}
                  </div>
                )}

              <div className="form-row">
                <div className="form-group" style={{ flex: "1" }}>
                  <label style={{ fontSize: "0.85rem" }}>Document Label</label>
                  <input
                    type="text"
                    className="form-control"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g. Sponsorship Approval Notice"
                  />
                </div>
                <div className="form-group" style={{ flex: "1" }}>
                  <label style={{ fontSize: "0.85rem" }}>Upload New / Replacement Document</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  />
                </div>
              </div>
              <small style={{ color: "#64748b", fontSize: "0.75rem" }}>
                Accepted formats: PDF, Images, Word documents. Leave empty to keep existing document.
              </small>
            </div>
          </div>

          <div className="dashboard-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingSponsorship(null)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUpdatingSponsorship}>
              {isUpdatingSponsorship ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditSponsorshipModal;
