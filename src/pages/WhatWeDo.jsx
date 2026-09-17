import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import staffFolders from '../assets/images/Staff-holding-folders.jpg';

function WhatWeDo() {
  return (
    <div id="contentBox">

      
      <main>
        <div id="DeltaPlaceHolderMain" style={{ overflow: 'visible' }}>
          <div id="tab-pane-1" className="tab-pane fade in active">
            <div className="interactive-tile">
              <div className="hero-bg" style={{backgroundImage: `url(${staffFolders})`, marginTop: '0px'}}></div>
              
              {/* Start element: hero-block */}
              <div className="hero-block fancy">
                <div className="container">
                  <div className="row">
                    <div className="col-sm-6 hero-block-content">
                      <div className="breadcrumbs-container dark">
                        <ol className="breadcrumb">
                          <li><Link to="/" id="ctlBreadcrumbsHome">Home</Link></li>
                        </ol>
                      </div>
                      <div className="hero-block-content-inner">
                        <h1>What we do</h1>
                        <div className="ms-rtestate-field" style={{display:'inline'}}>
                          <p>&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* End element: hero-block */}

              <div className="tiles-container container">
                <div className="warning-container hidden" style={{marginRight: '0.3rem'}}>
                  <div className="row">
                    <div className="col-xs-12">
                      <p className="warning-text"></p>
                    </div>
                  </div>
                </div>

                <div className="flex">
                  <div className="tile">
                    <Link to="/what-we-do/education-program">
                      <span className="title">
                        <h3>Education program</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        See information regarding education and training in Australia for students from overseas
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <Link to="/what-we-do/the-administration-of-the-immigration-program">
                      <span className="title">
                        <h3>Immigration &amp; Citizenship</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        See how we administer the Immigration &amp; Citizenship Program and our migration planning levels 
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <Link to="/what-we-do/refugee-and-humanitarian-program">
                      <span className="title">
                        <h3>Refugee and humanitarian</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        Read about our Refugee and humanitarian program
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <Link to="/what-we-do/skilled-migration-program">
                      <span className="title">
                        <h3>Skilled Migration program</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        Find out about our skilled migration program
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <Link to="/what-we-do/status-resolution-service">
                      <span className="title">
                        <h3>Status Resolution Service</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        See how the Department's Status Resolution Service can help you
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <Link to="/what-we-do/whm-program/">
                      <span className="title">
                        <h3>Working Holiday Maker program</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        See Information about our Working Holiday Maker program
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <Link to="/what-we-do/uhm-program">
                      <span className="title">
                        <h3>UHM program</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        Find out about the Unaccompanied Humanitarian Minors (UHM) program
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <Link to="/what-we-do/migration-strategy">
                      <span className="title">
                        <h3>Migration Strategy</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        A Migration System for Australia’s Future
                      </span>
                    </Link>
                  </div>

                  <div className="tile">
                    <Link to="/what-we-do/family-migration-program">
                      <span className="title">
                        <h3>Family Migration program</h3>
                        <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                      </span>
                      <span className="body">
                        Find out about the Family Migration program
                      </span>
                    </Link>
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

export default WhatWeDo;
