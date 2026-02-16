import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const updateStatus = async (id, action) => {
    try {
      await api.patch(`/consent/${id}/${action}`);
      loadApprovals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">Approval queue</h2>
        <p>Review access requests and respond quickly.</p>
      </div>
      <div className="card">
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
                        <button className="btn btn-primary" onClick={() => updateStatus(item._id, 'approve')}>
                          Approve
                        </button>
                        <button className="btn btn-danger" onClick={() => updateStatus(item._id, 'reject')}>
                          Reject
                        </button>
                      </div>
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
