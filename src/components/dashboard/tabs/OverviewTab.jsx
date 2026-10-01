import React from "react";
import { VisasTable } from "./VisasTab";
import { PaymentsTable } from "./PaymentsTab";
import { CompaniesTable } from "./CompaniesTab";
import { OfferLettersTable } from "./OfferLettersTab";
import { SavedVisaGrantsTable } from "./VisaGrantTab";
import { UsersTable } from "./AccountsTab";

function OverviewTab({
  // Visas
  visasList,
  fetchVisas,
  handleDeleteVisa,

  // Payments
  paymentsList,
  usersList,
  fetchPayments,
  paymentSearch,
  setPaymentSearch,
  paymentStatusFilter,
  setPaymentStatusFilter,
  handleTogglePaymentStatus,
  handleDeletePayment,

  // Companies
  companiesList,
  companySearch,
  setCompanySearch,
  fetchCompanies,
  setEditingCompany,
  handleDeleteCompany,

  // Offer Letters
  offerLettersList,
  offerLetterCompanyFilter,
  setOfferLetterCompanyFilter,
  offerLetterSearch,
  setOfferLetterSearch,
  fetchOfferLetters,
  handleOpenOfferLetterPreview,
  handleDownloadOfferLetter,
  downloadingLetterId,
  handleStartEditOfferLetter,
  handleDeleteOfferLetter,

  // Saved Visa Grants
  savedVisaGrants,
  visaGrantSearch,
  setVisaGrantSearch,
  setVisaGrantFormData,
  setVisaGrantAlert,
  handleLoadSavedVisaGrant,
  handleOpenVisaGrantPreview,
  handleDownloadVisaGrantPDF,
  downloadingVisaId,
  handleDeleteSavedVisaGrant,

  // Users
  userSearch,
  setUserSearch,
  fetchUsers,
  setEditingUser,
  handleDeleteUser,
}) {
  return (
    <>
      <VisasTable
        visasList={visasList}
        fetchVisas={fetchVisas}
        handleDeleteVisa={handleDeleteVisa}
      />

      <PaymentsTable
        paymentsList={paymentsList}
        visasList={visasList}
        usersList={usersList}
        fetchPayments={fetchPayments}
        paymentSearch={paymentSearch}
        setPaymentSearch={setPaymentSearch}
        paymentStatusFilter={paymentStatusFilter}
        setPaymentStatusFilter={setPaymentStatusFilter}
        handleTogglePaymentStatus={handleTogglePaymentStatus}
        handleDeletePayment={handleDeletePayment}
      />

      <CompaniesTable
        companiesList={companiesList}
        companySearch={companySearch}
        setCompanySearch={setCompanySearch}
        fetchCompanies={fetchCompanies}
        setEditingCompany={setEditingCompany}
        handleDeleteCompany={handleDeleteCompany}
      />

      <OfferLettersTable
        offerLettersList={offerLettersList}
        companiesList={companiesList}
        offerLetterCompanyFilter={offerLetterCompanyFilter}
        setOfferLetterCompanyFilter={setOfferLetterCompanyFilter}
        offerLetterSearch={offerLetterSearch}
        setOfferLetterSearch={setOfferLetterSearch}
        fetchOfferLetters={fetchOfferLetters}
        handleOpenOfferLetterPreview={handleOpenOfferLetterPreview}
        handleDownloadOfferLetter={handleDownloadOfferLetter}
        downloadingLetterId={downloadingLetterId}
        handleStartEditOfferLetter={handleStartEditOfferLetter}
        handleDeleteOfferLetter={handleDeleteOfferLetter}
      />

      <SavedVisaGrantsTable
        savedVisaGrants={savedVisaGrants}
        visaGrantSearch={visaGrantSearch}
        setVisaGrantSearch={setVisaGrantSearch}
        setVisaGrantFormData={setVisaGrantFormData}
        setVisaGrantAlert={setVisaGrantAlert}
        handleLoadSavedVisaGrant={handleLoadSavedVisaGrant}
        handleOpenVisaGrantPreview={handleOpenVisaGrantPreview}
        handleDownloadVisaGrantPDF={handleDownloadVisaGrantPDF}
        downloadingVisaId={downloadingVisaId}
        handleDeleteSavedVisaGrant={handleDeleteSavedVisaGrant}
      />

      <UsersTable
        usersList={usersList}
        userSearch={userSearch}
        setUserSearch={setUserSearch}
        fetchUsers={fetchUsers}
        setEditingUser={setEditingUser}
        handleDeleteUser={handleDeleteUser}
      />
    </>
  );
}

export default OverviewTab;
