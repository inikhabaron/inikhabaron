'use client';

import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { DS } from './design-system';
import { isStaffRole } from './constants';
import { LoadingSpinner } from './LoadingSpinner';

export function UsersView({ users, loading, onAdd, onEdit, onDelete, formatDate }) {
  if (loading) return <LoadingSpinner />;

  // Staff-only view — see STAFF_ROLES in ./constants. Filtered here rather
  // than at the fetch in app/admin/page.js because that same `users` array is
  // also passed to NewsFormDialog as `staffUsers`, and this is purely about
  // what this one table shows.
  const staff = users.filter((user) => isStaffRole(user.role));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Users</h2>
        <button style={DS.btn('primary')} onClick={onAdd}><Plus size={15} />Add User</button>
      </div>
      <div style={{ ...DS.card, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
              {['Name', 'Email', 'Role', 'Verified', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f9fafb' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#1d4ed8', flexShrink: 0 }}>
                      {user.name?.[0]}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{user.name}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 12, color: '#6b7280' }}>{user.email}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ ...DS.tag, border: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{user.role}</span>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  {user.isVerified ? <CheckCircle size={16} color="#059669" /> : <XCircle size={16} color="#d1d5db" />}
                </td>
                <td style={{ padding: '13px 16px', fontSize: 12, color: '#6b7280' }}>{formatDate(user.createdAt)}</td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={DS.btn('ghost')} onClick={() => onEdit(user)}><Edit size={14} /></button>
                    <button style={{ ...DS.btn('ghost'), color: '#dc2626' }} onClick={() => onDelete(user.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
