import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Activity } from '../../types';
import { flattenTree } from '../../hooks/useActivities';

interface Props {
  sourceId: string;
  activities: Activity[];
  tree: Activity[];
  onMerge: (sourceId: string, targetId: string) => Promise<void>;
  onClose: () => void;
}

const MergeModal: React.FC<Props> = ({ sourceId, activities, tree, onMerge, onClose }) => {
  const [targetId, setTargetId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const source = activities.find((a) => a.id === sourceId);
  const flat = flattenTree(tree).filter((a) => a.id !== sourceId);
  const filtered = flat.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  const handleMerge = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      await onMerge(sourceId, targetId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex items-center justify-between mb-16">
          <h2 className="modal-title" style={{ margin: 0 }}>Merge activity</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          All sessions from <strong style={{ color: 'var(--text-primary)' }}>{source?.name}</strong> will be moved to the selected activity, then it will be deleted.
        </p>

        <div className="form-group mb-16">
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32 }}
              placeholder="Search target activity…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
          {filtered.map((a) => (
            <div
              key={a.id}
              className={`activity-option${a.id === targetId ? ' selected' : ''}`}
              style={{ paddingLeft: a.depth * 14 + 12 }}
              onClick={() => setTargetId(a.id)}
            >
              <span className="activity-dot" style={{ background: a.color || 'var(--accent)' }} />
              {a.name}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '14px 12px', fontSize: 13, color: 'var(--text-muted)' }}>No activities found</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={handleMerge} disabled={!targetId || loading} id="confirm-merge-btn">
            {loading ? <span className="spinner" /> : 'Merge'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeModal;
