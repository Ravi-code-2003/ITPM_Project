import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AIChat from "./AIChat";

const FloatingAIChat = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (loading) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setIsOpen((prev) => !prev);
  };

  if (loading) {
    return null;
  }

  return (
    <>
      {isOpen && isAuthenticated && (
        <div className="fixed bottom-24 right-4 z-[1000] w-[calc(100vw-2rem)] max-w-md sm:right-6 sm:w-[420px]">
          <AIChat isFloating onClose={() => setIsOpen(false)} />
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className="fixed bottom-6 right-4 z-[1001] h-14 w-14 rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:right-6"
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        {isOpen ? "X" : "AI"}
      </button>
    </>
  );
};

export default FloatingAIChat;
