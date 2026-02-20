import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', referenceDescription: '' });

  const loadProfile = () => {
    api
      .get('/auth/me')
      .then((response) => {
        const data = response.data.data || response.data;
        setUser(data);
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          referenceDescription: data.referenceDescription || '',
        });
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const scheduleDeletion = async () => {
    if (!window.confirm('Schedule account deletion? You can cancel within 7 days.')) return;
    try {
      const response = await api.delete('/auth/delete');
      const scheduledFor = response.data?.data?.deletionScheduledFor;
      setInfo(
        scheduledFor
          ? `Account deletion scheduled. Log in before ${new Date(scheduledFor).toLocaleDateString()} to cancel.`
          : 'Account deletion scheduled. Log in within 7 days to cancel.'
      );
      loadProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule deletion');
    }
  };

  const cancelDeletion = async () => {
    try {
      await api.patch('/auth/cancel-deletion');
      setInfo('Account deletion canceled.');
      loadProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel deletion');
    }
  };

  const saveProfile = async () => {
    try {
      const response = await api.patch('/auth/profile', {
        name: form.name,
        phone: form.phone,
        referenceDescription: form.referenceDescription,
      });
      const updated = response.data.data || response.data;
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('user-updated'));
      setEditing(false);
      setInfo('Profile updated successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'phone') {
      setForm({ ...form, phone: value.replace(/\\D/g, '').slice(0, 10) });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  if (loading) {
    return <div className="card">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!user) {
    return <div className="card">No profile data.</div>;
  }

  const scheduledFor = user.deletionScheduledFor ? new Date(user.deletionScheduledFor) : null;

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">Profile</h2>
        <p>Manage your identity details used for data discovery.</p>
      </div>
      <div className="card">
        {info && <div className="alert alert-success" style={{ marginBottom: 12 }}>{info}</div>}
        {editing ? (
          <div className="form">
            <div className="form-group">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                inputMode="numeric"
                autoComplete="tel"
                pattern="[0-9]{10}"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label>Reference description</label>
              <textarea
                name="referenceDescription"
                rows={3}
                value={form.referenceDescription}
                onChange={handleChange}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={saveProfile}>
                Save changes
              </button>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-2">
            <div>
              <label>Name</label>
              <p>{user.name}</p>
            </div>
            <div>
              <label>Email</label>
              <p>{user.email}</p>
            </div>
            <div>
              <label>Role</label>
              <p>{user.role?.replace('_', ' ')}</p>
            </div>
            <div>
              <label>Email verified</label>
              <p>{user.isEmailVerified ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <label>Phone</label>
              <p>{user.phone || 'Not provided'}</p>
            </div>
            <div>
              <label>Reference description</label>
              <p>{user.referenceDescription || 'Not provided'}</p>
            </div>
          </div>
        )}
        {!editing && (
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              Edit profile
            </button>
          </div>
        )}
      </div>
      <div className="card">
        <h3>System identifiers</h3>
        <p>Share these with service users to ensure accurate matching.</p>
        <div className="grid grid-2" style={{ marginTop: 12 }}>
          <div>
            <label>User ID</label>
            <p>{user.userId}</p>
          </div>
          <div>
            <label>UUID</label>
            <p>{user.uuid}</p>
          </div>
        </div>
      </div>
      <div className="card">
        <h3>Danger zone</h3>
        <p>Schedule account deletion. Log in within 7 days to cancel.</p>
        {scheduledFor && (
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            Deletion scheduled for {scheduledFor.toLocaleDateString()}.
          </div>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-danger" onClick={scheduleDeletion}>
            Schedule deletion
          </button>
          {scheduledFor && (
            <button className="btn btn-secondary" onClick={cancelDeletion}>
              Cancel deletion
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
