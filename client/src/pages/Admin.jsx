import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FiUserPlus, FiTrash2, FiShield, FiX } from 'react-icons/fi';
import './Admin.css';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/register', form);
      toast.success('User created');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'staff' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const roleBadge = {
    admin: 'badge-danger',
    manager: 'badge-warning',
    staff: 'badge-info'
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>User Administration</h1>
          <p className="page-subtitle">Manage staff accounts and roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiUserPlus size={18} /> Add User
        </button>
      </div>

      {loading ? (
        <div className="loading-skeleton">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 56, marginBottom: 4 }} />
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-sm">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="user-name">{u.name}</span>
                      {u._id === currentUser?._id && (
                        <span className="badge badge-sm badge-muted">You</span>
                      )}
                    </div>
                  </td>
                  <td className="email-cell">{u.email}</td>
                  <td>
                    <span className={`badge ${roleBadge[u.role]}`}>
                      <FiShield size={10} /> {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive !== false ? 'badge-success' : 'badge-muted'}`}>
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="date-cell">
                    {new Date(u.createdAt).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New User</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
