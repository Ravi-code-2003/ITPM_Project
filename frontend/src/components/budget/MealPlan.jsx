import React, { useEffect, useMemo, useState } from "react";
import { budgetAPI } from "../../services/api";
import MealToken from "./MealToken";
import Button from "../ui/Button";
import { generateMealPlanPDF } from "../../utils/pdfGenerator";

const FILTERS = ["all", "breakfast", "lunch", "dinner"];

const estimateNutrition = (meal) => {
  const price = Number(meal.price || 0);
  const base = Math.max(200, Math.round(price * 2.8));
  const protein = Math.max(10, Math.round(base * 0.08));
  const carbs = Math.max(15, Math.round(base * 0.11));
  const fats = Math.max(6, Math.round(base * 0.04));

  const tags = [];
  if (protein >= 20) tags.push("High Protein");
  if (carbs <= 35) tags.push("Low Carb");
  if ((meal.category || "").toLowerCase() === "breakfast") tags.push("Morning Fuel");
  if ((meal.name || "").toLowerCase().includes("salad")) tags.push("Vegan");

  return {
    calories: base,
    protein,
    carbs,
    fats,
    tags: tags.length ? tags : ["Balanced"],
  };
};

const flattenMeals = (data) => {
  const categories = ["breakfast", "lunch", "dinner"];
  const rows = [];
  categories.forEach((category) => {
    (data?.meals?.[category] || []).forEach((meal, idx) => {
      const nutrition = estimateNutrition(meal);
      const sourceId = meal?._id || meal?.id || meal?.name || "meal";
      const uid = `${category}:${sourceId}:${idx}`;
      rows.push({
        ...meal,
        id: sourceId,
        uid,
        category,
        nutrition: {
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fats: nutrition.fats,
        },
        tags: nutrition.tags,
      });
    });
  });
  return rows;
};

const MealPlan = ({ refreshTick = 0 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);
  const [selected, setSelected] = useState({});

  const allMeals = useMemo(() => flattenMeals(data), [data]);
  const filteredMeals = useMemo(() => {
    return categoryFilter === "all"
      ? allMeals
      : allMeals.filter((meal) => meal.category === categoryFilter);
  }, [allMeals, categoryFilter]);

  const visibleMeals = useMemo(
    () => filteredMeals.slice(0, visibleCount),
    [filteredMeals, visibleCount]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await budgetAPI.getMealPlan();
        setData(res.data || null);
      } catch (e) {
        setError("Failed to load meal plan");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshTick]);

  useEffect(() => {
    const grouped = { breakfast: [], lunch: [], dinner: [] };
    Object.values(selected).forEach((meal) => {
      grouped[meal.category].push(meal);
    });
    localStorage.setItem("mealPlannerSelection", JSON.stringify(grouped));
  }, [selected]);

  const toggleSelect = (meal) => {
    setSelected((prev) => {
      const next = { ...prev };
      const key = meal.uid || meal.id;
      if (next[key]) delete next[key];
      else next[key] = meal;
      return next;
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-secondary">No meal plan generated.</p>;

  return (
    <div className="p-4 rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold">Healthy Meal Planner {data.cached ? "(cached)" : ""}</p>
          <p className="text-sm text-secondary">
            Budget: LKR {Number(data.budget || 0).toFixed(2)} | Selected:{" "}
            {Object.keys(selected).length}
          </p>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setCategoryFilter(filter);
                setVisibleCount(9);
              }}
              className={`px-3 py-1 rounded-full text-sm capitalize ${
                categoryFilter === filter
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {filter}
            </button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const grouped = { breakfast: [], lunch: [], dinner: [] };
              Object.values(selected).forEach((meal) => {
                grouped[meal.category].push(meal);
              });
              generateMealPlanPDF(grouped);
            }}
          >
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {visibleMeals.map((meal) => (
          <MealToken
            key={meal.uid}
            meal={meal}
            selected={Boolean(selected[meal.uid])}
            onToggle={toggleSelect}
          />
        ))}
      </div>

      {visibleCount < filteredMeals.length && (
        <button
          type="button"
          onClick={() => setVisibleCount((v) => v + 6)}
          className="mt-4 px-4 py-2 rounded-lg border text-sm"
        >
          Load More
        </button>
      )}
    </div>
  );
};

export default MealPlan;
