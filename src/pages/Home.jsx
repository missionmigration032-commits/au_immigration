import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, AlertCircle, Download } from 'lucide-react';


function Home() {
  return (
    <div id="contentBox">

      <main>
        <div id="DeltaPlaceHolderMain" style={{ overflow: 'visible' }}>
          <div id="tab-pane-1" className="tab-pane fade in active">
            <div className="home-page">
              <div className="hero-bg extended" style={{backgroundImage: 'url("/kangaroo-family-beach.jpg")', marginTop: '0px'}}></div>
              
              <div className="hero-block extended fancy">
                <div className="container">
                  <div className="row">
                    <div className="col-sm-6 hero-block-content">
                      <div className="hero-block-content-inner">
                        <div className="section-title">
                          Welcome to the Department of Home Affairs
                        </div>
                        <h1>Immigration and citizenship</h1>
                        <ul className="main-menu link-list has-bg">
                          <li className="navigation-node has-sub-menu">
                            <a href="/entering-and-leaving-australia" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={(e) => {
                              e.preventDefault();
                              window.dispatchEvent(new CustomEvent('openNavMenu', { detail: '/entering-and-leaving-australia' }));
                            }}>Entering and leaving Australia <ArrowRight size={18} /></a>
                          </li>
                          <li className="navigation-node has-sub-menu">
                            <a href="/visas" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={(e) => {
                              e.preventDefault();
                              window.dispatchEvent(new CustomEvent('openNavMenu', { detail: '/visas' }));
                            }}>Visas <ArrowRight size={18} /></a>
                          </li>
                          <li className="navigation-node has-sub-menu">
                            <a href="/citizenship" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={(e) => {
                              e.preventDefault();
                              window.dispatchEvent(new CustomEvent('openNavMenu', { detail: '/citizenship' }));
                            }}>Australian citizenship <ArrowRight size={18} /></a>
                          </li>
                          <li><Link to="/what-we-do">What we do</Link></li>
                          <li><Link to="/settling-in-australia">Settling in Australia</Link></li>
                          <li className="navigation-node has-sub-menu">
                            <a href="/help-support" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={(e) => {
                              e.preventDefault();
                              window.dispatchEvent(new CustomEvent('openNavMenu', { detail: '/help-support' }));
                            }}>Help and support <ArrowRight size={18} /></a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tiles-container container">
                <div className="warning-container" style={{marginRight: '0.3rem'}}>
                  <div className="row">
                    <div className="col-xs-12">
                      <div className="warning-text" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <AlertCircle size={24} color="#B71234" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <p>People impacted by the conflict in Iran can find more information on &zwnj;<a className="external" aria-label="Iran Visa Information - external link" href="#">Iran Visa Information</a>.</p>
                          <p>People impacted by conflict in the State of Palestine or Israel can find more information on <a className="external" aria-label="Hamas-Israel Conflict: Visa Support and financial assistance - external link" href="#">Hamas-Israel Conflict: Visa Support and financial assistance</a>.<br/></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="group-selector-container">
                  <div className="group-selector-inner">
                    <p>
                      <span className="edit-text" title="" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} />
                        Customise this page
                      </span>
                    </p>
                    <div className="group-selector">
                      <label className="fancy-select" htmlFor="tile-selector">
                        <span><strong>Show me more...</strong></span>
                        <select id="tile-group-selector" defaultValue="0: Object">
                          <option value="0: Object">Show me more...</option>
                          <option value="1: Object">Applying for a visa</option>
                          <option value="2: Object">Australian citizenship</option>
                          <option value="3: Object">Entering or leaving Australia</option>
                          <option value="4: Object">Employing or sponsoring workers</option>
                          <option value="5: Object">I already have a visa</option>
                          <option value="6: Object">New Zealand citizens</option>
                          <option value="7: Object">Permanent residence (PR)</option>
                        </select>
                      </label>
                      <a>Reset</a>
                    </div>
                  </div>
                </div>

                <div className="flex">
                  <div className="tile">
                    <Link to="/visas/employing-and-sponsoring-someone/employing-overseas-workers">
                      <span className="title">
                        <h3>Employ people from overseas</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        See how to bring someone into Australia to work for you
                      </span>
                    </Link>
                  </div>
                  
                  <div className="tile">
                    <a className="external popup-trigger" href="#" data-target="external-link-popup">
                      <span className="title">
                        <h3>Hamas-Israel conflict support</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        Find visa information to support those impacted by the Hamas-Israel conflict and surrounding areas
                      </span>
                    </a>
                  </div>

                  <div className="tile">
                    <Link to="/visas/getting-a-visa/visa-finder">
                      <span className="title">
                        <h3>Explore visa options</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        Answer a few questions to identify which visas might be suitable for you and your family
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <Link to="/help-support/tools">
                      <span className="title">
                        <h3>Our online forms and services</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        Apply, notify us of changes, check status or withdraw an application. Use ImmiAccount or VEVO.
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <Link to="/citizenship/become-a-citizen">
                      <span className="title">
                        <h3>Become an Australian citizen</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        See if you are eligible and how to apply
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <Link to="/visas/visa-about-to-expire">
                      <span className="title">
                        <h3>Visa expiring or has expired</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        See what your options are and what you need to do 
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <Link to="/change-in-situation">
                      <span className="title">
                        <h3>Your situation has changed</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        Moved? Had a baby? Got a new passport? Need to change your plans? Find out what you need to do
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <Link to="/visas/already-have-a-visa/check-visa-details-and-conditions">
                      <span className="title">
                        <h3>Visa conditions</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        Your visa has conditions. Find out what you can and can't do
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <a className="external popup-trigger" href="#" data-target="external-link-popup">
                      <span className="title">
                        <h3>Report suspicious activities</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        Report suspicious or illegal immigration, citizenship, customs and trade activity
                      </span>
                    </a>
                  </div>
                </div>
              </div>

              {/* News slider */}
              <div className="news section light bg-stripe slide-section">
                <div className="container">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="title-row">
                        <h2> News </h2>
                        <Link className="archive-link" to="/news-media/archive">See all</Link>
                        <div className="pull-right slide-controls news-slide-controls">
                          <button aria-label="Previous" className="circle prevArrow" tabIndex="-1">
                            <ArrowLeft size={16} /> 
                          </button>
                          <button aria-label="Next" className="circle nextArrow" tabIndex="-1">
                            <ArrowRight size={16} /> 
                          </button> 
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="news-slider row">
                    <div className="col-sm-4">
                      <div className="news-item">
                        <a className="news-link" href="#">
                          <span className="image-parent">
                            <img className="img-responsive" alt="" src="/rugby-league-world-cup.jpg"/>
                          </span>
                          <span className="news-text">
                            <span className="date">27 Jul 2026</span>
                            <span className="title">Rugby League World Cup 2026 – visas for fans and supporters</span>
                            <span className="sub-title">Fans and supporters who want to come to Australia to watch the Rugby League World Cup 2026 must have a valid Australian visa.</span>
                          </span>
                        </a> 
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="news-item">
                        <a className="news-link" href="#">
                          <span className="image-parent">
                            <img className="img-responsive" alt="" src="/group-of-diverse-occupation-people.jpg"/>
                          </span>
                          <span className="news-text">
                            <span className="date">29 Jul 2026</span>
                            <span className="title">New Ministerial Directions for the processing of Family and Skilled visas</span>
                            <span className="sub-title">On 25 July 2026, three new Ministerial Directions came into effect.</span>
                          </span>
                        </a> 
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="news-item">
                        <a className="news-link" href="#">
                          <span className="image-parent">
                            <img className="img-responsive" alt="" src="/generic.jpg"/>
                          </span>
                          <span className="news-text">
                            <span className="date">03 Jul 2026</span>
                            <span className="title">Enhanced Australian Visitor visa (600) application option for eligible Papua New Guinea</span>
                            <span className="sub-title">If you are a citizen of Papua New Guinea and you have had a Visitor visa granted within the last 5 years, you may be eligible to use a new application process.</span>
                          </span>
                        </a> 
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* End of News slider */} 
              
              <div className="section dark footer-contact">
                <div className="container">
                  <div className="row">
                    <div className="col-sm-3">
                      <h2>Contact<br/></h2>
                    </div>
                    <div className="col-sm-3">
                      <h4>General</h4>
                      <p>Do you have a question, feedback or a complaint? Let us help you find the right answer.<br/></p>
                      <p><Link to="/help-support/popular-questions">Popular questions</Link></p>
                      <p><Link to="/help-support/contact-us">Contact us</Link></p>
                    </div>
                    <div className="col-sm-3">
                      <h4>Report suspicious activities<br/></h4>
                      <p>
                        <a href="#"> 
                          <img className="img-responsive" alt="Report online to border watch" src="/footer-nav-report-online.png"/>
                        </a> 
                        <br/>&nbsp;
                      </p>
                    </div>
                    <div className="col-sm-3">
                      <h4>National Security Hotline</h4>
                      <p>
                        <a href="https://www.nationalsecurity.gov.au/what-can-i-do/report-suspicious-behaviour"> 
                          <img className="img-responsive" alt="if it doesn't add up speak up call national security hotline" src="/Nat-sec-hotline-carousel-image-2.jpg"/>
                        </a>&nbsp;<br/>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
