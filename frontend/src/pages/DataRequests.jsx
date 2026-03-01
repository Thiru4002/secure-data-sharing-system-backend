import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function DataRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRequests = () => {
    setLoading(true);
    api
      .get('/data-requests/my')
      .then((response) => {
        const data = response.data.data || response.data || [];
        setRequests(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const summary = useMemo(() => {
    const counts = { pending: 0, fulfilled: 0, rejected: 0 };
    requests.forEach((item) => {
      if (counts[item.status] !== undefined) counts[item.status] += 1;
    });
    return counts;
  }, [requests]);
  const activeStatus = searchParams.get('status') || 'pending';
  const filteredRequests = useMemo(
    () => requests.filter((item) => item.status === activeStatus),
    [requests, activeStatus]
  );

  const setStatusFilter = (status) => {
    setSearchParams({ status });
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">My pre-data requests</h2>
        <p>Requests you sent to data owners before data is uploaded.</p>
      </div>
      <div className="card">
        <div className="grid grid-3" style={{ gap: 12 }}>
          <div className="card" style={{ boxShadow: 'none' }}>
            <h4>Pending</h4>
            <p>{summary.pending}</p>
          </div>
          <div className="card" style={{ boxShadow: 'none' }}>
            <h4>Fulfilled</h4>
            <p>{summary.fulfilled}</p>
          </div>
          <div className="card" style={{ boxShadow: 'none' }}>
            <h4>Rejected</h4>
            <p>{summary.rejected}</p>
          </div>
        </div>
      </div>
      <div className="card">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {['pending', 'fulfilled', 'rejected'].map((status) => (
            <button
              key={status}
              className={activeStatus === status ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        {loading ? (
          <p>Loading requests...</p>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">No requests for this filter. Start from Discover.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Requested Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Linked Data</th>
                  <th>Requested</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((item) => (
                  <tr key={item._id}>
                    <td>{item.owner?.name || 'Unknown'}</td>
                    <td>{item.requestedTitle || '-'}</td>
                    <td>{item.requestedCategory || '-'}</td>
                    <td><span className={`status-pill ${item.status}`}>{item.status}</span></td>
                    <td>{item.linkedData?.title || '-'}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
