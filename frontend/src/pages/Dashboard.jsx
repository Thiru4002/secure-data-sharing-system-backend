import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      setLoading(true);
      api
        .get('/admin/statistics')
        .then((response) => setStats(response.data.data))
        .catch(() => setStats(null))
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">Welcome, {user.name}</h2>
        <p>Role: {user.role.replace('_', ' ')}</p>
        <p>Email verified: {user.isEmailVerified ? 'Yes' : 'No'}</p>
      </div>

      {user.role === 'admin' && (
        <div className="card">
          <h3>System snapshot</h3>
          {loading ? (
            <p>Loading statistics...</p>
          ) : stats ? (
            <div className="grid grid-3">
              <div className="stat">
                <span>Total users</span>
                <strong>{stats.totalUsers}</strong>
              </div>
              <div className="stat">
                <span>Total data</span>
                <strong>{stats.totalData}</strong>
              </div>
              <div className="stat">
                <span>Total consents</span>
                <strong>{stats.totalConsents}</strong>
              </div>
            </div>
          ) : (
            <p>Unable to load statistics.</p>
          )}
        </div>
      )}

      <div className="card">
        <h3>Quick actions</h3>
        <div className="grid grid-2" style={{ marginTop: 12 }}>
          {user.role === 'data_owner' && (
            <>
              <Link className="btn btn-primary" to="/upload">
                Upload data
              </Link>
              <Link className="btn btn-secondary" to="/my-data">
                My data
              </Link>
              <Link className="btn btn-secondary" to="/approvals">
                Review approvals
              </Link>
              <Link className="btn btn-secondary" to="/consent-history">
                Consent history
              </Link>
            </>
          )}
          {user.role === 'service_user' && (
            <>
              <Link className="btn btn-primary" to="/discover">
                Discover data
              </Link>
              <Link className="btn btn-secondary" to="/requests">
                Track requests
              </Link>
              <Link className="btn btn-secondary" to="/approved-data">
                Approved data
              </Link>
            </>
          )}
          {user.role === 'admin' && (
            <>
              <Link className="btn btn-primary" to="/admin">
                Admin hub
              </Link>
              <Link className="btn btn-secondary" to="/discover">
                Browse data
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Next steps</h3>
        <p>
          Use discover to search by user ID, UUID, or reference description. Every interaction is tracked
          in the audit log.
        </p>
      </div>
    </div>
  );
}
