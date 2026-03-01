import { useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import api from './api/axiosConfig';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import UploadData from './pages/UploadData';
import DiscoverData from './pages/DiscoverData';
import OwnerProfile from './pages/OwnerProfile';
import ViewData from './pages/ViewData';
import MyRequests from './pages/MyRequests';
import Approvals from './pages/Approvals';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';
import MyData from './pages/MyData';
import ConsentHistory from './pages/ConsentHistory';
import ApprovedData from './pages/ApprovedData';
import IncomingDataRequests from './pages/IncomingDataRequests';

const EXPIRY_WARNING_DAYS = 3;

function RequireAuth({ user, children }) {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function AppShell({ user, onLogout }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts, setCounts] = useState({
    servicePendingRequests: 0,
    serviceExpiringConsents: 0,
    ownerIncomingPending: 0,
    ownerExpiringGrants: 0,
  });

  const daysToExpiry = (dateValue) => {
    if (!dateValue) return -1;
    const expiry = new Date(dateValue);
    return Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 1180) {
      document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  useEffect(() => {
    let active = true;

    const loadCounts = async () => {
      try {
        if (user?.role === 'service_user') {
          const [requestRes, consentRes] = await Promise.all([
            api.get('/data-requests/my'),
            api.get('/consent/my-requests'),
          ]);

          const requests = requestRes.data.data || requestRes.data || [];
          const consents = consentRes.data.data || consentRes.data || [];

          const pendingRequests = requests.filter((item) => item.status === 'pending').length;
          const expiringConsents = consents.filter((item) => {
            if (item.status !== 'approved') return false;
            const days = daysToExpiry(item.expiryDate);
            return days >= 0 && days <= EXPIRY_WARNING_DAYS;
          }).length;

          if (active) {
            setCounts((prev) => ({
              ...prev,
              servicePendingRequests: pendingRequests,
              serviceExpiringConsents: expiringConsents,
            }));
          }
        }

        if (user?.role === 'data_owner') {
          const [incomingRes, grantsRes] = await Promise.all([
            api.get('/data-requests/incoming'),
            api.get('/consent/approvals'),
          ]);

          const incoming = incomingRes.data.data || incomingRes.data || [];
          const grants = grantsRes.data.data || grantsRes.data || [];
          const consentApprovals = grants;

          const preRequestPending = incoming.filter((item) => item.status === 'pending').length;
          const consentPending = consentApprovals.filter((item) => item.status === 'pending').length;
          const incomingPending = preRequestPending + consentPending;
          const expiringGrants = grants.filter((item) => {
            if (item.status !== 'approved') return false;
            const days = daysToExpiry(item.expiryDate);
            return days >= 0 && days <= EXPIRY_WARNING_DAYS;
          }).length;

          if (active) {
            setCounts((prev) => ({
              ...prev,
              ownerIncomingPending: incomingPending,
              ownerExpiringGrants: expiringGrants,
            }));
          }
        }
      } catch {
        // Keep current values when an API call fails.
      }
    };

    loadCounts();
    const intervalId = setInterval(loadCounts, 30000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [user]);

  const navItems = useMemo(() => {
    if (user?.role === 'service_user') {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: 'DB' },
        { to: '/discover', label: 'Discover Owners', icon: 'DS' },
        { to: '/approved-data', label: 'Consents', icon: 'CT', badge: counts.serviceExpiringConsents },
        { to: '/profile', label: 'Profile', icon: 'PR' },
      ];
    }

    if (user?.role === 'data_owner') {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: 'DB' },
        { to: '/incoming-requests', label: 'Incoming Requests', icon: 'IR', badge: counts.ownerIncomingPending },
        { to: '/my-data', label: 'My Data', icon: 'MD' },
        { to: '/consent-history', label: 'Granted Consents', icon: 'GC', badge: counts.ownerExpiringGrants },
        { to: '/profile', label: 'Profile', icon: 'PR' },
      ];
    }

    if (user?.role === 'admin') {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: 'DB' },
        { to: '/admin', label: 'Control Center', icon: 'CC' },
        { to: '/profile', label: 'Profile', icon: 'PR' },
      ];
    }

    return [];
  }, [user, counts]);

  const summaryText = useMemo(() => {
    if (user?.role === 'service_user') {
      return `${counts.servicePendingRequests} pending requests, ${counts.serviceExpiringConsents} consents expiring soon`;
    }
    if (user?.role === 'data_owner') {
      return `${counts.ownerIncomingPending} incoming pending, ${counts.ownerExpiringGrants} grants expiring soon`;
    }
    return 'Manage your secure data workflow';
  }, [user, counts]);

  return (
    <div className="app-shell">
      <button
        className={`mobile-menu-btn ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={sidebarOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-badge">CV</div>
          <div>
            <strong>ClarityVault</strong>
            <p>{summaryText}</p>
          </div>
        </div>

        <div className="nav-group">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-link-text">{item.label}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <h4>{user?.name}</h4>
          <p>{user?.role?.replace('_', ' ')}</p>
          <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="content">
        <div className="topbar">
          <div>
            <h1>Secure Data Sharing</h1>
            <p className="subtle" style={{ margin: 4 }}>
              Consent-first platform for verifiable data access.
            </p>
          </div>
          <div className="user-chip">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
        </div>

        <Routes>
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/upload" element={<UploadData />} />
          <Route
            path="/discover"
            element={user?.role === 'data_owner' ? <Navigate to="/dashboard" replace /> : <DiscoverData />}
          />
          <Route
            path="/owners/:id"
            element={user?.role === 'service_user' ? <OwnerProfile /> : <Navigate to="/dashboard" replace />}
          />
          <Route path="/view/:id" element={<ViewData user={user} />} />
          <Route path="/requests" element={<MyRequests />} />
          <Route path="/approved-data" element={<ApprovedData />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/my-data" element={<MyData />} />
          <Route
            path="/consent-history"
            element={user?.role === 'data_owner' ? <ConsentHistory /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/data-requests"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/incoming-requests"
            element={user?.role === 'data_owner' ? <IncomingDataRequests /> : <Navigate to="/dashboard" replace />}
          />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    window.addEventListener('user-updated', handleUpdate);
    return () => window.removeEventListener('user-updated', handleUpdate);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="app-root" />;
  }

  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register setUser={setUser} />} />
        <Route
          path="/*"
          element={
            <RequireAuth user={user}>
              <AppShell user={user} onLogout={handleLogout} />
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
