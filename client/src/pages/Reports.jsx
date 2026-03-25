import { useState, useEffect } from 'react';
import api from '../utils/api';
import { FiUsers, FiCheckSquare, FiAlertTriangle, FiClock, FiActivity, FiTrendingUp } from 'react-icons/fi';
import './Reports.css';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/residents/stats');
        setStats(data);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="reports-page">
        <div className="page-header">
          <h1>Reports</h1>
          <p className="page-subtitle">Summary statistics and insights</p>
        </div>
        <div className="reports-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const fundingMap = {};
  stats.fundingBreakdown?.forEach(f => {
    fundingMap[f._id] = f.count;
  });

  const fundingData = [
    { label: 'Private / Respite', count: fundingMap['private'] || 0, color: '#10b981' },
    { label: 'CCG D2A', count: fundingMap['d2a'] || 0, color: '#3b82f6' },
    { label: 'CCG ICB', count: fundingMap['ccg-icb'] || 0, color: '#6366f1' },
    { label: 'Local Authority', count: fundingMap['la'] || 0, color: '#f59e0b' },
  ];

  const totalFunding = fundingData.reduce((sum, f) => sum + f.count, 0) || 1;

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="page-subtitle">Summary statistics and insights</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="reports-grid">
        <div className="report-card">
          <div className="report-card-icon" style={{ background: 'var(--primary-bg)', color: 'var(--primary-light)' }}>
            <FiUsers size={22} />
          </div>
          <div className="report-card-body">
            <div className="report-card-value">{stats.totalActive}</div>
            <div className="report-card-label">Total Active Residents</div>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <FiActivity size={22} />
          </div>
          <div className="report-card-body">
            <div className="report-card-value">{stats.admissions}</div>
            <div className="report-card-label">In Admission Phase</div>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <FiTrendingUp size={22} />
          </div>
          <div className="report-card-body">
            <div className="report-card-value">{stats.ongoingCare}</div>
            <div className="report-card-label">Ongoing Care</div>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <FiClock size={22} />
          </div>
          <div className="report-card-body">
            <div className="report-card-value">{stats.dischargePlanning}</div>
            <div className="report-card-label">Discharge Planning</div>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-icon" style={{ background: 'var(--primary-bg)', color: 'var(--primary-light)' }}>
            <FiCheckSquare size={22} />
          </div>
          <div className="report-card-body">
            <div className="report-card-value">{stats.pendingTasks + stats.inProgressTasks}</div>
            <div className="report-card-label">Active Tasks</div>
            <div className="report-card-sub">{stats.pendingTasks} pending · {stats.inProgressTasks} in progress</div>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <FiAlertTriangle size={22} />
          </div>
          <div className="report-card-body">
            <div className="report-card-value">{stats.overdueTasks}</div>
            <div className="report-card-label">Overdue Tasks</div>
          </div>
        </div>
      </div>

      {/* Funding Breakdown */}
      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 20 }}>Funding Breakdown</h2>
        <div className="funding-chart">
          <div className="funding-bar-row">
            {fundingData.map((f) => (
              <div
                key={f.label}
                className="funding-bar-segment"
                style={{
                  width: `${(f.count / totalFunding) * 100}%`,
                  background: f.color,
                  minWidth: f.count > 0 ? 20 : 0
                }}
                title={`${f.label}: ${f.count}`}
              />
            ))}
          </div>
          <div className="funding-legend">
            {fundingData.map((f) => (
              <div key={f.label} className="funding-legend-item">
                <span className="funding-dot" style={{ background: f.color }} />
                <span className="funding-label">{f.label}</span>
                <span className="funding-count">{f.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
