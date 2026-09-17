import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Printer, ChevronUp } from 'lucide-react';
import footerLogo from '../assets/images/footer-logo-white.svg';

const FacebookIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const LinkedinIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

function Footer() {
  const handlePrint = (e) => {
    e.preventDefault();
    window.print();
  };

  return (
    <div className="footer-container ms-edit-overlay noindex">
      <footer>
        {/* ===== feedback control ======== */}
        <div className="footer-feedback" style={{ display: 'block' }}>
          <div className="container">
            <div className="row footer-feedback-row">
              <div className="col-xs-4">
                <AlertCircle size={16} style={{ marginRight: '6px' }} />
                <a className="feedback-link" href="#" id="ctlTaskbarFeedbackLabel">Tell us what you think of this page</a>
              </div>
              <div className="col-xs-4 text-center">
                <span id="ctlPageModifiedLabel">Last updated:</span>
                <span id="pageModified"> 23 September 2024</span>
              </div>
              <div className="col-xs-4 text-right">
                <div className="print-link hidden-print">
                  <a href="#" onClick={handlePrint} id="ctlTaskbarPrintLabel">
                    Print this page &nbsp;<Printer size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="section footer-links">
          <div className="container">
            <div className="row">
              <div className="col-sm-3">
                <nav>
                  <ul className="footer-links-primary">
                    <li><a href="#">Home Affairs Portfolio</a></li>
                    <li><a href="https://www.abf.gov.au/">Travel and crossing the border</a></li>
                    <li><a href="https://www.abf.gov.au/">Import, export and buying online</a></li>
                    <li><a href="#">National Security</a></li>
                    <li><a href="#">Emergency Management</a></li>
                    <li><a href="#">Cyber Security</a></li>
                    <li><a href="#">Multicultural Affairs</a></li>
                  </ul>
                </nav>
              </div>
              <div className="col-sm-3">
                <nav>
                  <ul className="footer-links-secondary">
                    <li><a className="external" href="#">Who we are</a></li>
                    <li><a className="external" href="#">Our Ministers</a></li>
                    <li><Link to="/help-support/popular-questions">Popular questions</Link></li>
                    <li><Link to="/help-support/glossary">Glossary</Link></li>
                    <li><Link to="/help-support/departmental-forms">Forms</Link></li>
                    <li><Link to="/help-support/tools">Online services</Link></li>
                    <li><a className="external" href="#">Compliments, complaints and suggestions</a></li>
                  </ul>
                </nav>
              </div>
              <div className="col-sm-3 col-sm-offset-3">
                <div className="footer-links-logo">
                  <img className="img-responsive" alt="Australian Government" src={footerLogo} />&nbsp;
                </div>
                &nbsp;
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-secondary">
          <div className="container">
            <div className="row">
              <div className="col-sm-9">
                The Department of Home Affairs acknowledges the Traditional Custodians of Country throughout Australia and their continuing connection to land, sea and community. We pay our respects to all Aboriginal and Torres Strait Islander peoples, their cultures and to their elders past, present and emerging.
              </div>
              <div className="col-sm-3"></div>
            </div>
            <div className="row">
              <div className="col-sm-8 footer-secondary-links">
                <ul className="list-inline">
                  <li><Link to="/conditions-of-use">Conditions of use</Link></li>
                  <li><a href="#">Web privacy statement</a></li>
                  <li><a href="#">Accessibility of this website</a></li>
                  <li><a href="#">Access to information</a></li>
                  <li><a href="#">Information publication scheme</a></li>
                  <li><a href="#">Copyright and disclaimer</a></li>
                  <li><a href="#">Privacy</a></li>
                </ul>
              </div>
              <div className="col-sm-4">
                <div className="back-to-top text-right">
                  <a href="#top">
                    Back to top <ChevronUp size={16} style={{ marginLeft: '4px' }} />
                  </a>
                </div>
                <div className="social-links text-right">
                  <a className="circle social-link-icon" href="https://facebook.com/aushomeaffairs" target="_blank" rel="noopener noreferrer">
                    <FacebookIcon size={18} aria-hidden="true" />
                    <span className="sr-only">Facebook page for Australian Department of Home Affairs</span>
                  </a>
                  <a className="circle social-link-icon" href="https://au.linkedin.com/company/australian-department-of-home-affairs" target="_blank" rel="noopener noreferrer">
                    <LinkedinIcon size={18} aria-hidden="true" />
                    <span className="sr-only">LinkedIn page for Australian Department of Home Affairs</span>
                  </a>
                  <br /><br />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="ZN_1NBARpGldvj2GeW"></div>
        <br />
      </footer>
    </div>
  );
}

export default Footer;
