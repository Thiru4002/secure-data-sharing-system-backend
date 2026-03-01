import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const PURPOSE_OPTIONS = ['Project review', 'Research', 'Audit', 'Medical', 'Legal', 'Other'];

export default function OwnerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestCategory, setRequestCategory] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [preRequestOpen, setPreRequestOpen] = useState(false);
  const [purposeByDataId, setPurposeByDataId] = useState({});
  const [customPurposeByDataId, setCustomPurposeByDataId] = useState({});
  const [dataRequestLoadingById, setDataRequestLoadingById] = useState({});
  const [dataRequestMessageById, setDataRequestMessageById] = useState({});
  const [dataRequestErrorById, setDataRequestErrorById] = useState({});
  const preRequestRef = useRef(null);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/discovery/owners/${id}`);
      const payload = response.data.data || response.data;
      setOwnerProfile(payload || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load owner profile');
      setOwnerProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const dataList = useMemo(() => ownerProfile?.data || [], [ownerProfile]);

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!ownerProfile?.owner?.id) return;

    setRequestSubmitting(true);
    setRequestStatus('');
    setRequestError('');

    try {
      await api.post('/data-requests', {
        ownerId: ownerProfile.owner.id,
        message: requestMessage,
        requestedTitle: requestTitle || undefined,
        requestedCategory: requestCategory || undefined,
      });
      setRequestStatus('Pre-request sent to data owner.');
      setRequestMessage('');
      setRequestTitle('');
      setRequestCategory('');
    } catch (err) {
      setRequestError(err.response?.data?.message || 'Failed to send pre-request');
    } finally {
      setRequestSubmitting(false);
    }
  };

  const requestUploadedData = async (dataId) => {
    setDataRequestMessageById((prev) => ({ ...prev, [dataId]: '' }));
    setDataRequestErrorById((prev) => ({ ...prev, [dataId]: '' }));
    setDataRequestLoadingById((prev) => ({ ...prev, [dataId]: true }));

    const selectedPurpose = purposeByDataId[dataId] || 'Project review';
    const finalPurpose =
      selectedPurpose === 'Other'
        ? (customPurposeByDataId[dataId] || 'Other')
        : selectedPurpose;

    try {
      await api.post('/consent/request', { dataId, purpose: finalPurpose });
      setDataRequestMessageById((prev) => ({
        ...prev,
        [dataId]: 'Access request sent for this data.',
      }));
    } catch (err) {
      setDataRequestErrorById((prev) => ({
        ...prev,
        [dataId]: err.response?.data?.message || 'Failed to request access',
      }));
    } finally {
      setDataRequestLoadingById((prev) => ({ ...prev, [dataId]: false }));
    }
  };

  const scrollToPreRequest = () => {
    preRequestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <div className="section-head">
          <h2 className="section-title" style={{ marginBottom: 0 }}>Data owner page</h2>
          <button className="btn btn-secondary" onClick={() => navigate('/discover')}>
            Back to discover
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading owner profile...</p>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : !ownerProfile ? (
          <p>Owner profile not found.</p>
        ) : (
          <div className="grid" style={{ gap: 16 }}>
            <div className="owner-summary">
              <h3>{ownerProfile.owner?.name}</h3>
              <div className="kv-row">
                <span className="subtle">User ID</span>
                <span>{ownerProfile.owner?.userId || '-'}</span>
              </div>
            </div>

            <div ref={preRequestRef} className="card" style={{ boxShadow: 'none' }}>
              <div className="section-head">
                <h4 style={{ marginBottom: 0 }}>Pre-request for missing data</h4>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setPreRequestOpen((prev) => !prev)}
                >
                  {preRequestOpen ? 'Hide pre-request form' : 'Open pre-request form'}
                </button>
              </div>
              <p className="subtle" style={{ marginTop: 4 }}>
                Use this only when the uploaded list does not contain the data you need.
              </p>
              <div className={`collapsible ${preRequestOpen ? 'open' : ''}`}>
                <div className="collapsible-inner">
                  {requestStatus && <div className="alert alert-success">{requestStatus}</div>}
                  {requestError && <div className="alert alert-error">{requestError}</div>}
                  <form className="form" onSubmit={submitRequest}>
                    <div className="form-group">
                      <label>What do you need?</label>
                      <textarea
                        value={requestMessage}
                        onChange={(event) => setRequestMessage(event.target.value)}
                        placeholder="Explain the data you need and why"
                        required
                      />
                    </div>
                    <div className="grid grid-2">
                      <div className="form-group">
                        <label>Requested title (optional)</label>
                        <input
                          value={requestTitle}
                          onChange={(event) => setRequestTitle(event.target.value)}
                          placeholder="e.g., Medical Report 2025"
                        />
                      </div>
                      <div className="form-group">
                        <label>Requested category (optional)</label>
                        <input
                          value={requestCategory}
                          onChange={(event) => setRequestCategory(event.target.value)}
                          placeholder="e.g., Medical"
                        />
                      </div>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={requestSubmitting}>
                      {requestSubmitting ? 'Sending...' : 'Send pre-request'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div>
              <div className="section-head">
                <h4 style={{ marginBottom: 0 }}>Uploaded data list ({dataList.length})</h4>
                <button className="btn btn-secondary" type="button" onClick={scrollToPreRequest}>
                  Missing something? Pre-request
                </button>
              </div>
              {dataList.length === 0 ? (
                <div className="empty-state">No data uploaded yet for this owner.</div>
              ) : (
                <div className="grid" style={{ gap: 12 }}>
                  {dataList.map((item) => (
                    <div key={item._id} className="card" style={{ boxShadow: 'none' }}>
                      <div className="owner-data-item">
                        <h5 className="owner-data-title">{item.title}</h5>
                        <p className="owner-data-desc">{item.description || 'No description provided.'}</p>
                        <div className="owner-meta-list">
                          <div className="owner-meta-row">
                            <span className="owner-meta-label">Category</span>
                            <span>{item.category || '-'}</span>
                          </div>
                          <div className="owner-meta-row">
                            <span className="owner-meta-label">Tags</span>
                            <span>
                              {Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.join(', ') : '-'}
                            </span>
                          </div>
                          <div className="owner-meta-row">
                            <span className="owner-meta-label">Uploaded</span>
                            <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</span>
                          </div>
                          <div className="owner-meta-row">
                            <span className="owner-meta-label">Last updated</span>
                            <span>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}</span>
                          </div>
                          <div className="owner-meta-row">
                            <span className="owner-meta-label">Download</span>
                            <span className={`status-pill ${item.allowDownload ? 'active' : 'rejected'}`}>
                              {item.allowDownload ? 'Allowed' : 'Not allowed'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="owner-meta-row">
                        <span className="owner-meta-label">Request purpose</span>
                        <div>
                          <select
                            value={purposeByDataId[item._id] || 'Project review'}
                            onChange={(event) =>
                              setPurposeByDataId((prev) => ({
                                ...prev,
                                [item._id]: event.target.value,
                              }))
                            }
                          >
                            {PURPOSE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          {(purposeByDataId[item._id] || 'Project review') === 'Other' && (
                            <input
                              style={{ marginTop: 8 }}
                              placeholder="Enter custom purpose"
                              value={customPurposeByDataId[item._id] || ''}
                              onChange={(event) =>
                                setCustomPurposeByDataId((prev) => ({
                                  ...prev,
                                  [item._id]: event.target.value,
                                }))
                              }
                            />
                          )}
                        </div>
                      </div>
                      <div className="actions-row" style={{ marginTop: 12 }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => requestUploadedData(item._id)}
                          disabled={dataRequestLoadingById[item._id]}
                        >
                          {dataRequestLoadingById[item._id] ? 'Requesting...' : 'Request access'}
                        </button>
                      </div>
                      {dataRequestMessageById[item._id] && (
                        <div className="alert alert-success" style={{ marginTop: 10 }}>
                          {dataRequestMessageById[item._id]}
                        </div>
                      )}
                      {dataRequestErrorById[item._id] && (
                        <div className="alert alert-error" style={{ marginTop: 10 }}>
                          {dataRequestErrorById[item._id]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
