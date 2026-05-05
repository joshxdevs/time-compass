import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronDown, Pencil, Trash2, Merge, Plus, GripVertical } from 'lucide-react';
import { Activity } from '../../types';

const COLORS = ['#7c6af7','#4ade80','#f87171','#fbbf24','#60a5fa','#f472b6','#34d399','#fb923c'];

interface Props {
  activity: Activity;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMerge: (id: string) => void;
  onCreate: (parentId: string) => void;
  onColorChange: (id: string, color: string) => Promise<void>;
  depth?: number;
}

const ActivityNode: React.FC<Props> = ({ activity, onRename, onDelete, onMerge, onCreate, onColorChange, depth = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(activity.name);
  const [showColors, setShowColors] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasChildren = activity.children && activity.children.length > 0;

  const commitRename = async () => {
    if (editName.trim() && editName !== activity.name) {
      await onRename(activity.id, editName.trim());
    }
    setEditing(false);
  };

  return (
    <div className="activity-node">
      <div className="activity-node-row" style={{ paddingLeft: depth * 16 + 10 }}>
        <GripVertical size={14} style={{ color: 'var(--text-muted)', cursor: 'grab', flexShrink: 0 }} />

        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', width: 16, flexShrink: 0 }}
          onClick={() => setExpanded((e) => !e)}
        >
          {hasChildren
            ? expanded ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
            : <span style={{ width: 14 }} />}
        </button>

        {/* Color dot */}
        <button
          style={{ width: 10, height: 10, borderRadius: '50%', background: activity.color || 'var(--accent)', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}
          onClick={() => setShowColors((s) => !s)}
          title="Change color"
        />

        {editing ? (
          <input
            ref={inputRef}
            className="activity-name-input"
            value={editName}
            autoFocus
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setEditName(activity.name); setEditing(false); } }}
          />
        ) : (
          <span className="activity-name" onDoubleClick={() => setEditing(true)}>{activity.name}</span>
        )}

        <div className="activity-actions">
          <button className="btn btn-icon btn-ghost" title="Add child" onClick={() => onCreate(activity.id)} id={`add-child-${activity.id}`}>
            <Plus size={13} />
          </button>
          <button className="btn btn-icon btn-ghost" title="Rename" onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.select(), 10); }} id={`rename-${activity.id}`}>
            <Pencil size={13} />
          </button>
          <button className="btn btn-icon btn-ghost" title="Merge" onClick={() => onMerge(activity.id)} id={`merge-${activity.id}`}>
            <Merge size={13} />
          </button>
          <button className="btn btn-icon btn-danger" title="Delete" onClick={() => onDelete(activity.id)} id={`delete-${activity.id}`}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Color picker */}
      {showColors && (
        <div style={{ paddingLeft: depth * 16 + 48, paddingBottom: 8, display: 'flex', gap: 6 }}>
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-swatch${activity.color === c ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => { onColorChange(activity.id, c); setShowColors(false); }}
            />
          ))}
        </div>
      )}

      {/* Children */}
      {hasChildren && expanded && (
        <div className="activity-children">
          {activity.children!.map((child) => (
            <ActivityNode
              key={child.id}
              activity={child}
              onRename={onRename}
              onDelete={onDelete}
              onMerge={onMerge}
              onCreate={onCreate}
              onColorChange={onColorChange}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityNode;
