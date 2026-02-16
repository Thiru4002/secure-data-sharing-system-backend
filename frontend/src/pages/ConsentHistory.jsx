import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

export default function ConsentHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [histories, setHistories] = useState({});
  const [historyLoading, setHistoryLoading] = useState({});

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
      await api.patch(`/consent/${consentId}/revoke`);
      await fetchHistory(dataId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke consent');
    }
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">Consent history</h2>
        <p>Expand each data item to see who has access and revoke approvals.</p>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading data...</p>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
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
                                      >
                                        Revoke
                                      </button>
                                    ) : (
                                      '-'
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
