import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [actionLoadingById, setActionLoadingById] = useState({});
  const [actionTypeById, setActionTypeById] = useState({});
  const [actionMessageById, setActionMessageById] = useState({});
  const [actionErrorById, setActionErrorById] = useState({});

  const loadApprovals = () => {
    setLoading(true);
    api
      .get('/consent/approvals')
      .then((response) => {
        const data = response.data.data || response.data || [];
        setApprovals(data.filter((item) => item.status === 'pending'));
      })
      .catch(() => setApprovals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadApprovals();
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

  const updateStatus = async (id, action) => {
    try {
      setMessage('');
      setError('');
      setActionMessageById((prev) => ({ ...prev, [id]: '' }));
      setActionErrorById((prev) => ({ ...prev, [id]: '' }));
      setActionLoadingById((prev) => ({ ...prev, [id]: true }));
      setActionTypeById((prev) => ({ ...prev, [id]: action }));
      await api.patch(`/consent/${id}/${action}`);
      setMessage(action === 'approve' ? 'Consent approved successfully.' : 'Consent rejected successfully.');
      setActionMessageById((prev) => ({
        ...prev,
        [id]: action === 'approve' ? 'Approved.' : 'Rejected.',
      }));
      loadApprovals();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update';
      setError(msg);
      setActionErrorById((prev) => ({ ...prev, [id]: msg }));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [id]: false }));
      setActionTypeById((prev) => ({ ...prev, [id]: null }));
    }
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">Approval queue</h2>
        <p>Review access requests and respond quickly.</p>
      </div>
      <div className="card">
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <p>Loading approvals...</p>
        ) : approvals.length === 0 ? (
          <p>No approvals pending.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Data</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((item) => (
                  <tr key={item._id}>
                    <td>{item.serviceUser?.name || 'Unknown'}</td>
                    <td>{item.data?.title || 'Unknown'}</td>
                    <td>{item.purpose || '-'}</td>
                    <td>{item.status}</td>
                    <td>
                      <div className="actions-row">
                        <button
                          className="btn btn-primary"
                          onClick={() => updateStatus(item._id, 'approve')}
                          disabled={actionLoadingById[item._id]}
                        >
                          {actionLoadingById[item._id] && actionTypeById[item._id] === 'approve'
                            ? 'Working...'
                            : 'Approve'}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => updateStatus(item._id, 'reject')}
                          disabled={actionLoadingById[item._id]}
                        >
                          {actionLoadingById[item._id] && actionTypeById[item._id] === 'reject'
                            ? 'Working...'
                            : 'Reject'}
                        </button>
                      </div>
                      {actionMessageById[item._id] && (
                        <div className="alert alert-success" style={{ marginTop: 10 }}>
                          {actionMessageById[item._id]}
                        </div>
                      )}
                      {actionErrorById[item._id] && (
                        <div className="alert alert-error" style={{ marginTop: 10 }}>
                          {actionErrorById[item._id]}
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
    </div>
  );
}
