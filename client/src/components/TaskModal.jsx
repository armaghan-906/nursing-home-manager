import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FiX } from 'react-icons/fi';

const TaskModal = ({ task, residentId, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'admission',
    status: 'pending',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    notes: '',
    fundingType: 'all'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        category: task.category || 'admission',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        assignedTo: task.assignedTo || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        notes: task.notes || '',
        fundingType: task.fundingType || 'all'
      });
    }
  }, [task]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      if (task) {
        await api.put(`/tasks/${task._id}`, form);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', { ...form, residentId });
        toast.success('Task created');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'Add Task'}</h2>
          <button className="btn-icon" onClick={onClose}><FiX size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Title *</label>
              <input value={form.title} onChange={(e) => handleChange('title', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
                  <option value="admission">Admission</option>
                  <option value="ongoing-care">Ongoing Care</option>
                  <option value="discharge">Discharge</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={(e) => handleChange('priority', e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div className="form-group">
                <label>Assigned To</label>
                <input value={form.assignedTo} onChange={(e) => handleChange('assignedTo', e.target.value)} placeholder="Staff name" />
              </div>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => handleChange('dueDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea rows={2} value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
