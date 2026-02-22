import React, { useEffect, useRef, useState } from "react";
import { aiAPI } from "../../services/api";
import Card, { CardContent, CardHeader, CardTitle } from "../ui/Card";
import Button from "../ui/Button";

const AIChat = () => {
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

  return (
    <Card className="h-[75vh] flex flex-col">
      <CardHeader className="border-b border-secondary/20 dark:border-secondary/10">
        <CardTitle>AI Campus Assistant</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  }`}
                >
                  <p className="text-xs font-semibold mb-1">
                    {message.sender === "user" ? "User" : "AI"}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
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
