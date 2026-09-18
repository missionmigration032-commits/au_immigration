import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const initialVisaData = {
  userId: '',
  familyName: '',
  givenNames: '',
  documentNumber: '',
  visaClassSubclass: '',
  visaApplicant: 'Primary',
  visaGrantDate: '',
  visaExpiryDate: '',
  visaStatus: 'In Effect',
  visaGrantNumber: '',
  trn: '',
  entriesAllowed: 'Multiple',
  mustNotArriveAfter: '',
  enterBeforeDate: '',
  periodOfStay: 'Indefinite',
  visaType: 'Temporary',
  dateOfBirth: '',
  nationality: ''
};

function Dashboard() {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [activeTab, setActiveTab] = useState('visas'); // 'visas' or 'accounts'

  // Account creation state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Visa creation state
  const [visaData, setVisaData] = useState(initialVisaData);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [currentDocName, setCurrentDocName] = useState('');
  const [currentDocBase64, setCurrentDocBase64] = useState('');
  const [currentDocFileName, setCurrentDocFileName] = useState('');
  const [documentKey, setDocumentKey] = useState(Date.now());

  const [usersList, setUsersList] = useState([]);
  const [visasList, setVisasList] = useState([]);
  
  const fetchVisas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/visas?origin=au`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (data.visas) setVisasList(data.visas);
      }
    } catch (error) {
      console.error('Failed to fetch visas:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/users?origin=au`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) setUsersList(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    if (role === 'admin' || role === 'employe') {
      fetchUsers();
      fetchVisas();
    }
  }, [role, token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/lusc/login');
  };

  const handleCreateAccount = async (type) => {
    try {
      const endpoint = type === 'employe' ? '/api/auth/employe?origin=au' : '/api/auth/user?origin=au';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, password, origin: 'au' })
      });
      if (response.ok) {
        alert(`${type} created successfully!`);
        setUsername('');
        setPassword('');
        fetchUsers();
      } else if (response.status === 401) {
        handleLogout();
      } else {
        const error = await response.json();
        alert(`Failed to create ${type}: ${error.message}`);
      }
    } catch (error) {
      alert('Error creating account');
      console.error(error);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`${API_URL}/api/auth/users/${id}?origin=au`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('User deleted successfully!');
        fetchUsers();
      } else {
        const error = await response.json();
        alert(`Failed to delete user: ${error.message}`);
      }
    } catch (error) {
      alert('Error deleting user');
      console.error(error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentDocFileName(file.name);
      if (!currentDocName.trim()) {
        const defaultName = file.name.replace(/\.[^/.]+$/, '');
        setCurrentDocName(defaultName);
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentDocBase64(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setCurrentDocBase64('');
      setCurrentDocFileName('');
    }
  };

  const addDocumentToList = () => {
    if (!currentDocBase64) {
      alert('Please select a file first');
      return;
    }
    const docName = currentDocName.trim() || currentDocFileName || 'Document';
    setUploadedDocs(prev => [
      ...prev,
      {
        document: currentDocBase64,
        documentName: docName,
        name: docName,
        fileName: currentDocFileName
      }
    ]);
    setCurrentDocBase64('');
    setCurrentDocName('');
    setCurrentDocFileName('');
    setDocumentKey(Date.now());
  };

  const removeDocumentFromList = (index) => {
    setUploadedDocs(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleVisaChange = (e) => {
    setVisaData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateVisa = async (e) => {
    e.preventDefault();
    try {
      let finalDocs = [...uploadedDocs];
      const isAlreadyInList = uploadedDocs.some(d => d.document === currentDocBase64 || (currentDocFileName && d.fileName === currentDocFileName));
      if (currentDocBase64 && !isAlreadyInList) {
        if (!currentDocName.trim()) {
          alert('Document name is required for all uploaded files');
          return;
        }
        finalDocs.push({
          document: currentDocBase64,
          documentName: currentDocName.trim(),
          name: currentDocName.trim(),
          fileName: currentDocFileName
        });
      }

      // Verify document name is present for all documents
      for (const doc of finalDocs) {
        if (!doc.documentName || !doc.documentName.trim()) {
          alert('Document name is required for all uploaded files');
          return;
        }
      }

      // Format document array specifically as expected by createVisa in backend:
      // each item has `document` (base64 data URI) and `documentName` (string)
      const docsArray = finalDocs.map(doc => ({
        document: doc.document,
        documentName: doc.documentName.trim(),
        name: doc.documentName.trim()
      }));

      const payload = {
        ...visaData,
        origin: 'au',
        document: docsArray
      };

      if (!payload.userId) {
        delete payload.userId; // Let it be null
      }
      delete payload.documentName;

      const response = await fetch(`${API_URL}/api/visas?origin=au`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert('Visa created successfully!');
        setVisaData(initialVisaData);
        setUploadedDocs([]);
        setCurrentDocBase64('');
        setCurrentDocName('');
        setCurrentDocFileName('');
        setDocumentKey(Date.now());
        fetchVisas(); // Refresh visa list
      } else if (response.status === 401) {
        handleLogout();
      } else {
        const error = await response.json();
        alert(`Failed to create visa: ${error.message}`);
      }
    } catch (error) {
      alert('Error creating visa');
      console.error(error);
    }
  };

  const handleDeleteVisa = async (id) => {
    if (!window.confirm('Are you sure you want to delete this visa?')) return;
    try {
      const response = await fetch(`${API_URL}/api/visas/${id}?origin=au`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('Visa deleted successfully!');
        fetchVisas();
      } else {
        const error = await response.json();
        alert(`Failed to delete visa: ${error.message}`);
      }
    } catch (error) {
      alert('Error deleting visa');
      console.error(error);
    }
  };

  const renderUsersTable = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>
          Created Accounts ({usersList.length})
        </h2>
        <button 
          type="button"
          className="btn btn-primary" 
          style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          onClick={fetchUsers}
        >
          🔄 Refresh Users
        </button>
      </div>
      <div className="table-container">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Origin</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersList.length > 0 ? (
              usersList.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: '600' }}>{u.username}</td>
                  <td>
                    <span className={`status-badge role-badge-${u.role || 'user'}`}>
                      {u.role ? u.role.toUpperCase() : 'USER'}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge">
                      {u.origin ? u.origin.toUpperCase() : 'AU'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    {u.role !== 'admin' ? (
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleDeleteUser(u._id)}
                      >
                        Delete
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Protected</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  No created accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderVisasTable = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>
          Visa List ({visasList.length})
        </h2>
        <button 
          type="button"
          className="btn btn-primary" 
          style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          onClick={fetchVisas}
        >
          🔄 Refresh Visas
        </button>
      </div>
      <div className="table-container">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Given Names</th>
              <th>Family Name</th>
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
              visasList.map(visa => (
                <tr key={visa._id}>
                  <td>{visa.givenNames || '-'}</td>
                  <td>{visa.familyName || '-'}</td>
                  <td>{visa.visaGrantNumber || '-'}</td>
                  <td>{visa.documentNumber || '-'}</td>
                  <td>
                    <span className={`status-badge ${visa.visaStatus === 'In Effect' ? 'active' : ''}`}>
                      {visa.visaStatus || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    {visa.userId ? (
                      <span className="status-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                        👤 {typeof visa.userId === 'object' ? visa.userId.username : visa.userId}
                      </span>
                    ) : (
                      <span style={{ color: '#999', fontSize: '0.8rem' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    {visa.document && Array.isArray(visa.document) && visa.document.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {visa.document.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.8rem', color: 'var(--primary-color)', textDecoration: 'none' }}
                          >
                            📄 {doc.name || `Document ${idx + 1}`}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#999', fontSize: '0.8rem' }}>None</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => handleDeleteVisa(visa._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                  No visas found for this origin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (role !== 'admin' && role !== 'employe') {
    return <div style={{ padding: '2rem' }}>Access Denied. Only Admin and Employee roles can access this dashboard.</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Admin Portal</h2>
        </div>
        <div className="sidebar-menu">
          {role === 'admin' && (
            <div 
              className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span>📊</span> Overview
            </div>
          )}
          <div 
            className={`menu-item ${activeTab === 'visas' ? 'active' : ''}`}
            onClick={() => setActiveTab('visas')}
          >
            <span>📄</span> Visa Management
          </div>
          <div 
            className={`menu-item ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            <span>👥</span> Account Management
          </div>
        </div>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h1>Welcome, {role.toUpperCase()}</h1>
              <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                ImmiAccount Administration Portal (Origin: AU)
              </p>
            </div>
            {role === 'admin' && (
              <div style={{ display: 'flex', gap: '15px' }}>
                <div 
                  onClick={() => setActiveTab('visas')}
                  style={{ 
                    cursor: 'pointer',
                    background: 'white', 
                    padding: '10px 18px', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                    borderLeft: '4px solid var(--primary-color)',
                    minWidth: '110px'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Visas</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-color)' }}>{visasList.length}</div>
                </div>
                <div 
                  onClick={() => setActiveTab('accounts')}
                  style={{ 
                    cursor: 'pointer',
                    background: 'white', 
                    padding: '10px 18px', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                    borderLeft: '4px solid #10b981',
                    minWidth: '110px'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Accounts</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{usersList.length}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {activeTab === 'overview' && role === 'admin' && (
          <>
            {renderVisasTable()}
            {renderUsersTable()}
          </>
        )}

        {activeTab === 'accounts' && (
          <>
            <div className="card">
              <h2>Create Account</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Enter username"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                {role === 'admin' && (
                  <button className="btn btn-primary" onClick={() => handleCreateAccount('employe')} style={{ marginRight: '10px' }}>
                    Create Employee
                  </button>
                )}
                <button className="btn btn-primary" onClick={() => handleCreateAccount('user')}>
                  Create User
                </button>
              </div>
            </div>
            {renderUsersTable()}
          </>
        )}

        {activeTab === 'visas' && (
          <>
            <div className="card">
              <h2>Create New Visa</h2>
              <form onSubmit={handleCreateVisa}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: '1 1 100%' }}>
                    <label style={{ fontWeight: '600', color: 'var(--secondary-color)' }}>
                      Assign to User Account (User ID)
                    </label>
                    <select
                      className="form-control"
                      name="userId"
                      value={visaData.userId || ''}
                      onChange={handleVisaChange}
                    >
                      <option value="">-- Select User Account (Optional / Unassigned) --</option>
                      {usersList.map(u => (
                        <option key={u._id} value={u._id}>
                          {u.username} ({u.role ? u.role.toUpperCase() : 'USER'}) — ID: {u._id}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                      Link this visa to an existing user account fetched from the API.
                    </small>
                  </div>

                  {Object.keys(visaData).filter(key => key !== 'userId').map(key => (
                    <div className="form-group" key={key}>
                      <label>{key === 'trn' ? 'Transaction Reference Number (TRN)' : key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                      <input
                        type={key.toLowerCase().includes('date') || key === 'mustNotArriveAfter' ? 'date' : 'text'}
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
                <div style={{ marginTop: '20px', padding: '16px', border: '1px dashed var(--border-color)', borderRadius: '6px', backgroundColor: '#fafbfc' }}>
                  <label style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--secondary-color)', display: 'block', marginBottom: '8px' }}>
                    Attach Documents (Sent to backend in array)
                  </label>
                  
                  {uploadedDocs.length > 0 ? (
                    <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                      {uploadedDocs.map((doc, idx) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>
                          <strong>{doc.documentName || doc.name}</strong> 
                          <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '6px' }}>({doc.fileName || 'file'})</span>
                          <button 
                            type="button" 
                            onClick={() => removeDocumentFromList(idx)} 
                            style={{ marginLeft: '10px', color: '#d9534f', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: '#777', marginBottom: '12px' }}>No documents attached yet.</p>
                  )}

                  <div className="form-row" style={{ alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                      <label>Document Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Passport Copy" 
                        value={currentDocName}
                        onChange={e => setCurrentDocName(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                      <label>Select File</label>
                      <input 
                        key={documentKey}
                        type="file" 
                        className="form-control" 
                        onChange={handleFileChange}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 0, minWidth: '120px' }}>
                      <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={addDocumentToList}
                        style={{ width: '100%', marginBottom: '0' }}
                      >
                        Add to List
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary">Create Visa</button>
                </div>
              </form>
            </div>
            {renderVisasTable()}
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
