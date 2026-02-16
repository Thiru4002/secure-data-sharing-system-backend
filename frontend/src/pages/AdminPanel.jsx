import { useEffect, useMemo, useState } from 'react';
import api from '../api/axiosConfig';

const CONSENT_TABS = ['all', 'pending', 'approved', 'rejected', 'revoked'];
const ADMIN_SECTIONS_KEY = 'admin_panel_sections_v1';
const DEFAULT_SECTIONS = {
  userManagement: true,
  consentMonitor: true,
  recentData: false,
  auditLog: false,
  reportsReview: true,
};

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [data, setData] = useState([]);
  const [consents, setConsents] = useState([]);
  const [audit, setAudit] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [includeSuspended, setIncludeSuspended] = useState(true);
  const [consentFilter, setConsentFilter] = useState('all');
  const [reportFilter, setReportFilter] = useState('pending');
  const [sectionOpen, setSectionOpen] = useState(() => {
    try {
      const raw = localStorage.getItem(ADMIN_SECTIONS_KEY);
      if (!raw) return DEFAULT_SECTIONS;
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SECTIONS, ...parsed };
    } catch {
      return DEFAULT_SECTIONS;
    }
  });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, dataRes, consentsRes, auditRes, reportsRes] = await Promise.all([
        api.get('/admin/statistics'),
        api.get('/admin/users', {
          params: {
            search: search || undefined,
            role: roleFilter || undefined,
            includeDeleted: includeSuspended,
            limit: 100,
          },
        }),
        api.get('/admin/data', { params: { limit: 50 } }),
        api.get('/admin/consents', {
          params: {
            status: consentFilter !== 'all' ? consentFilter : undefined,
            limit: 50,
          },
        }),
        api.get('/admin/audit-logs', { params: { limit: 50 } }),
        api.get('/admin/reports', {
          params: {
            status: reportFilter || undefined,
            limit: 50,
          },
        }),
      ]);

      setStats(statsRes.data.data || null);
      setUsers(usersRes.data.data?.data || usersRes.data.data || []);
      setData(dataRes.data.data?.data || dataRes.data.data || []);
      setConsents(consentsRes.data.data?.data || consentsRes.data.data || []);
      setAudit(auditRes.data.data?.data || auditRes.data.data || []);
      setReports(reportsRes.data.data?.data || reportsRes.data.data || []);
    } catch {
      setStats(null);
      setUsers([]);
      setData([]);
      setConsents([]);
      setAudit([]);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [consentFilter, reportFilter]);

  useEffect(() => {
    localStorage.setItem(ADMIN_SECTIONS_KEY, JSON.stringify(sectionOpen));
  }, [sectionOpen]);

  const toggleSection = (key) => {
    setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyUserFilters = () => {
    loadDashboard();
  };

  const updateUser = async (id, payload) => {
    try {
      await api.patch(`/admin/users/${id}`, payload);
      await loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const reviewReport = async (id, payload) => {
    try {
      await api.patch(`/admin/reports/${id}/review`, payload);
      await loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review report');
    }
  };

  const usersSummary = useMemo(() => {
    const summary = { data_owner: 0, service_user: 0, admin: 0 };
    users.forEach((u) => {
      if (summary[u.role] !== undefined) summary[u.role] += 1;
    });
    return summary;
  }, [users]);

  const sectionHeader = (title, key) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <button className="btn btn-secondary" onClick={() => toggleSection(key)}>
        {sectionOpen[key] ? 'Minimize' : 'Expand'}
      </button>
    </div>
  );

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">Admin Panel</h2>
        <p>Manage users, inspect data flow, and monitor consent activity.</p>
      </div>

      <div className="card">
        <h3>System stats</h3>
        {loading && !stats ? (
          <p>Loading statistics...</p>
        ) : (
          <div className="grid grid-3">
            <div className="stat"><span>Total users</span><strong>{stats?.totalUsers || 0}</strong></div>
            <div className="stat"><span>Suspended users</span><strong>{stats?.suspendedUsers || 0}</strong></div>
            <div className="stat"><span>Total data</span><strong>{stats?.totalData || 0}</strong></div>
            <div className="stat"><span>Total consents</span><strong>{stats?.totalConsents || 0}</strong></div>
            <div className="stat"><span>Pending consents</span><strong>{stats?.pendingConsents || 0}</strong></div>
            <div className="stat"><span>Approved consents</span><strong>{stats?.approvedConsents || 0}</strong></div>
          </div>
        )}
      </div>

      <div className="card">
        {sectionHeader('User management', 'userManagement')}
        {sectionOpen.userManagement && (
          <>
            <div className="grid grid-3" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>Search</label>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, email, user ID"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="">All roles</option>
                  <option value="data_owner">Data owner</option>
                  <option value="service_user">Service user</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group" style={{ alignContent: 'end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={includeSuspended}
                    onChange={(event) => setIncludeSuspended(event.target.checked)}
                  />
                  Include suspended users
                </label>
                <button className="btn btn-secondary" onClick={applyUserFilters} style={{ marginTop: 10 }}>
                  Apply filters
                </button>
              </div>
            </div>

            <p className="subtle" style={{ marginBottom: 10 }}>
              Filtered users: data owners {usersSummary.data_owner}, service users {usersSummary.service_user}, admins {usersSummary.admin}
            </p>

            <div className="table-wrap"><table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.isDeleted ? 'Suspended' : 'Active'}</td>
                    <td>
                      <button
                        className={u.isDeleted ? 'btn btn-secondary' : 'btn btn-danger'}
                        onClick={() => updateUser(u._id, { isDeleted: !u.isDeleted })}
                      >
                        {u.isDeleted ? 'Reactivate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </>
        )}
      </div>

      <div className="card">
        {sectionHeader('Consent monitor', 'consentMonitor')}
        {sectionOpen.consentMonitor && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {CONSENT_TABS.map((status) => (
                <button
                  key={status}
                  className={consentFilter === status ? 'btn btn-primary' : 'btn btn-secondary'}
                  onClick={() => setConsentFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="table-wrap"><table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Owner</th>
                  <th>Service user</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {consents.slice(0, 15).map((c) => (
                  <tr key={c._id}>
                    <td>{c.data?.title || 'Unknown'}</td>
                    <td>{c.dataOwner?.name || 'Unknown'}</td>
                    <td>{c.serviceUser?.name || 'Unknown'}</td>
                    <td>{c.status}</td>
                    <td>{new Date(c.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </>
        )}
      </div>

      <div className="card">
        {sectionHeader('Reports review', 'reportsReview')}
        {sectionOpen.reportsReview && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <button className={reportFilter === 'pending' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setReportFilter('pending')}>Pending</button>
              <button className={reportFilter === 'validated' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setReportFilter('validated')}>Validated</button>
              <button className={reportFilter === 'rejected' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setReportFilter('rejected')}>Rejected</button>
            </div>
            <div className="table-wrap"><table className="table">
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Reported user</th>
                  <th>Category</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 20).map((r) => (
                  <tr key={r._id}>
                    <td>{r.reporter?.email || r.reporter?.name || 'Unknown'}</td>
                    <td>{r.reportedUser?.email || r.reportedUser?.name || 'Unknown'}</td>
                    <td>{r.category}</td>
                    <td>{r.reason}</td>
                    <td>{r.status}</td>
                    <td>
                      {r.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-danger" onClick={() => reviewReport(r._id, { status: 'validated', suspendUser: true })}>Validate + Suspend</button>
                          <button className="btn btn-secondary" onClick={() => reviewReport(r._id, { status: 'rejected' })}>Reject</button>
                        </div>
                      ) : (
                        'Reviewed'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </>
        )}
      </div>

      <div className="card">
        {sectionHeader('Recent data', 'recentData')}
        {sectionOpen.recentData && (
          <div className="table-wrap"><table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Owner</th>
                <th>Category</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((d) => (
                <tr key={d._id}>
                  <td>{d.title}</td>
                  <td>{d.owner?.name || 'Unknown'}</td>
                  <td>{d.category}</td>
                  <td>{new Date(d.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      <div className="card">
        {sectionHeader('Audit log', 'auditLog')}
        {sectionOpen.auditLog && (
          <div className="table-wrap"><table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>User</th>
                <th>Description</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {audit.slice(0, 10).map((a) => (
                <tr key={a._id}>
                  <td>{a.action}</td>
                  <td>{a.userId?.name || 'Unknown'}</td>
                  <td>{a.description || '-'} </td>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
