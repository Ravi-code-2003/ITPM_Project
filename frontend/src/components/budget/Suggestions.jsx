import React, { useEffect, useState } from "react";
import { budgetAPI } from "../../services/api";

const Suggestions = ({ refreshTick = 0 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await budgetAPI.getSuggestions();
        setData(res.data || null);
      } catch (e) {
        setError("Failed to load suggestions");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshTick]);

  if (loading) return <p className="text-sm text-secondary">Loading smart suggestions...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="p-4 rounded-lg border">
      <p className="font-semibold mb-2">Top 5 Food Suggestions {data?.cached ? "(cached)" : ""}</p>
      <ul className="text-sm space-y-1">
        {(data?.suggestions || []).map((item) => (
          <li key={item.id}>
            {item.name} ({item.category}) - LKR {item.price} | score: {item.score}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Suggestions;
