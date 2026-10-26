import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { API_URL } from '../context/AuthContext.jsx';
import FacebookIcon from './FacebookIcon.jsx';

export default function FacebookPublishModal({ 
  isOpen, 
  onClose, 
  product = null, 
  token,
  onSuccess 
}) {
  const [imageUrl, setImageUrl] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [fbPage, setFbPage] = useState(null);

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Auto-fill from product
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setImageUrl(product.image || '');
        const priceText = product.discountPercent > 0
          ? `$${(product.discountedPrice || (product.price * (1 - product.discountPercent / 100))).toFixed(2)} (${product.discountPercent}% OFF)`
          : `$${Number(product.price).toFixed(2)}`;

        const frontendUrl = (import.meta.env.VITE_FRONTEND_URL || window.location.origin).replace(/\/+$/, '');
        const productUrl = `${frontendUrl}/product/${product.id}?source=facebook`;

        setMessage(
          `✨ ${product.name} ✨\n\n` +
          `${product.description || 'Elevate your style with our latest collection.'}\n\n` +
          `🏷️ Price: ${priceText}\n` +
          `📦 Category: ${product.category || 'Apparel'}\n` +
          `🛒 Shop Now: ${productUrl}\n` +
          `🔥 Available now at TrendVibe!\n\n` +
          `#TrendVibe #NewArrival #${(product.category || 'Fashion').replace(/\s+/g, '')} #Streetwear #OOTD #ShopNow`
        );
      } else {
        setImageUrl('');
        setMessage('✨ Check out our newest arrival at TrendVibe! Shop now via link in bio.\n\n#TrendVibe #Fashion #Style #OOTD');
      }
      setErrorMsg('');
      setPublishResult(null);
    }
  }, [product, isOpen]);

  // Fetch Facebook Page status
  useEffect(() => {
    if (isOpen && token) {
      fetch(`${API_URL}/admin/facebook/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.page) setFbPage(data.page);
      })
      .catch(err => console.warn('Could not load Facebook page status:', err));
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

    try {
      const res = await fetch(`${API_URL}/admin/publish-to-facebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageUrl: imageUrl.trim(),
          message: message.trim(),
          productId: product?.id || null,
          productName: product?.name || 'Custom Post'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to publish to Facebook.');

      setPublishResult(data);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during Facebook publishing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addHashtag = (tag) => {
    if (!message.includes(tag)) {
      setMessage(prev => prev.trim() + ' ' + tag);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Facebook Header Bar */}
        <div
          className="p-5 text-white flex items-center justify-between shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1877F2 0%, #0d5dbf 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
              <FacebookIcon size={24} color="#ffffff" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>Publish to Facebook</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Page Post
                </span>
              </h3>
              <p className="text-xs text-white/90 font-medium">
                {fbPage
                  ? `${fbPage.name} (${fbPage.fan_count?.toLocaleString() || '—'} followers)`
                  : 'Meta Facebook Graph API (v21.0)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-80px)] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Publishing Failed:</span>
                <p className="font-normal leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {publishResult && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-1 flex-1">
                <span className="font-bold text-sm block">Live on Facebook! 🎉</span>
                <p className="font-normal text-slate-700 dark:text-slate-300">Your product was successfully published to your Facebook Page.</p>
                <div className="pt-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  Post ID: <span className="font-bold text-slate-900 dark:text-white">{publishResult.postId}</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handlePublish} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Image Preview */}
              <div className="md:col-span-5 flex flex-col">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Image Preview
                </label>
                <div className="w-full aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden relative shadow-inner">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Facebook Preview"
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
                </div>
                {product && (
                  <div className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium space-y-1">
                    <div className="truncate">Product: <strong className="text-slate-800 dark:text-slate-200">{product.name}</strong></div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono truncate bg-blue-50 dark:bg-blue-950/40 py-1 px-2 rounded-lg border border-blue-200/50 dark:border-blue-800/50 flex items-center justify-center gap-1">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span>{(import.meta.env.VITE_FRONTEND_URL || window.location.origin).replace(/\/+$/, '')}/product/{product.id}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Controls */}
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
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                    required
                    disabled={isSubmitting}
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                    Must be directly accessible over HTTPS (JPEG or PNG).
                  </span>
                </div>

                {/* Post Message */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                      Post Message & Hashtags
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">{message.length} chars</span>
                  </div>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a captivating message for your Facebook post..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-2 px-3 text-xs font-normal focus:outline-none focus:border-blue-500 resize-none transition-colors"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Quick Hashtags */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Hashtags:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['#TrendVibe', '#Fashion', '#Streetwear', '#OOTD', '#NewArrival', '#StyleInspo', '#Sale'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addHashtag(tag)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
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
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-black shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: isSubmitting || !imageUrl ? '#94a3b8' : 'linear-gradient(135deg, #1877F2 0%, #0d5dbf 100%)', boxShadow: '0 4px 14px rgba(24, 119, 242, 0.35)' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Publishing to Facebook...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Publish to Facebook</span>
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
