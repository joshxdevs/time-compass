import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import ActivityNode from '../components/Activities/ActivityNode';
import MergeModal from '../components/Activities/MergeModal';

const COLORS = ['#7c6af7','#4ade80','#f87171','#fbbf24','#60a5fa','#f472b6','#34d399','#fb923c'];

const Activities: React.FC = () => {
  const { tree, activities, isLoading, createActivity, updateActivity, deleteActivity, mergeActivities } = useActivities();
  const [search, setSearch] = useState('');
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newParentId, setNewParentId] = useState<string | undefined>();

  const filteredTree = search
    ? tree.filter((a) => JSON.stringify(a).toLowerCase().includes(search.toLowerCase()))
    : tree;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    await createActivity(newName.trim(), newParentId, randomColor);
    setNewName('');
    setCreating(false);
    setNewParentId(undefined);
  };

  const handleAddChild = (parentId: string) => {
    setNewParentId(parentId);
    setCreating(true);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Activities</h1>
            <p className="page-subtitle">Organize your work into a hierarchy</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setNewParentId(undefined); setCreating(true); }} id="new-activity-btn">
            <Plus size={16} /> New activity
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="form-input"
          style={{ paddingLeft: 36 }}
          placeholder="Search activities…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="activity-search"
        />
      </div>

      {creating && (
        <div className="card mb-16" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <input
            autoFocus
            className="form-input"
            placeholder={newParentId ? 'Child activity name…' : 'Activity name…'}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
          />
          <button className="btn btn-primary" onClick={handleCreate} id="confirm-create-btn">Create</button>
          <button className="btn btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
        </div>
      )}

      <div className="card" style={{ padding: '8px 4px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><span className="spinner" style={{ width: 24, height: 24 }} /></div>
        ) : filteredTree.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗂️</div>
            <div className="empty-state-title">No activities yet</div>
            <div className="empty-state-text">Create your first activity to start organizing your time.</div>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <Plus size={16} /> Create activity
            </button>
          </div>
        ) : (
          <div className="activity-tree">
            {filteredTree.map((activity) => (
              <ActivityNode
                key={activity.id}
                activity={activity}
                onRename={(id, name) => updateActivity(id, { name })}
                onDelete={deleteActivity}
                onMerge={(id) => setMergeSourceId(id)}
                onCreate={handleAddChild}
                onColorChange={(id, color) => updateActivity(id, { color })}
              />
            ))}
          </div>
        )}
      </div>

      {mergeSourceId && (
        <MergeModal
          sourceId={mergeSourceId}
          activities={activities}
          tree={tree}
          onMerge={mergeActivities}
          onClose={() => setMergeSourceId(null)}
        />
      )}
    </div>
  );
};

export default Activities;
