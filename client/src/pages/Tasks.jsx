import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import {
  FiCheckCircle, FiCircle, FiLoader, FiAlertTriangle,
  FiFilter, FiSearch, FiXCircle, FiChevronDown, FiChevronRight, FiUser
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

const categoryLabel = {
  'records-update': 'Records Update',
  'invoicing-agreement': 'Invoicing & Agreement',
  'contract': 'Contract',
  'long-term-funding': 'Long-Term Funding',
  'fnc': 'FNC Assessment',
  'post-demise-discharge': 'Post Demise / Discharge',
  'hl-tasks': 'HL Tasks'
};

const fundingLabel = {
  'private': 'Private',
  'private-respite': 'Private Respite',
  'la': 'Local Authority',
  'la-respite': 'LA Respite',
  'ccg-icb': 'NHS D2A',
  'd2a': 'NHS CHC'
};

const fundingBadge = {
  'private': 'badge-purple',
  'private-respite': 'badge-purple',
  'la': 'badge-muted',
  'la-respite': 'badge-muted',
  'ccg-icb': 'badge-info',
  'd2a': 'badge-warning'
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});
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

  const toggleCollapse = (residentId) => {
    setCollapsed(prev => ({ ...prev, [residentId]: !prev[residentId] }));
  };

  const filteredTasks = tasks.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    const r = t.residentId;
    return (
      t.title.toLowerCase().includes(q) ||
      r?.firstName?.toLowerCase().includes(q) ||
      r?.lastName?.toLowerCase().includes(q) ||
      r?.roomNumber?.toLowerCase().includes(q)
    );
  });

  // Group by resident
  const grouped = filteredTasks.reduce((acc, task) => {
    const id = task.residentId?._id || 'unknown';
    if (!acc[id]) acc[id] = { resident: task.residentId, tasks: [] };
    acc[id].tasks.push(task);
    return acc;
  }, {});

  // Sort by room number ascending
  const groups = Object.values(grouped).sort((a, b) => {
    const aRoom = a.resident?.roomNumber || '';
    const bRoom = b.resident?.roomNumber || '';
    return aRoom.localeCompare(bRoom, undefined, { numeric: true });
  });

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Task Manager</h1>
          <p className="page-subtitle">
            {groups.length} residents · {filteredTasks.length} tasks
          </p>
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

      {/* Column headings */}
      {!loading && groups.length > 0 && (
        <div className="group-col-headings">
          <span style={{ width: 28 }} />
          <span style={{ width: 32 }} />
          <span className="gcol gcol-room">Room</span>
          <span className="gcol gcol-name">Name</span>
          <span className="gcol gcol-admission">Admission</span>
          <span className="gcol gcol-funding">Funding</span>
          <span className="gcol gcol-rate">Net Weekly Rate</span>
          <span className="gcol gcol-progress">Progress</span>
          <span style={{ width: 90 }} />
        </div>
      )}

      {/* Grouped Task List */}
      {loading ? (
        <div className="loading-skeleton">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 56, marginBottom: 8, borderRadius: 8 }} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <FiCheckCircle size={48} />
          <h3>No tasks found</h3>
          <p>Adjust your filters or add residents to generate tasks.</p>
        </div>
      ) : (
        <div className="resident-groups">
          {groups.map(({ resident, tasks: resTasks }) => {
            const id = resident?._id || 'unknown';
            const isCollapsed = collapsed[id];
            const completedCount = resTasks.filter(t => t.status === 'completed').length;
            const total = resTasks.length;
            const pct = total ? Math.round((completedCount / total) * 100) : 0;
            const hasOverdue = resTasks.some(t =>
              t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
            );
            const hasBlocked = resTasks.some(t => t.status === 'blocked');
            const admissionDate = resident?.admissionDate
              ? new Date(resident.admissionDate).toLocaleDateString('en-GB')
              : '—';
            const rate = resident?.fundingRate
              ? `£${parseFloat(resident.fundingRate).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—';

            return (
              <div key={id} className="resident-group">
                {/* Resident Header Row */}
                <div
                  className="resident-group-header"
                  onClick={() => toggleCollapse(id)}
                >
                  <span className="collapse-icon">
                    {isCollapsed ? <FiChevronRight size={16} /> : <FiChevronDown size={16} />}
                  </span>

                  <div className="resident-avatar">
                    <FiUser size={14} />
                  </div>

                  <span className="gcol gcol-room">
                    <span className="room-number-badge">{resident?.roomNumber || '—'}</span>
                  </span>

                  <span className="gcol gcol-name">
                    <span className="resident-group-name">
                      {resident?.firstName} {resident?.lastName}
                      {hasOverdue && <span className="overdue-dot" title="Has overdue tasks" />}
                      {hasBlocked && <span className="blocked-dot" title="Has blocked tasks" />}
                    </span>
                  </span>

                  <span className="gcol gcol-admission">{admissionDate}</span>

                  <span className="gcol gcol-funding">
                    {resident?.fundingType && (
                      <span className={`badge badge-sm ${fundingBadge[resident.fundingType] || 'badge-muted'}`}>
                        {fundingLabel[resident.fundingType] || resident.fundingType}
                      </span>
                    )}
                  </span>

                  <span className="gcol gcol-rate">{rate}</span>

                  <span className="gcol gcol-progress">
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="progress-label">{completedCount}/{total}</span>
                  </span>

                  <button
                    className="view-resident-btn"
                    onClick={(e) => { e.stopPropagation(); navigate(`/residents/${id}`); }}
                  >
                    View Profile
                  </button>
                </div>

                {/* Tasks Table */}
                {!isCollapsed && (
                  <div className="resident-group-tasks">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}></th>
                          <th>Task</th>
                          <th>Category</th>
                          <th>Assigned To</th>
                          <th>Priority</th>
                          <th>Due Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resTasks.map((task) => {
                          const StatusIcon = statusIcons[task.status] || FiCircle;
                          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
                          return (
                            <tr key={task._id} className={task.status === 'completed' ? 'row-completed' : ''}>
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
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                  {categoryLabel[task.category] || task.category}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.85rem' }}>
                                  {task.assignedTo || '—'}
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
          })}
        </div>
      )}
    </div>
  );
};

export default Tasks;
