import React from "react";

export const getFormattedTodayDate = () => {
  const options = { day: "2-digit", month: "long", year: "numeric" };
  return new Date().toLocaleDateString("en-GB", options);
};

export const getFormattedExpiryDate = (months = 6) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  const options = { day: "2-digit", month: "long", year: "numeric" };
  return d.toLocaleDateString("en-GB", options);
};

export const generateNumericString = (length) => {
  let res = "";
  for (let i = 0; i < length; i++) {
    res += Math.floor(Math.random() * 10).toString();
  }
  return res;
};

export const generate8CharRef = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const getInitialOfferLetterFormData = () => ({
  companyId: "",
  userId: "",
  refrenceNumber: `OL-AU-${generate8CharRef()}`,
  sponsorName: "",
  sponsorAddress: "54B Tidal Road, Sydney NSW 2000, Australia",
  clientId: generateNumericString(11),
  sponsorshipApprovalId: generateNumericString(10),
  fileNumber: `ABD2026/${generateNumericString(6)}`,
  sponsorshipFeeReceiptNumber: generateNumericString(12),
  dateOfApproval: getFormattedTodayDate(),
  applicantName: "",
  nationality: "Bangladeshi",
  status: "Issued",
  passportNumber: `A${generateNumericString(8)}`,
  sponsorshipNumber: `W${generateNumericString(7)}`,
  issueDate: getFormattedTodayDate(),
  validTill: getFormattedExpiryDate(6),
});

export const initialVisaData = {
  userId: "",
  familyName: "",
  givenNames: "",
  documentNumber: "",
  visaClassSubclass: "",
  visaApplicant: "Primary",
  visaGrantDate: "",
  visaExpiryDate: "",
  visaStatus: "In Effect",
  visaGrantNumber: "",
  trn: "",
  entriesAllowed: "Multiple",
  mustNotArriveAfter: "",
  enterBeforeDate: "",
  periodOfStay: "Indefinite",
  visaType: "Temporary",
  dateOfBirth: "",
  nationality: "",
  employer: "",
};

export const getInitialVisaFormData = () => ({ ...initialVisaData });

export const getInitialVisaGrantFormData = () => ({
  id: `VG-${Date.now()}`,
  refrenceNumber: `VG-AU-${generate8CharRef()}`,
  applicantName: "PATEL Chintankumar Ranchhodbhai",
  dateOfBirth: "25 September 1999",
  passportNumber: `U${generateNumericString(7)}IND`,
  passportCountry: "INDIA",

  visaName: "Transit (subclass 771)",
  applicationStatus: "Granted",
  visaGrantNumber: `1139500${generateNumericString(6)}`,
  applicationId: generateNumericString(9),
  trn: `EGP${generate8CharRef().slice(0, 7)}`,

  grantDate: getFormattedTodayDate(),
  mustNotArriveAfter: getFormattedExpiryDate(12),
  lengthOfStay: "3 day(s) from the date of each arrival",
  travel: "Multiple entries",

  conditions: "8101 - No work\n8201 - Maximum three months study",
  whyKeepNotice:
    "Airlines might ask for details in this notice so they can carry out checks to allow you to board the plane.",
  createdAt: new Date().toISOString(),
});

export const getInitialPaymentData = () => ({
  selectedVisaId: "",
  visaType: "",
  name: "",
  referenceNumber: generate8CharRef(),
  transactionDate: new Date().toISOString().split("T")[0],
  issuingOffice: "New Delhi",
  internalRef: "",
  currency: "AUD",
  amount: "",
  status: "paid",
});

