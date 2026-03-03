import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function ConsentHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState([]);
  const [activityFilter, setActivityFilter] = useState('active');
  const [actionLoadingById, setActionLoadingById] = useState({});
  const [actionMessageById, setActionMessageById] = useState({});
  const [actionErrorById, setActionErrorById] = useState({});

  const loadGrantedConsents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/consent/approvals');
      const items = response.data.data || response.data || [];
      const approved = Array.isArray(items) ? items.filter((item) => item.status === 'approved') : [];
      setRows(approved);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load granted consents');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrantedConsents();
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (Object.keys(actionMessageById).length === 0) return undefined;
    const timer = setTimeout(() => setActionMessageById({}), 3000);
    return () => clearTimeout(timer);
  }, [actionMessageById]);

  const isCurrentlySharing = (entry) => {
    if (!entry?.expiryDate) return true;
    return new Date(entry.expiryDate).getTime() > Date.now();
  };

  const revokeConsent = async (consentId) => {
    if (!window.confirm('Revoke this consent?')) return;
    try {
      setMessage('');
      setError('');
      setActionMessageById((prev) => ({ ...prev, [consentId]: '' }));
      setActionErrorById((prev) => ({ ...prev, [consentId]: '' }));
      setActionLoadingById((prev) => ({ ...prev, [consentId]: true }));

      await api.patch(`/consent/${consentId}/revoke`);

      setMessage('Consent revoked successfully.');
      setActionMessageById((prev) => ({ ...prev, [consentId]: 'Revoked.' }));
      await loadGrantedConsents();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to revoke consent';
      setError(msg);
      setActionErrorById((prev) => ({ ...prev, [consentId]: msg }));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [consentId]: false }));
    }
  };

  const rowsSorted = useMemo(
    () => [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [rows]
  );
  const filteredRows = useMemo(() => {
    return rowsSorted.filter((entry) => {
      const sharingNow = isCurrentlySharing(entry);
      return activityFilter === 'active' ? sharingNow : !sharingNow;
    });
  }, [rowsSorted, activityFilter]);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">Granted consents</h2>
        <p>Shows only approved consents. Revoke access from active grants.</p>
      </div>

      <div className="card">
        <div className="chip-row">
          <button
            className={`btn ${activityFilter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActivityFilter('active')}
            type="button"
          >
            Active
          </button>
          <button
            className={`btn ${activityFilter === 'expired' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActivityFilter('expired')}
            type="button"
          >
            Expired
          </button>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p>Loading granted consents...</p>
        ) : rows.length === 0 ? (
          <div className="empty-state">No granted consents found.</div>
        ) : filteredRows.length === 0 ? (
          <div className="empty-state">No {activityFilter} granted consents found.</div>
        ) : (
          <>
            <div className="table-wrap desktop-only">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Service user</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Approved</th>
                  <th>Expiry</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((entry) => {
                  const sharingNow = isCurrentlySharing(entry);
                  return (
                    <tr key={entry._id}>
                      <td>{entry.data?.title || 'Unknown data'}</td>
                      <td>{entry.serviceUser?.name || 'Unknown'}</td>
                      <td>{entry.purpose || '-'}</td>
                      <td>
                        <span className={`status-pill ${sharingNow ? 'approved' : 'expired'}`}>
                          {sharingNow ? 'Approved' : 'Expired'}
                        </span>
                      </td>
                      <td>{entry.approvedAt ? new Date(entry.approvedAt).toLocaleDateString() : '-'}</td>
                      <td>{entry.expiryDate ? new Date(entry.expiryDate).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className="actions-row">
                          {sharingNow ? (
                            <button
                              className="btn btn-danger"
                              onClick={() => revokeConsent(entry._id)}
                              disabled={actionLoadingById[entry._id]}
                            >
                              {actionLoadingById[entry._id] ? 'Working...' : 'Revoke'}
                            </button>
                          ) : (
                            <button className="btn btn-secondary" disabled>
                              No action
                            </button>
                          )}
                          <Link
                            className="btn btn-secondary"
                            to={`/reports?reportedUserId=${encodeURIComponent(entry.serviceUser?.userId || entry.serviceUser?._id || '')}`}
                          >
                            Report user
                          </Link>
                        </div>
                        {actionMessageById[entry._id] && (
                          <div className="alert alert-success" style={{ marginTop: 10 }}>
                            {actionMessageById[entry._id]}
                          </div>
                        )}
                        {actionErrorById[entry._id] && (
                          <div className="alert alert-error" style={{ marginTop: 10 }}>
                            {actionErrorById[entry._id]}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            <div className="granted-consent-cards mobile-only">
              {filteredRows.map((entry) => {
                const sharingNow = isCurrentlySharing(entry);
                return (
                  <article key={entry._id} className="granted-consent-card">
                    <div className="section-head">
                      <strong>{entry.data?.title || 'Unknown data'}</strong>
                      <span className={`status-pill ${sharingNow ? 'approved' : 'expired'}`}>
                        {sharingNow ? 'Approved' : 'Expired'}
                      </span>
                    </div>
                    <div className="kv-row">
                      <span className="subtle">Service user</span>
                      <span>{entry.serviceUser?.name || 'Unknown'}</span>
                    </div>
                    <div className="kv-row">
                      <span className="subtle">Purpose</span>
                      <span>{entry.purpose || '-'}</span>
                    </div>
                    <div className="kv-row">
                      <span className="subtle">Approved</span>
                      <span>{entry.approvedAt ? new Date(entry.approvedAt).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="kv-row">
                      <span className="subtle">Expiry</span>
                      <span>{entry.expiryDate ? new Date(entry.expiryDate).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="actions-row">
                      {sharingNow ? (
                        <button
                          className="btn btn-danger"
                          onClick={() => revokeConsent(entry._id)}
                          disabled={actionLoadingById[entry._id]}
                        >
                          {actionLoadingById[entry._id] ? 'Working...' : 'Revoke'}
                        </button>
                      ) : (
                        <button className="btn btn-secondary" disabled>
                          No action
                        </button>
                      )}
                      <Link
                        className="btn btn-secondary"
                        to={`/reports?reportedUserId=${encodeURIComponent(entry.serviceUser?.userId || entry.serviceUser?._id || '')}`}
                      >
                        Report user
                      </Link>
                    </div>
                    {actionMessageById[entry._id] && (
                      <div className="alert alert-success">{actionMessageById[entry._id]}</div>
                    )}
                    {actionErrorById[entry._id] && (
                      <div className="alert alert-error">{actionErrorById[entry._id]}</div>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

