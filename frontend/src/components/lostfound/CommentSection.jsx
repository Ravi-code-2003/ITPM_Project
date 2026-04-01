import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newContactInfo, setNewContactInfo] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/lostfound/${postId}/comments`);
      setComments(data.comments || []);
      setError('');
    } catch (err) {
      setError('Failed to load messages.');
      console.error('Load comments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/lostfound/${postId}/comment`, {
        message: newMessage,
        contactInfo: newContactInfo,
      });
      setNewMessage('');
      setNewContactInfo('');
      await loadComments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
      console.error('Submit comment error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId) => {
    if (!replyMessage.trim()) {
      setError('Reply cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/lostfound/comment/${commentId}/reply`, {
        message: replyMessage,
      });
      setReplyMessage('');
      setReplyingTo(null);
      await loadComments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reply.');
      console.error('Submit reply error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const groupedComments = comments.reduce((acc, comment) => {
    if (!comment.isReply) {
      acc.push({
        ...comment,
        replies: comments.filter(c => c.parentCommentId === comment._id),
      });
    }
    return acc;
  }, []);

  if (loading) {
    return <div className="lf-comments-loading">Loading messages...</div>;
  }

  return (
    <div className="lf-comment-section">
      <h4>📬 Messages ({comments.length})</h4>

      {error && <div className="lf-error-inline">{error}</div>}

      <div className="lf-comments-list">
        {groupedComments.length === 0 ? (
          <p className="lf-no-comments">No messages yet. Share this post to get help finding your item!</p>
        ) : (
          groupedComments.map((comment) => (
            <div key={comment._id} className="lf-comment-group">
              <div className="lf-comment">
                <div className="lf-comment-header">
                  <strong>{comment.senderId?.name || 'Anonymous'}</strong>
                  <span className="lf-comment-time">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="lf-comment-message">{comment.message}</p>
                {comment.contactInfo && (
                  <p className="lf-comment-contact">
                    <strong>Contact:</strong> {comment.contactInfo}
                  </p>
                )}
                {!replyingTo && (
                  <button
                    className="lf-reply-btn"
                    onClick={() => setReplyingTo(comment._id)}
                  >
                    Reply
                  </button>
                )}
              </div>

              {/* Display replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="lf-replies">
                  {comment.replies.map((reply) => (
                    <div key={reply._id} className="lf-reply">
                      <div className="lf-comment-header">
                        <strong className="owner-badge">📌 You (Owner)</strong>
                        <span className="lf-comment-time">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="lf-comment-message">{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply form */}
              {replyingTo === comment._id && (
                <form className="lf-reply-form" onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitReply(comment._id);
                }}>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    disabled={submitting}
                  />
                  <div className="lf-reply-actions">
                    <button
                      type="submit"
                      className="lf-btn-primary lf-btn-small"
                      disabled={submitting}
                    >
                      {submitting ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button
                      type="button"
                      className="lf-btn-secondary lf-btn-small"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyMessage('');
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))
        )}
      </div>

      {/* New comment form */}
      <form onSubmit={handleSubmitComment} className="lf-new-comment-form">
        <h5>Send a Message</h5>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="I think I found your item..."
          rows={3}
          disabled={submitting}
        />
        <input
          type="text"
          value={newContactInfo}
          onChange={(e) => setNewContactInfo(e.target.value)}
          placeholder="Your contact info (optional)"
          disabled={submitting}
        />
        <button
          type="submit"
          className="lf-btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
