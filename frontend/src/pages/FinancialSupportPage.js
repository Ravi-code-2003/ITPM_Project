import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeDollarSign,
  Banknote,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Coins,
  IndianRupee,
  PiggyBank,
  Search,
  Sparkles,
  Store,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import api from '../services/api';

const EXPENSE_CATEGORY_DEFAULTS = [
  { key: 'food', label: 'Food', percent: 35, icon: UtensilsCrossed, tone: 'bg-amber-500' },
  { key: 'housing', label: 'Housing', percent: 30, icon: Store, tone: 'bg-sky-500' },
  { key: 'transport', label: 'Transport', percent: 10, icon: Banknote, tone: 'bg-emerald-500' },
  { key: 'study', label: 'Study', percent: 12, icon: Sparkles, tone: 'bg-violet-500' },
  { key: 'savings', label: 'Savings', percent: 8, icon: PiggyBank, tone: 'bg-rose-500' },
  { key: 'flex', label: 'Flexible', percent: 5, icon: Coins, tone: 'bg-slate-500' },
];

const MEAL_BUDGET_PRESETS = [250, 400, 600, 800, 1200];

const createDefaultCategories = () => EXPENSE_CATEGORY_DEFAULTS.map((item) => ({ ...item }));

const mergeCategoryVisuals = (categories) => {
  const fallback = createDefaultCategories();
  if (!Array.isArray(categories) || categories.length === 0) {
    return fallback;
  }

  return categories
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const visual = EXPENSE_CATEGORY_DEFAULTS.find((entry) => entry.key === item.key);
      return {
        ...(visual || {}),
        key: String(item.key || visual?.key || '').trim(),
        label: String(item.label || visual?.label || '').trim(),
        percent: Number(item.percent || 0),
      };
    })
    .filter((item) => item.key && item.label)
    .map((item, index) => ({
      ...item,
      icon: item.icon || fallback[index % fallback.length].icon,
      tone: item.tone || fallback[index % fallback.length].tone,
    }));
};

