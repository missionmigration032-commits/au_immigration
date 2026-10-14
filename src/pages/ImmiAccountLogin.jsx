import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./immiaccount.css";
import logoHA from "../assets/images/logo-ha.png";

function ImmiAccountLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }
    setIsLoggingIn(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.user.givenName || data.user.givenNames) {
          const g = data.user.givenName || data.user.givenNames;
          localStorage.setItem("givenNames", g);
          localStorage.setItem("givenName", g);
        }
        if (data.user.familyName) {
          localStorage.setItem("familyName", data.user.familyName);
        }

        if (data.user.role === "user") {
          navigate("/user-portal");
        } else {
          navigate("/dashboard");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Login failed: ${errorData.message || "Invalid credentials"}`);
      }
    } catch (error) {
      alert("Login error. Please verify backend server is running.");
      console.error(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCancel = () => {
    if (username || password) {
      setUsername("");
      setPassword("");
    } else {
      navigate("/");
    }
  };

  const handleHelp = (topic) => {
    alert(`Help: ${topic}`);
  };

  return (
    <div className="immi-application immi-login-application">
      {/* ImmiAccount Top Header */}
      <header className="immi-header immi-login-header">
        <div className="immi-login-header-left">
          <img
            src={logoHA}
            alt="Australian Government Department of Home Affairs"
          />
        </div>
        <div className="immi-login-header-right">
          <h1>ImmiAccount</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="immi-login-content-wrapper">
        {/* Dark Navy "Login" Bar */}
        <div className="immi-login-title-bar">Login</div>
        {isLoggingIn && <div className="immi-login-bar-progress" />}

        {/* Login to ImmiAccount Section */}
        <div className="immi-login-form-section">
          <h3 className="immi-section-heading">Login to ImmiAccount</h3>
          <p className="immi-mandatory-hint">
            Fields marked <span className="immi-star">*</span> must be
            completed.
          </p>

          <form onSubmit={handleLogin}>
            <div className="immi-field-row">
              <label className="immi-field-label" htmlFor="immi-username">
                Username <span className="immi-star">*</span>
              </label>
              <div className="immi-field-control">
                <input
                  id="immi-username"
                  type="text"
                  className="immi-text-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={isLoggingIn}
                />
                <button
                  type="button"
                  className="immi-qmark-btn"
                  title="Help on Username"
                  disabled={isLoggingIn}
                  onClick={() =>
                    handleHelp(
                      "Please enter your registered ImmiAccount username.",
                    )
                  }>
                  ?
                </button>
              </div>
            </div>

            <div className="immi-field-row">
              <label className="immi-field-label" htmlFor="immi-password">
                Password <span className="immi-star">*</span>
              </label>
              <div className="immi-field-control">
                <input
                  id="immi-password"
                  type="password"
                  className="immi-text-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isLoggingIn}
                />
                <button
                  type="button"
                  className="immi-qmark-btn"
                  title="Help on Password"
                  disabled={isLoggingIn}
                  onClick={() =>
                    handleHelp("Please enter your ImmiAccount password.")
                  }>
                  ?
                </button>
              </div>
            </div>

            {/* Authenticating Loading Banner Effect */}
            {isLoggingIn && (
              <div className="immi-login-authenticating-banner">
                <span className="immi-spinner-gov-sm" />
                <div className="immi-login-authenticating-text">
                  <strong>Verifying credentials with ImmiAccount...</strong>
                  <span>Please wait while your details are authenticated.</span>
                </div>
              </div>
            )}

            {/* Gray Action Bar */}
            <div className="immi-button-bar">
              <button
                type="button"
                className="immi-gov-action-btn"
                onClick={handleCancel}
                disabled={isLoggingIn}>
                Cancel
              </button>
              <button
                type="submit"
                className={`immi-gov-action-btn ${isLoggingIn ? "immi-btn-loading" : ""}`}
                disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <span className="immi-btn-spinner" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>

          {/* Right-aligned Forgot / Recovery Links */}
          <div className="immi-help-links-group">
            <p>
              I have forgotten my ImmiAccount{" "}
              <a
                href="#"
                className="immi-ref-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Recover username service");
                }}>
                username
              </a>{" "}
              or{" "}
              <a
                href="#"
                className="immi-ref-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Reset password service");
                }}>
                password
              </a>
            </p>
            <p>
              I no longer have access to my{" "}
              <a
                href="#"
                className="immi-ref-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Multi-factor authentication reset service");
                }}>
                multi-factor authentication app
              </a>
            </p>
          </div>
        </div>

        {/* Create an ImmiAccount Section */}
        <div className="immi-create-section">
          <h3 className="immi-section-heading">Create an ImmiAccount</h3>
          <p className="immi-create-desc">
            Create an ImmiAccount to access the Department of Home Affairs's
            online services.
          </p>
          <div className="immi-create-controls">
            <button
              type="button"
              className="immi-gov-action-btn"
              onClick={() =>
                alert("Redirecting to ImmiAccount registration...")
              }>
              Create ImmiAccount
            </button>
            <button
              type="button"
              className="immi-qmark-btn"
              title="Help on Create ImmiAccount"
              onClick={() =>
                handleHelp(
                  "An ImmiAccount allows you to lodge online visa applications and access Home Affairs services.",
                )
              }>
              ?
            </button>
          </div>
        </div>
      </div>

      {/* Full-width Government Footer */}
      <footer className="immi-dashboard-footer" style={{ marginTop: "30px" }}>
        <div className="immi-footer-inner">
          <a href="#accessibility" onClick={(e) => e.preventDefault()}>
            Accessibility
          </a>
          <span className="immi-footer-sep">|</span>
          <a href="#security" onClick={(e) => e.preventDefault()}>
            Online Security
          </a>
          <span className="immi-footer-sep">|</span>
          <a href="#privacy" onClick={(e) => e.preventDefault()}>
            Privacy
          </a>
          <span className="immi-footer-sep">|</span>
          <a href="#copyright" onClick={(e) => e.preventDefault()}>
            Copyright &amp; Disclaimer
          </a>
        </div>
      </footer>
    </div>
  );
}

export default ImmiAccountLogin;
