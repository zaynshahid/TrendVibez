import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Image as ImageIcon, 
  ExternalLink,
  Instagram,
  RefreshCw,
  Copy
} from 'lucide-react';
import { API_URL } from '../context/AuthContext.jsx';
import InstagramIcon from './InstagramIcon.jsx';


export default function InstagramPublishModal({ 
  isOpen, 
  onClose, 
  product = null, 
  token,
  onSuccess 
}) {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusStep, setStatusStep] = useState(''); // 'container' | 'publishing' | 'done'
  const [publishResult, setPublishResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [igAccount, setIgAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-fill form when product changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setImageUrl(product.image || '');
        const priceText = product.discountPercent > 0 
          ? `$${(product.discountedPrice || (product.price * (1 - product.discountPercent / 100))).toFixed(2)} (${product.discountPercent}% OFF)` 
          : `$${Number(product.price).toFixed(2)}`;

        const frontendUrl = (import.meta.env.VITE_FRONTEND_URL || window.location.origin).replace(/\/+$/, '');
        const productUrl = `${frontendUrl}/product/${product.id}?source=instagram`;

        const autoCaption = `✨ ${product.name} ✨\n\n` +
          `${product.description || 'Elevate your style with our latest collection.'}\n\n` +
          `🏷️ Price: ${priceText}\n` +
          `📦 Category: ${product.category || 'Apparel'}\n` +
          `🔗 Product Link: ${productUrl}\n` +
          `🔥 Available now at TrendVibe! (Tap link in bio to shop or copy link above)\n\n` +
          `#TrendVibe #NewArrival #${(product.category || 'Fashion').replace(/\s+/g, '')} #Streetwear #OOTD #ShopNow`;

        setCaption(autoCaption);
      } else {
        setImageUrl('');
        setCaption('✨ Check out our newest arrival at TrendVibe! Link in bio to shop.\n\n#TrendVibe #Fashion #Style #OOTD');
      }
      setErrorMsg('');
      setPublishResult(null);
      setStatusStep('');
    }
  }, [product, isOpen]);

  // Fetch connected Instagram account status
  useEffect(() => {
    if (isOpen && token) {
      setLoadingAccount(true);
      fetch(`${API_URL}/admin/instagram/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.account) {
          setIgAccount(data.account);
        }
      })
      .catch(err => console.warn('Could not load IG account status:', err))
      .finally(() => setLoadingAccount(false));
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setErrorMsg('Please enter a valid public image URL.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setPublishResult(null);
    setStatusStep('container');

    try {
      const res = await fetch(`${API_URL}/admin/publish-to-instagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageUrl: imageUrl.trim(),
          caption: caption.trim(),
          productId: product?.id || null,
          productName: product?.name || 'Custom Post'
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to publish to Instagram.');
      }

      setStatusStep('done');
      setPublishResult(data);
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during Instagram publishing.');
      setStatusStep('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addHashtag = (tag) => {
    if (!caption.includes(tag)) {
      setCaption(prev => prev.trim() + ' ' + tag);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Instagram Header Bar */}
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 p-5 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
              <InstagramIcon size={24} color="#ffffff" />
            </div>
            <div>

              <h3 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>Publish to Instagram</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Live Feed
                </span>
              </h3>
              <p className="text-xs text-white/90 font-medium">
                {igAccount 
                  ? `@${igAccount.username} (${igAccount.account_type || 'Business'})`
                  : 'Meta Instagram Graph API (v21.0)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-80px)] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-slide-up">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="space-y-1">
                <span className="font-bold block">Publishing Failed:</span>
                <p className="text-rose-600 dark:text-rose-300 font-normal leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {publishResult && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs animate-slide-up">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="space-y-1 flex-1">
                <span className="font-bold text-sm block">Live on Instagram! 🎉</span>
                <p className="font-normal text-slate-700 dark:text-slate-300">
                  Your product was successfully submitted and published to your Instagram feed.
                </p>
                <div className="pt-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  Post ID: <span className="font-bold text-slate-900 dark:text-white">{publishResult.postId}</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handlePublish} className="space-y-5">
            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Left Column: Image Feed Preview */}
              <div className="md:col-span-5 flex flex-col">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Feed Preview (1:1 / 4:5)
                </label>
                <div className="w-full aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden relative shadow-inner group">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Instagram Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800';
                      }}
                    />
                  ) : (
                    <div className="p-4 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                      <ImageIcon className="h-8 w-8 stroke-1" />
                      <span className="text-xs font-medium">No image URL specified</span>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-md text-[10px] text-white px-2 py-1 rounded-lg text-center font-bold">
                    Aspect Ratio: 1:1 or 4:5
                  </div>
                </div>
                {product && (
                  <div className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium space-y-1">
                    <div className="truncate">Product: <strong className="text-slate-800 dark:text-slate-200">{product.name}</strong></div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono truncate bg-indigo-50 dark:bg-indigo-950/40 py-1 px-2 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center gap-1">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span>{(import.meta.env.VITE_FRONTEND_URL || window.location.origin).replace(/\/+$/, '')}/product/{product.id}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Form Controls */}
              <div className="md:col-span-7 space-y-4">
                {/* Image URL Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Public Image URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or Cloudinary URL"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 transition-colors"
                    required
                    disabled={isSubmitting}
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                    Must be directly accessible over HTTPS (JPEG or PNG).
                  </span>
                </div>

                {/* Caption Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                      Post Caption & Hashtags
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {caption.length} chars
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write an engaging caption..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-2 px-3 text-xs font-normal focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 resize-none transition-colors"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Quick Hashtag Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Quick Hashtags:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['#TrendVibe', '#Fashion', '#Streetwear', '#OOTD', '#NewArrival', '#StyleInspo', '#Sale'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addHashtag(tag)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !imageUrl}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:via-rose-600 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-rose-500/25 hover:shadow-rose-500/35 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {statusStep === 'container' ? 'Creating IG Container...' : 'Publishing to Feed...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Publish Post Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
