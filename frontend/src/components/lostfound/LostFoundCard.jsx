import React, { useState } from "react";
import api from "../../services/api";
import CommentSection from "./CommentSection";
import MarkFoundModal from "./MarkFoundModal";
import { useAuth } from "../../contexts/AuthContext";

const getImageSrc = (imageUrl) => {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http")) return imageUrl;
  const apiBase = api.defaults.baseURL || "";
  const serverBase = apiBase.replace(/\/api\/?$/, "");
  return `${serverBase}${imageUrl}`;
};

const LostFoundCard = ({ item, postType, onResolve, onDelete }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showMarkFoundModal, setShowMarkFoundModal] = useState(false);
  const imageSrc = getImageSrc(item.imageUrl);
  const statusLabel = item.status === "resolved" ? "Resolved" : "Open";
  const isOwner = user && user._id === item.userId;

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(item._id);
    }
  };

  const handleResolveClick = () => {
    if (onResolve) {
      onResolve(item._id);
    }
  };

  return (
    <div className="lf-card">
      <div className="lf-card-image">
        {imageSrc ? (
          <img src={imageSrc} alt={item.title} />
        ) : (
          <div className="lf-card-placeholder">No photo</div>
        )}
      </div>
      <div className="lf-card-body">
        <div className="lf-card-header">
          <h4 className="lf-card-title">{item.title}</h4>
          <span className={`lf-status ${item.status === "resolved" ? "resolved" : "open"}`}>
            {statusLabel}
          </span>
        </div>
        <p className="lf-card-description">{item.description}</p>
        <div className="lf-card-meta">
          <span className="lf-meta-item">📍 {item.location}</span>
          <span className="lf-meta-item">📅 {new Date(item.date).toLocaleDateString()}</span>
          <span className="lf-card-category">{item.category}</span>
        </div>

        {/* For FOUND items: Show "View Noter Info" button */}
        {postType === "found" && (
          <button 
            className="lf-btn-secondary lf-btn-small"
            onClick={() => setShowContact(!showContact)}
          >
            {showContact ? "Hide Noter Info" : "View Noter Info"}
          </button>
        )}

        {/* Contact info display for found items */}
        {postType === "found" && showContact && item.contactInfo && (
          <div className="lf-contact-info">
            <p><strong>Contact:</strong> {item.contactInfo}</p>
          </div>
        )}

        {/* For LOST items: Show messages button only to owner */}
        {postType === "lost" && isOwner && (
          <button 
            className="lf-btn-primary lf-btn-small"
            onClick={() => setShowComments(!showComments)}
          >
            {showComments ? "Hide Messages" : "Show Messages"}
          </button>
        )}

        {/* For LOST items: allow others to mark as found */}
        {postType === "lost" && !isOwner && item.status !== "resolved" && (
          <button
            className="lf-btn-success lf-btn-small"
            onClick={() => setShowMarkFoundModal(true)}
          >
            Mark as Found
          </button>
        )}

        {/* Owner actions */}
        {isOwner && (
          <div className="lf-card-actions">
            {item.status !== "resolved" && (
              <button 
                className="lf-btn-success lf-btn-small"
                onClick={handleResolveClick}
              >
                ✓ Mark as Resolved
              </button>
            )}
            <button 
              className="lf-btn-danger lf-btn-small"
              onClick={handleDeleteClick}
            >
              🗑 Delete
            </button>
          </div>
        )}
      </div>

      {/* Comment section for lost item owner */}
      {showComments && postType === "lost" && isOwner && (
        <CommentSection postId={item._id} />
      )}

      {showMarkFoundModal && (
        <MarkFoundModal
          post={item}
          onClose={() => setShowMarkFoundModal(false)}
        />
      )}
    </div>
  );
};

export default LostFoundCard;
