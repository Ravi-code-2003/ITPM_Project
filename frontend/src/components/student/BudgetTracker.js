import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Target,
  AlertTriangle,
  PlusCircle,
} from "lucide-react";
import Button from "../ui/Button";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
import { aiAPI, transactionsAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const DEFAULT_FORM = {
  type: "expense",
  category: "Food",
  amount: "",
  description: "",
  date: "",
};

const BudgetTracker = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [advice, setAdvice] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const adviceTimerRef = useRef(null);

  const userId = user?._id || JSON.parse(localStorage.getItem("user") || "{}")?._id;
  const summaryCacheKey = useMemo(
    () => (userId ? `budget_summary_${userId}` : null),
    [userId]
  );

  const fetchSummary = useCallback(async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const response = await transactionsAPI.getSummary(userId);
      setSummary(response.summary);
      if (summaryCacheKey) {
        localStorage.setItem(summaryCacheKey, JSON.stringify(response.summary));
      }
    } catch (error) {
      toast.error("Failed to fetch budget summary");
      console.error("Error fetching budget summary:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, summaryCacheKey]);

  const fetchAdvice = useCallback(async () => {
    try {
      setAdviceLoading(true);
      const response = await aiAPI.getBudgetAdvice();
      setAdvice(response.advice);
    } catch (error) {
      setAdvice(null);
      console.error("Error fetching budget advice:", error);
    } finally {
      setAdviceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    let usedCache = false;
    if (summaryCacheKey) {
      const cached = localStorage.getItem(summaryCacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setSummary(parsed);
          setLoading(false);
          usedCache = true;
        } catch (error) {
          localStorage.removeItem(summaryCacheKey);
        }
      }
    }

    fetchSummary({ showLoader: !usedCache });

    if (advice) {
      return undefined;
    }

    const scheduleAdvice = () => {
      if (advice || adviceLoading) {
        return;
      }
      fetchAdvice();
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      adviceTimerRef.current = window.requestIdleCallback(scheduleAdvice, { timeout: 3000 });
    } else {
      adviceTimerRef.current = setTimeout(scheduleAdvice, 1200);
    }

    return () => {
      if (adviceTimerRef.current && typeof window !== "undefined") {
        if ("cancelIdleCallback" in window) {
          window.cancelIdleCallback(adviceTimerRef.current);
        } else {
          clearTimeout(adviceTimerRef.current);
        }
      }
    };
  }, [userId, summaryCacheKey, fetchSummary, fetchAdvice, advice, adviceLoading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTransaction = async () => {
    const amountValue = Number(formData.amount);
    if (!formData.category.trim()) {
      toast.error("Please enter a category");
      return;
    }
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await transactionsAPI.create({
        type: formData.type,
        category: formData.category,
        amount: amountValue,
        description: formData.description,
        date: formData.date || undefined,
      });

      toast.success("Transaction added");
      setFormData(DEFAULT_FORM);
      setShowAddTransaction(false);
      await fetchSummary();
      await fetchAdvice();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add transaction");
    }
  };

  const getStatus = () => {
    if (!summary) return "no-data";
    if (summary.totalIncome === 0 && summary.totalExpenses === 0) return "no-data";
    if (summary.remainingBudget < 0) return "over";
    const ratio = summary.totalIncome > 0 ? summary.totalExpenses / summary.totalIncome : 1;
    if (ratio >= 1) return "over";
    if (ratio >= 0.8) return "warning";
    if (ratio >= 0.6) return "caution";
    return "good";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "good":
        return "text-green-600 dark:text-green-400";
      case "caution":
        return "text-yellow-600 dark:text-yellow-400";
      case "warning":
        return "text-orange-600 dark:text-orange-400";
      case "over":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "good":
        return <Target className="h-5 w-5 text-green-600" />;
      case "caution":
        return <TrendingUp className="h-5 w-5 text-yellow-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "over":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  const status = getStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-gray-100">Budget Tracker</h1>
          <p className="text-secondary dark:text-gray-400">Track income, expenses, and savings</p>
        </div>

        <Button onClick={() => setShowAddTransaction(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Add Transaction</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                    placeholder="e.g., Food, Transport, Rent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                  placeholder="Notes about this transaction"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleAddTransaction} className="flex-1">
                  Save Transaction
                </Button>
                <Button variant="outline" onClick={() => setShowAddTransaction(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary dark:text-gray-400">Total Income</p>
                    <p className="text-2xl font-bold text-primary dark:text-gray-100">
                      LKR {summary.totalIncome.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                    <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary dark:text-gray-400">Total Expenses</p>
                    <p className="text-2xl font-bold text-primary dark:text-gray-100">
                      LKR {summary.totalExpenses.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                    <ShoppingBag className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary dark:text-gray-400">Remaining Budget</p>
                    <p className={`text-2xl font-bold ${getStatusColor(status)}`}>
                      LKR {summary.remainingBudget.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                    {getStatusIcon(status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(status)}
                Budget Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-secondary dark:text-gray-400">Expenses vs Income</span>
                    <span className={getStatusColor(status)}>
                      {summary.totalIncome > 0
                        ? ((summary.totalExpenses / summary.totalIncome) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        status === "good"
                          ? "bg-green-500"
                          : status === "caution"
                          ? "bg-yellow-500"
                          : status === "warning"
                          ? "bg-orange-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          summary.totalIncome > 0
                            ? (summary.totalExpenses / summary.totalIncome) * 100
                            : 0,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-secondary dark:text-gray-400">Transactions</p>
                    <p className="font-semibold">{summary.last10Transactions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary dark:text-gray-400">Latest Expense</p>
                    <p className="font-semibold">
                      {summary.last10Transactions.find((t) => t.type === "expense")
                        ? `LKR ${summary.last10Transactions.find((t) => t.type === "expense").amount.toFixed(2)}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary dark:text-gray-400">Latest Income</p>
                    <p className="font-semibold">
                      {summary.last10Transactions.find((t) => t.type === "income")
                        ? `LKR ${summary.last10Transactions.find((t) => t.type === "income").amount.toFixed(2)}`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.last10Transactions.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No transactions yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.last10Transactions.map((txn) => (
                    <div
                      key={txn._id}
                      className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-primary dark:text-gray-100">
                          {txn.category}
                        </p>
                        <p className="text-sm text-secondary dark:text-gray-400">
                          {txn.description || "No description"} • {new Date(txn.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`font-semibold ${
                          txn.type === "income"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {txn.type === "income" ? "+" : "-"} LKR {txn.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>AI Budget Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          {adviceLoading ? (
            <div className="flex items-center gap-3 text-secondary dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              Generating suggestions...
            </div>
          ) : advice ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-primary dark:text-gray-100 mb-2">Suggestions</h4>
                <ul className="list-disc list-inside text-sm text-secondary dark:text-gray-300 space-y-1">
                  {advice.suggestions?.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-primary dark:text-gray-100 mb-2">Warnings</h4>
                {advice.warnings?.length ? (
                  <ul className="list-disc list-inside text-sm text-secondary dark:text-gray-300 space-y-1">
                    {advice.warnings.map((warn, index) => (
                      <li key={index}>{warn}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-secondary dark:text-gray-400">No warnings right now.</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-primary dark:text-gray-100 mb-2">Savings Recommendation</h4>
                <p className="text-sm text-secondary dark:text-gray-300">
                  {advice.savingsRecommendation || "Keep tracking your income and expenses to unlock savings tips."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-secondary dark:text-gray-400">
                No advice available yet. Add some transactions to get personalized tips.
              </p>
              <Button variant="outline" onClick={fetchAdvice}>
                Generate Advice
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetTracker;
