import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function ForgotPassword() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const requestOtp = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/auth/forgot-password', { phone });
      setMessage('OTP sent to the phone number.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/auth/reset-password', { phone, otp, newPassword });
      setMessage('Password reset successful. You can sign in now.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div>
          <div className="tag">Account recovery</div>
          <h1>Reset your password with a phone OTP.</h1>
          <p>
            Enter the OTP you receive to reset your password.
          </p>
        </div>
        <div>
          <p className="subtle">Remembered your password?</p>
          <Link className="btn btn-ghost" to="/login">
            Back to sign in
          </Link>
        </div>
      </div>
      <div className="auth-card">
        <div className="card dark">
          <h2>Forgot password</h2>
          <p className="subtle">Step {step} of 2</p>
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          {step === 1 ? (
            <form className="form" onSubmit={requestOtp}>
              <div className="form-group">
                <label>Phone number</label>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="e.g., +1 555 555 5555"
                  required
                />
              </div>
              <button className="btn btn-primary" type="submit">
                Send OTP
              </button>
            </form>
          ) : (
            <form className="form" onSubmit={resetPassword}>
              <div className="form-group">
                <label>Phone number</label>
                <input value={phone} disabled />
              </div>
              <div className="form-group">
                <label>OTP</label>
                <input value={otp} onChange={(event) => setOtp(event.target.value)} required />
              </div>
              <div className="form-group">
                <label>New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" type="button" onClick={() => setStep(1)}>
                  Back
                </button>
                <button className="btn btn-primary" type="submit">
                  Reset password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

