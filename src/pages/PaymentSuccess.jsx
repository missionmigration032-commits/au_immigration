import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { verifyPaymentSession } from "../services/stripeService";
import logoHA from "../assets/images/logo-ha.png";
import logoStacked from "../assets/images/logostacked.png";
import "./immiaccount.css";

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get("session_id");
  const paymentId = queryParams.get("payment_id");
  const token = localStorage.getItem("token");

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      if (!sessionId) {
        setError("Missing session_id in redirect URL.");
        setLoading(false);
        return;
      }

      try {
        const result = await verifyPaymentSession(sessionId, token);
        if (isMounted) {
          setPaymentData(result.payment);
          setLoading(false);
        }
      } catch (err) {
        console.error("Verification error:", err);
        if (isMounted) {
          setError(err.message || "Failed to verify Stripe payment session");
          setLoading(false);
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [sessionId, token]);

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("user");
    navigate("/lusc/login");
  };

  const receiptNum =
    paymentData?.referenceNumber ||
    "RC" + Math.floor(100000000 + Math.random() * 900000000);
  const voucherNum =
    paymentData?.stripePaymentIntentId ||
    paymentData?.stripeSessionId ||
    "STRIPE-" + (sessionId ? sessionId.slice(-8) : "APPROVED");
  const amountFormatted = paymentData?.amount
    ? parseFloat(paymentData.amount).toFixed(2)
    : "145.00";
  const currencyFormatted = paymentData?.currency || "AUD";
  const dateFormatted = paymentData?.transactionDate
    ? new Date(paymentData.transactionDate).toLocaleString("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleString("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
      });

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
        {loading ? (
          <div
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "8px",
              textAlign: "center",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "4px solid #e0e0e0",
                borderTopColor: "#0056b3",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px auto",
              }}
            />
            <h2 style={{ color: "#002b49", margin: "0 0 10px 0" }}>
              Verifying Stripe Payment...
            </h2>
            <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>
              Please wait while we confirm your transaction with the Department of Home Affairs.
            </p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: "white",
              padding: "35px",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              borderTop: "4px solid #dc3545",
            }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "bold",
                margin: "0 auto 15px auto",
              }}>
              ✕
            </div>
            <h2 style={{ textAlign: "center", color: "#991b1b", margin: "0 0 10px 0" }}>
              Payment Verification Failed
            </h2>
            <p style={{ textAlign: "center", color: "#666", fontSize: "14px" }}>
              {error}
            </p>
            <div style={{ textAlign: "center", marginTop: "25px" }}>
              <button
                type="button"
                className="immi-btn-classic"
                onClick={() => navigate("/user-portal")}>
                Return to ImmiAccount
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Success Banner */}
            <div
              style={{
                backgroundColor: "white",
                padding: "24px",
                borderRadius: "8px",
                marginBottom: "20px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                borderTop: "4px solid #10b981",
                textAlign: "center",
              }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  backgroundColor: "#ecfdf5",
                  color: "#047857",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  fontWeight: "bold",
                  margin: "0 auto 12px auto",
                }}>
                ✓
              </div>
              <h1
                style={{
                  color: "#002b49",
                  fontSize: "22px",
                  margin: "0 0 8px 0",
                  fontWeight: "600",
                }}>
                Payment Successful &amp; Verified
              </h1>
              <p style={{ color: "#475569", margin: 0, fontSize: "13px" }}>
                Your payment has been securely processed by Stripe and verified by the Australian Department of Home Affairs.
              </p>
            </div>

            {/* Official Receipt Card */}
            <div
              className="immi-receipt-card"
              style={{
                backgroundColor: "white",
                padding: "24px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "2px solid #002b49",
                  paddingBottom: "12px",
                  marginBottom: "16px",
                }}>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "bold",
                    color: "#002b49",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}>
                  Official Payment Receipt &amp; Pre-pay Paper Voucher
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#047857",
                    backgroundColor: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    padding: "4px 10px",
                    borderRadius: "4px",
                  }}>
                  PAID (STRIPE)
                </span>
              </div>

              <table
                className="immi-receipt-table"
                style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#64748b", fontSize: "13px" }}>
                      Receipt / Ref Number:
                    </th>
                    <td style={{ textAlign: "right", padding: "8px 0", fontWeight: "bold", fontSize: "13px" }}>
                      {receiptNum}
                    </td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#64748b", fontSize: "13px" }}>
                      Stripe Session ID:
                    </th>
                    <td style={{ textAlign: "right", padding: "8px 0", fontFamily: "monospace", fontSize: "12px" }}>
                      {sessionId}
                    </td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#64748b", fontSize: "13px" }}>
                      Payer Account:
                    </th>
                    <td style={{ textAlign: "right", padding: "8px 0", fontSize: "13px" }}>
                      {paymentData?.userId?.username || "Authorized Applicant"}
                    </td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#64748b", fontSize: "13px" }}>
                      Payment Method:
                    </th>
                    <td style={{ textAlign: "right", padding: "8px 0", fontSize: "13px" }}>
                      Stripe (Credit / Debit Card)
                    </td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#64748b", fontSize: "13px" }}>
                      Visa Subclass:
                    </th>
                    <td style={{ textAlign: "right", padding: "8px 0", fontSize: "13px" }}>
                      {paymentData?.visaType || paymentData?.visaId?.visaClassSubclass || "Australian Visa"}
                    </td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#64748b", fontSize: "13px" }}>
                      Transaction Date &amp; Time:
                    </th>
                    <td style={{ textAlign: "right", padding: "8px 0", fontSize: "13px" }}>
                      {dateFormatted}
                    </td>
                  </tr>
                  <tr style={{ borderTop: "2px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", padding: "12px 0 6px 0", fontSize: "15px", color: "#002b49" }}>
                      Total Amount Paid:
                    </th>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "12px 0 6px 0",
                        fontWeight: "bold",
                        fontSize: "18px",
                        color: "#047857",
                      }}>
                      ${amountFormatted} {currencyFormatted}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div
                style={{
                  marginTop: "20px",
                  padding: "12px",
                  backgroundColor: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "6px",
                  textAlign: "center",
                  fontSize: "12px",
                  color: "#64748b",
                }}>
                Keep a copy of this pre-payment receipt for your records. Quote Reference{" "}
                <strong>{receiptNum}</strong> if you need to contact the Department of Home Affairs.
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "24px",
                  gap: "12px",
                  flexWrap: "wrap",
                }}>
                <button
                  type="button"
                  className="immi-btn-classic"
                  onClick={handlePrint}
                  style={{
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    padding: "8px 16px",
                    cursor: "pointer",
                  }}>
                  🖨️ Print Receipt
                </button>
                <button
                  type="button"
                  className="immi-btn-classic"
                  onClick={() => navigate("/user-portal")}
                  style={{
                    backgroundColor: "#0056b3",
                    color: "white",
                    padding: "8px 20px",
                    fontWeight: "bold",
                    border: "none",
                    cursor: "pointer",
                  }}>
                  Return to ImmiAccount Portal →
                </button>
              </div>
            </div>
          </div>
        )}
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

export default PaymentSuccess;
