import React from "react";

function OfferLetterPreviewModal({
  previewOfferLetterData,
  previewPdfUrl,
  isPreviewGenerating,
  handleCloseOfferLetterPreview,
  handleDownloadOfferLetter,
}) {
  if (!previewOfferLetterData && !previewPdfUrl && !isPreviewGenerating)
    return null;

  return (
    <div
      className="dashboard-modal-backdrop"
      onClick={handleCloseOfferLetterPreview}>
      <div
        className="dashboard-modal dashboard-modal-pdf"
        onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 style={{ margin: 0 }}>
              📄 Australian Offer Letter PDF Preview
            </h3>
            <span className="variable-badge">
              {previewOfferLetterData?.sponsorshipNumber ||
                previewOfferLetterData?.refrenceNumber ||
                "Grant Letter"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {previewOfferLetterData && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  handleDownloadOfferLetter(previewOfferLetterData)
                }>
                📥 Download PDF
              </button>
            )}
            <button
              className="dashboard-modal-close"
              onClick={handleCloseOfferLetterPreview}>
              ✕
            </button>
          </div>
        </div>
        <div
          className="dashboard-modal-body"
          style={{ position: "relative", minHeight: "500px" }}>
          {isPreviewGenerating ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: "500px",
                color: "#ffffff",
                gap: "14px",
              }}>
              <div style={{ fontSize: "2.4rem" }}>⏳</div>
              <div style={{ fontSize: "1.05rem", fontWeight: "500" }}>
                Generating 2-page Offer Letter PDF with React-PDF...
              </div>
            </div>
          ) : previewPdfUrl ? (
            <iframe
              src={previewPdfUrl}
              title="Offer Letter PDF Preview"
              style={{
                width: "100%",
                height: "100%",
                minHeight: "500px",
                border: "none",
              }}
            />
          ) : (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#cbd5e1",
              }}>
              No preview available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfferLetterPreviewModal;
