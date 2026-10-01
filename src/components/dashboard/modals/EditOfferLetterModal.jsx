import React from "react";
import {
  generate8CharRef,
  generateNumericString,
} from "../dashboardUtils";

function EditOfferLetterModal({
  editingOfferLetter,
  setEditingOfferLetter,
  handleUpdateOfferLetter,
  handleOpenOfferLetterPreview,
  companiesList,
  usersList,
}) {
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
                      sponsorAddress:
                        selectedComp?.address ?
                          selectedComp.address
                        : editingOfferLetter.sponsorAddress,
                    });
                  }}
                  required>
                  <option value="">-- Select Company --</option>
                  {companiesList.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.address ? `— ${c.address}` : ""} ({c.origin.toUpperCase()})
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
}

export default EditOfferLetterModal;
