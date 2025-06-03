import React, { useState } from 'react';
import { createSupportRequest } from '../api/requests';

const SupportRequestModal = ({ show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (error) setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    
    if (!formData.message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    try {
      setLoading(true);
      
      // Submit support request
      const result = await createSupportRequest(formData);
      
      // Reset form
      setFormData({
        subject: '',
        message: '',
        priority: 'medium'
      });
      
      // Notify parent component
      if (onSuccess) onSuccess(result);
      
      // Close modal
      if (onClose) onClose();
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit support request');
    } finally {
      setLoading(false);
    }
  };
  
  // Don't render anything if modal is not visible
  if (!show) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040 }}
      />

      {/* Modal */}
      <div
        className="modal fade show"
        style={{ display: 'block', zIndex: 1050 }}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Request IT Support</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="subject" className="form-label">
                    Subject
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="priority" className="form-label">
                    Priority
                  </label>
                  <select
                    className="form-select"
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="low">Low - Not urgent</option>
                    <option value="medium">Medium - Normal priority</option>
                    <option value="high">High - Urgent issue</option>
                    <option value="urgent">Urgent - Critical problem</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="message" className="form-label">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Please describe your issue in detail"
                  ></textarea>
                </div>

                <div className="form-text mb-3">
                  Please provide as much detail as possible to help us assist you efficiently.
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupportRequestModal;