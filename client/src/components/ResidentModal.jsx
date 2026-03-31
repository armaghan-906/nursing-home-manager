import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FiX } from 'react-icons/fi';

const ResidentModal = ({ resident, onClose, onSave }) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    roomNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
    fundingType: 'private',
    fundingRate: '',
    status: 'admission',
    admissionNotes: '',
    primaryContact: { name: '', phone: '', email: '', relationship: '' },
    emergencyContact: { name: '', phone: '', relationship: '' },
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (resident) {
      setForm({
        firstName: resident.firstName || '',
        lastName: resident.lastName || '',
        dateOfBirth: resident.dateOfBirth ? resident.dateOfBirth.split('T')[0] : '',
        roomNumber: resident.roomNumber || '',
        admissionDate: resident.admissionDate ? resident.admissionDate.split('T')[0] : '',
        fundingType: resident.fundingType || 'private',
        fundingRate: resident.fundingRate || '',
        status: resident.status || 'admission',
        admissionNotes: resident.admissionNotes || resident.medicalNotes || '',
        primaryContact: resident.primaryContact || { name: '', phone: '', email: '', relationship: '' },
        emergencyContact: resident.emergencyContact || { name: '', phone: '', relationship: '' },
        notes: resident.notes || ''
      });
    }
  }, [resident]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (type, field, value) => {
    setForm(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.roomNumber) {
      toast.error('Please fill in required fields');
      return;
    }
    setSaving(true);
    try {
      if (resident) {
        await api.put(`/residents/${resident._id}`, form);
        toast.success('Resident updated');
      } else {
        await api.post('/residents', form);
        toast.success('Resident added — workflow tasks generated!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2>{resident ? 'Edit Resident' : 'Add New Resident'}</h2>
          <button className="btn-icon" onClick={onClose}><FiX size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Personal */}
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Room Number *</label>
                <input value={form.roomNumber} onChange={(e) => handleChange('roomNumber', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Admission Date</label>
                <input type="date" value={form.admissionDate} onChange={(e) => handleChange('admissionDate', e.target.value)} />
              </div>
            </div>

            {/* Funding & Status */}
            <div className="form-row">
              <div className="form-group">
                <label>Funding Type</label>
                <select value={form.fundingType} onChange={(e) => handleChange('fundingType', e.target.value)}>
                  <option value="private">Private</option>
                  <option value="private-respite">Private Respite</option>
                  <option value="la">Local Authority</option>
                  <option value="la-respite">LA Respite</option>
                  <option value="ccg-icb">NHS D2A</option>
                  <option value="d2a">NHS CHC</option>
                </select>
              </div>
              <div className="form-group">
                <label>Weekly Rate (£)</label>
                <input placeholder="e.g. 1564.71" value={form.fundingRate} onChange={(e) => handleChange('fundingRate', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                  <option value="admission">Admission</option>
                  <option value="ongoing-care">Ongoing Care</option>
                  <option value="discharge-planning">Discharge Planning</option>
                  <option value="discharged">Discharged</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
            </div>

            {/* Next of Kin */}
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, marginTop: 8, color: 'var(--text-secondary)' }}>Next of Kin</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input value={form.primaryContact.name} onChange={(e) => handleContactChange('primaryContact', 'name', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Relationship</label>
                <input value={form.primaryContact.relationship} onChange={(e) => handleContactChange('primaryContact', 'relationship', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input value={form.primaryContact.phone} onChange={(e) => handleContactChange('primaryContact', 'phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.primaryContact.email} onChange={(e) => handleContactChange('primaryContact', 'email', e.target.value)} />
              </div>
            </div>

            {/* Admission Notes */}
            <div className="form-group">
              <label>Admission Notes</label>
              <textarea rows={3} value={form.admissionNotes} onChange={(e) => handleChange('admissionNotes', e.target.value)} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (resident ? 'Update' : 'Add Resident')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResidentModal;