const formatCurrency = (value) => `LKR ${(Number(value) || 0).toFixed(2)}`;

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const FinancialSupportPage = () => {
  const navigate = useNavigate();
  const [plannerBudget, setPlannerBudget] = useState('');
  const [submittedBudget, setSubmittedBudget] = useState('');
  const [categories, setCategories] = useState(createDefaultCategories);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [budgetData, setBudgetData] = useState(null);

  const [mealBudget, setMealBudget] = useState('400');
  const [mealType, setMealType] = useState('all');
  const [mealCategory, setMealCategory] = useState('all');
  const [mealResults, setMealResults] = useState({ comboMeals: [], foodItems: [] });
  const [mealLoading, setMealLoading] = useState(false);

  useEffect(() => {
    const loadFinanceProfile = async () => {
      try {
        setProfileLoading(true);
        const response = await api.get('/student/finance-profile');
        const profile = response.data?.profile || {};

        const budgetValue = Number(profile.monthlyBudget || 0);
        setPlannerBudget(budgetValue > 0 ? String(budgetValue) : '');
        setSubmittedBudget(budgetValue > 0 ? String(budgetValue) : '');
        setCategories(mergeCategoryVisuals(profile.expenseCategories));
      } catch (error) {
        console.error('Failed to load finance profile:', error);
        setCategories(createDefaultCategories());
      } finally {
        setProfileLoading(false);
      }
    };

    loadFinanceProfile();
  }, []);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoadingInsights(true);
        const query = submittedBudget ? `?monthlyBudget=${encodeURIComponent(submittedBudget)}` : '';
        const response = await api.get(`/student/budget-tracker${query}`);
        setBudgetData(response.data?.budgetTracker || null);
      } catch (error) {
        console.error('Failed to load budget insights:', error);
        toast.error('Failed to load monthly insights.');
      } finally {
        setLoadingInsights(false);
      }
    };

    loadInsights();
  }, [submittedBudget]);

  useEffect(() => {
    const loadInitialMeals = async () => {
      try {
        setMealLoading(true);
        const params = new URLSearchParams({ budget: '400' });
        const response = await api.get(`/student/budget-meals?${params.toString()}`);
        setMealResults(response.data?.results || { comboMeals: [], foodItems: [] });
      } catch (error) {
        console.error('Failed to load budget meals:', error);
      } finally {
        setMealLoading(false);
      }
    };

    loadInitialMeals();
  }, []);

  const normalizedBudget = Number(plannerBudget) || 0;
  const monthlyBudget = Number(budgetData?.monthlyBudget || submittedBudget || 0);
  const monthlySpent = Number(budgetData?.totalSpent || 0);
  const remaining = Number(budgetData?.remaining || monthlyBudget - monthlySpent);
  const usagePercent = Number(budgetData?.percentageUsed || 0);

  const plannedCategoryCards = useMemo(
    () => categories.map((category) => ({
      ...category,
      amount: normalizedBudget > 0 ? (normalizedBudget * category.percent) / 100 : 0,
    })),
    [categories, normalizedBudget]
  );

  const allocationTotal = categories.reduce((sum, item) => sum + Number(item.percent || 0), 0);

  const peakDay = useMemo(() => {
    const entries = Object.entries(budgetData?.dailySpending || {});
    if (entries.length === 0) return null;
    return entries.reduce((best, current) => (current[1] > best[1] ? current : best), entries[0]);
  }, [budgetData]);

  const topOrders = useMemo(() => (Array.isArray(budgetData?.monthlyOrders) ? budgetData.monthlyOrders.slice(0, 5) : []), [budgetData]);
  const dailyAverage = budgetData?.orderCount > 0 ? monthlySpent / budgetData.orderCount : 0;

  const fetchMealShortcuts = async (budgetValue = mealBudget, typeValue = mealType, categoryValue = mealCategory) => {
    const parsedBudget = Number(budgetValue);

    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      toast.error('Enter a valid meal budget.');
      return;
    }

    try {
      setMealLoading(true);
      const params = new URLSearchParams({ budget: String(parsedBudget) });
      if (typeValue !== 'all') params.append('type', typeValue);
      if (categoryValue !== 'all') params.append('category', categoryValue);

      const response = await api.get(`/student/budget-meals?${params.toString()}`);
      setMealResults(response.data?.results || { comboMeals: [], foodItems: [] });
      toast.success('Loaded low-budget meal shortcuts.');
    } catch (error) {
      console.error('Failed to fetch budget meals:', error);
      toast.error('Failed to load meal shortcuts.');
    } finally {
      setMealLoading(false);
    }
  };

  const savePlannerBudget = () => {
    const budgetValue = Number(plannerBudget);
    if (!Number.isFinite(budgetValue) || budgetValue <= 0) {
      toast.error('Please enter a valid monthly budget.');
      return;
    }

    const saveProfile = async () => {
      try {
        setProfileSaving(true);
        const response = await api.put('/student/finance-profile', {
          monthlyBudget: budgetValue,
          expenseCategories: categories.map((item) => ({
            key: item.key,
            label: item.label,
            percent: Number(item.percent || 0),
          })),
        });

        const profile = response.data?.profile || {};
        const savedBudget = Number(profile.monthlyBudget || 0);

        setPlannerBudget(savedBudget > 0 ? String(savedBudget) : '');
        setSubmittedBudget(savedBudget > 0 ? String(savedBudget) : '');
        setCategories(mergeCategoryVisuals(profile.expenseCategories));
        toast.success('Budget planner saved to your account.');
      } catch (error) {
        console.error('Failed to save finance profile:', error);
        toast.error(error.response?.data?.message || 'Failed to save budget planner.');
      } finally {
        setProfileSaving(false);
      }
    };

    saveProfile();
  };

  const updateCategoryPercent = (categoryKey, value) => {
    const percent = Math.max(0, Math.min(100, Number(value) || 0));
    setCategories((prev) => prev.map((item) => (item.key === categoryKey ? { ...item, percent } : item)));
  };

  const normalizeCategories = () => {
    const total = categories.reduce((sum, item) => sum + Number(item.percent || 0), 0);
    if (total <= 0) return;

    setCategories((prev) => prev.map((item) => ({
      ...item,
      percent: Number(((Number(item.percent || 0) / total) * 100).toFixed(1)),
    })));
    toast.success('Budget split normalized to 100%.');
  };

  const quickInsights = [
    { label: 'Budget set', value: formatCurrency(monthlyBudget || normalizedBudget), icon: Wallet },
    { label: 'Spent this month', value: formatCurrency(monthlySpent), icon: IndianRupee },
    { label: 'Remaining', value: formatCurrency(Math.max(0, remaining)), icon: BadgeDollarSign },
    { label: 'Orders tracked', value: String(budgetData?.orderCount || 0), icon: BellRing },
  ];

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-amber-50 via-white to-white dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <section className="rounded-3xl border border-amber-200/80 dark:border-amber-800/50 bg-white/90 dark:bg-surface-dark/90 shadow-xl p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/student/dashboard')}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors shadow-sm"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="inline-flex items-center rounded-full border border-emerald-300/80 dark:border-emerald-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-900/20">
                  Student financial support
                </span>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary dark:text-gray-100">
                  Financial Support Tools
                </h1>
                <p className="text-secondary dark:text-gray-400 mt-2 text-sm sm:text-base max-w-2xl leading-relaxed">
                  Plan your monthly budget, split expenses into clear categories, watch your spending pattern, and jump straight to cheap meal options when you need them.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:max-w-3xl">
              {quickInsights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/15 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-secondary dark:text-gray-400">{item.label}</p>
                        <p className="mt-1.5 text-sm sm:text-base font-bold text-primary dark:text-gray-100 break-words">{item.value}</p>
                      </div>
                      <div className="rounded-2xl bg-white dark:bg-slate-900 p-2.5 text-emerald-600 dark:text-emerald-300 shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <Card className="xl:col-span-4 border border-amber-200/80 dark:border-amber-900/40 bg-white/95 dark:bg-surface-dark/90 shadow-xl h-fit xl:sticky xl:top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-600" />
                Budget Planner
              </CardTitle>
              <p className="text-sm text-secondary dark:text-gray-400 mt-1">Set your monthly spending target and shape it into categories.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary dark:text-gray-300">Monthly budget (LKR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={plannerBudget}
                  onChange={(event) => setPlannerBudget(event.target.value)}
                  className="w-full rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="e.g. 25000"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button onClick={savePlannerBudget} className="w-full inline-flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {profileSaving ? 'Saving...' : 'Update planner'}
                </Button>
                <Button
                  variant="outline"
                  onClick={normalizeCategories}
                  className="w-full inline-flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Normalize split
                </Button>
              </div>

              <div className={`rounded-2xl border px-4 py-3 ${allocationTotal === 100 ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-900/15' : 'border-amber-200 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-900/15'}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-primary dark:text-gray-100">Split total</p>
                  <p className={`text-sm font-bold ${allocationTotal === 100 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    {allocationTotal.toFixed(1)}%
                  </p>
                </div>
                <p className="mt-1 text-xs text-secondary dark:text-gray-400">
                  Keep it close to 100% so your planner stays easy to read.
                </p>
              </div>

              {profileLoading && (
                <p className="text-xs text-secondary dark:text-gray-400">
                  Loading your saved finance profile...
                </p>
              )}

              <div className="space-y-3">
                {plannedCategoryCards.map((category) => {
                  const Icon = category.icon;

                  return (
                    <div key={category.key} className="rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/60 dark:bg-slate-900/40 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`rounded-xl p-2 text-white ${category.tone}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-primary dark:text-gray-100 truncate">{category.label}</p>
                            <p className="text-xs text-secondary dark:text-gray-400">{formatCurrency(category.amount)}</p>
                          </div>
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={category.percent}
                            onChange={(event) => updateCategoryPercent(category.key, event.target.value)}
                            className="w-full rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-white dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${category.tone}`} style={{ width: `${Math.min(100, category.percent)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="xl:col-span-8 space-y-6">
            <Card className="border border-amber-200/80 dark:border-amber-900/40 bg-white/95 dark:bg-surface-dark/90 shadow-xl">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-amber-600" />
                      Monthly Insights
                    </CardTitle>
                    <p className="text-sm text-secondary dark:text-gray-400 mt-1">Track what you spent this month and where the pressure is building.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingInsights ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-amber-500" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      <div className="rounded-2xl border border-amber-100 dark:border-amber-800 bg-amber-50/70 dark:bg-slate-900/40 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-secondary dark:text-gray-400">Monthly budget</p>
                        <p className="mt-2 text-2xl font-bold text-primary dark:text-gray-100">{formatCurrency(monthlyBudget || normalizedBudget)}</p>
                      </div>
                      <div className="rounded-2xl border border-amber-100 dark:border-amber-800 bg-white dark:bg-slate-900/40 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-secondary dark:text-gray-400">Total spent</p>
                        <p className="mt-2 text-2xl font-bold text-primary dark:text-gray-100">{formatCurrency(monthlySpent)}</p>
                      </div>
                      <div className="rounded-2xl border border-amber-100 dark:border-amber-800 bg-white dark:bg-slate-900/40 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-secondary dark:text-gray-400">Remaining</p>
                        <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(Math.max(0, remaining))}</p>
                      </div>
                      <div className="rounded-2xl border border-amber-100 dark:border-amber-800 bg-white dark:bg-slate-900/40 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-secondary dark:text-gray-400">Usage</p>
                        <p className="mt-2 text-2xl font-bold text-primary dark:text-gray-100">{usagePercent.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-100 dark:border-amber-800 bg-white dark:bg-slate-900/40 p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-primary dark:text-gray-100">Budget progress</p>
                          <p className="text-xs text-secondary dark:text-gray-400">Based on completed and ready orders this month.</p>
                        </div>
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{usagePercent.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-amber-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 80 ? 'bg-orange-500' : usagePercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(usagePercent || 0, 100)}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-secondary dark:text-gray-400">
                        <span className="rounded-full border border-amber-200 dark:border-amber-700 px-3 py-1 bg-white dark:bg-slate-900">Daily average: {formatCurrency(dailyAverage)}</span>
                        {peakDay && (
                          <span className="rounded-full border border-amber-200 dark:border-amber-700 px-3 py-1 bg-white dark:bg-slate-900">
                            Peak day: {formatDate(peakDay[0])} {formatCurrency(peakDay[1])}
                          </span>
                        )}
                        <span className="rounded-full border border-amber-200 dark:border-amber-700 px-3 py-1 bg-white dark:bg-slate-900">
                          Orders: {budgetData?.orderCount || 0}
                        </span>
                      </div>
                    </div>

                    {topOrders.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <h3 className="font-semibold text-primary dark:text-gray-100">Recent orders</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {topOrders.map((order) => (
                            <div key={order._id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="font-semibold text-primary dark:text-gray-100 truncate">{order.restaurantId?.shopName || 'Restaurant'}</p>
                                <p className="text-xs text-secondary dark:text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                              </div>
                              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">{formatCurrency(order.totalAmount)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-amber-200 dark:border-amber-700 p-6 text-center text-secondary dark:text-gray-400 bg-amber-50/50 dark:bg-slate-900/30">
                        No completed orders have been tracked yet this month.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-amber-200/80 dark:border-amber-900/40 bg-white/95 dark:bg-surface-dark/90 shadow-xl">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UtensilsCrossed className="h-5 w-5 text-amber-600" />
                      Low-Budget Meal Shortcuts
                    </CardTitle>
                    <p className="text-sm text-secondary dark:text-gray-400 mt-1">Jump straight to affordable meals, combos, and snack options within your limit.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MEAL_BUDGET_PRESETS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setMealBudget(String(value));
                          fetchMealShortcuts(String(value), mealType, mealCategory);
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${String(value) === String(mealBudget) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-slate-800'}`}
                      >
                        {formatCurrency(value)}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={mealBudget}
                    onChange={(event) => setMealBudget(event.target.value)}
                    placeholder="Meal budget"
                    className="lg:col-span-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <select
                    value={mealType}
                    onChange={(event) => setMealType(event.target.value)}
                    className="lg:col-span-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="all">All meals</option>
                    <option value="combo">Combo meals only</option>
                    <option value="individual">Individual items only</option>
                  </select>
                  <select
                    value={mealCategory}
                    onChange={(event) => setMealCategory(event.target.value)}
                    className="lg:col-span-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="all">All categories</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                    <option value="drink">Drink</option>
                  </select>
                  <Button
                    onClick={() => fetchMealShortcuts(mealBudget, mealType, mealCategory)}
                    className="lg:col-span-3 inline-flex items-center justify-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Search meals
                  </Button>
                </div>

                {mealLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-amber-500" />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-amber-100 dark:border-amber-800 bg-amber-50/60 dark:bg-slate-900/40 p-4">
                        <h3 className="font-semibold text-primary dark:text-gray-100 flex items-center gap-2">
                          <BadgeDollarSign className="h-4 w-4 text-amber-600" />
                          Combo meals
                        </h3>
                        <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
                          {(mealResults.comboMeals || []).length > 0 ? mealResults.comboMeals.map((meal) => (
                            <div key={meal._id} className="rounded-xl border border-amber-100 dark:border-amber-800 bg-white dark:bg-slate-900 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-primary dark:text-gray-100">{meal.name}</p>
                                  <p className="text-xs text-secondary dark:text-gray-400 mt-1">{meal.restaurantId?.shopName || 'Restaurant'}{meal.restaurantId?.location ? ` • ${meal.restaurantId.location}` : ''}</p>
                                </div>
                                <p className="font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">{formatCurrency(meal.totalPrice)}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-sm text-secondary dark:text-gray-400">No combo meals found in this budget range.</p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-100 dark:border-amber-800 bg-white dark:bg-slate-900/40 p-4">
                        <h3 className="font-semibold text-primary dark:text-gray-100 flex items-center gap-2">
                          <Store className="h-4 w-4 text-amber-600" />
                          Individual items
                        </h3>
                        <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
                          {(mealResults.foodItems || []).length > 0 ? mealResults.foodItems.map((foodItem) => (
                            <div key={foodItem._id} className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-primary dark:text-gray-100">{foodItem.name}</p>
                                  <p className="text-xs text-secondary dark:text-gray-400 mt-1">{foodItem.restaurantId?.shopName || 'Restaurant'}{foodItem.category ? ` • ${foodItem.category}` : ''}</p>
                                </div>
                                <p className="font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">{formatCurrency(foodItem.price)}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-sm text-secondary dark:text-gray-400">No individual items found in this budget range.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSupportPage;