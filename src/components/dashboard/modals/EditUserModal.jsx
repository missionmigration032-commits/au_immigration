import React from "react";

function EditUserModal({
  editingUser,
  setEditingUser,
  handleUpdateUser,
  isUpdatingUser,
}) {
  if (!editingUser) return null;

  return (
    <div
      className="dashboard-modal-backdrop"
      onClick={() => setEditingUser(null)}>
      <div
        className="dashboard-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px" }}>
        <div className="dashboard-modal-header">
          <h3>Edit User Account</h3>
          <button
            className="dashboard-modal-close"
            onClick={() => setEditingUser(null)}>
            ✕
          </button>
        </div>
        <form onSubmit={handleUpdateUser}>
          <div className="dashboard-modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Given Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingUser.givenName || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      givenName: e.target.value,
                    })
                  }
                  placeholder="Enter given name"
                />
              </div>
              <div className="form-group">
                <label>Family Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingUser.familyName || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      familyName: e.target.value,
                    })
                  }
                  placeholder="Enter family name"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  className="form-control"
                  value={editingUser.dob || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      dob: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={editingUser.email || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      email: e.target.value,
                    })
                  }
                  placeholder="user@example.com"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Passport Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingUser.passport || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      passport: e.target.value,
                    })
                  }
                  placeholder="Passport number"
                />
              </div>
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingUser.username || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      username: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password (Optional)</label>
                <input
                  type="password"
                  className="form-control"
                  value={editingUser.password || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      password: e.target.value,
                    })
                  }
                  placeholder="Leave blank to keep unchanged"
                />
                <small
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.75rem",
                    display: "block",
                    marginTop: "3px",
                  }}>
                  Leave blank to keep current password
                </small>
              </div>
            </div>
          </div>
          <div className="dashboard-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingUser(null)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUpdatingUser}>
              {isUpdatingUser ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUserModal;
