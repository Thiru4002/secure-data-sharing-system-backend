import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

export default function ConsentHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState({});
  const [histories, setHistories] = useState({});
  const [historyLoading, setHistoryLoading] = useState({});
  const [actionLoadingById, setActionLoadingById] = useState({});
  const [actionMessageById, setActionMessageById] = useState({});
  const [actionErrorById, setActionErrorById] = useState({});

  const loadData = () => {
    setLoading(true);
    api
      .get('/data/my-data')
      .then((response) => setItems(response.data.data || response.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
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

  const toggleHistory = async (dataId) => {
    const next = !expanded[dataId];
    setExpanded((prev) => ({ ...prev, [dataId]: next }));
    if (next && !histories[dataId]) {
      await fetchHistory(dataId);
    }
  };

  const fetchHistory = async (dataId) => {
    setHistoryLoading((prev) => ({ ...prev, [dataId]: true }));
    try {
      const response = await api.get(`/consent/access-history?dataId=${dataId}`);
      const rows = response.data.data || response.data || [];
      setHistories((prev) => ({
        ...prev,
        [dataId]: rows,
      }));
    } catch (err) {
      setHistories((prev) => ({
        ...prev,
        [dataId]: { error: err.response?.data?.message || 'Failed to load history' },
      }));
    } finally {
      setHistoryLoading((prev) => ({ ...prev, [dataId]: false }));
    }
  };

  const revokeConsent = async (consentId, dataId) => {
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
      await fetchHistory(dataId);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to revoke consent';
      setError(msg);
      setActionErrorById((prev) => ({ ...prev, [consentId]: msg }));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [consentId]: false }));
    }
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">Consent history</h2>
        <p>Expand each data item to see who has access and revoke approvals.</p>
      </div>

      <div className="card">
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <p>Loading data...</p>
        ) : items.length === 0 ? (
          <p>No data uploaded yet.</p>
        ) : (
          <div className="grid" style={{ gap: 14 }}>
            {items.map((item) => {
              const history = histories[item._id];
              const isExpanded = !!expanded[item._id];
              const isLoading = !!historyLoading[item._id];
              return (
                <div key={item._id} className="card" style={{ boxShadow: 'none' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <div>
                      <h3 style={{ marginBottom: 6 }}>{item.title}</h3>
                      <p style={{ margin: 0 }}>{item.description}</p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => toggleHistory(item._id)}>
                      {isExpanded ? 'Hide history' : 'View history'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 16 }}>
                      {isLoading ? (
                        <p>Loading history...</p>
                      ) : history?.error ? (
                        <div className="alert alert-error">{history.error}</div>
                      ) : !history || history.length === 0 ? (
                        <p>No access requests yet.</p>
                      ) : (
                        <div className="table-wrap">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Service user</th>
                                <th>Purpose</th>
                                <th>Status</th>
                                <th>Requested</th>
                                <th>Expiry</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {history.map((entry) => (
                                <tr key={entry._id}>
                                  <td>{entry.serviceUser?.name || 'Unknown'}</td>
                                  <td>{entry.purpose || '-'}</td>
                                  <td>{entry.status}</td>
                                  <td>{new Date(entry.createdAt).toLocaleDateString()}</td>
                                  <td>{entry.expiryDate ? new Date(entry.expiryDate).toLocaleDateString() : '-'}</td>
                                  <td>
                                    {entry.status === 'approved' ? (
                                      <button
                                        className="btn btn-danger"
                                        onClick={() => revokeConsent(entry._id, item._id)}
                                        disabled={actionLoadingById[entry._id]}
                                      >
                                        {actionLoadingById[entry._id] ? 'Working...' : 'Revoke'}
                                      </button>
                                    ) : (
                                      '-'
                                    )}
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
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
