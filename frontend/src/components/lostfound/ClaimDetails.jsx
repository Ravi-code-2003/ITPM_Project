import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../services/api";

const ClaimDetails = ({ claimId, onClose }) => {
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const { data } = await api.get(`/claims/${claimId}`);
        setClaim(data.claim);
      } catch (error) {
        console.error("Fetch claim details error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (claimId) {
      fetchClaim();
    }
  }, [claimId]);

  return createPortal(
    <div className="lf-modal-overlay">
      <div className="lf-modal">
        <button className="lf-close-btn" onClick={onClose} aria-label="Close details">
          ×
        </button>
        <h2>Claim Details</h2>

        {loading && <p className="lf-loading">Loading claim details...</p>}

        {!loading && !claim && (
          <p className="lf-error-inline">Could not load claim details.</p>
        )}

        {!loading && claim && (
          <div className="lf-claim-details">
            <p>
              <strong>Name:</strong> {claim.name}
            </p>
            <p>
              <strong>Student ID:</strong> {claim.studentId}
            </p>
            <p>
              <strong>Phone:</strong> {claim.phone}
            </p>
            <p>
              <strong>Email:</strong> {claim.email}
            </p>
            <p>
              <strong>Message:</strong> {claim.message || "-"}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ClaimDetails;
