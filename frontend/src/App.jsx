import { useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import UploadData from './pages/UploadData';
import DiscoverData from './pages/DiscoverData';
import ViewData from './pages/ViewData';
import MyRequests from './pages/MyRequests';
import Approvals from './pages/Approvals';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';
import MyData from './pages/MyData';
import ConsentHistory from './pages/ConsentHistory';
import ApprovedData from './pages/ApprovedData';

function RequireAuth({ user, children }) {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function AppShell({ user, onLogout }) {
  const navItems = useMemo(() => {
    const items = [
      { to: '/dashboard', label: 'Overview' },
      { to: '/profile', label: 'Profile' },
    ];
    if (user?.role !== 'data_owner') {
      items.splice(1, 0, { to: '/discover', label: 'Discover' });
    }
    if (user?.role === 'data_owner') {
      items.splice(1, 0, { to: '/upload', label: 'Upload' });
      items.splice(2, 0, { to: '/my-data', label: 'My Data' });
      items.push({ to: '/reports', label: 'Reports' });
      items.push({ to: '/approvals', label: 'Approvals' });
      items.push({ to: '/consent-history', label: 'Consent History' });
    }
    if (user?.role === 'service_user') {
      items.push({ to: '/reports', label: 'Reports' });
      items.push({ to: '/requests', label: 'My Requests' });
      items.push({ to: '/approved-data', label: 'Approved Data' });
    }
    if (user?.role === 'admin') {
      items.push({ to: '/admin', label: 'Admin' });
    }
    return items;
  }, [user]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-badge">CV</div>
          <span>ClarityVault</span>
        </div>
        <div className="nav-group">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
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
      <main className="content">
        <div className="topbar">
          <div>
            <h1>Secure Data Sharing</h1>
            <p className="subtle" style={{ margin: 4 }}>
              Consent-first workflows for real-world data.
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
            element={
              user?.role === 'data_owner' ? <Navigate to="/dashboard" replace /> : <DiscoverData />
            }
          />
          <Route path="/view/:id" element={<ViewData user={user} />} />
          <Route path="/requests" element={<MyRequests />} />
          <Route path="/approved-data" element={<ApprovedData />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/my-data" element={<MyData />} />
          <Route path="/consent-history" element={<ConsentHistory />} />
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
