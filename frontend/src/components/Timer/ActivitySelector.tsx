import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';
import { Activity } from '../../types';
import { flattenTree } from '../../hooks/useActivities';

const COLORS = ['#7c6af7','#4ade80','#f87171','#fbbf24','#60a5fa','#f472b6','#34d399','#fb923c'];

interface Props {
  tree: Activity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate?: (name: string, parentId?: string) => Promise<void>;
  disabled?: boolean;
}

const ActivitySelector: React.FC<Props> = ({ tree, selectedId, onSelect, onCreate, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const flat = flattenTree(tree);
  const filtered = flat.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  const selected = flat.find((a) => a.id === selectedId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !onCreate) return;
    await onCreate(newName.trim());
    setNewName('');
    setCreating(false);
  };

  return (
    <div className="activity-selector" ref={ref}>
      <button
        className="activity-selector-trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        id="activity-selector-btn"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selected ? (
            <>
              <span className="activity-dot" style={{ background: selected.color || 'var(--accent)' }} />
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Select activity…</span>
          )}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>

      {open && (
        <div className="activity-dropdown">
          <div className="activity-search">
            <input
              autoFocus
              placeholder="Search activities…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {filtered.length === 0 && !creating && (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)' }}>No activities found</div>
          )}
          {filtered.map((a) => (
            <div
              key={a.id}
              className={`activity-option${a.id === selectedId ? ' selected' : ''}`}
              onClick={() => { onSelect(a.id); setOpen(false); setSearch(''); }}
            >
              <span style={{ paddingLeft: a.depth * 14 }} />
              <span className="activity-dot" style={{ background: a.color || 'var(--accent)' }} />
              <span className="truncate">{a.name}</span>
            </div>
          ))}
          {onCreate && !creating && (
            <div
              className="activity-option"
              onClick={() => setCreating(true)}
              style={{ borderTop: '1px solid var(--border)', color: 'var(--accent)' }}
            >
              <Plus size={14} />
              New activity
            </div>
          )}
          {creating && (
            <div style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
              <input
                autoFocus
                className="form-input"
                style={{ fontSize: 13, padding: '6px 10px' }}
                placeholder="Activity name…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
              />
              <button className="btn btn-primary btn-sm" onClick={handleCreate}>Add</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivitySelector;
