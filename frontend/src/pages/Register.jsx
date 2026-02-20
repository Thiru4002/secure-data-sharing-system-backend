import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function Register({ setUser }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'service_user',
    phone: '',
    referenceDescription: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phone: digits });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.phone.length !== 10) {
        setError('Phone number must be exactly 10 digits');
        setLoading(false);
        return;
      }
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        referenceDescription: formData.referenceDescription || undefined,
      });
      const login = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      const { token, user } = login.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (setUser) setUser(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div>
          <div className="tag">Create your vault</div>
          <h1>Set up a secure identity in minutes.</h1>
          <p>
            Choose your role, add reference details, and start sharing data with clear consent trails.
          </p>
        </div>
        <div>
          <p className="subtle">Already registered?</p>
          <Link className="btn btn-ghost" to="/login">
            Sign in
          </Link>
        </div>
      </div>
      <div className="auth-card">
        <div className="card dark">
          <h2>Create account</h2>
          <p className="subtle">All fields marked with * are required.</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input name="password" type="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="data_owner">Data owner</option>
                <option value="service_user">Service user</option>
              </select>
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                inputMode="numeric"
                autoComplete="tel"
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="10-digit phone number"
              />
            </div>
            <div className="form-group">
              <label>Reference description</label>
              <textarea
                name="referenceDescription"
                value={formData.referenceDescription}
                onChange={handleChange}
                rows={3}
                placeholder="Optional context to help others identify you"
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
