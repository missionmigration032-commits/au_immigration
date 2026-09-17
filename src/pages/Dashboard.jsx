import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const initialVisaData = {
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
  nationality: '',
  documentName: '',
  document: ''
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
  const [documentKey, setDocumentKey] = useState(Date.now());

  const [usersList, setUsersList] = useState([]);
  const [visasList, setVisasList] = useState([]);
  
  const fetchVisas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/visas?origin=au`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.visas) setVisasList(data.visas);
      }
    } catch (error) {
      console.error('Failed to fetch visas:', error);
    }
  };

  useEffect(() => {
    if (role === 'admin' || role === 'employe') {
      // Fetch users
      fetch(`${API_URL}/api/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(async res => {
        if (res.status === 401) {
          handleLogout();
          return null;
        }
        return res.json();
      })
      .then(data => {
        if(data && Array.isArray(data)) setUsersList(data);
      })
      .catch(err => console.error(err));

      // Fetch visas
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
      const endpoint = type === 'employe' ? '/api/auth/employe' : '/api/auth/user';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        alert(`${type} created successfully!`);
        setUsername('');
        setPassword('');
        // Refresh users list
        fetch(`${API_URL}/api/auth/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { if(data && Array.isArray(data)) setUsersList(data); });
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

  const handleVisaChange = (e) => {
    if (e.target.type === 'file') {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setVisaData(prev => ({ ...prev, [e.target.name]: reader.result }));
        };
        reader.readAsDataURL(file);
      } else {
        setVisaData(prev => ({ ...prev, [e.target.name]: '' }));
      }
    } else {
      setVisaData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };

  const handleCreateVisa = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...visaData, origin: 'au' };
      if (!payload.userId) {
        delete payload.userId; // Let it be null
      }
      const response = await fetch(`${API_URL}/api/visas`, {
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
          <h1>Welcome, {role}</h1>
        </div>

        {activeTab === 'accounts' && (
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
        )}

        {activeTab === 'visas' && (
          <>
            <div className="card">
              <h2>Create New Visa</h2>
              <form onSubmit={handleCreateVisa}>
                <div className="form-row">
                  {Object.keys(visaData).map(key => (
                    <div className="form-group" key={key}>
                      <label>{key === 'trn' ? 'Transaction Reference Number (TRN)' : key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                      {key === 'document' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            key={documentKey}
                            type="file"
                            className="form-control"
                            name={key}
                            onChange={handleVisaChange}
                          />
                          {visaData.document && (
                            <button 
                              type="button" 
                              className="btn btn-danger" 
                              onClick={() => {
                                setVisaData({ ...visaData, document: '' });
                                setDocumentKey(Date.now());
                              }}
                              style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      ) : (
                        <input
                          type={key.toLowerCase().includes('date') || key === 'mustNotArriveAfter' ? 'date' : 'text'}
                          className="form-control"
                          name={key}
                          value={visaData[key]}
                          onChange={handleVisaChange}
                          placeholder={`Enter ${key}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary">Create Visa</button>
                </div>
              </form>
            </div>

            <div className="card">
              <h2>Visa List</h2>
              <div className="table-container">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Given Names</th>
                      <th>Family Name</th>
                      <th>Grant Number</th>
                      <th>Passport</th>
                      <th>Status</th>
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
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                          No visas found for this origin.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
