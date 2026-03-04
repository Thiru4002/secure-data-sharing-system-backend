import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_ORIGIN } from '../api/axiosConfig';

export default function Landing() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    let active = true;
    const abortController = new AbortController();

    const warmingTimer = setTimeout(() => {
      if (!active) return;
      setBackendStatus((prev) => (prev === 'checking' ? 'waking' : prev));
    }, 3500);

    const requestTimer = setTimeout(() => {
      abortController.abort();
    }, 25000);

    fetch(`${API_ORIGIN}/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: abortController.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Health check failed');
        return res.json();
      })
      .then(() => {
        if (!active) return;
        setBackendStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setBackendStatus('error');
      })
      .finally(() => {
        clearTimeout(warmingTimer);
        clearTimeout(requestTimer);
      });

    return () => {
      active = false;
      clearTimeout(warmingTimer);
      clearTimeout(requestTimer);
      abortController.abort();
    };
  }, []);

  return (
    <div>
      <section className="hero">
        <div className={`landing-server-badge ${backendStatus}`}>
          {backendStatus === 'checking' && 'Server: connecting'}
          {backendStatus === 'waking' && 'Server: waking up'}
          {backendStatus === 'ready' && 'Server: ready'}
          {backendStatus === 'error' && 'Server: unreachable'}
        </div>

        <div className="tag">Trusted data exchange</div>
        <h1>ClarityVault keeps consent, ownership, and access in one place.</h1>
        <p>
          A secure data sharing platform built for universities, clinics, and service teams that need
          verifiable consent and precise identity matching.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/register">
            Create account
          </Link>
          <Link className="btn btn-secondary" to="/login">
            Sign in
          </Link>
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature-card">
          <h3>Consent-first workflows</h3>
          <p>
            Every request is tracked, approved, and audited. Owners stay in control and
            service users get a clear approval trail.
          </p>
        </div>
        <div className="feature-card">
          <h3>Identity clarity</h3>
          <p>
            Match the right person with UUIDs, user IDs, and reference hints. No more "same name" mixups.
          </p>
        </div>
        <div className="feature-card">
          <h3>Purpose-built dashboards</h3>
          <p>
            Owners, service users, and admins each get tools that reflect their role and responsibilities.
          </p>
        </div>
      </section>

      <section className="feature-grid" style={{ paddingTop: 0 }}>
        <div className="feature-card">
          <h3>Upload with metadata</h3>
          <p>Attach category, tags, and owner identifiers to improve discovery accuracy.</p>
        </div>
        <div className="feature-card">
          <h3>Request and track</h3>
          <p>Track approvals, revocations, and access history without leaving the workspace.</p>
        </div>
        <div className="feature-card">
          <h3>Audit-ready</h3>
          <p>Admins view system stats, audit logs, and consent trends in one hub.</p>
        </div>
      </section>

      <footer className="footer">
        <span>ClarityVault · Secure Data Sharing System</span>
        <span>Built for academic projects and real-world workflows</span>
      </footer>
    </div>
  );
}
