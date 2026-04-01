import React from "react";

const MealToken = ({ meal, selected, onToggle }) => {
  const nutrition = meal.nutrition || { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const tags = meal.tags || [];

  return (
    <button
      type="button"
      onClick={() => onToggle(meal)}
      className={`text-left rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        selected ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
      }`}
    >
      {meal.imageUrl ? (
        <img
          src={meal.imageUrl}
          alt={meal.name}
          className="w-full h-32 object-cover rounded-xl mb-3"
          loading="lazy"
        />
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-gray-900">{meal.name}</h4>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
          {meal.category}
        </span>
      </div>

      <p className="text-sm text-gray-500 mt-1">LKR {Number(meal.price || 0).toFixed(2)}</p>

      <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-700">
        <div>Calories: {nutrition.calories}</div>
        <div>Protein: {nutrition.protein}g</div>
        <div>Carbs: {nutrition.carbs}g</div>
        <div>Fats: {nutrition.fats}g</div>
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
};

export default React.memo(MealToken);
