import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import {
  FiCheckCircle, FiCircle, FiClock, FiLoader, FiAlertTriangle,
  FiFilter, FiSearch, FiXCircle
} from 'react-icons/fi';
import './Tasks.css';

const statusIcons = {
  'pending': FiCircle,
  'in-progress': FiLoader,
  'completed': FiCheckCircle,
  'cancelled': FiXCircle,
  'blocked': FiAlertTriangle
};

const statusColors = {
  'pending': 'var(--text-muted)',
  'in-progress': 'var(--info)',
  'completed': 'var(--success)',
  'cancelled': 'var(--text-muted)',
  'blocked': 'var(--danger)'
};

const priorityBadge = {
  'low': 'badge-muted',
  'medium': 'badge-info',
  'high': 'badge-warning',
  'urgent': 'badge-danger'
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (dueDateFilter !== 'all') params.dueDate = dueDateFilter;

      const { data } = await api.get('/tasks', { params });
      setTasks(data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, dueDateFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch {
      toast.error('Failed to update task');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    const resident = t.residentId;
    return (
      t.title.toLowerCase().includes(q) ||
      (resident?.firstName?.toLowerCase().includes(q)) ||
      (resident?.lastName?.toLowerCase().includes(q)) ||
      (resident?.roomNumber?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Task Manager</h1>
          <p className="page-subtitle">Overview of all tasks across residents</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks or residents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <FiFilter size={16} className="filter-icon" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="records-update">Records Update</option>
            <option value="invoicing-agreement">Invoicing & Agreement</option>
            <option value="contract">Contract</option>
            <option value="long-term-funding">Long-Term Funding</option>
            <option value="fnc">FNC Assessment</option>
            <option value="post-demise-discharge">Post Demise / Discharge</option>
            <option value="hl-tasks">HL Tasks</option>
          </select>
          <select value={dueDateFilter} onChange={(e) => setDueDateFilter(e.target.value)}>
            <option value="all">All Dates</option>
            <option value="overdue">Overdue</option>
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="loading-skeleton">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 48, marginBottom: 4 }} />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <FiCheckCircle size={48} />
          <h3>No tasks found</h3>
          <p>Adjust your filters or add residents to generate tasks.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Task</th>
                <th>Resident</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const StatusIcon = statusIcons[task.status] || FiCircle;
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
                return (
                  <tr key={task._id}>
                    <td>
                      <button
                        className="task-status-btn"
                        style={{ color: statusColors[task.status] }}
                        onClick={() => {
                          const next = task.status === 'completed' ? 'pending'
                            : task.status === 'pending' ? 'in-progress'
                            : task.status === 'in-progress' ? 'completed'
                            : 'pending';
                          handleStatusChange(task._id, next);
                        }}
                      >
                        <StatusIcon size={18} />
                      </button>
                    </td>
                    <td>
                      <div className={`task-table-title ${task.status === 'completed' ? 'completed-text' : ''}`}>
                        {task.title}
                      </div>
                    </td>
                    <td>
                      {task.residentId ? (
                        <button
                          className="resident-link"
                          onClick={() => navigate(`/residents/${task.residentId._id}`)}
                        >
                          {task.residentId.firstName} {task.residentId.lastName}
                          <span className="room-tag">{task.residentId.roomNumber}</span>
                        </button>
                      ) : '—'}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {{
                          'records-update': 'Records Update',
                          'invoicing-agreement': 'Invoicing & Agreement',
                          'contract': 'Contract',
                          'long-term-funding': 'Long-Term Funding',
                          'fnc': 'FNC Assessment',
                          'post-demise-discharge': 'Post Demise / Discharge',
                          'hl-tasks': 'HL Tasks'
                        }[task.category] || task.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${priorityBadge[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`date-cell ${isOverdue ? 'overdue' : ''}`}>
                        {task.dueDate ? (
                          <>
                            {isOverdue && <FiAlertTriangle size={12} />}
                            {new Date(task.dueDate).toLocaleDateString('en-GB')}
                          </>
                        ) : '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontSize: '0.85rem', color: statusColors[task.status] }}>
                        {task.status?.replace('-', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Tasks;
