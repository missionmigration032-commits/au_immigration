import React from "react";

function EditCompanyModal({
  editingCompany,
  setEditingCompany,
  handleUpdateCompany,
}) {
  if (!editingCompany) return null;

  return (
    <div
      className="dashboard-modal-backdrop"
      onClick={() => setEditingCompany(null)}>
      <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-modal-header">
          <h3>Edit Company</h3>
          <button
            className="dashboard-modal-close"
            onClick={() => setEditingCompany(null)}>
            ✕
          </button>
        </div>
        <form onSubmit={handleUpdateCompany}>
          <div className="dashboard-modal-body">
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                className="form-control"
                value={editingCompany.name || ""}
                onChange={(e) =>
                  setEditingCompany({
                    ...editingCompany,
                    name: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Company Address</label>
              <input
                type="text"
                className="form-control"
                value={editingCompany.address || ""}
                onChange={(e) =>
                  setEditingCompany({
                    ...editingCompany,
                    address: e.target.value,
                  })
                }
                placeholder="e.g. 54B Tidal Road, Sydney NSW 2000, Australia"
              />
            </div>
          </div>
          <div className="dashboard-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingCompany(null)}>
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

export default EditCompanyModal;
