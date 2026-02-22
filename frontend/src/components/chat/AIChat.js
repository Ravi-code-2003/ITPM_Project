import React, { useEffect, useRef, useState } from "react";
import { aiAPI } from "../../services/api";
import Card, { CardContent, CardHeader, CardTitle } from "../ui/Card";
import Button from "../ui/Button";

const renderInlineFormattedText = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold">
          {boldMatch[1]}
        </strong>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

const renderMessageBody = (content) => {
  const lines = String(content || "").split("\n");

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={`line-${index}`} className="h-1" />;
        }

        const headingMatch = trimmed.match(/^\*\*([^*]+)\*\*$/);
        if (headingMatch) {
          return (
            <p key={`line-${index}`} className="text-base font-semibold">
              {headingMatch[1]}
            </p>
          );
        }

        const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);
        if (bulletMatch) {
          return (
            <p key={`line-${index}`} className="pl-4 relative">
              <span className="absolute left-0">•</span>
              {renderInlineFormattedText(bulletMatch[1])}
            </p>
          );
        }

        return <p key={`line-${index}`}>{renderInlineFormattedText(trimmed)}</p>;
      })}
    </div>
  );
};

const AIChat = ({ isFloating = false, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await aiAPI.getChatHistory();
        setMessages(data.messages || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load chat history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) {
      return;
    }

    if (trimmed.length > 2000) {
      setError("Message must be 2000 characters or fewer.");
      return;
    }

    setError("");
    setIsSending(true);

    try {
      const response = await aiAPI.sendMessage(trimmed);
      setMessages(response.messages || []);
      setInput("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
  const containerClassName = isFloating
    ? "h-[70vh] max-h-[640px] flex flex-col shadow-2xl border border-secondary/30 dark:border-secondary/20"
    : "h-[75vh] flex flex-col";

  return (
    <Card className={containerClassName}>
      <CardHeader className="border-b border-secondary/20 dark:border-secondary/10">
        <div className="flex items-center justify-between gap-4">
          <CardTitle>AI Campus Assistant</CardTitle>
          {isFloating && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm font-semibold text-secondary transition-colors hover:bg-secondary/10 dark:text-gray-300 dark:hover:bg-secondary/20"
              aria-label="Close chatbot"
            >
              Close
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
          {isLoading ? (
            <p className="text-secondary dark:text-gray-400">Loading chat history...</p>
          ) : messages.length === 0 ? (
            <p className="text-secondary dark:text-gray-400">
              Start the conversation with your AI campus assistant.
            </p>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.timestamp || "msg"}-${index}`}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.sender === "user"
                      ? "bg-primary text-white"
                      : "bg-accent/20 text-primary dark:text-gray-100"
                  } overflow-hidden break-words`}
                >
                  {renderMessageBody(message.content)}
                </div>
              </div>
            ))
          )}

          {isSending && (
            <p className="text-sm text-secondary dark:text-gray-400">AI is generating a response...</p>
          )}
        </div>

        <div className="border-t border-secondary/20 dark:border-secondary/10 p-4">
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Ask your campus-related question..."
              className="w-full rounded-lg border border-secondary/40 dark:border-secondary/20 bg-white dark:bg-surface-dark px-3 py-2 text-sm text-primary dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={2000}
              disabled={isSending}
            />
            <Button onClick={handleSendMessage} disabled={isSending || !input.trim()}>
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChat;
