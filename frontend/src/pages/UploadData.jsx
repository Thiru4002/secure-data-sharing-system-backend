import { useState } from 'react';
import api from '../api/axiosConfig';

export default function UploadData() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    file: null,
    category: 'General',
    tags: '',
    ownerReferenceHint: '',
    ownerIdentifier: '',
    allowDownload: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (event) => {
    const { name, value, files, type, checked } = event.target;
    if (name === 'file') {
      setFormData({ ...formData, file: files[0] });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          data.append(key, value);
        }
      });

      await api.post('/data/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('Data uploaded successfully');
      setFormData({
        title: '',
        description: '',
        content: '',
        file: null,
        category: 'General',
        tags: '',
        ownerReferenceHint: '',
        ownerIdentifier: '',
        allowDownload: false,
      });
      setShowAdvanced(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">Upload data</h2>
        <p>Keep it simple: title, description, and content/file. Advanced metadata is optional.</p>
      </div>

      <div className="card">
        {loading && <div className="alert alert-info">Uploading... please wait.</div>}
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" rows="3" value={formData.description} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Content (optional)</label>
            <textarea name="content" rows="4" value={formData.content} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Upload file (optional)</label>
            <input name="file" type="file" onChange={handleChange} />
            {formData.file && (
              <div style={{ marginTop: 8 }}>
                <p style={{ color: '#5b6475', fontSize: 13, margin: 0 }}>
                  Selected: {formData.file.name} ({Math.round(formData.file.size / 1024)} KB) · {formData.file.type || 'unknown type'}
                </p>
                <p style={{ color: '#5b6475', fontSize: 13, margin: '4px 0 0' }}>
                  Cloud delivery: {formData.file.type?.startsWith('image/') ? 'image' : 'raw'}
                </p>
              </div>
            )}
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                name="allowDownload"
                checked={formData.allowDownload}
                onChange={handleChange}
              />
              Allow service users to download files after approval
            </label>
            <p style={{ margin: '6px 0 0', color: '#5b6475', fontSize: 13 }}>
              Applies to file uploads only. You can change this later in My Data.
            </p>
          </div>

          <button className="btn btn-secondary" type="button" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? 'Hide advanced' : 'Show advanced'}
          </button>

          {showAdvanced && (
            <div className="grid" style={{ gap: 16 }}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Category</label>
                  <input name="category" value={formData.category} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Tags</label>
                  <input name="tags" value={formData.tags} onChange={handleChange} placeholder="tag1, tag2" />
                </div>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Owner reference hint</label>
                  <input
                    name="ownerReferenceHint"
                    value={formData.ownerReferenceHint}
                    onChange={handleChange}
                    placeholder="e.g., Medical Records 2024"
                  />
                </div>
                <div className="form-group">
                  <label>Owner identifier</label>
                  <input
                    name="ownerIdentifier"
                    value={formData.ownerIdentifier}
                    onChange={handleChange}
                    placeholder="e.g., EMP-789"
                  />
                </div>
              </div>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>
    </div>
  );
}

