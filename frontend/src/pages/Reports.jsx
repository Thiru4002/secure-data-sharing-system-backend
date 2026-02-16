import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';

const CATEGORIES = [
  { value: 'abuse', label: 'Abuse' },
  { value: 'spam', label: 'Spam' },
  { value: 'fake_identity', label: 'Fake identity' },
  { value: 'policy_violation', label: 'Policy violation' },
  { value: 'other', label: 'Other' },
];

export default function Reports() {
  const location = useLocation();
  const [form, setForm] = useState({
    reportedUserId: '',
    category: 'other',
    reason: '',
    details: '',
  });
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadMyReports = async () => {
    try {
      const response = await api.get('/reports/my');
      setMyReports(response.data.data || response.data || []);
    } catch {
      setMyReports([]);
    }
  };

  useEffect(() => {
    const search = new URLSearchParams(location.search);
    const userId = search.get('reportedUserId') || '';
    if (userId) {
      setForm((prev) => ({ ...prev, reportedUserId: userId }));
    }
    loadMyReports();
  }, [location.search]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.post('/reports', form);
      setMessage('Report submitted for admin review.');
      setForm({ reportedUserId: '', category: 'other', reason: '', details: '' });
      await loadMyReports();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">Report User</h2>
        <p>Submit safety reports. Admin will review and take action when valid.</p>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Reported user ID (USER_... or ObjectId)</label>
            <input
              placeholder="e.g., USER_ABC123"
              value={form.reportedUserId}
              onChange={(event) => setForm({ ...form, reportedUserId: event.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Reason</label>
            <input
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Details (optional)</label>
            <textarea
              rows={4}
              value={form.details}
              onChange={(event) => setForm({ ...form, details: event.target.value })}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit report'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>My reports</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Reported user</th>
                <th>Category</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {myReports.map((r) => (
                <tr key={r._id}>
                  <td>{r.reportedUser?.userId || r.reportedUser?._id || 'Unknown'}</td>
                  <td>{r.category}</td>
                  <td>{r.status}</td>
                  <td>{r.reason}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
