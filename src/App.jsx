import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import VisaConditionsOverview from "./pages/VisaConditionsOverview";
import ChangeInSituation from "./pages/ChangeInSituation";
import WhatWeDo from "./pages/WhatWeDo";
import SettlingInAustralia from "./pages/SettlingInAustralia";
import VevoFirstParty from "./pages/VevoFirstParty";
import ImmiAccountLogin from "./pages/ImmiAccountLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import UserPortal from "./pages/UserPortal";
function App() {
  const location = useLocation();
  const isVevo = location.pathname.startsWith('/evo/firstParty');
  const isImmiLogin = location.pathname.startsWith('/lusc/login');
  const isStandalone = isVevo || isImmiLogin;

  return (
    <div className="app">
      {!isStandalone && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/visas/already-have-a-visa/check-visa-details-and-conditions/overview" element={<VisaConditionsOverview />} />
          <Route path="/what-we-do" element={<WhatWeDo />} />
          <Route path="/change-in-situation" element={<ChangeInSituation />} />
          <Route path="/settling-in-australia" element={<SettlingInAustralia />} />
          <Route path="/evo/firstParty" element={<VevoFirstParty />} />
          <Route path="/lusc/login" element={<ImmiAccountLogin />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'employe']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user-portal" 
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserPortal />
              </ProtectedRoute>
            } 
          />
          
          {/* Unimplemented nav routes → redirect to home */}
          <Route path="/entering-and-leaving-australia/*" element={<Navigate to="/" replace />} />
          <Route path="/visas/*" element={<Navigate to="/" replace />} />
          <Route path="/citizenship/*" element={<Navigate to="/" replace />} />
          <Route path="/help-support/*" element={<Navigate to="/" replace />} />
          <Route path="/news-media/*" element={<Navigate to="/" replace />} />
          <Route path="/conditions-of-use" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isStandalone && <Footer />}
    </div>
  );
}

export default App;
