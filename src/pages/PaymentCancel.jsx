import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logoHA from "../assets/images/logo-ha.png";
import logoStacked from "../assets/images/logostacked.png";
import "./immiaccount.css";

function PaymentCancel() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const paymentId = queryParams.get("payment_id");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("user");
    navigate("/lusc/login");
  };

  return (
    <div className="immi-application" style={{ minHeight: "100vh", backgroundColor: "#b5bcc4", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="immi-header">
        <div className="immi-header-left">
          <img
            src={logoStacked}
            alt="Australian Government Department of Home Affairs"
            className="immi-header-logo-stacked"
          />
        </div>
        <div className="immi-header-right">
          <div className="immi-header-user-row">
            <span className="immi-header-username">
              {(localStorage.getItem("username") || "Kunal").toUpperCase()}
            </span>
            <button
              type="button"
              className="immi-header-link"
              onClick={() => navigate("/user-portal")}>
              Manage Account
            </button>
          </div>
          <h1>Online Payments</h1>
        </div>
      </header>

      {/* Main Content (Full Width) */}
      <main style={{ width: "100%", padding: "14px 24px 14px 24px", boxSizing: "border-box" }}>
        <div
          style={{
            backgroundColor: "white",
            padding: "36px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            borderTop: "4px solid #f59e0b",
            textAlign: "center",
            width: "100%",
            boxSizing: "border-box",
          }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              backgroundColor: "#fef3c7",
              color: "#b45309",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: "bold",
              margin: "0 auto 16px auto",
            }}>
            !
          </div>

          <h1
            style={{
              color: "#002b49",
              fontSize: "20px",
              margin: "0 0 10px 0",
              fontWeight: "600",
            }}>
            Payment Cancelled
          </h1>

          <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px 0" }}>
            Your Razorpay transaction was cancelled or timed out. No funds were debited from your card or account.
          </p>

          <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 25px 0" }}>
            You can try making your payment again at any time through the ImmiAccount Make Payments service.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="immi-btn-classic"
              onClick={() => navigate("/user-portal/payment")}
              style={{
                backgroundColor: "#0056b3",
                color: "white",
                padding: "8px 20px",
                fontWeight: "bold",
                border: "none",
                cursor: "pointer",
              }}>
              Try Payment Again
            </button>
            <button
              type="button"
              className="immi-btn-classic"
              onClick={() => navigate("/user-portal")}
              style={{
                backgroundColor: "#f1f5f9",
                border: "1px solid #cbd5e1",
                padding: "8px 16px",
                cursor: "pointer",
              }}>
              Return to User Portal
            </button>
          </div>
        </div>
      </main>

      <footer className="immi-dashboard-footer">
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

export default PaymentCancel;
