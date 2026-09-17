import React from 'react';
import { Link } from 'react-router-dom';

function VisaConditionsOverview() {
  return (
    <div id="contentBox">
      
      <div id="DeltaPlaceHolderMain" style={{ overflow: 'visible' }}>
        <div className="hero-block pad-bottom fancy">
          <div className="container">
            <div className="row">
              <div className="col-sm-6 hero-block-content">
                <div className="breadcrumbs-container dark">
                  <ol className="breadcrumb">
                    <li><Link to="/" id="ctlBreadcrumbsHome">Home</Link></li>
                    <li className="has-sub-menu navigation-node"><Link to="/visas">Visas</Link></li>
                    <li className="has-sub-menu navigation-node"><Link to="/visas/already-have-a-visa">When you have a visa</Link></li>
                  </ol>
                </div>
                <div className="hero-block-content-inner">
                  <h1 id="pageTitle">
                    Check visa details and conditions
                    <span className="sr-only" aria-hidden="true">
                      Check visa details and conditions
                    </span>
                  </h1>
                  <p></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden visible-xs tabs-container-mobile container">
          <div className="select-wrapper">
            <select className="select-tabs" name="tabs" defaultValue="/visas/already-have-a-visa/check-visa-details-and-conditions/overview">
              <option value="/visas/already-have-a-visa/check-visa-details-and-conditions/overview">Overview</option>
              <option value="/visas/already-have-a-visa/check-visa-details-and-conditions/check-conditions-online">Check conditions online (VEVO)</option>
              <option value="/visas/already-have-a-visa/check-visa-details-and-conditions/check-conditions-online/visa-holders">- Visa holders</option>
              <option value="/visas/already-have-a-visa/check-visa-details-and-conditions/check-conditions-online/for-organisations">- Organisations</option>
              <option value="/visas/already-have-a-visa/check-visa-details-and-conditions/see-your-visa-conditions">See visa conditions</option>
              <option value="/visas/already-have-a-visa/check-visa-details-and-conditions/conditions-list">Conditions list</option>
              <option value="/visas/already-have-a-visa/check-visa-details-and-conditions/waivers-and-permissions">Waivers and permissions</option>
              <option value="/visas/already-have-a-visa/check-visa-details-and-conditions/waivers-and-permissions/work-longer-than-6-months">- Applying for permission to work longer than six months with one employer</option>
              <option value="/visas/already-have-a-visa/check-visa-details-and-conditions/waivers-and-permissions/no-further-stay-waiver">- No further stay waiver</option>
              <option value="/visas/already-have-a-visa/check-visa-details-and-conditions/waivers-and-permissions/requesting-permission-to-travel">- Requesting permission to travel</option>
            </select>
          </div>
        </div>

        <div className="tabs-container">
          <div className="container hidden-xs">
            <ul className="tabs flex">
              <li className="tab active"><Link to="/visas/already-have-a-visa/check-visa-details-and-conditions/overview">Overview</Link></li>
              <li className="tab"><Link to="/visas/already-have-a-visa/check-visa-details-and-conditions/check-conditions-online">Check conditions online (VEVO)</Link></li>
              <li className="tab"><Link to="/visas/already-have-a-visa/check-visa-details-and-conditions/see-your-visa-conditions">See visa conditions</Link></li>
              <li className="tab"><Link to="/visas/already-have-a-visa/check-visa-details-and-conditions/conditions-list">Conditions list</Link></li>
              <li className="tab"><Link to="/visas/already-have-a-visa/check-visa-details-and-conditions/waivers-and-permissions">Waivers and permissions</Link></li>
            </ul>
          </div>
        </div>

        <div className="container">
          <div className="home-body">
            <div className="row">
            </div>
          </div>
        </div>

        <div id="tab-pane-1" className="tab-content tab-pane fade in active content">
          <div className="container warning-container">
            <div className="row">
              <div className="col-xs-12">
                <div className="warning-text no-margin">
                  <p>&zwnj;<strong>Temporary travel restrictions for Iranian Visitor visa holders.&nbsp;</strong>For more information see &zwnj;<a className="external" href="#" aria-label="Temporary travel restrictions webpage - External link" target="_blank" rel="noopener noreferrer">Temporary travel restrictions for Visitor visa holders with Iranian passports.</a></p>
                </div>
              </div>
            </div>
          </div>  
          
          <div className="container control-wrapper">
            <div className="row">
              <div className="col-sm-3 content-menu-container hidden">
                <ul className="content-menu">
                </ul>
              </div>
              <div className="col-sm-12 content-main">
                <div className="row">
                  <div className="col-xs-12 col-sm-4">
                    <div className="title-text">
                      <p>&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;Visa Entitlement Verification Online (VEVO) allows visa holders, employers, education providers and other organisations to check visa details and conditions.</p>
                      <p>VEVO tells you details relating to your current in-effect visa:</p>
                      <ul>
                        <li>which visa </li>
                        <li>the expiry date<br/></li>
                        <li>the must not arrive after date</li>
                        <li>the period of stay (how long you can stay)&nbsp;</li>
                        <li>conditions (what you can and can't do).</li>
                      </ul>
                      <p>VEVO is not able to provide any details relating to visas that are not ‘in-effect’. For example, if you hold a Bridging visa but your substantive visa has not yet expired.&zwnj;<br/></p>
                    </div>
                  </div>
                  <div className="col-xs-12 col-sm-8">
                    <div className="row video-meta">
                      <div className="col-xs-12 col-sm-12">
                        <img src="/study.jpg" alt="A laptop, a pen and a cup of coffee sit on a desk." style={{width: '100%'}} />
                        <br/>
                      </div>
                    </div>
                  </div>
                </div>
                <hr/>
                <div>
                  <div className="col-sm-4">
                    <h2>Long term&nbsp;residents</h2>
                    <p></p>
                    <p>If you migrated to Australia before 1990 and have not travelled out of Australia you might not have an electronic record of your visa. You can request an electronic record of your permanent visa at <Link to="/visas/permanent-resident/evidence-of-residency-status">Proof of permanent residence</Link>. You can then use VEVO to prove you have a permanent visa.<br/></p>
                    <p></p>
                    <p><Link to="/visas/already-have-a-visa/check-visa-details-and-conditions/check-conditions-online">Check conditions online</Link></p>
                  </div>
                  <div className="col-sm-4">
                    <h2>List of conditions for a visa</h2>
                    <p>For each visa, find which conditions always apply, and which may apply depending on a range of criteria such as your country of origin.<br/></p>
                    <p><Link to="/visas/already-have-a-visa/check-visa-details-and-conditions/see-your-visa-conditions">See visa conditions</Link></p>
                  </div>
                  <div className="col-sm-4">
                    <h2>VEVO<br/></h2>
                    <p><Link className="btn btn-block btn-cta external" to="/evo/firstParty" target="_blank" rel="noopener noreferrer">Check your own visa details</Link></p>
                    <p><a className="btn btn-block btn-cta external" href="#" target="_blank" rel="noopener noreferrer">Organisation account holder VEVO login</a></p>
                    <p><a className="btn btn-block btn-cta external" href="#" target="_blank" rel="noopener noreferrer">Register as a VEVO organisation</a></p>
                  </div>
                </div> 
                <br/> 
                <br/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisaConditionsOverview;
