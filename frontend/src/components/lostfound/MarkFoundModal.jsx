import React, { useState } from "react";
import { createPortal } from "react-dom";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const MarkFoundModal = ({ post, onClose }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post(`/lostfound/${post._id}/mark-found`, { message });
      alert("Claim submitted. The item owner has been notified.");
      onClose();
    } catch (error) {
      console.error("Mark found error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="lf-modal-overlay">
      <div className="lf-modal">
        <button className="lf-close-btn" onClick={onClose} aria-label="Close modal">
          ×
        </button>
        <h2>Mark as Found</h2>
        <p className="lf-note">
          Your contact details will be sent automatically from your profile.
        </p>

        <form className="lf-form" onSubmit={handleSubmit}>
          <div className="lf-form-row">
            <div className="lf-form-group">
              <label>Name</label>
              <input value={user?.fullName || user?.name || "Not available"} readOnly />
            </div>
            <div className="lf-form-group">
              <label>Student ID</label>
              <input
                value={
                  user?.studentId ||
                  user?.registrationNumber ||
                  user?.userId ||
                  "Not provided"
                }
                readOnly
              />
            </div>
          </div>

          <div className="lf-form-row">
            <div className="lf-form-group">
              <label>Phone</label>
              <input value={user?.phoneNumber || user?.phone || "Not provided"} readOnly />
            </div>
            <div className="lf-form-group">
              <label>Email</label>
              <input value={user?.email || "Not available"} readOnly />
            </div>
          </div>

          <div className="lf-form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional note for the owner"
            />
          </div>

          <div className="lf-modal-actions">
            <button type="button" className="lf-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="lf-btn-success" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Claim"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default MarkFoundModal;
