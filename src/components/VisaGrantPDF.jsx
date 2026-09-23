import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { AU_GRANT_HEADER_BANNER_BASE64 } from "../assets/logoBase64";

// Styles matching the official Australian Government Department of Home Affairs Visa Grant Notice
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    paddingTop: 18,
    paddingBottom: 24,
    paddingLeft: 42,
    paddingRight: 42,
    color: "#000000",
    backgroundColor: "#ffffff",
    position: "relative",
  },
  headerBanner: {
    width: "100%",
    height: 64,
    objectFit: "contain",
    marginBottom: 16,
  },
  salutation: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    marginBottom: 8,
    color: "#000000",
  },
  grantNotice: {
    fontFamily: "Helvetica",
    fontSize: 9,
    marginBottom: 12,
    lineHeight: 1.3,
    color: "#000000",
  },
  // Application status bordered box
  statusBox: {
    borderWidth: 1.5,
    borderColor: "#000000",
    paddingTop: 5,
    paddingBottom: 7,
    paddingLeft: 8,
    paddingRight: 8,
    marginBottom: 13,
  },
  statusBoxTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 4,
    color: "#000000",
  },
  statusBoxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBoxVisaName: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#000000",
  },
  statusBoxGranted: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#000000",
  },
  // Section headers
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 5,
    color: "#000000",
  },
  // Conditions block
  conditionsList: {
    marginBottom: 6,
  },
  conditionItem: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    lineHeight: 1.35,
    color: "#000000",
  },
  bodyText: {
    fontFamily: "Helvetica",
    fontSize: 8,
    lineHeight: 1.3,
    color: "#222222",
    marginBottom: 5,
  },
  // Key-value bordered table
  tableContainer: {
    borderTopWidth: 0.6,
    borderTopColor: "#d1d5db",
    marginBottom: 11,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: "#d1d5db",
    paddingTop: 3.5,
    paddingBottom: 3.5,
  },
  tableLabelCol: {
    width: "44%",
    paddingRight: 6,
  },
  tableLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#000000",
  },
  tableValueCol: {
    width: "56%",
  },
  tableValue: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#000000",
  },
  // Why keep notice bullet section
  bulletContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 2,
  },
  bulletDot: {
    width: 14,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    paddingTop: -1,
  },
  bulletText: {
    flex: 1,
    fontFamily: "Helvetica",
    fontSize: 8.2,
    lineHeight: 1.3,
    color: "#000000",
  },
});

