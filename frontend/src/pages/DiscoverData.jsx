import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const HISTORY_KEY = 'discover_recent_user_ids';
const HISTORY_LIMIT = 5;
const PURPOSE_OPTIONS = ['Project review', 'Research', 'Audit', 'Medical', 'Legal', 'Other'];

export default function DiscoverData() {
  const [filters, setFilters] = useState({
    ownerUserId: '',
    search: '',
    category: '',
    tags: '',
    ownerUuid: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerName: '',
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [requestsByData, setRequestsByData] = useState({});
  const [recentSearches, setRecentSearches] = useState([]);
  const [lastSearchedId, setLastSearchedId] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [purposeById, setPurposeById] = useState({});
  const [customPurposeById, setCustomPurposeById] = useState({});
  const [requestLoadingById, setRequestLoadingById] = useState({});
  const [requestMessageById, setRequestMessageById] = useState({});
  const [requestErrorById, setRequestErrorById] = useState({});
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const canRequest = currentUser?.role === 'service_user';

  const loadRecentSearches = () => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const list = raw ? JSON.parse(raw) : [];
      setRecentSearches(Array.isArray(list) ? list : []);
    } catch {
      setRecentSearches([]);
    }
  };

  const saveRecentSearch = (userId) => {
    if (!userId) return;
    const next = [userId, ...recentSearches.filter((id) => id !== userId)].slice(0, HISTORY_LIMIT);
    setRecentSearches(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const handleChange = (event) => {
    setFilters({ ...filters, [event.target.name]: event.target.value });
  };

  const loadMyRequests = async () => {
    if (!canRequest) return;
    try {
      const response = await api.get('/consent/my-requests');
      const list = response.data.data?.data || response.data.data || response.data || [];
      const map = {};
      list.forEach((req) => {
        const dataId = req.data?._id;
        if (dataId && !map[dataId]) {
          // list is newest-first; keep the first occurrence as latest
          map[dataId] = req;
        }
      });
      setRequestsByData(map);
    } catch {
      setRequestsByData({});
    }
  };

  const runSearch = async (params) => {
    const response = await api.get(`/data/discover?${params}`);
    setResults(response.data.data?.data || response.data.data || []);
    await loadMyRequests();
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      await runSearch(params);
      const trimmed = filters.ownerUserId.trim();
      setLastSearchedId(trimmed);
      saveRecentSearch(trimmed);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const quickSearch = async (userId) => {
    if (!userId) return;
    setLoading(true);
    setError('');
    setMessage('');
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      params.append('ownerUserId', userId);
      await runSearch(params);
      setLastSearchedId(userId);
      saveRecentSearch(userId);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const requestAccess = async (dataId) => {
    try {
      setMessage('');
      setError('');
      setRequestMessageById((prev) => ({ ...prev, [dataId]: '' }));
      setRequestErrorById((prev) => ({ ...prev, [dataId]: '' }));
      setRequestLoadingById((prev) => ({ ...prev, [dataId]: true }));
      const selectedPurpose = purposeById[dataId] || 'Project review';
      const finalPurpose = selectedPurpose === 'Other'
        ? (customPurposeById[dataId] || 'Other')
        : selectedPurpose;
      await api.post('/consent/request', { dataId, purpose: finalPurpose });
      setMessage('Access request sent successfully.');
      setRequestMessageById((prev) => ({ ...prev, [dataId]: 'Request sent.' }));
      await loadMyRequests();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to request access';
      setError(msg);
      setRequestErrorById((prev) => ({ ...prev, [dataId]: msg }));
    } finally {
      setRequestLoadingById((prev) => ({ ...prev, [dataId]: false }));
    }
  };

  const handleViewDetails = (dataId) => {
    const req = requestsByData[dataId];
    if (!req || req.status !== 'approved') {
      alert('Request access first. You can view details after approval.');
      return;
    }
    navigate(`/view/${dataId}`);
  };

  useEffect(() => {
    loadMyRequests();
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (Object.keys(requestMessageById).length === 0) return undefined;
    const timer = setTimeout(() => setRequestMessageById({}), 3000);
    return () => clearTimeout(timer);
  }, [requestMessageById]);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">Discover data</h2>
        <p>Start with a user ID. Advanced filters are optional.</p>
      </div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        <form className="form" onSubmit={handleSearch}>
          <div className="form-group">
            <label>Owner user ID</label>
            <input
              name="ownerUserId"
              value={filters.ownerUserId}
              onChange={handleChange}
              placeholder="e.g., USER_1234_ABCD"
            />
          </div>

          <button className="btn btn-secondary" type="button" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? 'Hide advanced filters' : 'Show advanced filters'}
          </button>

          {showAdvanced && (
            <div className="grid" style={{ gap: 16 }}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Full-text search</label>
                  <input name="search" value={filters.search} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input name="category" value={filters.category} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Tags</label>
                  <input name="tags" value={filters.tags} onChange={handleChange} placeholder="comma separated" />
                </div>
                <div className="form-group">
                  <label>Owner UUID</label>
                  <input name="ownerUuid" value={filters.ownerUuid} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-3">
                <div className="form-group">
                  <label>Owner email</label>
                  <input name="ownerEmail" value={filters.ownerEmail} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Owner phone</label>
                  <input name="ownerPhone" value={filters.ownerPhone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Owner name</label>
                  <input name="ownerName" value={filters.ownerName} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h3>Results</h3>
        </div>
        {lastSearchedId && (
          <p style={{ marginTop: 0, color: '#5b6475' }}>Showing results for user ID: {lastSearchedId}</p>
        )}
        {loading ? (
          <p>Loading results...</p>
        ) : results.length === 0 ? (
          <p>No results yet. Try a filter above.</p>
        ) : (
          <div className="grid" style={{ gap: 16 }}>
            {results.map((item) => {
              const req = requestsByData[item._id];
              const purposeValue = purposeById[item._id] || 'Project review';
              return (
                <div key={item._id} className="card" style={{ boxShadow: 'none' }}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div style={{ marginTop: 10 }}>
                    <span className="tag">{item.category}</span>
                  </div>
                  <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                    <div className="kv-row">
                      <span className="subtle">Owner</span>
                      <span>{item.owner?.name || 'Unknown'} · {item.owner?.email || 'No email'}</span>
                    </div>
                    <div className="kv-row">
                      <span className="subtle">Purpose</span>
                      <div>
                        <select
                          value={purposeValue}
                          onChange={(event) =>
                            setPurposeById({ ...purposeById, [item._id]: event.target.value })
                          }
                        >
                          {PURPOSE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        {purposeValue === 'Other' && (
                          <input
                            style={{ marginTop: 8 }}
                            placeholder="Describe purpose"
                            value={customPurposeById[item._id] || ''}
                            onChange={(event) =>
                              setCustomPurposeById({ ...customPurposeById, [item._id]: event.target.value })
                            }
                          />
                        )}
                      </div>
                    </div>
                    {req && (
                      <div className="kv-row">
                        <span className="subtle">Request status</span>
                        <span><strong>{req.status}</strong></span>
                      </div>
                    )}
                  </div>
                  <div className="actions-row" style={{ marginTop: 12 }}>
                    <button className="btn btn-secondary" onClick={() => handleViewDetails(item._id)}>
                      View details
                    </button>
                    {canRequest && (
                      <button
                        className="btn btn-primary"
                        onClick={() => requestAccess(item._id)}
                        disabled={requestLoadingById[item._id]}
                      >
                        {requestLoadingById[item._id]
                          ? 'Requesting...'
                          : req
                            ? 'Request again'
                            : 'Request access'}
                      </button>
                    )}
                    {item.owner?.id && (
                      <button
                        className="btn btn-danger"
                        onClick={() => navigate(`/reports?reportedUserId=${item.owner.id}`)}
                      >
                        Report owner
                      </button>
                    )}
                  </div>
                  {requestMessageById[item._id] && (
                    <div className="alert alert-success" style={{ marginTop: 10 }}>
                      {requestMessageById[item._id]}
                    </div>
                  )}
                  {requestErrorById[item._id] && (
                    <div className="alert alert-error" style={{ marginTop: 10 }}>
                      {requestErrorById[item._id]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasSearched && recentSearches.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h3>Recent searches</h3>
            <button className="btn btn-secondary" type="button" onClick={clearRecentSearches}>
              Clear history
            </button>
          </div>
          <div style={{ margin: '10px 0 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {recentSearches.map((id) => (
              <button
                key={id}
                type="button"
                className="btn btn-secondary"
                onClick={() => quickSearch(id)}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


