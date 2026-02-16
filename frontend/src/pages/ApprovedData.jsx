import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const TABS = ['pending', 'approved', 'rejected', 'revoked'];

const getFilenameFromDisposition = (disposition) => {
  if (!disposition) return null;
  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1] || null;
};

export default function ApprovedData() {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('approved');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/consent/my-requests')
      .then((response) => {
        const list = response.data.data?.data || response.data.data || response.data || [];
        setItems(list);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load requests'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => items.filter((item) => item.status === activeTab), [items, activeTab]);

  const downloadIfAllowed = async (dataId, fallbackName) => {
    try {
      const response = await api.get(`/data/${dataId}/download`, { responseType: 'blob' });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const disposition = response.headers['content-disposition'];
      const filename = getFilenameFromDisposition(disposition) || fallbackName || 'download';
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

  const getDownloadState = (item) => {
    if (!item.data) return { label: 'Deleted', enabled: false };
    const allow = !!item.data?.allowDownload;
    const type = item.data?.dataType;
    const hasFile = !!item.data?.fileUrl;
    if (!allow) return { label: 'Download off', enabled: false };
    if (type === 'file') {
      return hasFile ? { label: 'Download file', enabled: true } : { label: 'File missing', enabled: false };
    }
    if (type === 'text') {
      return { label: 'Download text', enabled: true };
    }
    return { label: 'Download unavailable', enabled: false };
  };

  const renderStatus = (status) => status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <h2 className="section-title">My access status</h2>
        <p>Track approvals, rejections, and pending requests.</p>
      </div>
      <div className="card">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              className={tab === activeTab ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        {loading ? (
          <p>Loading requests...</p>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : filtered.length === 0 ? (
          <p>No {activeTab} requests yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Owner</th>
                  <th>Purpose</th>
                  <th>Requested</th>
                  <th>Expiry</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const download = getDownloadState(item);
                  const isDeleted = !item.data;
                  return (
                    <tr key={item._id}>
                      <td>{item.data?.title || 'Deleted data'}</td>
                      <td>{item.dataOwner?.name || 'Unknown'}</td>
                      <td>{item.purpose || '-'}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}</td>
                      <td>
                        {item.status === 'approved' && !isDeleted ? (
                          <div className="actions-row">
                            <button className="btn btn-secondary" onClick={() => navigate(`/view/${item.data?._id}`)}>
                              View data
                            </button>
                            <button
                              className={download.enabled ? 'btn btn-primary' : 'btn btn-secondary'}
                              onClick={() => download.enabled && downloadIfAllowed(item.data?._id, item.data?.title)}
                              disabled={!download.enabled}
                            >
                              {download.label}
                            </button>
                          </div>
                        ) : (
                          <span className="tag">{renderStatus(item.status)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
