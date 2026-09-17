import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ArrowLeft, Search, ChevronRight } from "lucide-react";
import logoHA from "../assets/images/logo-ha.png";

const menuData = [
  { label: "Home", path: "/" },
  {
    label: "Entering and leaving Australia",
    path: "/entering-and-leaving-australia",
    children: [
      {
        label: "Entering Australia",
        path: "/entering-and-leaving-australia/entering-australia",
      },
      {
        label: "Leaving Australia",
        path: "/entering-and-leaving-australia/leaving-australia",
      },
      {
        label: "Business travel card",
        path: "/entering-and-leaving-australia/business-travel-card",
      },
      {
        label: "New Zealand citizens",
        path: "/entering-and-leaving-australia/new-zealand-citizens",
      },
      {
        label: "Requesting your travel records",
        path: "/entering-and-leaving-australia/request-movement-records",
      },
      {
        label: "Travelling as a dual citizen",
        path: "/entering-and-leaving-australia/traveling-as-a-dual-citizen",
      },
      {
        label: "Travelling and your visa",
        path: "/entering-and-leaving-australia/travelling-and-your-visa",
        children: [
          {
            label: "Travel on a bridging visa",
            path: "/entering-and-leaving-australia/travelling-and-your-visa/travel-on-a-bridging-visa",
          },
          {
            label: "Travel while your visa is being processed",
            path: "/entering-and-leaving-australia/travelling-and-your-visa/travel-while-your-visa-is-being-processed",
          },
        ],
      },
      {
        label: "United States Global Entry program",
        path: "/entering-and-leaving-australia/global-entry-program",
      },
    ],
  },
  {
    label: "Visas",
    path: "/visas",
    children: [
      {
        label: "Getting a visa",
        path: "/visas/getting-a-visa",
        children: [
          {
            label: "Explore visa options",
            path: "/visas/getting-a-visa/visa-finder",
          },
          {
            label: "List of all visas",
            path: "/visas/getting-a-visa/visa-listing",
          },
          {
            label: "Visa processing times",
            path: "/visas/getting-a-visa/visa-processing-times",
          },
          {
            label: "Changing visas",
            path: "/visas/getting-a-visa/moving-between-visas",
          },
          {
            label: "Fees and charges for visas",
            path: "/visas/getting-a-visa/fees-and-charges",
          },
          {
            label: "Check twice submit once",
            path: "/visas/getting-a-visa/check-twice-submit-once",
          },
        ],
      },
      { label: "Working in Australia", path: "/visas/working-in-australia" },
      {
        label: "Employing or sponsoring workers",
        path: "/visas/employing-and-sponsoring-someone",
        children: [
          {
            label: "Employing overseas workers",
            path: "/visas/employing-and-sponsoring-someone/employing-overseas-workers",
          },
          {
            label: "Existing sponsors",
            path: "/visas/employing-and-sponsoring-someone/existing-sponsors",
          },
          {
            label: "Labour Agreements",
            path: "/visas/employing-and-sponsoring-someone/labour-agreements",
          },
        ],
      },
      {
        label: "Bringing someone",
        path: "/visas/bringing-someone",
        children: [
          {
            label: "Bringing partner or family",
            path: "/visas/bringing-someone/bringing-partner-or-family",
          },
          {
            label: "Bringing for activities",
            path: "/visas/bringing-someone/bringing-for-activities",
          },
        ],
      },
      {
        label: "When you have a visa",
        path: "/visas/already-have-a-visa",
        children: [
          {
            label: "Check visa details and conditions",
            path: "/visas/already-have-a-visa/check-visa-details-and-conditions",
          },
          { label: "ImmiCard", path: "/visas/already-have-a-visa/immicard" },
        ],
      },
      {
        label: "Your visa is expiring or has expired",
        path: "/visas/visa-about-to-expire",
      },
      { label: "Permanent resident (PR)", path: "/visas/permanent-resident" },
      { label: "Cancelling visas", path: "/visas/cancelling-a-visa" },
      {
        label: "Domestic and family violence and your visa",
        path: "/visas/domestic-family-violence-and-your-visa",
      },
    ],
  },
  {
    label: "Australian citizenship",
    path: "/citizenship",
    children: [
      {
        label: "Learn about Australian citizenship",
        path: "/citizenship/what-does-it-mean",
      },
      {
        label: "Become an Australian citizen",
        path: "/citizenship/become-a-citizen",
      },
      {
        label: "Citizenship test and interview",
        path: "/citizenship/test-and-interview",
      },
      { label: "Citizenship ceremony", path: "/citizenship/ceremony" },
      {
        label: "Evidence of citizenship and certificates",
        path: "/citizenship/certificate",
      },
      {
        label: "Give up Australian citizenship",
        path: "/citizenship/give-up-citizenship",
      },
      {
        label: "Celebrating citizenship",
        path: "/citizenship/celebrating-citizenship",
      },
      {
        label: "Citizenship processing times",
        path: "/citizenship/citizenship-processing-times",
      },
      {
        label: "Confirming Australian Citizenship",
        path: "/citizenship/confirming-australian-citizenship",
      },
    ],
  },
  { label: "Change in your situation", path: "/change-in-situation" },
  { label: "What we do", path: "/what-we-do" },
  { label: "Settling in Australia", path: "/settling-in-australia" },
  {
    label: "Help and support",
    path: "/help-support",
    children: [
      { label: "Departmental forms", path: "/help-support/departmental-forms" },
      { label: "Glossary", path: "/help-support/glossary" },
      { label: "Our online services", path: "/help-support/tools" },
      {
        label: "Meeting our requirements",
        path: "/help-support/meeting-our-requirements",
        children: [
          {
            label: "Health",
            path: "/help-support/meeting-our-requirements/health",
          },
          {
            label: "Character",
            path: "/help-support/meeting-our-requirements/character",
          },
          {
            label: "English language",
            path: "/help-support/meeting-our-requirements/english-language",
          },
          {
            label: "Biometrics",
            path: "/help-support/meeting-our-requirements/biometrics",
          },
          {
            label: "Providing accurate information",
            path: "/help-support/meeting-our-requirements/providing-accurate-information",
          },
          {
            label: "Australian values",
            path: "/help-support/meeting-our-requirements/australian-values",
          },
        ],
      },
      {
        label: "Who can help with your application?",
        path: "/help-support/who-can-help-with-your-application",
      },
      {
        label: "Applying online or on paper",
        path: "/help-support/applying-online-or-on-paper",
      },
      { label: "Visa scams", path: "/help-support/visa-scams" },
      {
        label: "Migrant worker protections",
        path: "/help-support/migrant-worker-protections",
      },
      { label: "Contact us", path: "/help-support/contact-us" },
      { label: "Popular questions", path: "/help-support/popular-questions" },
    ],
  },
  { label: "News and media", path: "/news-media" },
];

