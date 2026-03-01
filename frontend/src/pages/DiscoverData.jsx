import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function DiscoverData() {
  const [search, setSearch] = useState('');
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.append('search', search.trim());
      }
      const response = await api.get(`/discovery/owners?${params.toString()}`);
      const payload = response.data.data || response.data;
      setOwners(payload?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to discover owners');
      setOwners([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">Discover data owners</h2>
        <p>Browse a person first, then open their profile and uploaded data metadata.</p>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form className="form" onSubmit={handleSearch}>
          <div className="form-group">
            <label>Owner search</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, user ID, UUID, or reference"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search owners'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Owner profiles</h3>
        {loading ? (
          <p>Loading owners...</p>
        ) : hasSearched && owners.length === 0 ? (
          <div className="empty-state">No matching data owners found.</div>
        ) : owners.length === 0 ? (
          <div className="empty-state">Search to view owner profiles.</div>
        ) : (
          <div className="grid" style={{ gap: 12 }}>
            {owners.map((owner) => (
              <div key={owner.id} className="card" style={{ boxShadow: 'none' }}>
                <div className="kv-row">
                  <span className="subtle">Name</span>
                  <span>{owner.name}</span>
                </div>
                <div className="kv-row">
                  <span className="subtle">User ID</span>
                  <span>{owner.userId || '-'}</span>
                </div>
                <div className="kv-row">
                  <span className="subtle">UUID</span>
                  <span>{owner.uuid}</span>
                </div>
                <div className="kv-row">
                  <span className="subtle">Reference</span>
                  <span>{owner.referenceDescription || '-'}</span>
                </div>
                <div className="actions-row" style={{ marginTop: 12 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/owners/${owner.id}`)}
                  >
                    Open owner page
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
