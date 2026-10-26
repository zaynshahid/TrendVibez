import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Trash2,
  ChevronDown,
  ShoppingBag,
  ExternalLink,
  Star,
  RefreshCw,
  User,
  Bot,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  GripHorizontal
} from 'lucide-react';
import { useAuth, API_URL } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';

// Quick starter prompt suggestions
const QUICK_PROMPTS = [
  { label: '✨ Trending Items', prompt: 'What are the most popular and trending items in the store right now?' },
  { label: "🧥 Men's Collection", prompt: "Show me the top picks in the Men's clothing category with prices and available sizes." },
  { label: "👗 Women's Collection", prompt: "What women's dresses and apparel are currently in stock?" },
  { label: '🛍️ Add to Cart', prompt: 'Can you recommend a great outfit and add it to my cart?' },
  { label: '🔄 Returns & Shipping', prompt: "What is TrendVibe's shipping time, delivery fee, and return policy?" }
];

export default function Chatbot() {
  const { user, token } = useAuth();
  const { addToCart, removeFromCart, syncCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Per-user storage key — guests get their own slot too
  const chatStorageKey = `tv_chat_history_${user?.id ?? 'guest'}`;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const key = `tv_chat_history_${user?.id ?? 'guest'}`;
      const saved = sessionStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(true);

  // Drag state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);
  const widgetRef = useRef(null);
  const chatWindowRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const getDragBounds = useCallback(() => {
    const visibleElements = [widgetRef.current, isOpen ? chatWindowRef.current : null].filter(Boolean);
    if (visibleElements.length === 0) return null;

    const margin = 16;
    const bounds = visibleElements.reduce((acc, element) => {
      const rect = element.getBoundingClientRect();
      const baseLeft = rect.left - position.x;
      const baseTop = rect.top - position.y;

      return {
        minX: Math.max(acc.minX, margin - baseLeft),
        maxX: Math.min(acc.maxX, window.innerWidth - margin - rect.width - baseLeft),
        minY: Math.max(acc.minY, margin - baseTop),
        maxY: Math.min(acc.maxY, window.innerHeight - margin - rect.height - baseTop),
      };
    }, {
      minX: -Infinity,
      maxX: Infinity,
      minY: -Infinity,
      maxY: Infinity,
    });

    return bounds;
  }, [isOpen, position]);

  const clampPosition = useCallback((nextPosition) => {
    const bounds = getDragBounds();
    if (!bounds) return nextPosition;

    const minX = Math.min(bounds.minX, bounds.maxX);
    const maxX = Math.max(bounds.minX, bounds.maxX);
    const minY = Math.min(bounds.minY, bounds.maxY);
    const maxY = Math.max(bounds.minY, bounds.maxY);

    return {
      x: Math.max(minX, Math.min(nextPosition.x, maxX)),
      y: Math.max(minY, Math.min(nextPosition.y, maxY)),
    };
  }, [getDragBounds]);

  // Drag handlers
  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStart.current = { mx: clientX - position.x, my: clientY - position.y };
    setIsDragging(true);
  }, [position]);

  const handleDragMove = useCallback((e) => {
    if (!dragStart.current) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const newX = clientX - dragStart.current.mx;
    const newY = clientY - dragStart.current.my;
    setPosition(clampPosition({ x: newX, y: newY }));
  }, [clampPosition]);

  const handleDragEnd = useCallback(() => {
    dragStart.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('mouseleave', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('touchcancel', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('mouseleave', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((currentPosition) => clampPosition(currentPosition));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  // Listen for global open-ai-chatbot trigger events
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ai-chatbot', handleOpen);
    return () => window.removeEventListener('open-ai-chatbot', handleOpen);
  }, []);

  // When user logs in/out, reload their own chat history
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(chatStorageKey);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setMessages([]);
    }
  }, [chatStorageKey]);

  // Save conversation to sessionStorage under this user's key
  useEffect(() => {
    try {
      sessionStorage.setItem(chatStorageKey, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat history to storage', e);
    }
  }, [messages, chatStorageKey]);

  // Scroll to bottom on new messages or when opened
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
      setHasUnread(false);
      setShowWelcomeTooltip(false);
    }
  }, [messages, isOpen, isLoading]);

  // Hide initial welcome tooltip after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeTooltip(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = async (customPrompt) => {
    const textToSend = typeof customPrompt === 'string' ? customPrompt : inputValue.trim();
    if (!textToSend || isLoading) return;

    const userMessage = {
      id: Date.now() + '-user',
      role: 'user',
      text: textToSend,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build history for multi-turn conversational context
      const chatHistory = messages
        .filter(m => m.role === 'user' || m.role === 'model')
        .slice(-8)
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const isProductPage = location.pathname.startsWith('/products/') && location.pathname.split('/products/')[1];
      const currentProductId = isProductPage ? location.pathname.split('/products/')[1] : null;

      const pageContext = {
        pathname: location.pathname,
        isProductPage: !!isProductPage,
        productId: currentProductId,
        productDetails: window.__CURRENT_PRODUCT__ || null
      };

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory,
          pageContext
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get response from AI stylist.');
      }

      // Synchronize cart changes in frontend CartContext
      if (Array.isArray(data.cartActions) && data.cartActions.length > 0) {
        for (const action of data.cartActions) {
          if (action.action === 'add') {
            if (token) {
              // Authenticated user: backend already persisted to DB cart, refresh local state
              await syncCart();
            } else {
              // Guest user: update guest cart in localStorage/state
              try {
                await addToCart(
                  action.productId,
                  action.quantity || 1,
                  action.variantId || '',
                  action.selectedColor || ''
                );
              } catch (e) {
                console.warn('Guest cart synchronization note:', e);
              }
            }
          } else if (action.action === 'remove') {
            if (token) {
              await syncCart();
            } else {
              removeFromCart(action.productId, action.variantId || '');
            }
          }
        }
      }

      const botMessage = {
        id: Date.now() + '-bot',
        role: 'model',
        text: data.reply || "I'm here to help with any styling questions or catalog items!",
        products: data.productsMentioned || [],
        cartActions: data.cartActions || [],
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        id: Date.now() + '-err',
        role: 'model',
        isError: true,
        text: "I apologize, but I'm having trouble connecting to our store catalog right now. Please try again in a moment.",
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    try {
      sessionStorage.removeItem(chatStorageKey);
    } catch { }
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  // Helper to parse markdown-like bold, bullet points, and product links
  const renderFormattedMessage = (text) => {
    if (!text) return null;

    // Split text into paragraphs/lines
    const lines = text.split('\n');

    return (
      <div className="space-y-1.5 text-[0.875rem] leading-relaxed text-[#2C1810]">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Check for headers (e.g. ### Header)
          if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
            const headerText = trimmed.replace(/^#+\s*/, '');
            return (
              <h4 key={idx} className="font-serif font-bold text-[0.95rem] text-[#3B2A22] mt-2 mb-1">
                {renderInlineFormatting(headerText)}
              </h4>
            );
          }

          // Check for list items
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
            const listText = trimmed.replace(/^(\*|-|\d+\.)\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
                <span className="text-[#8B5E3C] mt-1 text-[0.7rem] select-none">•</span>
                <span className="flex-1">{renderInlineFormatting(listText)}</span>
              </div>
            );
          }

          return <p key={idx}>{renderInlineFormatting(line)}</p>;
        })}
      </div>
    );
  };

  // Render inline bold, code, and markdown links [Title](/products/123)
  const renderInlineFormatting = (str) => {
    // Regex for markdown links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(parseBold(str.substring(lastIndex, match.index)));
      }
      const linkText = match[1];
      const linkUrl = match[2];

      parts.push(
        <button
          key={`link-${match.index}`}
          onClick={(e) => {
            e.stopPropagation();
            if (linkUrl.startsWith('/')) {
              navigate(linkUrl);
            } else {
              window.open(linkUrl, '_blank', 'noopener,noreferrer');
            }
          }}
          className="inline-flex items-center gap-1 font-semibold text-[#8B5E3C] hover:text-[#3B2A22] underline underline-offset-2 transition-colors cursor-pointer"
        >
          {linkText}
          <ExternalLink size={12} className="opacity-80" />
        </button>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < str.length) {
      parts.push(parseBold(str.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : parseBold(str);
  };

  // Helper to parse **bold** and *italic*
  const parseBold = (raw) => {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const segments = [];
    let lastIdx = 0;
    let bMatch;

    while ((bMatch = boldRegex.exec(raw)) !== null) {
      if (bMatch.index > lastIdx) {
        segments.push(raw.substring(lastIdx, bMatch.index));
      }
      segments.push(
        <strong key={`bold-${bMatch.index}`} className="font-semibold text-[#2C1810]">
          {bMatch[1]}
        </strong>
      );
      lastIdx = bMatch.index + bMatch[0].length;
    }

    if (lastIdx < raw.length) {
      segments.push(raw.substring(lastIdx));
    }

    return segments;
  };

  return (
    <>
      {/* ===== DRAGGABLE FLOATING WIDGET ===== */}
      <div
        ref={widgetRef}
        className="fixed z-[9999] flex flex-col items-end pointer-events-auto select-none"
        style={{
          bottom: '1.5rem',
          right: '1.5rem',
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'auto',
        }}
      >
        {/* Callout bubble — always visible when closed */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              key="callout"
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88, y: 6 }}
              transition={{ duration: 0.28 }}
              onClick={() => setIsOpen(true)}
              className="mb-3 cursor-pointer group relative overflow-hidden rounded-2xl border-2 border-white/20 text-white max-w-[280px]"
              style={{
                background: 'linear-gradient(135deg, #2C1810 0%, #6F4E37 60%, #A07850 100%)',
                boxShadow: '0 10px 40px rgba(44,24,16,0.55), 0 0 30px rgba(160,120,80,0.4)',
              }}
            >
              {/* Shimmer sweep */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              <div className="relative flex items-center gap-3 p-3.5">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/15 border border-white/30 shadow-inner">
                    <Sparkles size={20} className="text-amber-300" />
                  </div>
                  {/* Live dot */}
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#2C1810] animate-pulse" />
                </div>
                <div>
                  <p className="font-serif font-bold text-sm text-white leading-snug">
                    AI Fashion Stylist
                  </p>
                  <p className="text-[0.72rem] text-amber-200/90 leading-tight mt-0.5">
                    Ask about styles, sizes, stock & more ✨
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag handle strip — always visible so widget is always draggable */}
        <div className="flex justify-center mt-1">
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B2A22]/70 border border-white/15 text-white/50 hover:text-white/80 hover:bg-[#3B2A22] transition-all cursor-grab active:cursor-grabbing text-[0.6rem] font-medium tracking-wide select-none"
            title="Drag to move"
          >
            <GripHorizontal size={12} />
            <span>drag</span>
          </div>
        </div>
      </div>


      {/* ===== DRAGGABLE CHAT WINDOW ===== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.94 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-[9998] flex flex-col bottom-28 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[410px] h-[580px] max-h-[82vh] bg-[#FCF9F5] border border-[#DDD1C3] rounded-3xl shadow-2xl overflow-hidden"
            style={{
              boxShadow: '0 20px 50px rgba(44, 24, 16, 0.18), 0 0 0 1px rgba(221, 209, 195, 0.6)',
              transform: `translate(${position.x}px, ${position.y}px)`,
            }}
          >

            {/* Header */}
            <div className="relative px-4 py-3.5 bg-gradient-to-r from-[#3B2A22] via-[#50392E] to-[#6F4E37] text-white flex items-center justify-between border-b border-[#3B2A22]/20 select-none shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-[#F7F2EB]/15 border border-[#EDE4D8]/30 flex items-center justify-center text-[#EDE4D8] shadow-inner">
                  <Sparkles size={18} />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#3B2A22] rounded-full" />
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-[1rem] leading-tight text-[#F7F2EB] tracking-wide">
                    TrendVibe Stylist
                  </h3>
                  <div className="flex items-center gap-1.5 text-[0.7rem] text-[#DDD1C3]/90 font-medium">
                    <span>Google Gemini AI</span>
                    <span>•</span>
                    <span className="text-emerald-300">Live Store & Cart</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    title="Clear Conversation"
                    className="p-1.5 text-[#DDD1C3] hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Chat"
                  className="p-1.5 text-[#DDD1C3] hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Conversation Messages Viewport */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm scroll-smooth">
              {/* Initial Welcome Banner if no messages */}
              {messages.length === 0 && (
                <div className="space-y-4 py-2 animate-fade-in">
                  <div className="bg-white/90 border border-[#DDD1C3] rounded-2xl p-4 shadow-sm text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#EFE7DB] flex items-center justify-center text-[#6F4E37] mb-2.5">
                      <Bot size={24} />
                    </div>
                    <h4 className="font-serif font-bold text-[#2C1810] text-base mb-1">
                      {user ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Welcome to TrendVibe!'}
                    </h4>
                    <p className="text-xs text-[#6B5B4E] leading-relaxed max-w-[280px] mx-auto">
                      I'm your AI fashion stylist. You can ask for recommendations, check stock, or even ask me to add items to your shopping cart!
                    </p>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="space-y-1.5">
                    <p className="text-[0.72rem] font-semibold text-[#8B5E3C] uppercase tracking-wider pl-1">
                      Popular Inquiries
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {QUICK_PROMPTS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(item.prompt)}
                          className="text-left text-xs bg-white hover:bg-[#F7F2EB] text-[#3B2A22] border border-[#DDD1C3]/80 hover:border-[#8B5E3C] px-3.5 py-2 rounded-xl transition-all shadow-2xs hover:shadow-xs flex items-center justify-between group"
                        >
                          <span>{item.label}</span>
                          <span className="text-[#8B5E3C] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Render Chat Messages */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 shadow-xs ${msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#6F4E37] to-[#5C3F2C] text-[#F7F2EB] rounded-br-xs'
                      : msg.isError
                        ? 'bg-red-50/90 border border-red-200 text-red-800 rounded-bl-xs'
                        : 'bg-white border border-[#DDD1C3] text-[#2C1810] rounded-bl-xs'
                      }`}
                  >
                    {/* User message is plain text, AI message is formatted */}
                    {msg.role === 'user' ? (
                      <p className="text-[0.875rem] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <>
                        {msg.isError && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-1">
                            <AlertCircle size={14} />
                            <span>Service Notice</span>
                          </div>
                        )}
                        {renderFormattedMessage(msg.text)}
                      </>
                    )}
                  </div>

                  {/* Cart Action Success Banner */}
                  {msg.cartActions && msg.cartActions.length > 0 && (
                    <div className="w-full mt-2 pl-1">
                      <div className="bg-[#5A7A52]/10 border border-[#5A7A52]/30 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2 text-xs text-[#2C1810]">
                          <CheckCircle2 size={16} className="text-[#5A7A52] shrink-0" />
                          <span className="font-medium">
                            {msg.cartActions.length} {msg.cartActions.length === 1 ? 'item' : 'items'} updated in your cart
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/cart');
                          }}
                          className="inline-flex items-center gap-1 bg-[#6F4E37] hover:bg-[#3B2A22] text-white text-[0.72rem] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
                        >
                          <ShoppingBag size={12} />
                          <span>View Cart</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render Product Recommendation Chips if returned by Gemini */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="w-full mt-2 space-y-2 pl-1">
                      <p className="text-[0.7rem] font-semibold text-[#8B5E3C] uppercase tracking-wider">
                        Featured From Our Catalog
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.products.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => handleProductClick(prod.id)}
                            className="bg-white border border-[#DDD1C3] hover:border-[#6F4E37] rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
                          >
                            <img
                              src={prod.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200'}
                              alt={prod.name}
                              className="w-12 h-12 rounded-lg object-cover bg-[#EFE7DB] shrink-0 group-hover:scale-105 transition-transform"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-xs text-[#2C1810] truncate group-hover:text-[#6F4E37]">
                                {prod.name}
                              </h5>
                              <div className="flex items-center justify-between mt-1">
                                <span className="font-serif font-bold text-xs text-[#8B5E3C]">
                                  ${parseFloat(prod.price).toFixed(2)}
                                </span>
                                {prod.rating && (
                                  <span className="flex items-center gap-0.5 text-[0.65rem] text-[#6B5B4E]">
                                    <Star size={10} className="fill-amber-400 text-amber-400" />
                                    {prod.rating}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[0.65rem] text-[#9A8478] px-1 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {/* Typing / Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-[#EFE7DB] flex items-center justify-center text-[#6F4E37] shrink-0 shadow-2xs">
                    <Sparkles size={14} className="animate-spin" />
                  </div>
                  <div className="bg-white border border-[#DDD1C3] rounded-2xl rounded-bl-xs px-4 py-3 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#8B5E3C] animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-[#8B5E3C] animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-[#8B5E3C] animate-bounce" />
                      <span className="text-xs text-[#6B5B4E] ml-2 font-medium">Updating catalog & cart...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-[#DDD1C3] shadow-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 bg-[#FCF9F5] border border-[#DDD1C3] focus-within:border-[#6F4E37] rounded-2xl px-3 py-1.5 transition-colors"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={user ? `Ask about products, sizes, add to cart...` : `Ask about jackets, sizes, add to cart...`}
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-none outline-none text-xs text-[#2C1810] placeholder:text-[#9A8478] py-1.5"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Send message"
                  className={`p-2 rounded-xl flex items-center justify-center transition-all ${inputValue.trim() && !isLoading
                    ? 'bg-[#6F4E37] hover:bg-[#3B2A22] text-white shadow-sm'
                    : 'bg-[#EFE7DB] text-[#9A8478] cursor-not-allowed'
                    }`}
                >
                  <Send size={15} />
                </button>
              </form>
              <div className="flex items-center justify-between px-1 mt-1 text-[0.65rem] text-[#9A8478]">
                <span>Press Enter to send</span>
                <span>Powered by Gemini & MySQL</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
