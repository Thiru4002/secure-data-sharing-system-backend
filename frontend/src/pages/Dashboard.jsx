import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [serviceSummary, setServiceSummary] = useState(null);
  const [ownerSummary, setOwnerSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const daysToExpiry = (dateValue) => {
      if (!dateValue) return -1;
      const expiry = new Date(dateValue);
      return Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    };

    const loadDashboard = async () => {
      setLoading(true);
      try {
        if (user?.role === 'admin') {
          const response = await api.get('/admin/statistics');
          setStats(response.data.data);
          setServiceSummary(null);
          setOwnerSummary(null);
        }

        if (user?.role === 'service_user') {
          const [consentRes, preRes] = await Promise.all([
            api.get('/consent/my-requests'),
            api.get('/data-requests/my'),
          ]);
          const consents = consentRes.data.data || consentRes.data || [];
          const preRequests = preRes.data.data || preRes.data || [];

          const summary = {
            pendingRequests: 0,
            expiringConsents: 0,
            activeConsents: 0,
            sharedDataItems: 0,
          };

          preRequests.forEach((item) => {
            if (item.status === 'pending') summary.pendingRequests += 1;
          });

          consents.forEach((item) => {
            if (item.status !== 'approved') return;
            const days = daysToExpiry(item.expiryDate);
            if (days < 0) return;
            if (days <= 3) summary.expiringConsents += 1;
            else summary.activeConsents += 1;
            if (item.data) summary.sharedDataItems += 1;
          });

          setServiceSummary(summary);
          setOwnerSummary(null);
          setStats(null);
        }

        if (user?.role === 'data_owner') {
          const [incomingRes, grantsRes, dataRes] = await Promise.all([
            api.get('/data-requests/incoming'),
            api.get('/consent/approvals'),
            api.get('/data/my-data'),
          ]);

          const incoming = incomingRes.data.data || incomingRes.data || [];
          const grants = grantsRes.data.data || grantsRes.data || [];
          const data = dataRes.data.data || dataRes.data || [];

          const summary = {
            pendingRequests: 0,
            activeGrants: 0,
            uploadedItems: Array.isArray(data) ? data.length : 0,
            expiringConsents: 0,
          };

          const preRequestPending = incoming.filter((item) => item.status === 'pending').length;
          const consentPending = grants.filter((item) => item.status === 'pending').length;
          summary.pendingRequests = preRequestPending + consentPending;

          grants.forEach((item) => {
            if (item.status !== 'approved') return;
            const days = daysToExpiry(item.expiryDate);
            if (days < 0) return;
            if (days <= 3) summary.expiringConsents += 1;
            else summary.activeGrants += 1;
          });

          setOwnerSummary(summary);
          setServiceSummary(null);
          setStats(null);
        }
      } catch {
        setStats(null);
        setServiceSummary(null);
        setOwnerSummary(null);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
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

      {user.role === 'service_user' && (
        <div className="card">
          <h3>Your activity summary</h3>
          {loading && !serviceSummary ? (
            <p>Loading summary...</p>
          ) : serviceSummary ? (
            <div className="grid grid-2">
              <div className="stat"><span>Pending requests</span><strong>{serviceSummary.pendingRequests}</strong></div>
              <div className="stat"><span>Consents expiring</span><strong>{serviceSummary.expiringConsents}</strong></div>
              <div className="stat"><span>Active consents</span><strong>{serviceSummary.activeConsents}</strong></div>
              <div className="stat"><span>Data shared with you</span><strong>{serviceSummary.sharedDataItems}</strong></div>
            </div>
          ) : (
            <p>Unable to load summary.</p>
          )}
        </div>
      )}

      {user.role === 'data_owner' && (
        <div className="card">
          <h3>Your data control summary</h3>
          {loading && !ownerSummary ? (
            <p>Loading summary...</p>
          ) : ownerSummary ? (
            <div className="grid grid-2">
              <div className="stat"><span>Pending requests</span><strong>{ownerSummary.pendingRequests}</strong></div>
              <div className="stat"><span>Active grants</span><strong>{ownerSummary.activeGrants}</strong></div>
              <div className="stat"><span>Data items uploaded</span><strong>{ownerSummary.uploadedItems}</strong></div>
              <div className="stat"><span>Consents expiring</span><strong>{ownerSummary.expiringConsents}</strong></div>
            </div>
          ) : (
            <p>Unable to load summary.</p>
          )}
        </div>
      )}

      <div className="card">
        <h3>Quick actions</h3>
        <div className="grid grid-2" style={{ marginTop: 12 }}>
          {user.role === 'data_owner' && (
            <>
              <Link className="btn btn-primary" to="/incoming-requests">
                Review requests
              </Link>
              <Link className="btn btn-secondary" to="/my-data">
                My data
              </Link>
              <Link className="btn btn-secondary" to="/consent-history">
                Granted consents
              </Link>
              <Link className="btn btn-secondary" to="/upload">Upload data</Link>
              <Link className="btn btn-secondary" to="/reports">Report user</Link>
            </>
          )}
          {user.role === 'service_user' && (
            <>
              <Link className="btn btn-primary" to="/discover">
                Discover owners
              </Link>
              <Link className="btn btn-secondary" to="/approved-data">
                My consents
              </Link>
              <Link className="btn btn-secondary" to="/reports">Report user</Link>
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
          Use discover to browse owners, open their profile, request uploaded data, or submit a pre-request
          when data is not uploaded yet.
        </p>
      </div>
    </div>
  );
}
