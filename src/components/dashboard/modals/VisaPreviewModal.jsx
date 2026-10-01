import React from "react";

function VisaPreviewModal({
  isVisaPreviewOpen,
  previewVisaData,
  visaPreviewPdfUrl,
  isVisaPreviewGenerating,
  handleCloseVisaGrantPreview,
  handleDownloadVisaGrantPDF,
}) {
  if (!isVisaPreviewOpen) return null;

  return (
    <div
      className="dashboard-modal-backdrop"
      onClick={handleCloseVisaGrantPreview}>
      <div
        className="dashboard-modal dashboard-modal-pdf"
        onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 style={{ margin: 0 }}>
              📄 Australian Visa Grant Notice PDF Preview
            </h3>
            <span className="variable-badge">
              {previewVisaData?.visaGrantNumber ||
                previewVisaData?.trn ||
                "Grant Notice"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {previewVisaData && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleDownloadVisaGrantPDF(previewVisaData)}>
                📥 Download PDF
              </button>
            )}
            <button
              className="dashboard-modal-close"
              onClick={handleCloseVisaGrantPreview}>
              ✕
            </button>
          </div>
        </div>
        <div
          className="dashboard-modal-body"
          style={{ position: "relative", minHeight: "500px" }}>
          {isVisaPreviewGenerating ? (
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
                Generating official Australian Visa Grant Notice PDF...
              </div>
            </div>
          ) : visaPreviewPdfUrl ? (
            <iframe
              src={visaPreviewPdfUrl}
              title="Visa Grant Notice PDF Preview"
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

export default VisaPreviewModal;
