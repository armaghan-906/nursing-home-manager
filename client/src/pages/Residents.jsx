import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FiPlus, FiSearch, FiFilter, FiUser, FiMoreVertical, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import ResidentModal from '../components/ResidentModal';
import './Residents.css';

const fundingLabels = {
  'private': 'Private / Respite',
  'd2a': 'CCG D2A',
  'ccg-icb': 'CCG ICB',
  'la': 'Local Authority'
};

const statusLabels = {
  'admission': 'Admission',
  'ongoing-care': 'Ongoing Care',
  'discharge-planning': 'Discharge Planning',
  'discharged': 'Discharged',
  'deceased': 'Deceased'
};

const statusBadge = {
  'admission': 'badge-info',
  'ongoing-care': 'badge-success',
  'discharge-planning': 'badge-warning',
  'discharged': 'badge-muted',
  'deceased': 'badge-muted'
};

const fundingBadge = {
  'private': 'badge-success',
  'd2a': 'badge-info',
  'ccg-icb': 'badge-primary',
  'la': 'badge-warning'
};

const Residents = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fundingFilter, setFundingFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editResident, setEditResident] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();

  const fetchResidents = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (fundingFilter !== 'all') params.fundingType = fundingFilter;

      const { data } = await api.get('/residents', { params });
      setResidents(data.residents);
    } catch (err) {
      toast.error('Failed to load residents');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, fundingFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/residents/stats');
      setStats(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchResidents();
    fetchStats();
  }, [fetchResidents, fetchStats]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resident and all associated tasks?')) return;
    try {
      await api.delete(`/residents/${id}`);
      toast.success('Resident deleted');
      fetchResidents();
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete resident');
    }
    setActiveMenu(null);
  };

  const handleSave = () => {
    setShowModal(false);
    setEditResident(null);
    fetchResidents();
    fetchStats();
  };

  return (
    <div className="residents-page">
      {/* Stats Row */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{stats.totalActive}</div>
            <div className="stat-label">Active Residents</div>
          </div>
          <div className="stat-card stat-blue">
            <div className="stat-value">{stats.admissions}</div>
            <div className="stat-label">In Admission</div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-value">{stats.ongoingCare}</div>
            <div className="stat-label">Ongoing Care</div>
          </div>
          <div className="stat-card stat-amber">
            <div className="stat-value">{stats.overdueTasks}</div>
            <div className="stat-label">Overdue Tasks</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Residents</h1>
          <p className="page-subtitle">Manage residents and their care workflows</p>
        </div>
        <button
          id="add-resident-btn"
          className="btn btn-primary"
          onClick={() => { setEditResident(null); setShowModal(true); }}
        >
          <FiPlus size={18} /> Add Resident
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            id="resident-search"
            type="text"
            placeholder="Search by name or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <FiFilter size={16} className="filter-icon" />
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="admission">Admission</option>
            <option value="ongoing-care">Ongoing Care</option>
            <option value="discharge-planning">Discharge Planning</option>
            <option value="discharged">Discharged</option>
            <option value="deceased">Deceased</option>
          </select>
          <select
            id="funding-filter"
            value={fundingFilter}
            onChange={(e) => setFundingFilter(e.target.value)}
          >
            <option value="all">All Funding</option>
            <option value="private">Private / Respite</option>
            <option value="d2a">CCG D2A</option>
            <option value="ccg-icb">CCG ICB</option>
            <option value="la">Local Authority</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-skeleton">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 56, marginBottom: 4 }} />
          ))}
        </div>
      ) : residents.length === 0 ? (
        <div className="empty-state">
          <FiUser size={48} />
          <h3>No residents found</h3>
          <p>Add a new resident or adjust your filters.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Resident</th>
                <th>Room</th>
                <th>Status</th>
                <th>Funding</th>
                <th>Rate</th>
                <th>Progress</th>
                <th>Admission</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {residents.map((r) => (
                <tr key={r._id} className="resident-row" onClick={() => navigate(`/residents/${r._id}`)}>
                  <td>
                    <div className="resident-name-cell">
                      <div className="resident-avatar">
                        {r.firstName?.[0]}{r.lastName?.[0]}
                      </div>
                      <div>
                        <div className="resident-name">{r.firstName} {r.lastName}</div>
                        {r.nhsNumber && <div className="resident-nhs">NHS: {r.nhsNumber}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span className="room-number">{r.roomNumber}</span></td>
                  <td><span className={`badge ${statusBadge[r.status]}`}>{statusLabels[r.status]}</span></td>
                  <td><span className={`badge ${fundingBadge[r.fundingType]}`}>{fundingLabels[r.fundingType]}</span></td>
                  <td className="date-cell">{r.fundingRate ? `£${r.fundingRate}` : '—'}</td>
                  <td>
                    <div className="progress-cell">
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${r.workflowProgress}%` }} />
                      </div>
                      <span className="progress-text">{r.completedTasks}/{r.totalTasks}</span>
                    </div>
                  </td>
                  <td className="date-cell">{new Date(r.admissionDate).toLocaleDateString('en-GB')}</td>
                  <td>
                    <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon"
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === r._id ? null : r._id); }}
                      >
                        <FiMoreVertical size={16} />
                      </button>
                      {activeMenu === r._id && (
                        <div className="dropdown-menu">
                          <button onClick={() => { navigate(`/residents/${r._id}`); setActiveMenu(null); }}>
                            <FiEye size={14} /> View Profile
                          </button>
                          <button onClick={() => { setEditResident(r); setShowModal(true); setActiveMenu(null); }}>
                            <FiEdit2 size={14} /> Edit
                          </button>
                          <button className="dropdown-danger" onClick={() => handleDelete(r._id)}>
                            <FiTrash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ResidentModal
          resident={editResident}
          onClose={() => { setShowModal(false); setEditResident(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Residents;
