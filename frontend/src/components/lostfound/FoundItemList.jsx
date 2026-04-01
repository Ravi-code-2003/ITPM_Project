import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import LostFoundCard from './LostFoundCard';

const FoundItemList = () => {
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);

  const fetchFound = async (skipCount = 0) => {
    try {
      setLoading(true);
      const { data } = await api.get('/lostfound/found', {
        params: { skip: skipCount, limit: 10 }
      });
      
      if (skipCount === 0) {
        setFoundItems(data.posts || []);
      } else {
        setFoundItems((prev) => [...prev, ...(data.posts || [])]);
      }
      
      setHasMore((data.posts || []).length === 10);
      setError(null);
    } catch (err) {
      setError('Failed to load found items.');
      console.error('Fetch found items error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFound(0);
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/lostfound/${id}`);
        setFoundItems((prev) => prev.filter((item) => item._id !== id));
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete post');
      }
    }
  };

  const loadMore = () => {
    const newSkip = skip + 10;
    setSkip(newSkip);
    fetchFound(newSkip);
  };

  if (loading && foundItems.length === 0) {
    return <div className="lf-loading">Loading found items...</div>;
  }

  if (error && foundItems.length === 0) {
    return <div className="lf-error">{error}</div>;
  }

  if (foundItems.length === 0) {
    return <div className="lf-empty">No found items reported yet.</div>;
  }

  return (
    <div className="lf-list">
      {foundItems.map((item) => (
        <LostFoundCard
          key={item._id}
          item={item}
          postType="found"
          onDelete={handleDelete}
        />
      ))}
      
      {error && <p className="lf-error">{error}</p>}
      
      {hasMore && !loading && (
        <button className="lf-load-more-btn" onClick={loadMore}>
          Load More
        </button>
      )}
      
      {loading && foundItems.length > 0 && (
        <p className="lf-loading-more">Loading more items...</p>
      )}
    </div>
  );
};

export default FoundItemList;