// Format full name as given name + family name (e.g. "Ankit Kumar")
export const formatApplicantFullName = (given, family) => {
  const parts = [given, family].map((s) => (s || "").trim()).filter(Boolean);
  if (parts.length === 0) return "";
  const fullName = parts.join(" ");
  if (fullName === fullName.toLowerCase()) {
    return fullName.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return fullName;
};

// Helper to format payment applicant name as: given name + family name
export const getPaymentApplicantDisplayName = (
  payment,
  visasList = [],
  usersList = []
) => {
  if (!payment) return "—";

  // 1. Direct givenNames / familyName
  if (payment.givenNames || payment.familyName) {
    const fn = formatApplicantFullName(
      payment.givenNames,
      payment.familyName,
    );
    if (fn) return fn;
  }

  // 2. Populated visaId object (from Mongoose .populate('visaId'))
  if (payment.visaId && typeof payment.visaId === "object") {
    if (payment.visaId.givenNames || payment.visaId.familyName) {
      const fn = formatApplicantFullName(
        payment.visaId.givenNames,
        payment.visaId.familyName,
      );
      if (fn) return fn;
    }
  }

  // 3. Populated visa object
  if (payment.visa && typeof payment.visa === "object") {
    if (payment.visa.givenNames || payment.visa.familyName) {
      const fn = formatApplicantFullName(
        payment.visa.givenNames,
        payment.visa.familyName,
      );
      if (fn) return fn;
    }
  }

  // 4. Linked visa in visasList by visaId
  const vId =
    payment.visaId ?
      typeof payment.visaId === "object" ?
        payment.visaId._id
      : payment.visaId
    : payment.visa && typeof payment.visa === "object" ? payment.visa._id
    : payment.visa;

  if (vId && Array.isArray(visasList) && visasList.length > 0) {
    const linked = visasList.find((v) => String(v._id) === String(vId));
    if (linked && (linked.givenNames || linked.familyName)) {
      const fn = formatApplicantFullName(
        linked.givenNames,
        linked.familyName,
      );
      if (fn) return fn;
    }
  }

  // 5. Check populated userId object
  if (payment.userId && typeof payment.userId === "object") {
    if (payment.userId.givenNames || payment.userId.familyName) {
      const fn = formatApplicantFullName(
        payment.userId.givenNames,
        payment.userId.familyName,
      );
      if (fn) return fn;
    }
    if (payment.userId.name || payment.userId.fullName) {
      return payment.userId.name || payment.userId.fullName;
    }
  }

  // 6. Match userId with visasList (find visa belonging to this user)
  const uId =
    payment.userId ?
      typeof payment.userId === "object" ?
        payment.userId._id
      : payment.userId
    : null;

  if (uId && Array.isArray(visasList) && visasList.length > 0) {
    const userVisa = visasList.find(
      (v) =>
        String(v.userId) === String(uId) && (v.givenNames || v.familyName),
    );
    if (userVisa) {
      const fn = formatApplicantFullName(
        userVisa.givenNames,
        userVisa.familyName,
      );
      if (fn) return fn;
    }
  }

  // 7. Match userId with usersList
  if (uId && Array.isArray(usersList) && usersList.length > 0) {
    const linkedUser = usersList.find((u) => String(u._id) === String(uId));
    if (linkedUser) {
      if (linkedUser.name || linkedUser.fullName)
        return linkedUser.name || linkedUser.fullName;
      if (linkedUser.username) return linkedUser.username;
    }
  }

  // 8. Raw name string
  const raw = payment.name || payment.applicantName || "";
  if (raw) {
    if (raw.includes(",")) {
      const [last, ...firstParts] = raw.split(",");
      const first = firstParts.join(" ").trim();
      const fn = formatApplicantFullName(first, last.trim());
      if (fn) return fn;
    }
    if (raw === raw.toLowerCase()) {
      return raw.replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return raw;
  }

  // 9. Populated userId username
  if (
    payment.userId &&
    typeof payment.userId === "object" &&
    payment.userId.username
  ) {
    return payment.userId.username;
  }

  return "—";
};

// Helper origin badge
export const renderOriginBadge = (origin) => {
  const code = (origin || "").toLowerCase();
  const label = origin ? origin.toUpperCase() : "AU";
  let flag = "🇦🇺";
  if (code === "nz") flag = "🇳🇿";
  if (code === "ca") flag = "🇨🇦";
  return (
    <span className={`origin-badge origin-badge-${code || "au"}`}>
      {flag} {label}
    </span>
  );
};

export const copyToClipboard = (text, label = "Text") => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  }
};

