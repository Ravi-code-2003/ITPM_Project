import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import LostFoundCard from './LostFoundCard';

const LostItemList = () => {
  const [lostItems, setLostItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);

  const fetchLost = async (skipCount = 0) => {
    try {
      setLoading(true);
      const { data } = await api.get('/lostfound/lost', {
        params: { skip: skipCount, limit: 10 }
      });
      
      if (skipCount === 0) {
        setLostItems(data.posts || []);
      } else {
        setLostItems((prev) => [...prev, ...(data.posts || [])]);
      }
      
      setHasMore((data.posts || []).length === 10);
      setError(null);
    } catch (err) {
      setError('Failed to load lost items.');
      console.error('Fetch lost items error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLost(0);
  }, []);

  const handleResolve = async (id) => {
    try {
      await api.patch(`/lostfound/${id}/resolve`);
      setLostItems((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, status: 'resolved' } : item
        )
      );
    } catch (err) {
      console.error('Resolve error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/lostfound/${id}`);
        setLostItems((prev) => prev.filter((item) => item._id !== id));
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete post');
      }
    }
  };

  const loadMore = () => {
    const newSkip = skip + 10;
    setSkip(newSkip);
    fetchLost(newSkip);
  };

  if (loading && lostItems.length === 0) {
    return <div className="lf-loading">Loading lost items...</div>;
  }

  if (error && lostItems.length === 0) {
    return <div className="lf-error">{error}</div>;
  }

  if (lostItems.length === 0) {
    return <div className="lf-empty">No lost items reported yet.</div>;
  }

  return (
    <div className="lf-list">
      {lostItems.map((item) => (
        <LostFoundCard
          key={item._id}
          item={item}
          postType="lost"
          onResolve={handleResolve}
          onDelete={handleDelete}
        />
      ))}
      
      {error && <p className="lf-error">{error}</p>}
      
      {hasMore && !loading && (
        <button className="lf-load-more-btn" onClick={loadMore}>
          Load More
        </button>
      )}
      
      {loading && lostItems.length > 0 && (
        <p className="lf-loading-more">Loading more items...</p>
      )}
    </div>
  );
};

export default LostItemList;
