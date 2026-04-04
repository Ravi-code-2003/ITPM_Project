import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, SendHorizontal, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiChatService } from '../../services/aiChatService';

const toUiMessages = (messages = []) => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((item) => item && typeof item === 'object' && item.content)
    .map((item) => ({
      role: item.sender === 'user' ? 'user' : 'assistant',
      content: String(item.content || ''),
      timestamp: item.timestamp,
    }));
};

const SUGGESTIONS = [
  'Find meals under LKR 500',
  'Show active food offers today',
  'What todos are pending this week?',
  'Summarize my latest study sessions',
];

const FloatingStudentChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef(null);

  const disableSend = useMemo(() => sending || !input.trim(), [sending, input]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen || historyLoaded) {
      return;
    }

    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const data = await aiChatService.getHistory();
        setMessages(toUiMessages(data.messages));
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to load chat history.';
        toast.error(message);
      } finally {
        setLoadingHistory(false);
        setHistoryLoaded(true);
      }
    };

    loadHistory();
  }, [isOpen, historyLoaded]);

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) {
      return;
    }

    setInput('');
    setSending(true);
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const data = await aiChatService.sendMessage(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'No reply received from assistant.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send message.';
      toast.error(message);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I could not process that request right now. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="w-[350px] max-w-[calc(100vw-2rem)] h-[540px] rounded-2xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-200/80 via-emerald-100/70 to-sky-100/70 dark:from-amber-900/40 dark:via-emerald-900/30 dark:to-sky-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">UniCore DB Assistant</p>
                  <p className="text-[11px] text-gray-700 dark:text-gray-400">Answers from your live system data</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
                aria-label="Close chatbot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-amber-50/40 dark:bg-slate-900/60">
            {loadingHistory ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-900 p-3 text-xs text-gray-700 dark:text-gray-300">
                  Ask me about meals, orders, finance, study, todos, notes, lost & found, and education programs.
                </div>
                <div className="grid gap-2">
                  {SUGGESTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSuggestion(item)}
                      className="text-left rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs hover:bg-amber-100/60 dark:hover:bg-slate-800"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'ml-auto bg-amber-500 text-white'
                      : 'mr-auto bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {message.content}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything from your DB..."
                className="flex-1 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={disableSend}
                className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
                aria-label="Send message"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 shadow-xl border border-amber-400 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold"
        >
          <MessageCircle className="h-4 w-4" />
          AI Assistant
        </button>
      )}
    </div>
  );
};

export default FloatingStudentChatbot;
