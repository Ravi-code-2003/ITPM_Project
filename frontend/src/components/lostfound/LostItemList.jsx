import React from "react";
import LostFoundCard from "./LostFoundCard";

const getUserId = (post) => (typeof post.userId === "object" ? post.userId?._id : post.userId);

const LostItemList = ({ posts, currentUserId, onResolve, onDelete, emptyLabel = "No lost items yet." }) => {
  if (!posts.length) {
    return <p className="text-sm text-secondary dark:text-gray-400">{emptyLabel}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {posts.map((post) => (
        <LostFoundCard
          key={post._id}
          post={post}
          isOwner={getUserId(post) === currentUserId}
          onResolve={onResolve}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default LostItemList;
