import React from "react";
import { useLoading } from "../context/LoadingContext";
import logoHA from "../assets/images/logo-ha.png";
import { ShieldCheck } from "lucide-react";
import "./LoadingOverlay.css";

function LoadingOverlay() {
  const { isLoading } = useLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <>
      {/* Top indeterminate government progress indicator */}
      <div className="gov-top-loader-bar" aria-hidden="true">
        <div className="gov-top-loader-indicator" />
      </div>

      {/* Main Home Affairs loading overlay */}
      <div
        className={`gov-loading-backdrop ${isLoading ? "gov-loading-visible" : ""}`}
        role="status"
        aria-live="polite"
        aria-busy={isLoading}
      >
        <div className="gov-loading-card">
          {/* Official Department of Home Affairs Header */}
          <div className="gov-loading-header">
            <img
              src={logoHA}
              alt="Australian Government - Department of Home Affairs"
              className="gov-loading-logo"
            />
            <span className="gov-loading-entity">Australian Government</span>
          </div>

          {/* Department of Home Affairs Dual-Ring Spinner */}
          <div className="gov-spinner-wrapper">
            <div className="gov-spinner-outer" />
            <div className="gov-spinner-inner" />
            <div className="gov-spinner-core" />
          </div>

          {/* Loading status message */}
          <h4 className="gov-loading-title">Processing Request</h4>
          <p className="gov-loading-description">
            Connecting to Department of Home Affairs secure online services. Please wait...
          </p>

          {/* Pulse dots indicator */}
          <div className="gov-loading-dots">
            <span className="gov-loading-dot" />
            <span className="gov-loading-dot" />
            <span className="gov-loading-dot" />
          </div>

          {/* Official Security Badge */}
          <div className="gov-loading-footer">
            <ShieldCheck size={14} />
            <span>Official Secure Connection &bull; Home Affairs Australia</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoadingOverlay;