export const VisaGrantDocument = ({ data }) => {
  const d = data || {};

  const applicantName =
    d.applicantName ||
    [d.givenNames, d.familyName].filter(Boolean).join(" ") ||
    "PATEL Chintankumar Ranchhodbhai";

  const visaName =
    d.visaName ||
    d.visaClassSubclass ||
    "Transit (subclass 771)";

  const applicationStatus =
    d.applicationStatus ||
    d.status ||
    "Granted";

  const grantDate =
    d.grantDate ||
    d.visaGrantDate ||
    "04 February 2025";

  const mustNotArriveAfter =
    d.mustNotArriveAfter ||
    d.visaExpiryDate ||
    "04 February 2026";

  const lengthOfStay =
    d.lengthOfStay ||
    d.periodOfStay ||
    "3 day(s) from the date of each arrival";

  const travel =
    d.travel ||
    d.entriesAllowed ||
    "Multiple entries";

  const dateOfBirth =
    d.dateOfBirth ||
    "25 September 1999";

  const visaGrantNumber =
    d.visaGrantNumber ||
    "1139500159106";

  const passportNumber =
    d.passportNumber ||
    d.documentNumber ||
    "U4019655IND";

  const passportCountry =
    d.passportCountry ||
    d.nationality ||
    "INDIA";

  const applicationId =
    d.applicationId ||
    "106951626";

  const trn =
    d.trn ||
    d.transactionReferenceNumber ||
    "EGP6QH59AO";

  // Parse conditions (supports multi-line string or array)
  let conditionLines = [];
  if (Array.isArray(d.conditions)) {
    conditionLines = d.conditions;
  } else if (typeof d.conditions === "string" && d.conditions.trim()) {
    conditionLines = d.conditions.split("\n").map((c) => c.trim()).filter(Boolean);
  } else {
    conditionLines = [
      "8101 - No work",
      "8201 - Maximum three months study",
    ];
  }

  const whyKeepNotice =
    d.whyKeepNotice ||
    "Airlines might ask for details in this notice so they can carry out checks to allow you to board the plane.";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Crest Banner */}
        <Image
          style={styles.headerBanner}
          src={AU_GRANT_HEADER_BANNER_BASE64}
        />

        {/* Salutation */}
        <Text style={styles.salutation}>Dear {applicantName}</Text>

        {/* Grant notice line */}
        <Text style={styles.grantNotice}>
          We have granted you a {visaName} visa on {grantDate}.
        </Text>

        {/* Application status box */}
        <View style={styles.statusBox}>
          <Text style={styles.statusBoxTitle}>Application status</Text>
          <View style={styles.statusBoxRow}>
            <Text style={styles.statusBoxVisaName}>{visaName}:</Text>
            <Text style={styles.statusBoxGranted}>{applicationStatus}</Text>
          </View>
        </View>

        {/* Visa conditions */}
        <Text style={styles.sectionTitle}>Visa conditions</Text>
        <View style={styles.conditionsList}>
          {conditionLines.map((cond, idx) => (
            <Text key={idx} style={styles.conditionItem}>
              {cond}
            </Text>
          ))}
        </View>

        <Text style={styles.bodyText}>
          An explanation of each condition of this {visaName} visa is included in this letter.
        </Text>
        <Text style={[styles.bodyText, { marginBottom: 11 }]}>
          You can check these conditions at any time by using the Visa Entitlement Verification Online
          (VEVO) service. The four-digit number presented next to each condition above is used in
          VEVO to identify each condition that applies to this {visaName} visa.
        </Text>

        {/* Visa duration and travel */}
        <Text style={styles.sectionTitle}>Visa duration and travel</Text>
        <View style={styles.tableContainer}>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCol}>
              <Text style={styles.tableLabel}>Date of grant</Text>
            </View>
            <View style={styles.tableValueCol}>
              <Text style={styles.tableValue}>{grantDate}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCol}>
              <Text style={styles.tableLabel}>Must not arrive after</Text>
            </View>
            <View style={styles.tableValueCol}>
              <Text style={styles.tableValue}>{mustNotArriveAfter}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCol}>
              <Text style={styles.tableLabel}>Length of stay</Text>
            </View>
            <View style={styles.tableValueCol}>
              <Text style={styles.tableValue}>{lengthOfStay}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCol}>
              <Text style={styles.tableLabel}>Travel</Text>
            </View>
            <View style={styles.tableValueCol}>
              <Text style={styles.tableValue}>{travel}</Text>
            </View>
          </View>
        </View>

        {/* Visa summary */}
        <Text style={styles.sectionTitle}>Visa summary</Text>
        <View style={styles.tableContainer}>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCol}>
              <Text style={styles.tableLabel}>Name</Text>
            </View>
            <View style={styles.tableValueCol}>
              <Text style={styles.tableValue}>{applicantName}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCol}>
              <Text style={styles.tableLabel}>Date of birth</Text>
            </View>
            <View style={styles.tableValueCol}>
              <Text style={styles.tableValue}>{dateOfBirth}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCol}>
              <Text style={styles.tableLabel}>Visa</Text>
            </View>
            <View style={styles.tableValueCol}>
              <Text style={styles.tableValue}>{visaName}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCol}>
              <Text style={styles.tableLabel}>Date of grant</Text>
            </View>
            <View style={styles.tableValueCol}>
              <Text style={styles.tableValue}>{grantDate}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCol}>
              <Text style={styles.tableLabel}>Visa grant number</Text>
            </View>
            <View style={styles.tableValueCol}>
              <Text style={styles.tableValue}>{visaGrantNumber}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCol}>
              <Text style={styles.tableLabel}>
                Passport (or other travel document) number
              </Text>
            </View>
            <View style={styles.tableValueCol}>
              <Text style={styles.tableValue}>{passportNumber}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCol}>
              <Text style={styles.tableLabel}>
                Passport (or other travel document) country
              </Text>
            </View>
            <View style={styles.tableValueCol}>
              <Text style={styles.tableValue}>{passportCountry}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCol}>
              <Text style={styles.tableLabel}>Application ID</Text>
            </View>
            <View style={styles.tableValueCol}>
              <Text style={styles.tableValue}>{applicationId}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCol}>
              <Text style={styles.tableLabel}>
                Transaction reference number
              </Text>
            </View>
            <View style={styles.tableValueCol}>
              <Text style={styles.tableValue}>{trn}</Text>
            </View>
          </View>
        </View>

        {/* Why keep this notice */}
        <Text style={styles.sectionTitle}>Why keep this notice?</Text>
        <View style={styles.bulletContainer}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{whyKeepNotice}</Text>
        </View>
      </Page>
    </Document>
  );
};

export const generateVisaGrantBlob = async (data) => {
  const blob = await pdf(<VisaGrantDocument data={data} />).toBlob();
  return blob;
};

export const generateVisaGrantBase64 = async (data) => {
  const blob = await generateVisaGrantBlob(data);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const downloadVisaGrantPDF = async (data, filename = "Visa_Grant_Notice.pdf") => {
  const blob = await generateVisaGrantBlob(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export default VisaGrantDocument;
