import React from "react";

export function UsersTable({
  usersList,
  userSearch,
  setUserSearch,
  fetchUsers,
  setEditingUser,
  handleDeleteUser,
}) {
  const filteredUsers = usersList.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase().trim();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.givenName && u.givenName.toLowerCase().includes(q)) ||
      (u.familyName && u.familyName.toLowerCase().includes(q)) ||
      (u.dob && u.dob.toLowerCase().includes(q)) ||
      (u.passport && u.passport.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
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
        <h2 style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
          Created Accounts ({usersList.length})
        </h2>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            style={{
              width: "200px",
              padding: "6px 12px",
              fontSize: "0.85rem",
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: "6px 14px", fontSize: "0.85rem" }}
            onClick={fetchUsers}>
            🔄 Refresh Users
          </button>
        </div>
      </div>
      <div className="table-container">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Given Name</th>
              <th>Family Name</th>
              <th>Date of Birth</th>
              <th>Email</th>
              <th>Passport</th>
              <th>Role</th>
              <th>Origin</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: "600" }}>{u.username}</td>
                  <td>{u.givenName || "—"}</td>
                  <td>{u.familyName || "—"}</td>
                  <td>{u.dob || "—"}</td>
                  <td>
                    {u.email ? (
                      <a
                        href={`mailto:${u.email}`}
                        style={{
                          color: "var(--primary-color)",
                          textDecoration: "none",
                        }}>
                        {u.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{u.passport || "—"}</td>
                  <td>
                    <span
                      className={`status-badge role-badge-${u.role || "user"}`}>
                      {u.role ? u.role.toUpperCase() : "USER"}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge">
                      {u.origin ? u.origin.toUpperCase() : "AU"}
                    </span>
                  </td>
                  <td
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}>
                    {u.createdAt ? (
                      new Date(u.createdAt).toLocaleDateString()
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                        onClick={() =>
                          setEditingUser({
                            _id: u._id,
                            username: u.username || "",
                            givenName: u.givenName || "",
                            familyName: u.familyName || "",
                            email: u.email || "",
                            passport: u.passport || "",
                            dob: u.dob || "",
                            password: "",
                            role: u.role || "user",
                          })
                        }>
                        Edit
                      </button>
                      {u.role !== "admin" ? (
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                          onClick={() => handleDeleteUser(u._id)}>
                          Delete
                        </button>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-secondary)",
                            alignSelf: "center",
                          }}>
                          Protected
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  style={{ textAlign: "center", padding: "20px" }}>
                  No created accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountsTab({
  accountFormData,
  setAccountFormData,
  isAccountSubmitting,
  handleCreateAccount,
  role,
  usersList,
  fetchUsers,
  userSearch,
  setUserSearch,
  setEditingUser,
  handleDeleteUser,
}) {
  return (
    <>
      <div className="card">
        <h2>Create Account</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Given Name</label>
            <input
              type="text"
              className="form-control"
              value={accountFormData.givenName}
              onChange={(e) =>
                setAccountFormData((prev) => ({
                  ...prev,
                  givenName: e.target.value,
                }))
              }
              placeholder="Enter given name (e.g. John)"
            />
          </div>
          <div className="form-group">
            <label>Family Name</label>
            <input
              type="text"
              className="form-control"
              value={accountFormData.familyName}
              onChange={(e) =>
                setAccountFormData((prev) => ({
                  ...prev,
                  familyName: e.target.value,
                }))
              }
              placeholder="Enter family name (e.g. Smith)"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              className="form-control"
              value={accountFormData.dob || ""}
              onChange={(e) =>
                setAccountFormData((prev) => ({
                  ...prev,
                  dob: e.target.value,
                }))
              }
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              value={accountFormData.email}
              onChange={(e) =>
                setAccountFormData((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="Enter email (e.g. user@example.com)"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Passport Number (Optional)</label>
            <input
              type="text"
              className="form-control"
              value={accountFormData.passport}
              onChange={(e) =>
                setAccountFormData((prev) => ({
                  ...prev,
                  passport: e.target.value,
                }))
              }
              placeholder="Enter passport number"
            />
          </div>
          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              className="form-control"
              value={accountFormData.username}
              onChange={(e) =>
                setAccountFormData((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              placeholder="Enter username"
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              className="form-control"
              value={accountFormData.password}
              onChange={(e) =>
                setAccountFormData((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="Enter password"
              required
            />
          </div>
        </div>
        <div style={{ marginTop: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {role === "admin" && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={isAccountSubmitting}
              onClick={() => handleCreateAccount("employe")}>
              {isAccountSubmitting ? "Creating..." : "Create Employee"}
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={isAccountSubmitting}
            onClick={() => handleCreateAccount("user")}>
            {isAccountSubmitting ? "Creating..." : "Create User"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setAccountFormData({
                username: "",
                password: "",
                email: "",
                givenName: "",
                familyName: "",
                passport: "",
                dob: "",
              })
            }>
            Clear
          </button>
        </div>
      </div>
      <UsersTable
        usersList={usersList}
        userSearch={userSearch}
        setUserSearch={setUserSearch}
        fetchUsers={fetchUsers}
        setEditingUser={setEditingUser}
        handleDeleteUser={handleDeleteUser}
      />
    </>
  );
}

export default AccountsTab;
