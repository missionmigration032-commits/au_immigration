import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

function ChangeInSituation() {
  return (
    <div id="contentBox">
      <div id="DeltaPlaceHolderMain" style={{ overflow: 'visible' }}>
        <div id="tab-pane-1" className="tab-pane fade in active">
          <div className="interactive-tile">
            <div className="hero-bg" style={{backgroundImage: 'url("/packing-boxes-writing-list.jpg")', marginTop: '0px'}}></div>
            
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
                      <h1>Changes in your situation</h1>
                      <div className="ms-rtestate-field" style={{display:'inline'}}>
                        <p>&zwnj;&zwnj;&zwnj;If your situation has changed or is about to change, you need to tell us because your visa might be affected. Changes in situation include changes to your passport or contact details, having a baby, and changes to your work or study. Choose a section below to look at the most common situations and how you can notify us.&zwnj;</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* End element: hero-block */}

            <div className="tiles-container container">
              <div className="warning-container" style={{marginRight: '0.3rem'}}>
                <div className="row">
                  <div className="col-xs-12">
                    <div className="warning-text">
                      <p>From 25 November 2024, paper Form 929 - Change of contact and/or passport details will no longer be available to use. Click on Passport details have changed, or Personal details have changed below for mor&zwnj;&zwnj;e information on how you can update your details with us.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex">
                <div className="tile">
                  <Link to="/change-in-situation/passport-details">
                    <span className="title">
                      <h3>Passport details have changed</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      Find out how to update your passport with us, including a change to your sex and/or gender.
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/change-in-situation/contact-details">
                    <span className="title">
                      <h3>Contact details have changed</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      Find out how to update your contact details with us, like your address, email and phone number.
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/change-in-situation/relationship-ended">
                    <span className="title">
                      <h3>Your relationship has changed</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      Relationship break-ups or the death of a partner can affect your visa situation. Find out more
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/change-in-situation/withdraw-visa-application">
                    <span className="title">
                      <h3>Withdraw an application</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      Withdraw your visa or citizenship application, or withdraw as a visa sponsor for someone else
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/change-in-situation/get-a-refund">
                    <span className="title">
                      <h3>Getting a refund</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      See how to apply
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/change-in-situation/death-in-family">
                    <span className="title">
                      <h3>Death of your sponsor</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      We need to know as soon as possible if someone included in your ongoing visa application dies
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/change-in-situation/had-a-baby">
                    <span className="title">
                      <h3>You had a child</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      Find out what you need to do
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/change-in-situation/study-situation">
                    <span className="title">
                      <h3>Study situation has changed</h3>
                      <span className="icon-arrow-right highlight"><ArrowRight size={20} /></span>
                    </span>
                    <span className="body">
                      To change courses, start date, welfare arrangements, defer, finish early, or are no longer studying
                    </span>
                  </Link>
                </div>

                <div className="tile">
                  <Link to="/change-in-situation/job-situation">
                    <span className="title">
                      <h3>Your job situation has changed</h3>
                      <span className="icon-arrow-right highlight"></span>
                    </span>
                    <span className="body">
                      You have changed jobs or job type, lost your job or want a new job
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

export default ChangeInSituation;
