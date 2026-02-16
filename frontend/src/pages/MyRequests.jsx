import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/consent/my-requests')
      .then((response) => {
        const data = response.data.data?.data || response.data.data || response.data || [];
        setRequests(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load requests'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">My access requests</h2>
        <p>Track your pending, approved, rejected, or revoked requests.</p>
      </div>
      <div className="card">
        {loading ? (
          <p>Loading requests...</p>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : requests.length === 0 ? (
          <p>No requests found. Send a request from Discover to see it here.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Owner</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Requested</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((item) => {
                  const isDeleted = !item.data;
                  return (
                    <tr key={item._id}>
                      <td>{item.data?.title || 'Deleted data'}</td>
                      <td>{item.dataOwner?.name || 'Unknown'}</td>
                      <td>{item.purpose || '-'}</td>
                      <td>{isDeleted ? 'deleted' : item.status}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
