import React from "react";
import AIChat from "../components/chat/AIChat";

const AIChatPage = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary dark:text-gray-100">AI Assistant</h1>
          <p className="text-secondary dark:text-gray-400 mt-2">
            Role-aware academic support with persistent conversation history.
          </p>
        </div>
        <AIChat />
      </div>
    </div>
  );
};

export default AIChatPage;
