import React from "react";
import { CheckCircle2, MapPin, CalendarDays, Tag, Trash2 } from "lucide-react";

const formatDate = (dateValue) => {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString();
};

const LostFoundCard = ({ post, isOwner, onResolve, onDelete, readOnly = false }) => {
  const isResolved = post.status === "resolved";

  return (
    <div className="lostfound-card border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-slate-900">
      <div className="flex items-start gap-4">
        {post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
          />
        ) : (
          <div className="w-24 h-24 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-slate-800 text-xs text-gray-500 flex items-center justify-center text-center px-2">
            No image
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-lg font-semibold text-primary dark:text-gray-100 truncate">{post.title}</h4>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                isResolved
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
              }`}
            >
              {isResolved ? "Resolved" : "Open"}
            </span>
          </div>

          <p className="mt-1 text-sm text-secondary dark:text-gray-300">{post.description}</p>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-secondary dark:text-gray-300">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {post.location}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {formatDate(post.date)}
            </p>
            <p className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {post.category}
            </p>
            <p>{post.contactInfo ? `Contact: ${post.contactInfo}` : "Contact: Not provided"}</p>
          </div>

          {Array.isArray(post.matchReasons) && post.matchReasons.length > 0 && (
            <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
              Match reason: {post.matchReasons.join(", ")} (score: {post.matchScore ?? "-"})
            </p>
          )}

          {!readOnly && isOwner && (
            <div className="mt-4 flex flex-wrap gap-2">
              {!isResolved && (
                <button
                  type="button"
                  onClick={() => onResolve?.(post._id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Resolved
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete?.(post._id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LostFoundCard;
