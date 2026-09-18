import React, { useState } from "react";
import { HelpCircle, Calendar, Home, ChevronLeft, ChevronRight, X } from "lucide-react";
import html2pdf from "html2pdf.js";
import "./vevo.css";
import "./ess.css";
import visaPdf from "../assets/visa.pdf";
import logoHa from "../assets/images/logostacked.png";

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo, Democratic Republic of the",
  "Congo, Republic of the",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "East Timor",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Korea, North",
  "Korea, South",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

function VevoFirstParty() {
  const [visaData, setVisaData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form state
  const [documentType, setDocumentType] = useState("");
  const [referenceType, setReferenceType] = useState("");
  const [dob, setDob] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [country, setCountry] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Add state for date suggestions
  const [dobSuggestions, setDobSuggestions] = useState([]);
  const [showDobSuggestions, setShowDobSuggestions] = useState(false);
  
  // Custom calendar state
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const generateCalendarGrid = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const startDayOffset = firstDay === 0 ? 6 : firstDay - 1; 
    
    const grid = [];
    let dayCounter = 1;
    let nextMonthCounter = 1;
    
    for (let row = 0; row < 6; row++) {
      const rowDays = [];
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < startDayOffset) {
          rowDays.push({ day: daysInPrevMonth - startDayOffset + col + 1, type: 'prev', m: month - 1, y: year });
        } else if (dayCounter <= daysInMonth) {
          rowDays.push({ day: dayCounter, type: 'current', m: month, y: year });
          dayCounter++;
        } else {
          rowDays.push({ day: nextMonthCounter, type: 'next', m: month + 1, y: year });
          nextMonthCounter++;
        }
      }
      grid.push(rowDays);
    }
    return grid;
  };

  const handleCalendarSelect = (cell) => {
    let y = cell.y;
    let m = cell.m;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    
    const dateStr = `${String(cell.day).padStart(2, '0')} ${MONTHS[m]} ${y}`;
    setDob(dateStr);
    setShowCalendarPopup(false);
  };

  const changeMonth = (offset) => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + offset, 1));
  };

  const handleDobChange = (e) => {
    const val = e.target.value;
    setDob(val);
    
    if (!val) {
      setDobSuggestions([]);
      setShowDobSuggestions(false);
      return;
    }

    const clean = val.replace(/\D/g, '');
    let sugs = [];
    
    if (clean.length === 4) {
      const d1 = parseInt(clean.substring(0, 1));
      const m1 = parseInt(clean.substring(1, 2));
      const y1 = parseInt(clean.substring(2, 4));
      
      if (d1 > 0 && d1 <= 9 && m1 > 0 && m1 <= 12) {
        sugs.push(`0${d1} ${MONTHS[m1-1]} 19${y1}`);
        if (d1 !== m1 && m1 <= 9) {
          sugs.push(`0${m1} ${MONTHS[d1-1]} 19${y1}`);
        }
      }
      sugs.push(val);
      sugs.push(`${clean.substring(0,2)} 19${clean.substring(2,4)}`);
    } else if (clean.length === 6) {
      const d = parseInt(clean.substring(0, 2));
      const m = parseInt(clean.substring(2, 4));
      const y = parseInt(clean.substring(4, 6));
      if (d > 0 && d <= 31 && m > 0 && m <= 12) {
        const year = y > 30 ? `19${y}` : `20${y}`;
        sugs.push(`${d.toString().padStart(2, '0')} ${MONTHS[m-1]} ${year}`);
      }
    } else if (clean.length === 8) {
      const d = parseInt(clean.substring(0, 2));
      const m = parseInt(clean.substring(2, 4));
      const y = parseInt(clean.substring(4, 8));
      if (d > 0 && d <= 31 && m > 0 && m <= 12) {
        sugs.push(`${d.toString().padStart(2, '0')} ${MONTHS[m-1]} ${y}`);
      }
    }

    // fallback
    if (sugs.length === 0) {
      sugs.push(val);
    }
    
    setDobSuggestions([...new Set(sugs)]);
    setShowDobSuggestions(true);
  };

  const selectDobSuggestion = (sug) => {
    setDob(sug);
    setShowDobSuggestions(false);
  };

  const API_URL = import.meta.env.VITE_API_URL;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    if (typeof dateString === "string") {
      const trimmed = dateString.trim().toLowerCase();
      if (
        trimmed === "" ||
        trimmed === "null" ||
        trimmed === "undefined" ||
        trimmed === "invalid date"
      ) {
        return "";
      }
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return dateString;
    }
  };

  const hasValue = (val) => {
    if (val === null || val === undefined) return false;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (
        trimmed === "" ||
        trimmed.toLowerCase() === "null" ||
        trimmed.toLowerCase() === "undefined" ||
        trimmed.toLowerCase() === "invalid date"
      ) {
        return false;
      }
    }
    return true;
  };

  const getDisplayFields = () => {
    if (!visaData) return [];

    const standardFields = [
      { label: "Family name", value: visaData.familyName ?? visaData.FamilyName ?? visaData.surname },
      { label: "Given name(s)", value: visaData.givenNames ?? visaData.givenName ?? visaData.GivenNames ?? visaData.firstName },
      { label: "Date of birth", value: formatDate(visaData.dateOfBirth ?? visaData.dob ?? visaData.DateOfBirth) },
      { label: "Document number", value: visaData.documentNumber ?? visaData.passportNumber ?? visaData.DocumentNumber },
      { label: "Nationality", value: visaData.nationality ?? visaData.country },
      { label: "Visa class / subclass", value: visaData.visaClassSubclass ?? visaData.visaClass ?? visaData.subclass },
      { label: "Visa applicant", value: visaData.visaApplicant ?? visaData.applicantType },
      { label: "Visa grant date", value: formatDate(visaData.visaGrantDate ?? visaData.grantDate) },
      { label: "Visa expiry date", value: formatDate(visaData.visaExpiryDate ?? visaData.expiryDate) },
      { label: "Visa status", value: visaData.visaStatus ?? visaData.status },
      { label: "Visa grant number", value: visaData.visaGrantNumber ?? visaData.grantNumber ?? visaData.VisaGrantNumber },
      { label: "Transaction reference number (TRN)", value: visaData.trn ?? visaData.TRN },
      { label: "Entries allowed", value: visaData.entriesAllowed },
      { label: "Must not arrive after", value: formatDate(visaData.mustNotArriveAfter) },
      { label: "Enter before date", value: formatDate(visaData.enterBeforeDate) },
      { label: "Period of stay", value: visaData.periodOfStay ?? visaData.stayPeriod },
      { label: "Visa type", value: visaData.visaType },
    ];

    const handledKeys = new Set([
      "_id",
      "userId",
      "createdAt",
      "updatedAt",
      "__v",
      "document",
      "documents",
      "origin",
      "familyName",
      "FamilyName",
      "surname",
      "givenNames",
      "givenName",
      "GivenNames",
      "firstName",
      "dateOfBirth",
      "dob",
      "DateOfBirth",
      "documentNumber",
      "passportNumber",
      "DocumentNumber",
      "nationality",
      "country",
      "visaClassSubclass",
      "visaClass",
      "subclass",
      "visaApplicant",
      "applicantType",
      "visaGrantDate",
      "grantDate",
      "visaExpiryDate",
      "expiryDate",
      "visaStatus",
      "status",
      "visaGrantNumber",
      "grantNumber",
      "VisaGrantNumber",
      "trn",
      "TRN",
      "entriesAllowed",
      "mustNotArriveAfter",
      "enterBeforeDate",
      "periodOfStay",
      "stayPeriod",
      "visaType",
      "searchType",
      "referenceNumber",
    ]);

    const filteredStandard = standardFields.filter((item) => hasValue(item.value));

    const extraFields = Object.entries(visaData)
      .filter(
        ([key, val]) =>
          !handledKeys.has(key) &&
          typeof val !== "object" &&
          typeof val !== "function" &&
          hasValue(val)
      )
      .map(([key, val]) => ({
        label: key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase()),
        value: String(val),
      }));

    return [...filteredStandard, ...extraFields];
  };

  const handleViewPdf = async () => {
    if (visaData && visaData.document) {
      let doc = visaData.document;
      
      // If document is an array, take the first element
      if (Array.isArray(doc) && doc.length > 0) {
        doc = doc[0];
      }
      
      // If document is an object, try to extract the URL or base64 data
      if (doc && typeof doc === "object") {
        doc = doc.url || doc.data || doc.base64 || doc.file || "";
      }

      if (typeof doc === "string" && doc) {
        if (doc.startsWith("data:")) {
          try {
            const byteString = atob(doc.split(',')[1]);
            const mimeString = doc.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, "_blank");
          } catch (e) {
            console.error("Failed to parse base64 document", e);
            window.open(doc, "_blank");
          }
        } else {
          // Remote HTTP/HTTPS URL
          window.open(doc, "_blank");
        }
        return;
      }
    }
    
    // Fallback to local static pdf
    window.open(visaPdf, "_blank");
  };

  const parseDateParts = (input) => {
    if (!input) return null;
    const str = String(input).trim();
    if (!str) return null;

    // 1. ISO or YYYY-MM-DD / YYYY/MM/DD
    const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (ymdMatch) {
      return {
        year: parseInt(ymdMatch[1], 10),
        month: parseInt(ymdMatch[2], 10),
        day: parseInt(ymdMatch[3], 10),
      };
    }

    const monthMap = {
      jan: 1, january: 1,
      feb: 2, february: 2,
      mar: 3, march: 3,
      apr: 4, april: 4,
      may: 5,
      jun: 6, june: 6,
      jul: 7, july: 7,
      aug: 8, august: 8,
      sep: 9, sept: 9, september: 9,
      oct: 10, october: 10,
      nov: 11, november: 11,
      dec: 12, december: 12,
    };

    // 2. "DD Month YYYY" or "DD-Month-YYYY" (e.g. 15 May 1990, 01 Jan 2000)
    const dmyAlphaMatch = str.match(/^(\d{1,2})[\s\-/,]+([a-zA-Z]+)[\s\-/,]+(\d{4})/);
    if (dmyAlphaMatch) {
      const d = parseInt(dmyAlphaMatch[1], 10);
      const m = monthMap[dmyAlphaMatch[2].toLowerCase()];
      const y = parseInt(dmyAlphaMatch[3], 10);
      if (m) {
        return { year: y, month: m, day: d };
      }
    }

    // 3. "Month DD YYYY" or "Month DD, YYYY" (e.g. May 15, 1990)
    const mdyAlphaMatch = str.match(/^([a-zA-Z]+)[\s\-/,]+(\d{1,2})[\s\-/,]+(\d{4})/);
    if (mdyAlphaMatch) {
      const m = monthMap[mdyAlphaMatch[1].toLowerCase()];
      const d = parseInt(mdyAlphaMatch[2], 10);
      const y = parseInt(mdyAlphaMatch[3], 10);
      if (m) {
        return { year: y, month: m, day: d };
      }
    }

    // 4. "DD/MM/YYYY" or "DD-MM-YYYY" or "DD.MM.YYYY" or "DD MM YYYY"
    const dmyNumMatch = str.match(/^(\d{1,2})[\s\-/. ]+(\d{1,2})[\s\-/. ]+(\d{4})$/);
    if (dmyNumMatch) {
      const d = parseInt(dmyNumMatch[1], 10);
      const m = parseInt(dmyNumMatch[2], 10);
      const y = parseInt(dmyNumMatch[3], 10);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return { year: y, month: m, day: d };
      }
    }

    // 5. Raw 8 digits "DDMMYYYY"
    const raw8Match = str.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (raw8Match) {
      const d = parseInt(raw8Match[1], 10);
      const m = parseInt(raw8Match[2], 10);
      const y = parseInt(raw8Match[3], 10);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return { year: y, month: m, day: d };
      }
    }

    // 6. Fallback: native Date parse
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      if (str.includes("T") || str.endsWith("Z")) {
        return {
          year: parsed.getUTCFullYear(),
          month: parsed.getUTCMonth() + 1,
          day: parsed.getUTCDate(),
        };
      }
      return {
        year: parsed.getFullYear(),
        month: parsed.getMonth() + 1,
        day: parsed.getDate(),
      };
    }

    return null;
  };

  const areDatesEqual = (d1, d2) => {
    if (!d1 || !d2) return false;
    const p1 = parseDateParts(d1);
    const p2 = parseDateParts(d2);
    if (!p1 || !p2) {
      return String(d1).trim().toLowerCase() === String(d2).trim().toLowerCase();
    }
    return p1.year === p2.year && p1.month === p2.month && p1.day === p2.day;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !documentType ||
      !referenceType ||
      !dob ||
      !documentNumber ||
      !country ||
      !termsAccepted
    ) {
      setError("Please fill out all required fields.");
      return;
    }

    try {
      setError("");
      setVisaData(null);
      setLoading(true);

      const response = await fetch(`${API_URL}/api/visas/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchType: referenceType,
          referenceNumber: documentNumber,
          origin: "au",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const backendDob = data.dateOfBirth || data.dob || data.DateOfBirth;

        if (!backendDob || !areDatesEqual(dob, backendDob)) {
          setVisaData(null);
          setError("Date of birth does not match our records.");
        } else {
          setVisaData(data);
          setError("");
        }
      } else {
        const err = await response.json();
        setError(err.message || "Visa not found");
      }
    } catch (err) {
      setError("An error occurred while searching");
    } finally {
      setLoading(false);
    }
  };

  // Form row styles
  const rowStyle = {
    display: "flex",
    marginBottom: "8px",
    alignItems: "center",
  };
  const labelStyle = { width: "220px", fontSize: "13px", color: "#000" };
  const inputContainerStyle = {
    display: "flex",
    alignItems: "center",
    flex: 1,
  };
  const requiredAsterisk = (
    <span style={{ color: "#d00", marginRight: "6px", fontSize: "16px" }}>
      *
    </span>
  );
  const inputStyle = {
    padding: "4px",
    border: "1px solid #999",
    fontSize: "13px",
    width: "300px",
  };
  const iconStyle = { marginLeft: "6px", color: "#012543" };

  return (
    <div
      style={{
        backgroundColor: "#c5cbd4",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          backgroundColor: "#012543",
          color: "#fff",
          padding: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #ccc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Logo */}
          <img
            src={logoHa}
            alt="Australian Government Department of Home Affairs"
            style={{ height: "60px" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            <Home size={14} style={{ marginRight: "4px", color: "#fff" }} />
            <a href="#" style={{ color: "#fff", textDecoration: "none" }}>
              Help [on]
            </a>
          </div>
          <h1
            style={{
              margin: "30px 0 0 0",
              fontSize: "26px",
              fontWeight: "normal",
              color: "#fff",
            }}
          >
            VEVO for Visa Holders
          </h1>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div style={{ padding: "10px" }}>
        {/* ENQUIRY PANEL */}
        {!visaData && (
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #999",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                backgroundColor: "#012543",
                color: "#fff",
                padding: "6px 10px",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Visa holder enquiry
            </div>

            <div style={{ padding: "15px" }}>
              <p style={{ margin: "0 0 5px 0", fontSize: "13px" }}>
                Please complete the following details to view your visa
                entitlements.
              </p>
              <p style={{ margin: "0 0 20px 0", fontSize: "13px" }}>
                Fields marked <span style={{ color: "#d00" }}>*</span> must be
                completed.
              </p>

              {error && (
                <div
                  style={{
                    color: "#d00",
                    fontWeight: "bold",
                    marginBottom: "15px",
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Document Type (Always visible) */}
                <div style={rowStyle}>
                  <div style={labelStyle}>Document type</div>
                  <div style={inputContainerStyle}>
                    {requiredAsterisk}
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Please choose a document type</option>
                      <option value="DFTTA">DFTTA</option>
                      <option value="ImmiCard">ImmiCard</option>
                      <option value="Passport">Passport</option>
                      <option value="PLO56 (M56)">PLO56 (M56)</option>
                      <option value="Titre de Voyage">Titre de Voyage</option>
                    </select>
                    <HelpCircle size={14} style={iconStyle} />
                  </div>
                </div>

                {/* Conditional Fields based on Document Type selection */}
                {documentType && (
                  <>
                    <div style={rowStyle}>
                      <div style={labelStyle}>Reference type</div>
                      <div style={inputContainerStyle}>
                        {requiredAsterisk}
                        <select
                          value={referenceType}
                          onChange={(e) => setReferenceType(e.target.value)}
                          style={inputStyle}
                        >
                          <option value="">
                            Please choose a reference type
                          </option>
                          <option value="trn">
                            Transaction Reference Number (TRN)
                          </option>
                          <option value="visaGrantNumber">
                            Visa Grant Number
                          </option>
                          <option value="passport">Passport Number</option>
                        </select>
                      </div>
                    </div>

                    <div style={rowStyle}>
                      <div style={labelStyle}>Date of birth</div>
                      <div style={inputContainerStyle}>
                        {requiredAsterisk}
                        <div style={{ position: 'relative', display: "flex", alignItems: "center", width: "300px" }}>
                          <input
                            type="text"
                            value={dob}
                            onChange={handleDobChange}
                            onFocus={() => { if(dobSuggestions.length > 0) setShowDobSuggestions(true); }}
                            onBlur={() => setTimeout(() => setShowDobSuggestions(false), 200)}
                            style={{ ...inputStyle, width: "100%" }}
                          />
                          {showDobSuggestions && dobSuggestions.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              backgroundColor: '#fff',
                              border: '1px solid #ccc',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              zIndex: 10
                            }}>
                              {dobSuggestions.map((sug, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => selectDobSuggestion(sug)}
                                  style={{
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    color: '#000'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6f7ff'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                                >
                                  {sug}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ position: 'relative' }}>
                          <div 
                            onClick={() => setShowCalendarPopup(!showCalendarPopup)} 
                            style={{ border: '1px solid #999', backgroundColor: '#f5f5f5', padding: '3px', marginLeft: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <Calendar size={16} color="#012543" />
                          </div>
                          
                          {showCalendarPopup && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: '#fff', border: '1px solid #999', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', width: '300px', zIndex: 100 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px', backgroundColor: '#f2f2f2', borderBottom: '1px solid #ccc' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <select 
                                    value={calendarDate.getMonth()} 
                                    onChange={e => setCalendarDate(new Date(calendarDate.getFullYear(), parseInt(e.target.value), 1))}
                                    style={{ padding: '2px', border: '1px solid #999', borderRadius: '3px' }}
                                  >
                                    {FULL_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                  </select>
                                  <input 
                                    type="text" 
                                    value={calendarDate.getFullYear()} 
                                    onChange={e => {
                                      const y = parseInt(e.target.value);
                                      if(!isNaN(y)) setCalendarDate(new Date(y, calendarDate.getMonth(), 1));
                                    }}
                                    style={{ width: '50px', padding: '2px', border: '1px solid #999', borderRadius: '3px' }}
                                  />
                                </div>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  <button type="button" onClick={() => changeMonth(-1)} style={{ padding: '2px', backgroundColor: '#fff', border: '1px solid #999', cursor: 'pointer' }}><ChevronLeft size={14} /></button>
                                  <button type="button" onClick={() => setCalendarDate(new Date())} style={{ padding: '2px', backgroundColor: '#fff', border: '1px solid #999', cursor: 'pointer' }}><Calendar size={14} /></button>
                                  <button type="button" onClick={() => changeMonth(1)} style={{ padding: '2px', backgroundColor: '#fff', border: '1px solid #999', cursor: 'pointer' }}><ChevronRight size={14} /></button>
                                  <button type="button" onClick={() => setShowCalendarPopup(false)} style={{ padding: '2px', backgroundColor: '#fff', border: '1px solid #999', cursor: 'pointer' }}><X size={14} /></button>
                                </div>
                              </div>
                              <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                  <tr>
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                      <th key={i} style={{ padding: '4px', fontWeight: 'bold', borderBottom: '1px dotted #000' }}>{d}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {generateCalendarGrid().map((row, i) => (
                                    <tr key={i}>
                                      {row.map((cell, j) => (
                                        <td 
                                          key={j} 
                                          onClick={() => handleCalendarSelect(cell)}
                                          style={{ 
                                            padding: '4px', 
                                            cursor: 'pointer',
                                            color: cell.type === 'current' ? '#000' : '#4986e7',
                                            border: cell.day === new Date().getDate() && cell.type === 'current' && calendarDate.getMonth() === new Date().getMonth() && calendarDate.getFullYear() === new Date().getFullYear() ? '1px solid #d00' : '1px solid transparent'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6f7ff'}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                          {cell.day}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                        <HelpCircle size={14} style={iconStyle} />
                      </div>
                    </div>

                    <div style={rowStyle}>
                      <div style={labelStyle}>Document number</div>
                      <div style={inputContainerStyle}>
                        {requiredAsterisk}
                        <input
                          type="text"
                          value={documentNumber}
                          onChange={(e) => setDocumentNumber(e.target.value)}
                          style={inputStyle}
                        />
                        <HelpCircle size={14} style={iconStyle} />
                      </div>
                    </div>

                    <div style={rowStyle}>
                      <div style={labelStyle}>Country of document</div>
                      <div style={inputContainerStyle}>
                        {requiredAsterisk}
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          style={inputStyle}
                        >
                          <option value="">Country</option>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <HelpCircle size={14} style={iconStyle} />
                      </div>
                    </div>

                    <div style={{ ...rowStyle, marginTop: "20px" }}>
                      <div style={labelStyle}></div>
                      <div
                        style={{
                          ...inputContainerStyle,
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        <a
                          href="#"
                          style={{
                            fontSize: "13px",
                            color: "#012543",
                            textDecoration: "underline",
                            marginBottom: "5px",
                          }}
                        >
                          View Terms and Conditions
                        </a>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            style={{ marginRight: "5px" }}
                          />
                          {requiredAsterisk}
                          <span style={{ fontSize: "13px" }}>
                            I have read and agree to the terms and conditions
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Form Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    border: "1px solid #bebfc7",
                    backgroundColor: "#f2f2f2",
                    marginTop: "20px",
                    padding: "0.5rm",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentType("");
                      setReferenceType("");
                      setDob("");
                      setDocumentNumber("");
                      setCountry("");
                      setTermsAccepted(false);
                      setError("");
                    }}
                    style={{
                      padding: "3px 15px",
                      backgroundColor: "#eee",
                      border: "1px solid #999",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: "3px 15px",
                      backgroundColor: "#eee",
                      border: "1px solid #999",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: "13px",
                    }}
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RESULTS PANEL */}
        {visaData && (
          <div
            id="visa-details-pdf-content"
            style={{
              backgroundColor: "#fff",
              border: "1px solid #999",
              maxWidth: "1000px",
              margin: "0 auto",
            }}
          >
            <div style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #ccc",
                  paddingBottom: "10px",
                  marginBottom: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setVisaData(null)}
                  style={{
                    padding: "4px 10px",
                    backgroundColor: "#f5f5f5",
                    border: "1px solid #999",
                    cursor: "pointer",
                  }}
                >
                  New enquiry
                </button>
                <div>
                  <button
                    type="button"
                    onClick={handleViewPdf}
                    style={{
                      padding: "4px 10px",
                      backgroundColor: "#e2e2e2",
                      border: "1px solid #999",
                      cursor: "pointer",
                    }}
                  >
                    View as PDF
                  </button>
                </div>
              </div>

              <table
                style={{
                  width: "100%",
                  textAlign: "left",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ width: "30%", padding: "8px 10px" }}>
                      Current date and time
                    </td>
                    <td style={{ width: "70%", padding: "8px 10px" }}>
                      {new Date().toLocaleString("en-AU", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        timeZoneName: "short",
                        timeZone: "Australia/Sydney",
                      })}{" "}
                      Canberra, Australia
                    </td>
                  </tr>
                  {getDisplayFields().map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: "8px 10px" }}>{item.label}</td>
                      <td style={{ padding: "8px 10px" }}>{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ margin: "0 10px", padding: "15px" }}>
        <div style={{ fontSize: "12px" }}>
          <a href="#" style={{ color: "#012543", textDecoration: "underline" }}>
            Accessibility
          </a>{" "}
          |{" "}
          <a href="#" style={{ color: "#012543", textDecoration: "underline" }}>
            Online Security
          </a>{" "}
          |{" "}
          <a href="#" style={{ color: "#012543", textDecoration: "underline" }}>
            Privacy
          </a>{" "}
          |{" "}
          <a href="#" style={{ color: "#012543", textDecoration: "underline" }}>
            Copyright &amp; Disclaimer
          </a>{" "}
          |{" "}
          <a href="#" style={{ color: "#012543", textDecoration: "underline" }}>
            Change Password
          </a>
        </div>
      </footer>
    </div>
  );
}

export default VevoFirstParty;
