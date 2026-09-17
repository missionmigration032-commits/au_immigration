import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './immiaccount.css';
import logoHA from '../assets/images/logo-ha.png';

function ImmiAccountLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user.role === 'user') {
          alert('Access denied: Standard users cannot log into this portal.');
          return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);
        alert('Login successful!');
        navigate('/dashboard');
      } else {
        const errorData = await response.json();
        alert(`Login failed: ${errorData.message}`);
      }
    } catch (error) {
      alert('Login error');
      console.error(error);
    }
  };

  return (
    <div className="immi-application">
      <header className="immi-header">
        <div className="immi-header-left">
          <img src={logoHA} alt="Australian Government Department of Home Affairs" />
        </div>
        <div className="immi-header-right">
          <h1>ImmiAccount</h1>
        </div>
      </header>

      <div className="immi-main">
        <div className="immi-page-title">
          <h2>Login</h2>
        </div>

        <div className="immi-content-container">
          <div className="immi-info-box">
            <div className="immi-info-header">
              <i className="fa fa-info-circle"></i> Information
            </div>
            <div className="immi-info-body">
              <h3>Temporary travel restrictions for Iranian Visitor visa holders</h3>
              <p>For more information see <a href="#">Temporary travel restrictions for Visitor visa holders with Iranian passports</a>.</p>
            </div>
          </div>

          <div className="immi-section">
            <h3>Login to ImmiAccount</h3>
            <p className="immi-mandatory-text">Fields marked <span className="req">*</span> must be completed.</p>
            
            <div className="immi-form">
              <div className="immi-form-row">
                <div className="immi-label-col">
                  <label>Username <span className="req">*</span></label>
                </div>
                <div className="immi-input-col">
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                  <i className="fa fa-question-circle help-icon"></i>
                </div>
              </div>
              <div className="immi-form-row">
                <div className="immi-label-col">
                  <label>Password <span className="req">*</span></label>
                </div>
                <div className="immi-input-col">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <i className="fa fa-question-circle help-icon"></i>
                </div>
              </div>
            </div>

            <div className="immi-actions-bar">
              <button className="immi-btn-cancel">Cancel</button>
              <button className="immi-btn-submit" onClick={handleLogin}>Login</button>
            </div>

            <div className="immi-forgot-links">
              <p>I have forgotten my ImmiAccount <a href="#">username</a> or <a href="#">password</a></p>
              <p>I no longer have access to my <a href="#">multi-factor authentication app</a></p>
            </div>
          </div>

          <div className="immi-divider"></div>

          <div className="immi-section">
            <h3>Create an ImmiAccount</h3>
            <p>Create an ImmiAccount to access the Department of Home Affairs's online services.</p>
            <div className="immi-create-btn-wrapper">
              <button className="immi-btn-cancel">Create ImmiAccount</button>
              <i className="fa fa-question-circle help-icon"></i>
            </div>
          </div>
        </div>
      </div>

      <footer className="immi-footer">
        <ul className="immi-footer-links">
          <li><a href="#">Accessibility</a></li>
          <li><a href="#">Copyright &amp; Disclaimer</a></li>
          <li><a href="#">Online Security</a></li>
          <li><a href="#">Privacy</a></li>
        </ul>
      </footer>
    </div>
  );
}

export default ImmiAccountLogin;
