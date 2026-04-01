import React from 'react';

const MatchAlert = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <div className="lf-match-alert">
      <div className="lf-match-alert-header">
        <span className="lf-match-icon">⚠️</span>
        <h3>Possible Matches Found!</h3>
      </div>
      <p className="lf-match-count">
        We found {matches.length} potential match{matches.length !== 1 ? 'es' : ''} for your lost item.
      </p>
      <ul className="lf-match-list">
        {matches.map((match, idx) => (
          <li key={match._id || idx} className="lf-match-item">
            <span className="lf-match-title">{match.title}</span>
            <span className="lf-match-location">📍 {match.location}</span>
            <span className="lf-match-date">{new Date(match.date).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
      <p className="lf-match-hint">
        Check these items above to see if they match what you're looking for!
      </p>
    </div>
  );
};

export default MatchAlert;
