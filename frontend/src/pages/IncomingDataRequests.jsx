import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function IncomingDataRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [consentRequests, setConsentRequests] = useState([]);
  const [dataOptions, setDataOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consentLoading, setConsentLoading] = useState(true);
  const [error, setError] = useState('');
  const [consentError, setConsentError] = useState('');
  const [actionLoadingById, setActionLoadingById] = useState({});
  const [actionTypeById, setActionTypeById] = useState({});
  const [actionMessageById, setActionMessageById] = useState({});
  const [actionErrorById, setActionErrorById] = useState({});
  const [selectedDataById, setSelectedDataById] = useState({});
  const activeStatus = searchParams.get('status') || 'pending';

  const normalizeStatus = (status) => {
    if (status === 'approved') return 'fulfilled';
    if (status === 'revoked') return 'rejected';
    return status;
  };

  const loadRequests = async (status) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/data-requests/incoming', {
        params: { status },
      });
      const data = response.data.data || response.data || [];
      const normalized = Array.isArray(data)
        ? data.map((item) => ({
            ...item,
            status: normalizeStatus(item.status),
          }))
        : [];
      setRequests(normalized);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load incoming requests');
    } finally {
      setLoading(false);
    }
  };

  const loadConsentApprovals = async () => {
    setConsentLoading(true);
    setConsentError('');
    try {
      const response = await api.get('/consent/approvals');
      const data = response.data.data || response.data || [];
      const pendingOnly = Array.isArray(data) ? data.filter((item) => item.status === 'pending') : [];
      setConsentRequests(pendingOnly);
    } catch (err) {
      setConsentError(err.response?.data?.message || 'Failed to load pending consent requests');
      setConsentRequests([]);
    } finally {
      setConsentLoading(false);
    }
  };

  const loadMyData = async () => {
    try {
      const response = await api.get('/data/my-data');
      const data = response.data.data || response.data || [];
      setDataOptions(Array.isArray(data) ? data : []);
    } catch {
      setDataOptions([]);
    }
  };

  useEffect(() => {
    loadMyData();
    loadConsentApprovals();
  }, []);

  useEffect(() => {
    loadRequests(activeStatus);
  }, [activeStatus]);

  useEffect(() => {
    if (Object.keys(actionMessageById).length === 0) return undefined;
    const timer = setTimeout(() => setActionMessageById({}), 3000);
    return () => clearTimeout(timer);
  }, [actionMessageById]);

  const filteredRequests = useMemo(() => requests, [requests]);

  const setStatusFilter = (status) => {
    setSearchParams({ status });
  };

  const handleConsentAction = async (consentId, action) => {
    setActionLoadingById((prev) => ({ ...prev, [consentId]: true }));
    setActionTypeById((prev) => ({ ...prev, [consentId]: action }));
    setActionMessageById((prev) => ({ ...prev, [consentId]: '' }));
    setActionErrorById((prev) => ({ ...prev, [consentId]: '' }));
    try {
      await api.patch(`/consent/${consentId}/${action}`);
      setActionMessageById((prev) => ({
        ...prev,
        [consentId]: action === 'approve' ? 'Approved.' : 'Rejected.',
      }));
      loadConsentApprovals();
    } catch (err) {
      setActionErrorById((prev) => ({
        ...prev,
        [consentId]: err.response?.data?.message || `Failed to ${action}`,
      }));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [consentId]: false }));
      setActionTypeById((prev) => ({ ...prev, [consentId]: '' }));
    }
  };

  const handleReject = async (requestId) => {
    setActionLoadingById((prev) => ({ ...prev, [requestId]: true }));
    setActionMessageById((prev) => ({ ...prev, [requestId]: '' }));
    setActionErrorById((prev) => ({ ...prev, [requestId]: '' }));
    try {
      await api.patch(`/data-requests/${requestId}/reject`);
      setActionMessageById((prev) => ({ ...prev, [requestId]: 'Rejected.' }));
      loadRequests(activeStatus);
    } catch (err) {
      setActionErrorById((prev) => ({
        ...prev,
        [requestId]: err.response?.data?.message || 'Failed to reject',
      }));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleFulfill = async (requestId) => {
    const dataId = selectedDataById[requestId];
    if (!dataId) {
      setActionErrorById((prev) => ({ ...prev, [requestId]: 'Select data to link.' }));
      return;
    }

    setActionLoadingById((prev) => ({ ...prev, [requestId]: true }));
    setActionMessageById((prev) => ({ ...prev, [requestId]: '' }));
    setActionErrorById((prev) => ({ ...prev, [requestId]: '' }));

    try {
      await api.patch(`/data-requests/${requestId}/fulfill`, { dataId });
      setActionMessageById((prev) => ({ ...prev, [requestId]: 'Fulfilled and consent approved.' }));
      loadRequests(activeStatus);
    } catch (err) {
      setActionErrorById((prev) => ({
        ...prev,
        [requestId]: err.response?.data?.message || 'Failed to fulfill',
      }));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">Incoming data requests</h2>
        <p>Requests sent to you before data is uploaded.</p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Pending access requests for uploaded data</h3>
        <p className="subtle" style={{ marginTop: 0 }}>
          Requests created when a service user clicks Request access on your uploaded items.
        </p>
        {consentLoading ? (
          <p>Loading pending access requests...</p>
        ) : consentError ? (
          <div className="alert alert-error">{consentError}</div>
        ) : consentRequests.length === 0 ? (
          <div className="empty-state">No pending access requests.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Service user</th>
                  <th>Data</th>
                  <th>Purpose</th>
                  <th>Requested</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {consentRequests.map((item) => (
                  <tr key={item._id}>
                    <td>{item.serviceUser?.name || 'Unknown'}</td>
                    <td>{item.data?.title || 'Unknown data'}</td>
                    <td>{item.purpose || '-'}</td>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="actions-row">
                        <button
                          className="btn btn-primary"
                          onClick={() => handleConsentAction(item._id, 'approve')}
                          disabled={actionLoadingById[item._id]}
                        >
                          {actionLoadingById[item._id] && actionTypeById[item._id] === 'approve'
                            ? 'Working...'
                            : 'Approve'}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleConsentAction(item._id, 'reject')}
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

      <div className="card">
        <div className="section-head">
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>Pre-data requests</h3>
          <Link
            className="btn btn-secondary"
            to={{ pathname: '/upload', search: '?returnTo=%2Fincoming-requests%3Fstatus%3Dpending' }}
          >
            Upload new data
          </Link>
        </div>
        <p className="subtle" style={{ marginTop: 8 }}>
          Requests sent before data was uploaded. Link existing data or upload a new item, then fulfill.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {['pending', 'fulfilled', 'rejected'].map((status) => (
            <button
              key={status}
              className={activeStatus === status ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        {loading ? (
          <p>Loading incoming requests...</p>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">No {activeStatus} requests.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Message</th>
                  <th>Requested Title</th>
                  <th>Category</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((item) => (
                  <tr key={item._id}>
                    <td>{item.requester?.name || 'Unknown'}</td>
                    <td>{item.message}</td>
                    <td>{item.requestedTitle || '-'}</td>
                    <td>{item.requestedCategory || '-'}</td>
                    <td>
                      <div className="grid" style={{ gap: 10 }}>
                        {item.status === 'pending' ? (
                          <>
                            <div className="actions-row">
                              <Link
                                className="btn btn-secondary"
                                to={{ pathname: '/upload', search: '?returnTo=%2Fincoming-requests%3Fstatus%3Dpending' }}
                              >
                                Upload new data
                              </Link>
                            </div>
                            <select
                              value={selectedDataById[item._id] || ''}
                              onChange={(event) =>
                                setSelectedDataById((prev) => ({ ...prev, [item._id]: event.target.value }))
                              }
                            >
                              <option value="">Select data to link</option>
                              {dataOptions.map((dataItem) => (
                                <option key={dataItem._id} value={dataItem._id}>
                                  {dataItem.title}
                                </option>
                              ))}
                            </select>
                            <div className="actions-row">
                              <button
                                className="btn btn-primary"
                                onClick={() => handleFulfill(item._id)}
                                disabled={actionLoadingById[item._id]}
                              >
                                {actionLoadingById[item._id] ? 'Working...' : 'Fulfill'}
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleReject(item._id)}
                                disabled={actionLoadingById[item._id]}
                              >
                                {actionLoadingById[item._id] ? 'Working...' : 'Reject'}
                              </button>
                            </div>
                          </>
                        ) : (
                          <span className={`status-pill ${item.status}`}>{item.status}</span>
                        )}
                        <div>
                          {item.linkedData?.title ? (
                            <span className="subtle">Linked: {item.linkedData.title}</span>
                          ) : (
                            <span className="subtle">Not linked</span>
                          )}
                        </div>
                        {actionMessageById[item._id] && (
                          <div className="alert alert-success">{actionMessageById[item._id]}</div>
                        )}
                        {actionErrorById[item._id] && (
                          <div className="alert alert-error">{actionErrorById[item._id]}</div>
                        )}
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
