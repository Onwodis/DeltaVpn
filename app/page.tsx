'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup, Variants } from 'framer-motion';
import { toast } from 'sonner';
import {
  Shield,
  Send,
  RefreshCw,
  Bot,
  User,
  Sun,Check,
  Moon,
  Trash2,
  Network,
  Lock,
  Zap,Copy,Edit2,
  Image as ImageIcon,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // Changed from Date to string
}

const LOCAL_STORAGE_KEY = 'Delta_vpn_chat_history';
const ContentParser = ({ content }: { content: string }) => {
  // Use [\s\S] to match everything including newlines, avoiding 's' flag issues
  // const parts = content.split(
  //   /(\[LIST\][\s\S]*?\[\/LIST\]|\[TABLE\][\s\S]*?\[\/TABLE\]|\[IMAGE\s+.*?\])/g
  // );
  const parts = content.split(
    /(\[LIST\][\s\S]*?\[\/LIST\]|\[TABLE\][\s\S]*?\[\/TABLE\]|\[IMAGE\s+.*?\])/g
  );
  

  return (
    <div className="space-y-4 font-sans text-slate-200">
      {parts.map((part, i) => {
        const cleanPart = part.trim();
        // 1. Handle Lists
        if (part.startsWith('[LIST]')) {
          const items = part
            .replace(/\[\/?LIST\]/g, '')
            .split('*')
            .filter((l) => l.trim());
          return (
            <ul key={i} className="space-y-2 my-4">
              {items.map((item, j) => (
                <li
                  key={j}
                  className="text-xs font-mono flex items-start gap-2 text-indigo-300"
                >
                  <span className="mt-1">
                    <Zap size={10} />
                  </span>
                  {item.trim()}
                </li>
              ))}
            </ul>
          );
        }

        // 2. Handle Images (Strip HTML attributes to get the src)
        if (part.startsWith('[IMAGE')) {
          // Extract the src attribute using a non-greedy regex
          const srcMatch = part.match(/src=["'](.*?)["']/);
          const src = srcMatch ? srcMatch[1] : '';

          return (
            <img
              key={i}
              src={src}
              className=" h-50 object-contain rounded mx-auto my-4 border-2"
              alt="Founder"
            />
          );
        }

        // 3. Handle Tables
        

        // 4. Handle Text
        return (
          <p key={i} className="text-xs leading-relaxed">
            {part.replace(/\{.*?\}/g, '').trim()}
          </p>
        );
      })}
    </div>
  );
};

// Statically type the object using Framer Motion's native Variants interface
const microBounceVariants: Variants = {
  initial: { opacity: 0, y: 30, scale: 0.9, rotateX: -15 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: -20,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const orchestrateContainer: Variants = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export default function VpnSupportDashboard() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 2. Optimized Handler
  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success('Snippet copied to clipboard');

    // Reset state after 2 seconds
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [isLoaded, setIsLoaded] = useState(false); // Splash screen state

  useEffect(() => {
    // Artificial delay to show logo/branding on load
    const timer = setTimeout(() => setIsLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const cachedTheme = localStorage.getItem('Delta_explicit_theme');
    if (cachedTheme) {
      setIsDark(cachedTheme === 'dark');
    }

    const cachedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cachedHistory) {
      try {
        setMessages(JSON.parse(cachedHistory));
      } catch (e) {
        console.error('Failed parsing chat history context:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, mounted]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const toggleTheme = () => {
    const nextState = !isDark;
    setIsDark(nextState);
    localStorage.setItem('Delta_explicit_theme', nextState ? 'dark' : 'light');
    toast.info(`Switched to ${nextState ? 'Dark' : 'Light'} Mode`, {
      duration: 1500,
    });
  };
  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          {/* Replace this with your actual image path */}
          <img src="/logo.png" alt="Nexus Logo" className="w-80 h-80 mb-4" />
          <div className="h-1 w-20 bg-indigo-500/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.2 }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userPrompt = input.trim();
    setInput('');
    // Just trigger the async process; the process itself handles the messages
    await processAgentInference(userPrompt);
  };

  // Inside your VpnSupportDashboard component:

  // Replace your existing addMessage and processAgentInference with this unified logic
  const appendMessage = (role: 'user' | 'assistant', content: string = '') => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setMessages((prev) => [...prev, msg]);
    return msg.id;
  };

  const processAgentInference = async (prompt: string) => {
    setIsLoading(true);
    // Add User Message ONCE
    appendMessage('user', prompt);

    try {
      const assistantId = crypto.randomUUID();
      // Prepare initial empty message for streaming
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history: messages.slice(-10) }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantReply = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        assistantReply += decoder.decode(value);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantReply } : m
          )
        );
      }
    } catch (err) {
      toast.error('Connection to Delta Node failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Ensure you flush this token whenever the user clears history logs:
  const clearChatHistory = () => {
    toast('Clear Conversation Logs?', {
      description:
        'This action will flush your local conversation terminal memory.',
      action: {
        label: 'Clear All',
        onClick: () => {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setMessages([]);
          setCurrentConversationId(null); // Clear context tracking state entirely
          toast.success('Conversation log clean-up complete.');
        },
      },
    });
  };

  if (!mounted) return null;

  return (
    <main
      className={`flex flex-col h-screen max-h-screen overflow-hidden font-sans antialiased perspective-[1000px] transition-colors duration-500 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Platform Header */}
      <header
        className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-500 shadow-lg ${
          isDark
            ? 'border-slate-800 bg-slate-950/80 backdrop-blur-md'
            : 'border-slate-200 bg-white/80 backdrop-blur-md'
        }`}
      >
        {/* <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.15, rotate: 360 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="p-2.5 bg-gradient-to-tr from-blue-700 to-indigo-500 rounded-xl text-white shadow-xl shadow-blue-500/20 cursor-pointer"
          >
            <Shield size={22} />
          </motion.div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-400">
              DeltaVPN Core
            </h1>
            <p
              className={`text-[10px] font-medium tracking-wide ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Gloc  Managed Node
            </p>
          </div>
        </div> */}
        <div className="flex items-center gap-3">
          {/* IMAGE LOGO IN NAVBAR */}
          <img
            src={`${isDark ? `/logob.png` : `/logo_ll.png`}`}
            alt="Delta Logo"
            className="w-28  rounded-lg object-contain"
          />

          {/* <div>
            <h1 className="...">DeltaVPN Core</h1>
            <p className="...">Gloc Managed Node</p>
          </div> */}
        </div>

        {/* Action Panel Utilities */}
        <div className="flex items-center gap-3">
          <AnimatePresence mode="popLayout">
            {messages.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearChatHistory}
                className={`p-2 cp rounded-xl transition-colors ${
                  isDark
                    ? 'bg-slate-900 text-slate-400 hover:text-rose-400'
                    : 'bg-slate-100 text-slate-500 hover:text-rose-600'
                }`}
              >
                <Trash2 size={15} />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            layout
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, rotate: 180 }}
            onClick={toggleTheme}
            className={`p-2 cp rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-amber-400'
                : 'bg-white border-slate-200 text-indigo-600 shadow-sm'
            }`}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </motion.button>
        </div>
      </header>

      {/* Main Conversation Canvas */}
      <section
        ref={scrollRef}
        className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-6 transition-colors duration-500 ${
          isDark ? 'bg-slate-950/40' : 'bg-slate-100/30'
        }`}
      >
        <div className="max-w-3xl mx-auto">
          <LayoutGroup>
            <motion.div
              variants={orchestrateContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {messages.length === 0 ? (
                  <motion.div
                    variants={microBounceVariants}
                    className={`flex flex-col items-center justify-center h-[55vh] text-center max-w-sm mx-auto p-8 rounded-3xl border ${
                      isDark
                        ? 'bg-slate-900/40 border-slate-800/60'
                        : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
                    }`}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: 'easeInOut',
                      }}
                      className={`p-4 rounded-2xl mb-2 text-blue-500 ${
                        isDark ? 'bg-slate-950' : 'bg-slate-50'
                      }`}
                    >
                      <Bot size={36} />
                    </motion.div>
                    <h2 className="text-md font-black tracking-tight">
                      Diagnostic Terminal
                    </h2>
                    <p
                      className={`text-xs leading-relaxed ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Submit queries regarding connection dropping spikes,
                      geo-latency profiles, or deployment allocation
                      configurations.
                    </p>
                  </motion.div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <motion.div
                        key={msg.id}
                        variants={microBounceVariants}
                        layout="position"
                        className={`flex gap-3.5 w-full ${
                          isUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isUser && (
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md"
                          >
                            <Bot size={16} />
                          </motion.div>
                        )}

                        <div
                          className={`p-4 rounded-2xl max-w-lg group relative ${
                            msg.role === 'user'
                              ? 'bg-blue-500'
                              : 'bg-slate-900 border border-slate-800'
                          }`}
                        >
                          <ContentParser content={msg.content} />

                          {/* Footer with Timestamp and Actions */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                            <span
                              className={`text-[9px] bg-gray-50 px-2 mx-2 opacity-50 font-mono ${
                                isDark ? 'text-gray-800' : 'text-gray-950'
                              }`}
                            >
                              {msg.timestamp}
                            </span>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className={`transition-colors duration-200 ${
                                  copiedId === msg.id
                                    ? 'text-emerald-400'
                                    : 'hover:text-blue-400'
                                } cp`}
                              >
                                {copiedId === msg.id ? (
                                  <Check size={10} />
                                ) : (
                                  <Copy size={10} />
                                )}
                              </button>
                              {msg.role === 'user' && (
                                <button
                                  onClick={() => {
                                    setInput(
                                      msg.content
                                    ); /* Logic to clear history if desired */
                                  }}
                                  className="hover:text-indigo-400 cp"
                                >
                                  <Edit2 size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {isUser && (
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: -10 }}
                            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                              isDark
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            <User size={16} />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })
                )}

                {/* Processing State Animation */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3.5 justify-start"
                  >
                    <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                      <RefreshCw size={14} className="animate-spin" />
                    </div>
                    <div
                      className={`px-5 py-3 rounded-2xl rounded-tl-none text-xs font-semibold flex items-center gap-2 shadow-sm border ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-400'
                          : 'bg-white border-slate-100 text-slate-500'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span>Syncing Gloc Inference Threads...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        </div>
      </section>

      {/* Input Form Panel Terminal */}
      <footer
        className={`p-4 md:p-6 border-t transition-colors duration-500 ${
          isDark
            ? 'bg-slate-950 border-slate-900 shadow-2xl'
            : 'bg-white border-slate-200'
        }`}
      >
        <form
          onSubmit={handleSubmit}
          className={`max-w-3xl mx-auto flex items-center gap-2 border rounded-xl p-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:scale-[1.01] ${
            isDark
              ? 'bg-slate-900/60 border-slate-800 focus-within:border-blue-500'
              : 'bg-slate-100 border-slate-200 focus-within:border-blue-500 focus-within:bg-white shadow-sm'
          }`}
        >
          {/* <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your connection telemetry query..."
            className={`flex-1 bg-transparent border-0 outline-none text-xs px-3 font-medium disabled:cursor-not-allowed ${
              isDark
                ? 'text-slate-100 placeholder-slate-500'
                : 'text-slate-800 placeholder-slate-400'
            }`}
            disabled={isLoading}
          /> */}
          <textarea // 1. Use textarea instead of input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            placeholder="Type your connection telemetry query..."
            className="flex-1 bg-transparent border-0 outline-none text-xs px-3 py-2 max-h-32 min-h-[40px] resize-none" // Added resize-none
            rows={1}
            disabled={isLoading}
          />
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-800 text-white dark:disabled:text-slate-600 rounded-lg shadow-md transition-all shrink-0 flex items-center justify-center ${
              input.length > 0 ? `cp` : `naa`
            }`}
          >
            <Send size={13} />
          </motion.button>
        </form>

        <div
          className={`flex items-center justify-center gap-1.5 text-[9px] mt-4 tracking-widest font-black uppercase transition-colors ${
            isDark ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          <Network size={10} className="text-blue-500" />
          <span>Context Sync Node Active</span>
        </div>
      </footer>
    </main>
  );
}
