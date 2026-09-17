import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function UserPortal() {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [grantNumber, setGrantNumber] = useState('');
  const [visaData, setVisaData] = useState(null);
  const [error, setError] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/lusc/login');
  };

  const handleSearch = async () => {
    try {
      setError('');
      setVisaData(null);
      
      const response = await fetch(`${API_URL}/api/visas/grant/${grantNumber}?origin=au`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVisaData(data);
      } else if (response.status === 401) {
        handleLogout();
      } else {
        const err = await response.json();
        setError(err.message || 'Visa not found');
      }
    } catch (error) {
      setError('An error occurred while searching');
    }
  };

  if (role !== 'user') {
    return <div>Access Denied. You are not a standard user.</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>User Portal</h1>
      <button onClick={handleLogout} style={{ marginBottom: '2rem' }}>Logout</button>

      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
        <h2>Search Visa</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label>Visa Grant Number: </label>
          <input 
            value={grantNumber} 
            onChange={e => setGrantNumber(e.target.value)} 
            placeholder="Enter grant number..."
          />
          <button onClick={handleSearch} style={{ marginLeft: '1rem' }}>Search</button>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      {visaData && (
        <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
          <h2>Visa Details</h2>
          <table style={{ width: '100%', textAlign: 'left' }}>
            <tbody>
              {Object.entries(visaData).map(([key, value]) => {
                if (key === '_id' || key === 'userId' || key === 'createdAt' || key === 'updatedAt' || key === '__v') return null;
                return (
                  <tr key={key}>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{key}</th>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserPortal;
