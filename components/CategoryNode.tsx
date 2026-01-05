import React, { useState } from 'react';
import type { CategoryNode as CN } from '../types/category';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface Props {
  node: CN;
  depth?: number;
}

export default function CategoryNode({ node, depth = 0 }: Props) {
  const [open, setOpen] = useState<boolean>(false);
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
        {hasChildren ? (
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? 'collapse' : 'expand'}
            style={{ 
              width: 24, 
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span style={{ display: 'inline-block', width: 24 }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{node.name}</div>
          {node.group && (
            <div style={{ fontSize: '12px', color: '#666' }}>{node.group}</div>
          )}
        </div>
      </div>
      {hasChildren && open && (
        <div style={{ marginTop: 4 }}>
          {node.children.map((child) => (
            <CategoryNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}