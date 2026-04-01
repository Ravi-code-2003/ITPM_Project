import React, { useEffect, useState } from "react";
import { budgetAPI } from "../../services/api";

const buildPolylinePoints = (points = [], width = 440, height = 150) => {
  if (!points.length) return "";
  const maxY = Math.max(...points.map((p) => p.remaining), 1);
  const minY = Math.min(...points.map((p) => p.remaining), 0);
  const ySpread = Math.max(maxY - minY, 1);

  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const normalizedY = (point.remaining - minY) / ySpread;
      const y = height - normalizedY * height;
      return `${x},${y}`;
    })
    .join(" ");
};

const Insights = ({ refreshTick = 0 }) => {
  const [data, setData] = useState(null);
  const [progression, setProgression] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [insightsRes, progressionRes] = await Promise.all([
          budgetAPI.getInsights(),
          budgetAPI.getProgression({ range: "monthly", limit: 6 }),
        ]);
        setData(insightsRes.data || null);
        setProgression(progressionRes.data?.points || []);
      } catch (e) {
        setError("Failed to load insights");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshTick]);

  if (loading) return <p className="text-sm text-secondary">Loading month-end insights...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-secondary">No insights yet.</p>;

  const chartPoints = progression.slice(-6);
  const polyline = buildPolylinePoints(chartPoints);

  return (
    <div className="p-4 rounded-lg border">
      <p className="font-semibold mb-2">Month-end Insights</p>
      <p className="text-sm"><strong>Saving tip:</strong> {data.savingTips?.[0] || "-"}</p>
      <p className="text-sm"><strong>Investment idea:</strong> {data.investmentSuggestions?.[0] || "-"}</p>
      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Budget Trend (Remaining Amount)</p>
        {chartPoints.length ? (
          <div className="rounded-lg border p-3 bg-white">
            <svg viewBox="0 0 440 150" className="w-full h-36" role="img" aria-label="Remaining budget trend line">
              <line x1="0" y1="150" x2="440" y2="150" stroke="#e5e7eb" strokeWidth="1" />
              <polyline fill="none" stroke="#16a34a" strokeWidth="3" points={polyline} />
            </svg>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
              {chartPoints.map((point) => (
                <div key={`${point.periodStart}-${point.periodEnd}`}>
                  {new Date(point.periodStart).toLocaleDateString()} - LKR {Number(point.remaining || 0).toFixed(0)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-secondary">No progression data yet.</p>
        )}
      </div>
    </div>
  );
};

export default Insights;
