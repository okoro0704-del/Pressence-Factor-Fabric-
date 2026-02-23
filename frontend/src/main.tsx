import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Sentinel from './pages/Sentinel';
import Vitalization from './pages/Vitalization';
import Nations from './pages/Nations';
import Lexicon from './pages/Lexicon';
// import MasterDashboard from './pages/MasterDashboard'; // Temporarily disabled due to encoding issues
import './styles/sovereignPortal.css';
import './styles/sovereignPortalExtended.css';
import './styles/masterDashboard.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sentinel" element={<Sentinel />} />
        <Route path="/vitalization" element={<Vitalization />} />
        <Route path="/nations" element={<Nations />} />
        <Route path="/lexicon" element={<Lexicon />} />
        {/* <Route path="/master-dashboard" element={<MasterDashboard />} /> */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);

