import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import {
  FiArrowLeft, FiEdit2, FiPhone, FiMail, FiUser, FiHeart,
  FiCheckCircle, FiCircle, FiClock, FiPaperclip, FiTrash2,
  FiChevronDown, FiChevronRight, FiPlus, FiAlertTriangle,
  FiLoader, FiXCircle, FiUpload
} from 'react-icons/fi';
import ResidentModal from '../components/ResidentModal';
import TaskModal from '../components/TaskModal';
import './ResidentProfile.css';

const fundingLabels = {
  'private': 'Private',
  'private-respite': 'Private Respite',
  'la': 'Local Authority',
  'la-respite': 'LA Respite',
  'ccg-icb': 'NHS D2A',
  'd2a': 'NHS CHC'
};

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

const priorityColors = {
  'low': 'badge-muted',
  'medium': 'badge-info',
  'high': 'badge-warning',
  'urgent': 'badge-danger'
};

const categoryLabels = {
  'records-update': 'Records Update',
  'invoicing-agreement': 'Invoicing & Agreement',
  'contract': 'Contract',
  'long-term-funding': 'Long-Term Funding',
  'fnc': 'FNC Assessment',
  'post-demise-discharge': 'Post Demise / Discharge',
  'hl-tasks': 'HL Supplementary Tasks',
  'change-in-funding': 'Change in Funding'
};

const categoryIcons = {
  'records-update': '📋',
  'invoicing-agreement': '🧾',
  'contract': '📝',
  'long-term-funding': '💰',
  'fnc': '🏥',
  'post-demise-discharge': '🚪',
  'hl-tasks': '💛',
  'change-in-funding': '🔄'
};

const ResidentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({
    'records-update': true,
    'invoicing-agreement': true,
    'contract': true,
    'long-term-funding': false,
    'fnc': false,
    'post-demise-discharge': false,
    'hl-tasks': false,
    'change-in-funding': false
  });
  const [uploadingTaskId, setUploadingTaskId] = useState(null);
  const [changeFundingType, setChangeFundingType] = useState('');
  const [generatingFunding, setGeneratingFunding] = useState(false);

  const fetchResident = useCallback(async () => {
    try {
      const { data } = await api.get(`/residents/${id}`);
      setResident(data);
    } catch (err) {
      toast.error('Failed to load resident');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchResident();
  }, [fetchResident]);

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchResident();
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchResident();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleFileUpload = async (taskId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploadingTaskId(taskId);
    try {
      await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('File uploaded');
      fetchResident();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleDeleteAttachment = async (taskId, attachmentId) => {
    try {
      await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
      toast.success('Attachment removed');
      fetchResident();
    } catch {
      toast.error('Failed to remove attachment');
    }
  };

  const handleChangeFunding = async () => {
    if (!changeFundingType) {
      toast.error('Please select a funding type');
      return;
    }
    setGeneratingFunding(true);
    try {
      const { data } = await api.post(`/residents/${id}/change-funding`, { newFundingType: changeFundingType });
      toast.success(data.message);
      setChangeFundingType('');
      setExpandedCategories(prev => ({ ...prev, 'change-in-funding': true }));
      fetchResident();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate tasks');
    } finally {
      setGeneratingFunding(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="skeleton" style={{ height: 200, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  if (!resident) return null;

  const categories = ['records-update', 'invoicing-agreement', 'contract', 'long-term-funding', 'fnc', 'change-in-funding', 'post-demise-discharge', 'hl-tasks'];

  return (
    <div className="profile-page">
      {/* Back button */}
      <button className="btn btn-ghost back-btn" onClick={() => navigate('/')}>
        <FiArrowLeft size={18} /> Back to Residents
      </button>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-lg">
            {resident.firstName?.[0]}{resident.lastName?.[0]}
          </div>
          <div className="profile-info">
            <h1>{resident.firstName} {resident.lastName}</h1>
            <div className="profile-meta">
              <span>Room {resident.roomNumber}</span>
              <span className="meta-sep">•</span>
              <span>{fundingLabels[resident.fundingType]}</span>
              <span className="meta-sep">•</span>
              <span style={{ textTransform: 'capitalize' }}>{resident.status?.replace('-', ' ')}</span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>
            <FiEdit2 size={16} /> Edit
          </button>
        </div>

        {/* Progress */}
        <div className="profile-progress">
          <div className="progress-info">
            <span>Workflow Progress</span>
            <span className="progress-pct">{resident.workflowProgress}%</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-bar-fill" style={{ width: `${resident.workflowProgress}%` }} />
          </div>
          <span className="progress-detail">{resident.completedTasks} of {resident.totalTasks} tasks completed</span>
        </div>

        {/* Contact Grid */}
        <div className="profile-contacts">
          {(resident.primaryContact?.name || resident.nokName) && (
            <div className="contact-card">
              <div className="contact-icon"><FiUser size={16} /></div>
              <div>
                <div className="contact-label">Next of Kin</div>
                <div className="contact-name">{resident.primaryContact?.name || resident.nokName}</div>
                {(resident.primaryContact?.relationship || resident.nokRelationship) && (
                  <div className="contact-sub">{resident.primaryContact?.relationship || resident.nokRelationship}</div>
                )}
                {(resident.primaryContact?.phone || resident.nokPhone) && (
                  <div className="contact-detail"><FiPhone size={12} /> {resident.primaryContact?.phone || resident.nokPhone}</div>
                )}
                {(resident.primaryContact?.email || resident.nokEmail) && (
                  <div className="contact-detail"><FiMail size={12} /> {resident.primaryContact?.email || resident.nokEmail}</div>
                )}
              </div>
            </div>
          )}
          {resident.gpName && (
            <div className="contact-card">
              <div className="contact-icon"><FiHeart size={16} /></div>
              <div>
                <div className="contact-label">GP</div>
                <div className="contact-name">{resident.gpName}</div>
                {resident.gpContact && (
                  <div className="contact-detail"><FiPhone size={12} /> {resident.gpContact}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Sections */}
      <div className="workflow-section">
        <div className="workflow-header">
          <h2>Workflow Tasks</h2>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>
            <FiPlus size={16} /> Add Task
          </button>
        </div>

        {categories.map((cat) => {
          const tasks = resident.tasks?.[cat] || [];
          const completed = tasks.filter(t => t.status === 'completed').length;
          const isExpanded = expandedCategories[cat];

          return (
            <div key={cat} className="category-section">
              <button className="category-header" onClick={() => toggleCategory(cat)}>
                <div className="category-left">
                  {isExpanded ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                  <span className="category-title">{categoryIcons[cat]} {categoryLabels[cat]}</span>
                  <span className="category-count">{completed}/{tasks.length}</span>
                </div>
                {tasks.length > 0 && (
                  <div className="category-progress">
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-bar-fill" style={{ width: `${tasks.length > 0 ? (completed / tasks.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
              </button>

              {isExpanded && (
                <div className="tasks-list">
                  {cat === 'change-in-funding' && (
                    <div className="change-funding-trigger" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                      <select
                        value={changeFundingType}
                        onChange={(e) => setChangeFundingType(e.target.value)}
                        style={{ flex: 1 }}
                      >
                        <option value="">— Select new funding type —</option>
                        <option value="private">Private</option>
                        <option value="private-respite">Private Respite</option>
                        <option value="la">Local Authority</option>
                        <option value="la-respite">LA Respite</option>
                        <option value="ccg-icb">NHS D2A</option>
                        <option value="d2a">NHS CHC</option>
                      </select>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleChangeFunding}
                        disabled={generatingFunding || !changeFundingType}
                      >
                        {generatingFunding ? 'Generating...' : 'Generate Tasks'}
                      </button>
                    </div>
                  )}
                  {tasks.length === 0 ? (
                    <div className="no-tasks">
                      {cat === 'change-in-funding' ? 'No change-in-funding tasks yet — select a funding type above to generate tasks' : 'No tasks in this category'}
                    </div>
                  ) : (
                    tasks.map((task) => {
                      const StatusIcon = statusIcons[task.status] || FiCircle;
                      return (
                        <div key={task._id} className={`task-item ${task.status === 'completed' ? 'task-completed' : ''}`}>
                          <div className="task-main">
                            <button
                              className="task-status-btn"
                              style={{ color: statusColors[task.status] }}
                              onClick={() => {
                                const next = task.status === 'completed' ? 'pending'
                                  : task.status === 'pending' ? 'in-progress'
                                  : task.status === 'in-progress' ? 'completed'
                                  : 'pending';
                                handleTaskStatusChange(task._id, next);
                              }}
                              title={`Status: ${task.status}`}
                            >
                              <StatusIcon size={20} />
                            </button>
                            <div className="task-content">
                              <div className="task-title-row">
                                <span className="task-title">{task.title}</span>
                                <span className={`badge badge-sm ${priorityColors[task.priority]}`}>{task.priority}</span>
                              </div>
                              {task.description && <div className="task-description">{task.description}</div>}
                              <div className="task-meta">
                                {task.assignedTo && <span>Assigned: {task.assignedTo}</span>}
                                {task.dueDate && (
                                  <span className={new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'overdue' : ''}>
                                    <FiClock size={12} /> {new Date(task.dueDate).toLocaleDateString('en-GB')}
                                  </span>
                                )}
                                {task.attachments?.length > 0 && (
                                  <span><FiPaperclip size={12} /> {task.attachments.length} file(s)</span>
                                )}
                              </div>

                              {/* Attachments */}
                              {task.attachments?.length > 0 && (
                                <div className="task-attachments">
                                  {task.attachments.map((att) => (
                                    <div key={att._id} className="attachment-chip">
                                      <FiPaperclip size={12} />
                                      <a href={att.path} target="_blank" rel="noreferrer">{att.originalName}</a>
                                      <button className="att-remove" onClick={() => handleDeleteAttachment(task._id, att._id)}>
                                        <FiTrash2 size={10} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="task-actions">
                              <label className="upload-btn" title="Upload file">
                                {uploadingTaskId === task._id ? <FiLoader size={14} className="spin" /> : <FiUpload size={14} />}
                                <input
                                  type="file"
                                  hidden
                                  onChange={(e) => {
                                    if (e.target.files[0]) handleFileUpload(task._id, e.target.files[0]);
                                  }}
                                />
                              </label>
                              <button className="btn-icon" onClick={() => { setEditTask(task); setShowTaskModal(true); }}>
                                <FiEdit2 size={14} />
                              </button>
                              <button className="btn-icon" onClick={() => handleDeleteTask(task._id)}>
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showEditModal && (
        <ResidentModal
          resident={resident}
          onClose={() => setShowEditModal(false)}
          onSave={() => { setShowEditModal(false); fetchResident(); }}
        />
      )}
      {showTaskModal && (
        <TaskModal
          task={editTask}
          residentId={id}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSave={() => { setShowTaskModal(false); setEditTask(null); fetchResident(); }}
        />
      )}
    </div>
  );
};

export default ResidentProfile;
