import React, { useEffect, useState } from "react";
import api from "../../services/api";
import ClaimDetails from "./ClaimDetails";

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/notifications");
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error("Fetch notifications error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="lf-notification-list">
      <h3>Lost &amp; Found Notifications</h3>

      {loading && <p className="lf-loading">Loading notifications...</p>}

      {!loading && notifications.length === 0 && (
        <p className="lf-empty">No notifications yet.</p>
      )}

      {!loading &&
        notifications.map((notification) => (
          <div key={notification._id} className="lf-notification-item">
            <p>{notification.message}</p>
            <button
              className="lf-btn-primary lf-btn-small"
              onClick={() => setSelectedClaimId(notification.relatedId)}
            >
              View Details
            </button>
          </div>
        ))}

      {selectedClaimId && (
        <ClaimDetails
          claimId={selectedClaimId}
          onClose={() => setSelectedClaimId("")}
        />
      )}
    </div>
  );
};

export default NotificationList;
