import React, { useState } from 'react';
import ReportItemModal from './ReportItemModal';
import LostItemList from './LostItemList';
import FoundItemList from './FoundItemList';
import MatchAlert from './MatchAlert';
import NotificationList from './NotificationList';
import './lostfound.css';

const LostFoundSection = () => {
  const [tab, setTab] = useState('lost');
  const [showModal, setShowModal] = useState(false);
  const [matches, setMatches] = useState([]);
  const [actionMessage, setActionMessage] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReported = (data) => {
    setShowModal(false);
    if (data.matches && data.matches.length > 0) {
      setMatches(data.matches);
      setActionMessage('✅ Post created! Found ' + data.matches.length + ' possible match(es)!');
    } else {
      setActionMessage('✅ Post created successfully.');
    }
    // Trigger refresh of the list
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setActionMessage(''), 4000);
  };

  return (
    <section className="lost-found-section">
      <div className="lf-header">
        <div className="lf-tabs">
          <button 
            className={`lf-tab ${tab === 'lost' ? 'active' : ''}`}
            onClick={() => setTab('lost')}
          >
            📍 Lost Items
          </button>
          <button 
            className={`lf-tab ${tab === 'found' ? 'active' : ''}`}
            onClick={() => setTab('found')}
          >
            ✅ Found Items
          </button>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="lf-report-btn"
        >
          + Report Item
        </button>
      </div>

      {actionMessage && <div className="lf-info-banner">{actionMessage}</div>}
      <NotificationList />
      {matches.length > 0 && <MatchAlert matches={matches} />}

      <div className="lf-content">
        {tab === 'lost' ? 
          <LostItemList key={refreshTrigger} /> : 
          <FoundItemList key={refreshTrigger} />
        }
      </div>

      {showModal && (
        <ReportItemModal
          onClose={() => setShowModal(false)}
          onSuccess={handleReported}
        />
      )}
    </section>
  );
};

export default LostFoundSection;
