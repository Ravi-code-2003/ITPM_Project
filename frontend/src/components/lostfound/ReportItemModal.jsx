import React, { useState } from 'react';
import api from '../../services/api';

const ReportItemModal = ({ onClose, onSuccess }) => {
  const [postType, setPostType] = useState('lost');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    date: '',
    contactInfo: '',
    image: null,
  });
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((p) => ({ ...p, image: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!form.title.trim()) return 'Title is required';
    if (!form.description.trim()) return 'Description is required';
    if (!form.category.trim()) return 'Category is required';
    if (!form.location.trim()) return 'Location is required';
    if (!form.date) return 'Date is required';
    if (!form.image) return 'Image is required';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const body = new FormData();
      body.append('postType', postType);
      body.append('title', form.title);
      body.append('description', form.description);
      body.append('category', form.category);
      body.append('location', form.location);
      body.append('date', form.date);
      body.append('contactInfo', form.contactInfo || '');
      body.append('image', form.image);

      const { data } = await api.post('/lostfound', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post. Please try again.');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Electronics', 'Documents', 'Jewelry', 'Clothing', 'Accessories', 'Books', 'Other'];

  return (
    <div className="lf-modal-overlay">
      <div className="lf-modal">
        <button className="lf-close-btn" onClick={onClose}>✕</button>
        <h2>Report Item</h2>
        
        <div className="lf-toggle-group">
          <button 
            className={`lf-toggle-btn ${postType === 'lost' ? 'active' : ''}`}
            onClick={() => setPostType('lost')}
          >
            📍 Lost
          </button>
          <button 
            className={`lf-toggle-btn ${postType === 'found' ? 'active' : ''}`}
            onClick={() => setPostType('found')}
          >
            ✅ Found
          </button>
        </div>

        <form onSubmit={handleSubmit} className="lf-form">
          <div className="lf-form-group">
            <label>Title *</label>
            <input 
              type="text"
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Blue backpack with laptop"
              maxLength={200}
            />
          </div>

          <div className="lf-form-group">
            <label>Description *</label>
            <textarea 
              value={form.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Provide details about the item..."
              maxLength={2000}
              rows={4}
            />
          </div>

          <div className="lf-form-row">
            <div className="lf-form-group">
              <label>Category *</label>
              <select 
                value={form.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="lf-form-group">
              <label>Location *</label>
              <input 
                type="text"
                value={form.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Campus Library"
              />
            </div>
          </div>

          <div className="lf-form-row">
            <div className="lf-form-group">
              <label>Date *</label>
              <input 
                type="date"
                value={form.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>

            <div className="lf-form-group">
              <label>Contact Info (optional)</label>
              <input 
                type="text"
                value={form.contactInfo}
                onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                placeholder="Phone or email"
              />
            </div>
          </div>

          <div className="lf-form-group">
            <label>Image (JPG/PNG) *</label>
            <input 
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleImage}
              required
            />
          </div>

          {preview && (
            <div className="lf-preview-container">
              <img className="lf-preview" src={preview} alt="Preview" />
            </div>
          )}

          {error && <p className="lf-error">{error}</p>}
          
          <div className="lf-modal-actions">
            <button 
              type="button"
              className="lf-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="lf-btn-primary"
              disabled={loading}
            >
              {loading ? 'Reporting...' : 'Report Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportItemModal;
