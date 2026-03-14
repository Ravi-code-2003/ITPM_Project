import React from "react";
import LostFoundCard from "./LostFoundCard";

const getUserId = (post) => (typeof post.userId === "object" ? post.userId?._id : post.userId);

const FoundItemList = ({ posts, currentUserId, onResolve, onDelete, emptyLabel = "No found items yet.", readOnly = false }) => {
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
          readOnly={readOnly}
        />
      ))}
    </div>
  );
};

export default FoundItemList;
