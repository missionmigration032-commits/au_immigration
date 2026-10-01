import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import footerLogo from "../assets/images/footer-logo-white.svg";

function CalculatePayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const token = localStorage.getItem("token");

  const searchParams = new URLSearchParams(location.search);
  const paymentId = searchParams.get("paymentId") || "";
  const paramSubclass = searchParams.get("subclass") || "600 Visitor/Tourist outside Australia";

  // Today's date formatted as DD/MM/YYYY
  const getTodayFormatted = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const [selectedSubclass, setSelectedSubclass] = useState(() => {
    if (paramSubclass.includes("600") || paramSubclass.toLowerCase().includes("visitor")) {
      return "600 Visitor/Tourist outside Australia";
    }
    if (paramSubclass.includes("500") || paramSubclass.toLowerCase().includes("student")) {
      return "500 Student Visa";
    }
    if (paramSubclass.includes("482")) {
      return "482 Temporary Skill Shortage";
    }
    if (paramSubclass.includes("189")) {
      return "189 Skilled Independent";
    }
    if (paramSubclass.includes("190")) {
      return "190 Skilled Nominated";
    }
    if (paramSubclass.includes("820") || paramSubclass.toLowerCase().includes("partner")) {
      return "820 Partner (Temporary)";
    }
    if (paramSubclass.includes("417")) {
      return "417 Working Holiday";
    }
    if (paramSubclass.includes("485")) {
      return "485 Temporary Graduate";
    }
    return paramSubclass || "600 Visitor/Tourist outside Australia";
  });

  const [lodgementDate, setLodgementDate] = useState(getTodayFormatted());
  const [isCalculated, setIsCalculated] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState("145.00");
  const [showHowCalculated, setShowHowCalculated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const datePickerRef = useRef(null);

  // Convert DD/MM/YYYY to YYYY-MM-DD for native input
  const getIsoDate = (dStr) => {
    if (!dStr) return "";
    const parts = dStr.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    return "";
  };

  const handleDateChangeFromPicker = (e) => {
    const isoVal = e.target.value; // YYYY-MM-DD
    if (isoVal) {
      const [yyyy, mm, dd] = isoVal.split("-");
      setLodgementDate(`${dd}/${mm}/${yyyy}`);
    }
  };

  const openCalendar = () => {
    if (datePickerRef.current) {
      if (typeof datePickerRef.current.showPicker === "function") {
        datePickerRef.current.showPicker();
      } else {
        datePickerRef.current.focus();
      }
    }
  };

  // Pricing calculator matching Home Affairs reference
  const getSubclassFee = (sub) => {
    const text = (sub || "").toLowerCase();
    if (text.includes("600") || text.includes("visitor")) return "145.00";
    if (text.includes("500") || text.includes("student")) return "710.00";
    if (text.includes("482") || text.includes("skill shortage")) return "1455.00";
    if (text.includes("189") || text.includes("190")) return "4640.00";
    if (text.includes("820") || text.includes("309") || text.includes("partner")) return "8850.00";
    if (text.includes("417") || text.includes("working holiday")) return "635.00";
    if (text.includes("485") || text.includes("graduate")) return "1895.00";
    return "145.00";
  };

  const getSubclassCodeLabel = (sub) => {
    const text = (sub || "").toLowerCase();
    if (text.includes("600") || text.includes("visitor")) return "FA600 Visitor/Tourist outside Australia";
    if (text.includes("500") || text.includes("student")) return "FA500 Student Visa";
    if (text.includes("482") || text.includes("skill shortage")) return "FA482 Temporary Skill Shortage";
    if (text.includes("189")) return "FA189 Skilled Independent";
    if (text.includes("190")) return "FA190 Skilled Nominated";
    if (text.includes("820") || text.includes("partner")) return "FA820 Partner (Temporary)";
    if (text.includes("417")) return "FA417 Working Holiday";
    if (text.includes("485")) return "FA485 Temporary Graduate";
    return `FA ${sub}`;
  };

  const handleCalculate = async (e) => {
    if (e) e.preventDefault();
    setIsCalculating(true);
    try {
      let finalFee = getSubclassFee(selectedSubclass);

      // Fetch payment amount from server if paymentId and token are available
      if (paymentId && token) {
        try {
          const res = await fetch(`${API_URL}/api/payments/${paymentId}?origin=au`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            const pay = data.payment || data.data || data;
            if (pay && pay.amount !== undefined && pay.amount !== null && Number(pay.amount) > 0) {
              finalFee = parseFloat(pay.amount).toFixed(2);
            }
          }
        } catch (err) {
          console.error("Error fetching payment amount from server:", err);
        }
      }

      setCalculatedAmount(finalFee);
      setIsCalculated(true);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClose = () => {
    navigate(`/user-portal/payment?paymentId=${paymentId}`);
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      const finalAmt = calculatedAmount || "145.00";

      // Save in localStorage for UserPortal to retrieve
      if (paymentId) {
        localStorage.setItem(`calc_amount_${paymentId}`, finalAmt);
      }
      localStorage.setItem("last_calculated_amount", finalAmt);
      localStorage.setItem("last_calculated_subclass", selectedSubclass);

      // Update payments in au_payments localStorage if exists
      try {
        const saved = localStorage.getItem("au_payments");
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            const updated = list.map((p) => {
              if (String(p.id || p._id) === String(paymentId)) {
                return { ...p, amount: parseFloat(finalAmt) };
              }
              return p;
            });
            localStorage.setItem("au_payments", JSON.stringify(updated));
          }
        }
      } catch (e) {}

      // Update backend if possible
      if (paymentId && token) {
        try {
          await fetch(`${API_URL}/api/payments/${paymentId}?origin=au`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              amount: finalAmt,
              visaType: selectedSubclass,
            }),
          });
        } catch (err) {
          console.error("Error updating payment with calculated amount:", err);
        }
      }

      // Redirect back to /user-portal/payment?paymentId=...&calculatedAmount=...
      navigate(`/user-portal/payment?paymentId=${paymentId}&calculatedAmount=${finalAmt}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      {/* Top Header matching reference screenshot */}
      <header style={{ backgroundColor: "#002b49", color: "#ffffff", display: "flex", alignItems: "stretch", justifyContent: "space-between", minHeight: "68px", borderBottom: "4px solid #0072ce", boxSizing: "border-box" }}>
        {/* Left: Coat of Arms + X Close */}
        <div style={{ display: "flex", alignItems: "center", padding: "8px 24px", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={footerLogo} alt="Australian Government" style={{ height: "42px", objectFit: "contain" }} />
            <div style={{ display: "flex", flexDirection: "column", fontSize: "11px", lineHeight: "1.25", color: "#ffffff" }}>
              <span style={{ fontWeight: "600", letterSpacing: "0.5px" }}>Australian Government</span>
              <span style={{ opacity: 0.9 }}>Department of Home Affairs</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              backgroundColor: "#ffffff",
              color: "#0056b3",
              border: "1px solid #7f9db9",
              padding: "4px 14px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              borderRadius: "1px",
              marginLeft: "10px",
              boxShadow: "inset 0 1px 0 #fff",
            }}
            title="Close and return to payment"
          >
            ✕ Close
          </button>
        </div>

        {/* Right: Department External Links Bar */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 24px", fontSize: "11px", color: "#e2e8f0", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/user-portal")}>ImmiAccount</span>
          <span style={{ opacity: 0.6 }}>|</span>
          <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/evo/firstParty")}>Visa Entitlement Verification Online (VEVO)</span>
          <span style={{ opacity: 0.6 }}>|</span>
          <span style={{ cursor: "pointer", textDecoration: "underline" }}>My Tourist Refund Scheme (TRS)</span>
        </div>
      </header>

      {/* Main Layout: Left Sidebar + Right Form */}
      <div style={{ display: "flex", flex: 1, minHeight: "calc(100vh - 72px)" }}>
        {/* Left Sidebar matching reference screenshot */}
        <aside style={{ width: "200px", minWidth: "200px", backgroundColor: "#eef2f5", borderRight: "1px solid #ced4da", boxSizing: "border-box" }}>
          <div
            style={{
              padding: "16px 14px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#004b87",
              borderLeft: "4px solid #004b87",
              backgroundColor: "#e2e8f0",
              cursor: "default",
            }}
          >
            Pre-pay Paper Service
          </div>
        </aside>

        {/* Main Panel matching reference screenshot */}
        <main style={{ flex: 1, padding: "36px 48px", boxSizing: "border-box", position: "relative" }}>
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "400", color: "#111827", margin: "0 0 32px 0", textAlign: "center" }}>
              Online Prepayment Portal
            </h1>

            <form onSubmit={handleCalculate} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              {/* Visa Subclass */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
                  Visa subclass <span style={{ color: "#d9381e" }}>*</span>
                </label>
                <select
                  value={selectedSubclass}
                  onChange={(e) => {
                    setSelectedSubclass(e.target.value);
                    if (isCalculated) {
                      const newFee = getSubclassFee(e.target.value);
                      setCalculatedAmount(newFee);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    fontSize: "13px",
                    border: "1px solid #7f9db9",
                    borderRadius: "1px",
                    backgroundColor: "#ffffff",
                    color: "#333",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="600 Visitor/Tourist outside Australia">600 Visitor/Tourist outside Australia</option>
                  <option value="500 Student Visa">500 Student Visa</option>
                  <option value="482 Temporary Skill Shortage">482 Temporary Skill Shortage</option>
                  <option value="189 Skilled Independent">189 Skilled Independent</option>
                  <option value="190 Skilled Nominated">190 Skilled Nominated</option>
                  <option value="820 Partner (Temporary)">820 Partner (Temporary)</option>
                  <option value="417 Working Holiday">417 Working Holiday</option>
                  <option value="485 Temporary Graduate">485 Temporary Graduate</option>
                </select>
              </div>

              {/* Lodgement Date */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
                  What date will you be lodging your application?
                </label>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    width: "220px",
                    border: "1px solid #7f9db9",
                    borderRadius: "1px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <input
                    type="text"
                    value={lodgementDate}
                    onChange={(e) => setLodgementDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    onClick={openCalendar}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      padding: "6px 10px",
                      fontSize: "13px",
                      color: "#333",
                      backgroundColor: "transparent",
                    }}
                  />
                  <input
                    type="date"
                    ref={datePickerRef}
                    value={getIsoDate(lodgementDate)}
                    onChange={handleDateChangeFromPicker}
                    style={{
                      position: "absolute",
                      right: "0",
                      top: "0",
                      width: "36px",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      zIndex: 2,
                    }}
                  />
                  <div
                    onClick={openCalendar}
                    style={{
                      padding: "6px 8px",
                      borderLeft: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                      cursor: "pointer",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      userSelect: "none",
                      position: "relative",
                      zIndex: 1,
                    }}
                    title="Choose Date"
                  >
                    📅
                  </div>
                </div>
              </div>

              {/* Price Note */}
              <div style={{ fontSize: "12px", color: "#666", marginTop: "-6px" }}>
                * Price will be displayed in Australian dollars
              </div>

              {/* Calculate Button matching Image 2 */}
              <div>
                <button
                  type="submit"
                  disabled={isCalculating}
                  style={{
                    backgroundColor: "#004b87",
                    color: "#ffffff",
                    border: "1px solid #003366",
                    padding: "7px 24px",
                    fontSize: "13px",
                    fontWeight: "600",
                    borderRadius: "2px",
                    cursor: isCalculating ? "not-allowed" : "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {isCalculating && (
                    <span
                      style={{
                        display: "inline-block",
                        width: "12px",
                        height: "12px",
                        border: "2px solid rgba(255, 255, 255, 0.35)",
                        borderTopColor: "#ffffff",
                        borderRadius: "50%",
                        animation: "spin 0.75s linear infinite",
                      }}
                    />
                  )}
                  {isCalculating ? "Calculating..." : "Calculate"}
                </button>
              </div>
            </form>

            {/* Price Breakdown Section matching Image 1 */}
            {isCalculated && (
              <div style={{ marginTop: "28px", animation: "fadeIn 0.3s ease" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#222", marginBottom: "4px" }}>
                  Price starts from AUD {calculatedAmount}
                </div>

                <div
                  style={{ fontSize: "12px", color: "#004b87", cursor: "pointer", textDecoration: "underline", marginBottom: "16px" }}
                  onClick={() => setShowHowCalculated(!showHowCalculated)}
                >
                  How this price is calculated
                </div>

                {showHowCalculated && (
                  <div style={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", padding: "10px 14px", borderRadius: "3px", fontSize: "12px", color: "#475569", marginBottom: "14px", lineHeight: "1.4" }}>
                    The price is determined based on the visa subclass application base charge set by the Department of Home Affairs under the Migration Regulations 1994. No GST is payable on visa application charges.
                  </div>
                )}

                {/* Calculation Table matching Image 1 */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px", fontSize: "13px", color: "#333" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #222" }}>
                      <th style={{ textAlign: "left", padding: "8px 0", fontWeight: "600", width: "65%" }}>Product</th>
                      <th style={{ textAlign: "center", padding: "8px 0", fontWeight: "600", width: "15%" }}>Quantity</th>
                      <th style={{ textAlign: "right", padding: "8px 0", fontWeight: "600", width: "20%" }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "14px 0 10px 0", color: "#475569" }}>
                        {getSubclassCodeLabel(selectedSubclass)}
                      </td>
                      <td style={{ textAlign: "center", padding: "14px 0 10px 0", color: "#475569" }}>1</td>
                      <td style={{ textAlign: "right", padding: "14px 0 10px 0", color: "#475569" }}>{calculatedAmount}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 0", color: "#475569" }}>GST</td>
                      <td style={{ textAlign: "center", padding: "10px 0" }}></td>
                      <td style={{ textAlign: "right", padding: "10px 0", color: "#475569" }}>0.00</td>
                    </tr>
                    <tr style={{ borderTop: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "14px 0", fontWeight: "bold", color: "#111827" }}>Total</td>
                      <td style={{ textAlign: "center", padding: "14px 0" }}></td>
                      <td style={{ textAlign: "right", padding: "14px 0", fontWeight: "bold", color: "#111827" }}>
                        AUD {calculatedAmount}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Continue Button at Bottom Right matching Image 1 */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#222",
                      border: "1px solid #7f9db9",
                      padding: "5px 22px",
                      fontSize: "13px",
                      fontWeight: "normal",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      boxShadow: "inset 0 1px 0 #fff, 0 1px 2px rgba(0,0,0,0.1)",
                      borderRadius: "1px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {isSubmitting ? "Updating..." : "Continue"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* HA Watermark on Bottom Right matching reference screenshot */}
          <div
            style={{
              position: "fixed",
              bottom: "16px",
              right: "24px",
              fontSize: "26px",
              fontStyle: "italic",
              fontWeight: "bold",
              color: "#333",
              opacity: 0.8,
              userSelect: "none",
              pointerEvents: "none",
              fontFamily: "Georgia, serif",
            }}
          >
            HA
          </div>
        </main>
      </div>
    </div>
  );
}

export default CalculatePayment;
