import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const getFilenameFromDisposition = (disposition) => {
  if (!disposition) return null;
  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1] || null;
};

export default function ViewData({ user }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await api.get(`/data/${id}`);
        setData(response.data.data || response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return <div className="card">Loading...</div>;
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="card">No data found.</div>;
  }

  const canDownloadFile = data.allowDownload && data.dataType === 'file' && data.fileUrl;
  const canDownloadText = data.allowDownload && data.dataType === 'text' && data.content;
  const canViewFile = data.dataType === 'file' && data.fileUrl;

  const viewFile = () => {
    const token = localStorage.getItem('token');
    const baseUrl = api.defaults.baseURL || 'http://localhost:5000/api';
    const url = `${baseUrl}/data/${id}/view?token=${encodeURIComponent(token || '')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadFile = async () => {
    try {
      const response = await api.get(`/data/${id}/download`, { responseType: 'blob' });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const disposition = response.headers['content-disposition'];
      const filename = getFilenameFromDisposition(disposition) || data.fileName || data.title || 'download';
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download');
    }
  };

  const downloadText = () => {
    const blob = new Blob([data.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title || 'data'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stack">
      <div className="card tinted">
        <h2 className="section-title">{data.title}</h2>
        <p>{data.description}</p>
        <div className="tag">{data.category}</div>
      </div>

      <div className="card tinted">
        <h3>Content</h3>
        {data.dataType === 'file' && data.fileUrl ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="actions-row">
              {canViewFile && (
                <button className="btn btn-secondary" onClick={viewFile}>
                  View file
                </button>
              )}
              {canDownloadFile && (
                <button className="btn btn-primary" onClick={downloadFile}>
                  Download file
                </button>
              )}
            </div>
            {data.content && (
              <div>
                <p style={{ margin: 0, color: '#5b6475' }}>Attached note:</p>
                <pre style={{ whiteSpace: 'pre-wrap', color: '#1b1f2a' }}>{data.content}</pre>
              </div>
            )}
          </div>
        ) : (
          <div>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#1b1f2a' }}>{data.content}</pre>
            {canDownloadText && (
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={downloadText}>
                Download text
              </button>
            )}
          </div>
        )}
        {!data.allowDownload && data.dataType === 'file' && (
          <p style={{ marginTop: 12, color: '#5b6475' }}>Download disabled by data owner.</p>
        )}
      </div>

      {user?.role === 'service_user' && data.ownerInfo && (
        <div className="card tinted">
          <h3>Owner reference</h3>
          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            <div className="kv-row">
              <span className="subtle">Name</span>
              <span>{data.ownerInfo.name}</span>
            </div>
            <div className="kv-row">
              <span className="subtle">Email</span>
              <span>{data.ownerInfo.email}</span>
            </div>
            <div className="kv-row">
              <span className="subtle">User ID</span>
              <span>{data.ownerInfo.userId}</span>
            </div>
          </div>
        </div>
      )}

      {data.consentInfo && (
        <div className="card tinted">
          <h3>Consent details</h3>
          <p>Approved at: {new Date(data.consentInfo.approvedAt).toLocaleString()}</p>
          <p>Expires: {new Date(data.consentInfo.expiryDate).toLocaleString()}</p>
          <p>Days remaining: {data.consentInfo.daysRemaining}</p>
        </div>
      )}
    </div>
  );
}
