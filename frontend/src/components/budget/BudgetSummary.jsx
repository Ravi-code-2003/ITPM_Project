import React, { useEffect, useState } from "react";
import { budgetAPI } from "../../services/api";
import Button from "../ui/Button";

const BudgetSummary = ({ refreshTick = 0, onBudgetUpdated }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("monthly");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await budgetAPI.getSummary();
      setData(res.data || null);
    } catch (e) {
      setError("Failed to load budget summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshTick]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      setError("Please enter a valid budget amount.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await budgetAPI.upsertBudget({ amount: numericAmount, type });
      await load();
      if (typeof onBudgetUpdated === "function") {
        onBudgetUpdated();
      }
      setAmount("");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save budget.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-secondary">Loading budget summary...</p>;
  if (!data) return <p className="text-sm text-secondary">No budget data.</p>;

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="p-4 rounded-lg border space-y-3">
        <p className="font-semibold">Set Budget</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-white"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Amount (LKR)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter budget amount"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Budget"}
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border">
          <p className="text-sm text-secondary">Current Budget</p>
          <p className="font-bold">LKR {Number(data.totalBudget || 0).toFixed(2)}</p>
          <p className="text-xs text-secondary capitalize mt-1">{data.budgetType || "no type"}</p>
        </div>
        <div className="p-4 rounded-lg border">
          <p className="text-sm text-secondary">Total Expenses</p>
          <p className="font-bold">LKR {Number(data.totalSpent || 0).toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-lg border">
          <p className="text-sm text-secondary">Remaining Budget</p>
          <p className="font-bold">LKR {Number(data.remaining || 0).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default BudgetSummary;
