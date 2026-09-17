import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

function SettlingInAustralia() {
  return (
    <div id="contentBox">
      <div id="DeltaPlaceHolderMain" style={{ overflow: 'visible' }}>
        <div id="tab-pane-1" className="tab-pane fade in active">
          <div className="interactive-tile">
            <div className="hero-bg" style={{backgroundImage: 'url("/Sunset-beach.jpg")', marginTop: '0px'}}></div>
            
            <div className="hero-block fancy">
              <div className="container">
                <div className="row">
                  <div className="col-sm-6 hero-block-content">
                    <div className="breadcrumbs-container dark">
                      <ol className="breadcrumb">
                        <li><Link to="/">Home</Link></li>
                      </ol>
                    </div>
                    <div className="hero-block-content-inner">
                      <h1>Settling in Australia</h1>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="tiles-container container">
              <div className="flex">
                <div className="tile">
                  <Link to="/settling-in-australia/settle-in-australia/overview">
                    <span className="title">
                      <h3>Settle in Australia</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      With the right support, refugees can make extraordinary contributions and become outstanding members
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/settling-in-australia/amep/about-the-program">
                    <span className="title">
                      <h3>Learning English</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      The Adult Migrant English Program (AMEP) provides free English language tuition to eligible migrants
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/settling-in-australia/helping-refugees/overview">
                    <span className="title">
                      <h3>Helping refugees</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      Resettling refugees and vulnerable people in humanitarian need.
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/settling-in-australia/youth-transition-support-services/overview">
                    <span className="title">
                      <h3>Supporting migrant youth</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      Support services for young migrants and refugees.
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/settling-in-australia/ausco/overview">
                    <span className="title">
                      <h3>Going to Australia</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      Advice for refugees about the journey to Australia (AUSCO).
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/settling-in-australia/humanitarian-settlement-program">
                    <span className="title">
                      <h3>Becoming self-reliant</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      Building the skills and knowledge refugees need to become self-reliant and active members (HSP).
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/settling-in-australia/sets-program">
                    <span className="title">
                      <h3>Supporting vulnerable refugees</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      Grants for humanitarian entrants, other eligible permanent migrants and their communities (SETS).
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/settling-in-australia/settlement-reports">
                    <span className="title">
                      <h3>Settlement reports</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      Statistical data on permanent arrivals to Australia to help government and community agencies.
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/settling-in-australia/settlement-policy-and-reform">
                    <span className="title">
                      <h3>Settlement Policy and Reform</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      Policy on settlement reform and improvement of data capture and analysis to measure outcomes
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettlingInAustralia;