export const getVisaGrantMergedData = (v) => {
  if (!v) return {};
  return {
    id: v.id || `VG-${Date.now()}`,
    refrenceNumber: v.refrenceNumber || `VG-AU-${generate8CharRef()}`,
    applicantName: v.applicantName || "PATEL Chintankumar Ranchhodbhai",
    dateOfBirth: v.dateOfBirth || "25 September 1999",
    passportNumber: v.passportNumber || "U4019655IND",
    passportCountry: v.passportCountry || "INDIA",
    visaName: v.visaName || "Transit (subclass 771)",
    applicationStatus: v.applicationStatus || "Granted",
    visaGrantNumber: v.visaGrantNumber || "1139500159106",
    applicationId: v.applicationId || "106951626",
    trn: v.trn || "EGP6QH59AO",
    grantDate: v.grantDate || getFormattedTodayDate(),
    mustNotArriveAfter: v.mustNotArriveAfter || getFormattedExpiryDate(12),
    lengthOfStay: v.lengthOfStay || "3 day(s) from the date of each arrival",
    travel: v.travel || "Multiple entries",
    conditions: v.conditions || "8101 - No work\n8201 - Maximum three months study",
    whyKeepNotice:
      v.whyKeepNotice ||
      "Airlines might ask for details in this notice so they can carry out checks to allow you to board the plane.",
    createdAt: v.createdAt || new Date().toISOString(),
  };
};

export const getOfferLetterMergedData = (ol) => {
  if (!ol) return {};
  const details = ol.details || {};
  return {
    ...details,
    companyId: ol.companyId,
    userId: ol.userId,
    refrenceNumber: ol.refrenceNumber || "",
    sponsorName:
      details.sponsorName ||
      ol.companyId?.name ||
      ol.sponsorName ||
      "HD Contractor Limited",
    sponsorAddress:
      details.sponsorAddress ||
      ol.sponsorAddress ||
      "54B Tidal Road, Sydney NSW 2000, Australia",
    clientId: details.clientId || ol.clientId || "15622175210",
    sponsorshipApprovalId:
      details.sponsorshipApprovalId ||
      ol.sponsorshipApprovalId ||
      "1740568430",
    fileNumber: details.fileNumber || ol.fileNumber || "ABD2026/420367",
    sponsorshipFeeReceiptNumber:
      details.sponsorshipFeeReceiptNumber ||
      ol.sponsorshipFeeReceiptNumber ||
      "100001750031",
    dateOfApproval:
      details.dateOfApproval || ol.dateOfApproval || getFormattedTodayDate(),
    applicantName:
      details.applicantName ||
      ol.userId?.username ||
      ol.applicantName ||
      "MD Shaminuzzaman",
    nationality: details.nationality || ol.nationality || "Bangladeshi",
    status: details.status || ol.status || "Issued",
    passportNumber:
      details.passportNumber || ol.passportNumber || "A09820252",
    sponsorshipNumber:
      details.sponsorshipNumber ||
      ol.sponsorshipNumber ||
      ol.refrenceNumber ||
      "W8420862",
    issueDate: details.issueDate || ol.issueDate || getFormattedTodayDate(),
    validTill: details.validTill || ol.validTill || getFormattedExpiryDate(6),
  };
};

export const COMMON_VISA_PROGRAMS = [
  "Employer Nomination",
  "Temporary Skill Shortage visa (subclass 482)",
  "Skilled Employer Sponsored Regional (subclass 494)",
  "Skilled Nominated visa (subclass 190)",
  "Skilled Work Regional (subclass 491)",
  "Training visa (subclass 407)",
  "Temporary Activity visa (subclass 408)",
  "Global Talent visa (subclass 858)",
];

export const getInitialNominationFormData = () => ({
  userId: "",
  applicationId: generateNumericString(9),
  nominationTrn: `NOM${generate8CharRef().slice(0, 7)}`,
  visaProgram: "Employer Nomination",
  fileNumber: `BCC2026/${generateNumericString(7)}`,
  givenName: "",
  familyName: "",
  approvedDate: getFormattedTodayDate(),
  origin: "au",
  documentName: "Nomination Approval Notice",
});

