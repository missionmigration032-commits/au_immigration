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
import { AU_LOGO_DARK_BASE64 } from "../assets/logoBase64";

// Styles matching the reference PDF letterhead
const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 9.5,
    paddingTop: 36,
    paddingBottom: 36,
    paddingLeft: 44,
    paddingRight: 44,
    color: "#000000",
    backgroundColor: "#ffffff",
    position: "relative",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 14,
  },
  logo: {
    width: 170,
    height: 40,
    objectFit: "contain",
  },
  metaSection: {
    marginBottom: 8,
  },
  metaTitle: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    marginBottom: 4,
  },
  metaGrid: {
    flexDirection: "column",
    gap: 1.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    lineHeight: 1.25,
    marginBottom: 1.5,
  },
  metaLabel: {
    fontSize: 11,
    marginRight: 4,
  },
  metaValue: {
    fontSize: 11,
  },
  sponsorBlock: {
    marginTop: 6,
    marginBottom: 8,
  },
  sponsorName: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    marginBottom: 2,
  },
  sponsorAddress: {
    fontFamily: "Times-Bold",
    fontSize: 10.5,
    lineHeight: 1.25,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 8,
  },
  salutationBlock: {
    marginBottom: 6,
  },
  dearText: {
    fontSize: 11,
    marginBottom: 1,
  },
  applicantNameHeader: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    marginBottom: 1,
  },
  nationalityText: {
    fontSize: 11,
  },
  statusSection: {
    marginBottom: 10,
    lineHeight: 1.25,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 1.5,
  },
  statusLabelBold: {
    fontFamily: "Times-Bold",
    fontSize: 11,
  },
  statusValueRegular: {
    fontSize: 11,
  },
  statusLabelInline: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    marginRight: 4,
  },
  statusValueInline: {
    fontSize: 11,
  },
  bodyParagraph: {
    fontSize: 9.5,
    lineHeight: 1.35,
    textAlign: "justify",
    marginBottom: 10,
  },
  linkText: {
    textDecoration: "underline",
    color: "#0000ee",
  },
  disclaimerParagraph: {
    fontSize: 8.5,
    lineHeight: 1.3,
    textAlign: "justify",
    marginBottom: 14,
  },
  closingText: {
    fontFamily: "Times-Bold",
    fontSize: 10.5,
    marginBottom: 16,
  },
  footerRow: {
    position: "absolute",
    bottom: 25,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeftText: {
    fontFamily: "Times-Bold",
    fontSize: 7.5,
    letterSpacing: 0.2,
  },
  footerRightText: {
    fontFamily: "Times-Bold",
    fontSize: 8.5,
  },
  // Page 2 specific styles
  page2Note: {
    fontFamily: "Times-Bold",
    fontSize: 9.5,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 18,
    paddingHorizontal: 20,
    lineHeight: 1.3,
  },
  sectionTitle: {
    fontFamily: "Times-Bold",
    fontSize: 9.5,
    marginTop: 8,
    marginBottom: 3,
  },
  sectionText: {
    fontSize: 8.5,
    lineHeight: 1.32,
    textAlign: "justify",
    marginBottom: 8,
  },
  boldInline: {
    fontFamily: "Times-Bold",
  },
});