const popularSearches = ["Visa", "Citizenship", "Form 80", "Form 888"];

function MenuItem({ item, onNavigate, depth = 0, forceOpenPath }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  useEffect(() => {
    if (forceOpenPath === item.path) {
      setIsOpen(true);
    } else if (forceOpenPath === null) {
      // Optional: close when menu is fully closed, but keeping it as is works too
    }
  }, [forceOpenPath, item.path]);

  const handleClick = (e) => {
    e.preventDefault();
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      onNavigate(item.path);
    }
  };

  const handleBack = () => {
    setIsOpen(false);
  };

  return (
    <li className={`${hasChildren ? "has-sub-menu" : ""} ${isOpen ? "open" : ""}`.trim()}>
      <a
        href={item.path}
        onClick={handleClick}
        aria-expanded={hasChildren ? isOpen : undefined}
      >
        {item.label}
        {hasChildren && <ChevronRight size={14} className="submenu-arrow" />}
      </a>
      {hasChildren && (
        <ul className="sub-menu">
          <li
            className="back-btn"
            style={{ display: isOpen ? "block" : "none" }}
          >
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleBack();
              }}
            >
              <ArrowLeft size={14} /> Back
            </a>
          </li>
          {item.children.map((child, idx) => (
            <MenuItem
              key={idx}
              item={child}
              onNavigate={onNavigate}
              depth={depth + 1}
              forceOpenPath={forceOpenPath}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previousSearches, setPreviousSearches] = useState([]);
  const [forceOpenPath, setForceOpenPath] = useState(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpenNavMenu = (e) => {
      setForceOpenPath(null); // Reset first so it triggers effect even if same path
      setTimeout(() => {
        setMenuOpen(true);
        setForceOpenPath(e.detail);
      }, 10);
    };
    window.addEventListener('openNavMenu', handleOpenNavMenu);
    return () => window.removeEventListener('openNavMenu', handleOpenNavMenu);
  }, []);

  const handleMenuOpen = () => {
    setMenuOpen(true);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const handleSearchOpen = () => {
    setSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
  };

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleNavigate = useCallback(
    (path) => {
      setMenuOpen(false);
      navigate(path);
    },
    [navigate],
  );

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      const term = searchQuery.trim();
      setPreviousSearches((prev) => {
        const filtered = prev.filter((s) => s !== term);
        return [term, ...filtered].slice(0, 5);
      });
      setSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(term)}`);
      setSearchQuery("");
    }
  }, [searchQuery, navigate]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
      handleSearchClose();
    }
  };

  const handlePopularSearch = (term) => {
    setSearchQuery(term);
    setPreviousSearches((prev) => {
      const filtered = prev.filter((s) => s !== term);
      return [term, ...filtered].slice(0, 5);
    });
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  // Close menu on overlay click or Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (menuOpen) handleMenuClose();
        if (searchOpen) handleSearchClose();
      }
    };
    
    const handleOutsideClick = (e) => {
      if (menuOpen) {
        // Find if click was inside the menu container or on the toggle button
        const menuContainer = document.querySelector('.side-navigation');
        const menuBtn = document.querySelector('.menu-open-btn');
        if (
          menuContainer && !menuContainer.contains(e.target) &&
          menuBtn && !menuBtn.contains(e.target)
        ) {
          handleMenuClose();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleOutsideClick); // Capture all outside clicks
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [menuOpen, searchOpen]);

  return (
    <>
    <header>
      <div className="header-bar">
        {/* Nav Overlay */}
        <div
          className={`nav-overlay ${menuOpen ? "nav-overlay-active" : ""}`}
          onClick={handleMenuClose}
        ></div>

        {/* Navigation */}
        <nav>
          <button
            type="button"
            className="menu-open-btn"
            aria-expanded={menuOpen}
            onClick={handleMenuOpen}
          >
            <Menu size={22} color="#FFFFFF" />
            <span id="ctlMenuLabel">Menu</span>
          </button>

          <div
            className={`side-navigation ${menuOpen ? "open" : ""}`.trim()}
            aria-hidden={!menuOpen}
          >
            <div className="control-row">
              <button
                type="button"
                className="menu-close-btn"
                onClick={handleMenuClose}
              >
                <X size={20} /> <span id="ctlMenuLabel2">Menu</span>
              </button>
              <a
                href="#"
                className="menu-portfolio-btn"
              >
                <ArrowLeft size={16} className="icon-arrow-left" />
                <div className="text" id="ctlMenuHomeLabel">
                  Home Affairs <br className="hidden visible-xs" />
                  Portfolio
                </div>
              </a>
            </div>

            <ul className="menu">
              {menuData.map((item, idx) => (
                <MenuItem key={idx} item={item} onNavigate={handleNavigate} forceOpenPath={forceOpenPath} />
              ))}
            </ul>
          </div>
        </nav>

        {/* Logo */}
        <div id="top" className="logo-container">
          <Link to="/">
            <img
              src={logoHA}
              alt="Australian Government - Department of Home Affairs"
              className="logo hidden-print"
              title="home"
            />
            <span className="logo-text" id="ctlLogoTextLabel">
              Immigration and citizenship
            </span>
          </Link>
        </div>

        {/* Search */}
        <div className="search-container">
          <button
            type="button"
            className="search-btn"
            aria-label="search"
            onClick={handleSearchOpen}
          >
            <Search size={20} />
            <span className="sr-only">Search</span>
          </button>

          <div
            className="search-overlay primary"
            style={{ 
              display: searchOpen ? "block" : "none",
              position: "fixed",
              top: 0, left: 0, right: 0,
              backgroundColor: "#fff",
              zIndex: 1002,
              padding: 0,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              maxHeight: "100vh",
              overflowY: "auto"
            }}
          >
            <span className="sr-only">pop-up content starts</span>
            <button
              type="button"
              className="close-search-overlay-btn"
              onClick={handleSearchClose}
            >
              <ArrowLeft size={20} />
              <span id="ctlSearchBacklabel">Back</span>
            </button>

            <div className="search-overlay-content">
              <div className="search-form">
                <label htmlFor="search-input" className="sr-only">
                  Search
                </label>
                <input
                  ref={searchInputRef}
                  type="search"
                  id="search-input"
                  name="search"
                  className="search-input"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                <button
                  type="button"
                  className="search-submit"
                  onClick={handleSearch}
                >
                  <Search size={18} />
                  <span className="sr-only">Search</span>
                </button>
              </div>

              <div className="search-metadata-row">
                <div className="search-metadata-col">
                  <div className="search-metadata">
                    <h3 id="ctlSearchPopularLabel">Popular searches</h3>
                    <ul className="popular-searches">
                      {popularSearches.map((term, idx) => (
                        <li key={idx}>
                          <a
                            href="#"
                            className="popular-term"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePopularSearch(term);
                            }}
                          >
                            {term}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="search-metadata-col">
                  <div className="search-metadata">
                    <h3 id="ctlSearchPreviousLabel">Your previous searches</h3>
                    <ul className="previous-searches">
                      {previousSearches.map((term, idx) => (
                        <li key={idx}>
                          <a
                            href="#"
                            className="popular-term"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePopularSearch(term);
                            }}
                          >
                            {term}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <span className="sr-only">pop-up content ends</span>
          </div>
        </div>
      </div>
    </header>
      {/* Start top links */}
      <div className="toplinks-container text-right hidden-print">
        <div className="container-fluid">
          <div className="menu-color-extender">&zwnj;&zwnj;&nbsp;</div>
          <ul className="toplinks-content">
            <li> 
              <Link to="/lusc/login" aria-label="ImmiAccount">ImmiAccount</Link> 
            </li>
            <li> 
              <Link to="/visas/already-have-a-visa/check-visa-details-and-conditions/overview">Visa Entitlement Verification Online (VEVO)</Link> 
            </li>
            <li> 
              <a href="http://trs.border.gov.au/" target="_blank" rel="noopener noreferrer" aria-label="My Tourist Refund Scheme (opens in new window)">My Tourist Refund Scheme (TRS)</a> &zwnj;<br/>
            </li>
          </ul>
        </div>
      </div>
      {/* End top links */}
    </>
  );
}

export default Header;
