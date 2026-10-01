import React from "react";
import { copyToClipboard, renderOriginBadge } from "../dashboardUtils";

export function CompaniesTable({
  companiesList,
  companySearch,
  setCompanySearch,
  fetchCompanies,
  setEditingCompany,
  handleDeleteCompany,
}) {
  const filteredCompanies = companiesList.filter((comp) => {
    const q = companySearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (comp.name && comp.name.toLowerCase().includes(q)) ||
      (comp.address && comp.address.toLowerCase().includes(q)) ||
      (comp._id && comp._id.toLowerCase().includes(q));
    return matchesSearch;
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
            Registered Companies ({companiesList.length})
          </h2>
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              marginTop: "4px",
            }}>
            Origin: <strong>AU</strong> &nbsp;|&nbsp; Total:{" "}
            <strong>{companiesList.length}</strong>
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
            onClick={fetchCompanies}>
            🔄 Refresh Companies
          </button>
          <input
            type="text"
            className="form-control"
            placeholder="Search companies..."
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            style={{
              width: "200px",
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
              <th>Company Name</th>
              <th>Address</th>
              <th>Origin</th>
              <th>Company ID</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: "600" }}>{c.name}</td>
                  <td
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}>
                    {c.address || "—"}
                  </td>
                  <td>{renderOriginBadge(c.origin)}</td>
                  <td>
                    <span className="ref-badge">
                      {c._id.slice(-8)}
                      <button
                        type="button"
                        className="copy-icon-btn"
                        title="Copy Full ID"
                        onClick={() => copyToClipboard(c._id, "Company ID")}>
                        📋
                      </button>
                    </span>
                  </td>
                  <td
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}>
                    {c.createdAt ? (
                      new Date(c.createdAt).toLocaleDateString()
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingCompany({ ...c })}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteCompany(c._id, c.name)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "24px",
                    color: "var(--text-secondary)",
                  }}>
                  {companiesList.length === 0 ?
                    "No companies registered yet. Use the form above to add a company."
                  : "No companies match the search criteria."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompaniesTab({
  companyFormData,
  setCompanyFormData,
  companyAlert,
  setCompanyAlert,
  isCompanySubmitting,
  handleCreateCompany,
  companiesList,
  fetchCompanies,
  companySearch,
  setCompanySearch,
  setEditingCompany,
  handleDeleteCompany,
}) {
  return (
    <>
      <div className="card">
        <h2>Create New Company</h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
            marginTop: "-10px",
            marginBottom: "20px",
          }}>
          Add an employer or sponsor company registered in Australia, New
          Zealand, or Canada.
        </p>
        {companyAlert && (
          <div
            className={`dashboard-alert dashboard-alert-${companyAlert.type}`}>
            <span>{companyAlert.message}</span>
            <button
              type="button"
              onClick={() => setCompanyAlert(null)}
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
        <form onSubmit={handleCreateCompany}>
          <div className="form-row">
            <div className="form-group" style={{ flex: "1 1 50%" }}>
              <label style={{ fontWeight: "600" }}>Company Name *</label>
              <input
                type="text"
                className="form-control"
                value={companyFormData.name}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
                    name: e.target.value,
                  })
                }
                placeholder="e.g. Atlassian Australia Pty Ltd"
                required
              />
            </div>
            <div className="form-group" style={{ flex: "1 1 50%" }}>
              <label style={{ fontWeight: "600" }}>Company Address</label>
              <input
                type="text"
                className="form-control"
                value={companyFormData.address}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
                    address: e.target.value,
                  })
                }
                placeholder="e.g. 54B Tidal Road, Sydney NSW 2000, Australia"
              />
            </div>
          </div>
          <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCompanySubmitting}>
              {isCompanySubmitting ? "Creating..." : "🏢 Create Company"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setCompanyFormData({ name: "", address: "" });
                setCompanyAlert(null);
              }}>
              Reset Form
            </button>
          </div>
        </form>
      </div>
      <CompaniesTable
        companiesList={companiesList}
        companySearch={companySearch}
        setCompanySearch={setCompanySearch}
        fetchCompanies={fetchCompanies}
        setEditingCompany={setEditingCompany}
        handleDeleteCompany={handleDeleteCompany}
      />
    </>
  );
}

export default CompaniesTab;