export const OfferLetterDocument = ({ data = {} }) => {
  // Normalize variable values with robust defaults matching the reference style
  const sponsorName =
    data.sponsorName || data.companyId?.name || "HD Contractor Limited";
  const sponsorAddress =
    data.sponsorAddress || "54B Tidal Road, Sydney NSW 2000, Australia";
  const clientId = data.clientId || "15622175210";
  const sponsorshipApprovalId = data.sponsorshipApprovalId || "1740568430";
  const fileNumber = data.fileNumber || "ABD2026/420367";
  const sponsorshipFeeReceiptNumber =
    data.sponsorshipFeeReceiptNumber || "100001750031";
  const dateOfApproval = data.dateOfApproval || "03 September 2026";

  const applicantName =
    data.applicantName || data.userId?.username || "MD Shaminuzzaman";
  const nationality = data.nationality || "Bangladeshi";
  const status = data.status || "Issued";
  const passportNumber = data.passportNumber || "A09820252";
  const sponsorshipNumber =
    data.sponsorshipNumber || data.refrenceNumber || "W8420862";
  const issueDate = data.issueDate || "03 September 2026";
  const validTill = data.validTill || "03 March 2027";

  return (
    <Document
      title={`Grant_Letter_${sponsorshipNumber || "AU"}`}
      author="Department of Home Affairs"
      subject="Grant Letter of Sponsorship for Australia">
      {/* ================= PAGE 1 ================= */}
      <Page size="A4" style={styles.page}>
        {/* Top Right Logo */}
        <View style={styles.headerContainer}>
          <Image style={styles.logo} src={AU_LOGO_DARK_BASE64} />
        </View>

        {/* Top Left Quote Meta */}
        <View style={styles.metaSection}>
          <Text style={styles.metaTitle}>In reply please quote:</Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Name of Sponsor:</Text>
              <Text style={styles.metaValue}>{sponsorName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Client ID:</Text>
              <Text style={styles.metaValue}>{clientId}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Sponsorship Approval ID:</Text>
              <Text style={styles.metaValue}>{sponsorshipApprovalId}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>File Number:</Text>
              <Text style={styles.metaValue}>{fileNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>
                Sponsorship Fee Receipt Number:
              </Text>
              <Text style={styles.metaValue}>
                {sponsorshipFeeReceiptNumber}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>
                Date of Sponsorship Approval:
              </Text>
              <Text style={styles.metaValue}>{dateOfApproval}</Text>
            </View>
          </View>
        </View>

        {/* Sponsor Address */}
        <View style={styles.sponsorBlock}>
          <Text style={styles.sponsorName}>{sponsorName}</Text>
          <Text style={styles.sponsorAddress}>{sponsorAddress}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Grant Letter of Sponsorship for Australia
        </Text>

        {/* Salutation */}
        <View style={styles.salutationBlock}>
          <Text style={styles.dearText}>Dear</Text>
          <Text style={styles.applicantNameHeader}>{applicantName}</Text>
          <Text style={styles.nationalityText}>{nationality}</Text>
        </View>

        {/* Status Details */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabelInline}>Status:</Text>
            <Text style={styles.statusValueInline}>{status}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabelInline}>Name:</Text>
            <Text style={styles.statusValueInline}>{applicantName}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabelInline}>Passport Number:</Text>
            <Text style={styles.statusValueInline}>{passportNumber}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabelInline}>Sponsorship Number:</Text>
            <Text style={styles.statusValueInline}>{sponsorshipNumber}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabelInline}>Issue Date:</Text>
            <Text style={styles.statusValueInline}>{issueDate}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabelInline}>Valid Till:</Text>
            <Text style={styles.statusValueInline}>{validTill}</Text>
          </View>
        </View>

        {/* Main Body Paragraph */}
        <Text style={styles.bodyParagraph}>
          You are now authorized to work in Australia under an approved
          electronic Sponsorship and may enter through all international
          airports in Australia as a recognized international worker. When you
          travel to Australia, you must carry the passport you used to apply for
          the sponsorship, as the permit is electronically linked to it.
          Australian border officials and airline check-in staff will have
          electronic access to confirm your sponsorship status. To view or
          verify your work authorization online, please visit{" "}
          <Text style={styles.linkText}>www.homeaffairs.gov.au</Text> and refer
          to the Sponsorship section or log in through your{" "}
          <Text style={styles.boldInline}>ImmiAccount</Text>.
        </Text>

        {/* Confidentiality Disclaimer */}
        <Text style={styles.disclaimerParagraph}>
          Any opinions expressed in this message do not necessarily reflect
          those of the Department of Home Affairs. This message and any
          attachments are confidential and intended solely for the use of the
          individual or entity to whom they are addressed. If you are not the
          intended recipient, or the person responsible for delivering the
          message to the intended recipient, please be advised that you have
          received this communication in error. Any use, disclosure,
          distribution, or copying of this communication is strictly prohibited.
          Please notify the sender immediately and delete this message and any
          attachments from your system.
        </Text>

        {/* Sign-off */}
        <Text style={styles.closingText}>Department of Home Affairs</Text>

        {/* Page 1 Footer */}
        <View style={styles.footerRow} fixed>
          <Text style={styles.footerLeftText}>DEPARTMENT OF HOME AFFAIRS</Text>
          <Text style={styles.footerRightText}>Australian Government</Text>
        </View>
      </Page>

      {/* ================= PAGE 2 ================= */}
      <Page size="A4" style={styles.page}>
        {/* Top Right Logo */}
        <View style={styles.headerContainer}>
          <Image style={styles.logo} src={AU_LOGO_DARK_BASE64} />
        </View>

        {/* Note */}
        <Text style={styles.page2Note}>
          *Note: This paper Authorized by Immigration Australia and valid till a
          limited duration as determined by Immigration Australia
        </Text>

        {/* Section 1 */}
        <Text style={styles.sectionTitle}>
          You do not require a visa label in your passport
        </Text>
        <Text style={styles.sectionText}>
          The details provided reflect the electronic record of your visa held
          by <Text style={styles.boldInline}>Immigration Australia</Text>{" "}
          (Department of Home Affairs). Do not alter this letter. For
          information about visas, visit:{" "}
          <Text style={styles.linkText}>https://immi.homeaffairs.gov.au</Text>
        </Text>
        <Text style={styles.sectionText}>
          Please ensure your visa details match your passport before you travel.
          Contact Immigration Australia immediately if there are any
          discrepancies.
        </Text>

        {/* Section 2 */}
        <Text style={styles.sectionTitle}>If you get a new passport</Text>
        <Text style={styles.sectionText}>
          If you obtain a new passport while this visa is still valid, you must
          request Immigration Australia to update your visa details so that they
          correspond with your new passport. Immigration Australia provides
          guidance on how to do this at:{" "}
          <Text style={styles.linkText}>
            https://immi.homeaffairs.gov.au/change-in-situation/passport-details
          </Text>
        </Text>

        {/* Section 3 */}
        <Text style={styles.sectionTitle}>Your passport scans</Text>
        <Text style={styles.sectionText}>
          At the time of your visa application, you may have been asked to
          submit your passport to the nearest Visa Application Centre (VAC) for
          scanning. This process is a standard part of verifying your identity
          and supporting your application.
        </Text>

        {/* Section 4 */}
        <Text style={styles.sectionTitle}>Passport Requirements Waived</Text>
        <Text style={styles.sectionText}>
          Following assessment of your application, we{" "}
          <Text style={styles.boldInline}>waived the passport requirement</Text>
          . We apologise if you have already submitted your passport to the VAC.
          Your passport will be returned to you as soon as possible.{" "}
          <Text style={styles.boldInline}>
            If you have not yet submitted your passport, please do not send it.
          </Text>
        </Text>

        {/* Section 5 */}
        <Text style={styles.sectionTitle}>Automated Systems</Text>
        <Text style={styles.sectionText}>
          Some parts of your application may have been processed using{" "}
          <Text style={styles.boldInline}>automated systems</Text> under section
          28 of the Migration Act 1958.
        </Text>
        <Text style={styles.sectionText}>
          For more information about Immigration Australia’s use of automation,
          visit:{" "}
          <Text style={styles.linkText}>
            https://immi.homeaffairs.gov.au/about-us/site-information/terms-of-use
          </Text>
        </Text>

        {/* Section 6 */}
        <Text style={styles.sectionTitle}>
          You Must Not Remain in Australia after Your Visa Expires
        </Text>
        <Text style={styles.sectionText}>
          You must hold a valid visa at all times while in Australia.
        </Text>
        <Text style={styles.sectionText}>
          If your visa expires and you do not leave, you will be in Australia
          unlawfully and may be liable for deportation. Failure to leave
          voluntarily before receiving a deportation order may result in a{" "}
          <Text style={styles.boldInline}>prohibition period</Text> that
          restricts you from returning to Australia in the future.
        </Text>

        {/* Page 2 Footer */}
        <View style={styles.footerRow} fixed>
          <View />
          <Text style={styles.footerRightText}>Australian Government</Text>
        </View>
      </Page>
    </Document>
  );
};

export const generateOfferLetterBlob = async (data) => {
  const blob = await pdf(<OfferLetterDocument data={data} />).toBlob();
  return blob;
};

export const downloadOfferLetterPDF = async (data, filename) => {
  const blob = await generateOfferLetterBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ||
    `Grant_Letter_${data.sponsorshipNumber || data.refrenceNumber || "AU"}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export default OfferLetterDocument;
