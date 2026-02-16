import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function Login({ setUser }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div>
          <div className="tag">Secure workspace</div>
          <h1>Welcome back to ClarityVault.</h1>
          <p>
            Continue where you left off. Review requests, share data securely, and keep your
            approvals in sync.
          </p>
        </div>
        <div>
          <p className="subtle">Need an account?</p>
          <Link className="btn btn-ghost" to="/register">
            Create account
          </Link>
        </div>
      </div>
      <div className="auth-card">
        <div className="card dark">
          <h2>Sign in</h2>
          <p className="subtle">Use your registered email address.</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" value={formData.password} onChange={handleChange} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="subtle" style={{ marginTop: 16 }}>
            <Link to="/forgot-password">Forgot password?</Link>
          </p>
          <p className="subtle" style={{ marginTop: 8 }}>
            Don&apos;t have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
