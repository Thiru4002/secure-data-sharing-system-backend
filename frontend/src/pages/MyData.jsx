import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function MyData() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    ownerReferenceHint: '',
    ownerIdentifier: '',
    allowDownload: false,
  });
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    api
      .get('/data/my-data')
      .then((response) => {
        const list = response.data.data || response.data || [];
        const sorted = Array.isArray(list) ? [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
        setItems(sorted);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load data');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '',
      ownerReferenceHint: item.ownerReferenceHint || '',
      ownerIdentifier: item.ownerIdentifier || '',
      allowDownload: !!item.allowDownload,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const saveEdit = async (id) => {
    try {
      await api.patch(`/data/${id}`, {
        title: form.title,
        description: form.description,
        category: form.category,
        tags: form.tags,
        ownerReferenceHint: form.ownerReferenceHint,
        ownerIdentifier: form.ownerIdentifier,
        allowDownload: form.allowDownload,
      });
      setEditingId(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const removeItem = async (id) => {
    if (!window.confirm('Delete this data item?')) return;
    try {
      await api.delete(`/data/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const renderTags = (tags) => {
    const list = Array.isArray(tags) ? tags : (tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
    if (!list.length) return <span className="subtle">No tags</span>;
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {list.map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    );
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">My uploaded data</h2>
        <p>Manage the data you have shared and update metadata when needed.</p>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading data...</p>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : items.length === 0 ? (
          <p>No data uploaded yet.</p>
        ) : (
          <div className="grid" style={{ gap: 16 }}>
            {items.map((item) => (
              <div key={item._id} className="card" style={{ boxShadow: 'none' }}>
                {editingId === item._id ? (
                  <div className="form">
                    <div className="form-group">
                      <label>Title</label>
                      <input name="title" value={form.title} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea name="description" rows="3" value={form.description} onChange={handleChange} />
                    </div>
                    <div className="grid grid-2">
                      <div className="form-group">
                        <label>Category</label>
                        <input name="category" value={form.category} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>Tags</label>
                        <input name="tags" value={form.tags} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="grid grid-2">
                      <div className="form-group">
                        <label>Owner reference hint</label>
                        <input
                          name="ownerReferenceHint"
                          value={form.ownerReferenceHint}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Owner identifier</label>
                        <input
                          name="ownerIdentifier"
                          value={form.ownerIdentifier}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          name="allowDownload"
                          checked={form.allowDownload}
                          onChange={handleChange}
                        />
                        Allow service users to download files after approval
                      </label>
                    </div>
                    <div className="actions-row">
                      <button className="btn btn-primary" onClick={() => saveEdit(item._id)}>
                        Save
                      </button>
                      <button className="btn btn-secondary" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 style={{ marginBottom: 6 }}>{item.title}</h3>
                    <p style={{ marginTop: 0 }}>{item.description}</p>
                    <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                      <div className="kv-row">
                        <span className="subtle">Category</span>
                        <span className="tag" style={{ width: 'fit-content' }}>{item.category}</span>
                      </div>
                      <div className="kv-row">
                        <span className="subtle">Tags</span>
                        {renderTags(item.tags)}
                      </div>
                      <div className="kv-row">
                        <span className="subtle">Reference hint</span>
                        <span>{item.ownerReferenceHint || '�'}</span>
                      </div>
                      <div className="kv-row">
                        <span className="subtle">Identifier</span>
                        <span>{item.ownerIdentifier || '�'}</span>
                      </div>
                      <div className="kv-row">
                        <span className="subtle">Download</span>
                        <span>{item.allowDownload ? 'Allowed' : 'Not allowed'}</span>
                      </div>
                    </div>
                    <div className="actions-row" style={{ marginTop: 16 }}>
                      <button className="btn btn-secondary" onClick={() => navigate(`/view/${item._id}`)}>
                        View
                      </button>
                      <button className="btn btn-primary" onClick={() => startEdit(item)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => removeItem(item._id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

