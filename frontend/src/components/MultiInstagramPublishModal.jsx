import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  Trash2, 
  Sparkles, 
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  ExternalLink
} from 'lucide-react';
import { API_URL } from '../context/AuthContext.jsx';
import InstagramIcon from './InstagramIcon.jsx';

/**
 * Generate default combined Instagram Carousel caption for multiple products with direct URLs
 */
function buildCombinedCarouselCaption(products) {
  if (!products || products.length === 0) return '';
  const frontendUrl = (import.meta.env.VITE_FRONTEND_URL || window.location.origin).replace(/\/+$/, '');
  
  let caption = `✨ TrendVibe Curated Collection ✨\n\n` +
    `Swipe left ➡️ to explore our latest collection:\n\n`;

  products.forEach((p, index) => {
    const priceText = p.discountPercent > 0 
      ? `$${(p.discountedPrice || (p.price * (1 - p.discountPercent / 100))).toFixed(2)} (${p.discountPercent}% OFF)` 
      : `$${Number(p.price).toFixed(2)}`;
    const productUrl = `${frontendUrl}/product/${p.id}?source=instagram`;
    caption += `${index + 1}️⃣ ${p.name} - ${priceText}\n   🔗 ${productUrl}\n`;
  });

  caption += `\n📦 Premium quality & fast delivery!\n` +
    `🔥 Available now at TrendVibe. Tap link in bio to shop or copy the product links above!\n\n` +
    `#TrendVibe #FashionCollection #NewArrivals #Streetwear #OOTD #ShopNow #CarouselPost`;

  return caption;
}

export default function MultiInstagramPublishModal({ 
  isOpen, 
  onClose, 
  selectedProducts = [], 
  token,
  onSuccess 
}) {
  const [items, setItems] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [igAccount, setIgAccount] = useState(null);

  // Lock background scroll when open
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

  // Initialize queue & master caption
  useEffect(() => {
    if (isOpen && selectedProducts && selectedProducts.length > 0) {
      const formatted = selectedProducts.map(p => ({
        id: p.id,
        product: p,
        name: p.name,
        price: p.price,
        imageUrl: p.image || '',
      }));
      setItems(formatted);
      setActiveSlide(0);
      setCaption(buildCombinedCarouselCaption(selectedProducts));
      setErrorMsg('');
      setPublishResult(null);
    } else if (isOpen) {
      setItems([]);
      setActiveSlide(0);
      setCaption('');
      setErrorMsg('');
      setPublishResult(null);
    }
  }, [isOpen, selectedProducts]);

  // Fetch Instagram account status
  useEffect(() => {
    if (isOpen && token) {
      fetch(`${API_URL}/admin/instagram/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.account) {
          setIgAccount(data.account);
        }
      })
      .catch(err => console.warn('Could not load IG account status:', err));
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleImageUrlChange = (id, val) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, imageUrl: val } : it));
  };

  const removeItem = (id) => {
    if (isSubmitting) return;
    const remaining = items.filter(it => it.id !== id);
    setItems(remaining);
    if (activeSlide >= remaining.length) {
      setActiveSlide(Math.max(0, remaining.length - 1));
    }
    setCaption(buildCombinedCarouselCaption(remaining.map(r => r.product)));
  };

  const addHashtag = (tag) => {
    if (!caption.includes(tag)) {
      setCaption(prev => prev.trim() + ' ' + tag);
    }
  };

  const resetCaption = () => {
    if (isSubmitting) return;
    setCaption(buildCombinedCarouselCaption(items.map(r => r.product)));
  };

  const handlePublishCarousel = async (e) => {
    e.preventDefault();

    if (items.length < 2) {
      setErrorMsg('Instagram Carousel posts require at least 2 product images.');
      return;
    }
    if (items.length > 10) {
      setErrorMsg('Instagram Carousel posts support a maximum of 10 product images.');
      return;
    }

    const invalidImage = items.find(it => !it.imageUrl || !it.imageUrl.trim());
    if (invalidImage) {
      setErrorMsg(`Product "${invalidImage.name}" has an invalid image URL.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setPublishResult(null);

    try {
      const res = await fetch(`${API_URL}/admin/publish-carousel-to-instagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageUrls: items.map(it => it.imageUrl.trim()),
          caption: caption.trim(),
          productIds: items.map(it => it.id),
          productNames: items.map(it => it.name),
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to publish Instagram Carousel post.');
      }

      setPublishResult(data);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during Instagram Carousel publication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentItem = items[activeSlide] || items[0];

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div 
          className="p-5 text-white flex items-center justify-between shadow-sm shrink-0"
          style={{
            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
              <InstagramIcon size={24} color="#ffffff" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>Publish Instagram Carousel Post</span>
                <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Single Multi-Photo Post
                </span>
              </h3>
              <p className="text-xs text-white/90 font-medium">
                {igAccount ? `@${igAccount.username} (${igAccount.name || 'Connected'})` : 'Meta Instagram Graph API (v21.0)'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-bold bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
              {items.length} Images in 1 Post
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Carousel Publishing Failed:</span>
                <p className="font-normal leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {publishResult && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-1 flex-1">
                <span className="font-bold text-sm block">Live on Instagram Carousel! 🎉</span>
                <p className="font-normal text-slate-700 dark:text-slate-300">{publishResult.message || 'Your products were published as a single carousel post.'}</p>
                <div className="pt-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  Live Post ID: <span className="font-bold text-slate-900 dark:text-white">{publishResult.postId}</span>
                </div>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-3">
              <Layers className="h-12 w-12 mx-auto stroke-1 text-slate-400" />
              <p className="font-semibold text-sm">No products selected for Carousel posting.</p>
              <p className="text-xs text-slate-400">Please select at least 2 products using checkboxes in the product table.</p>
            </div>
          ) : (
            <form onSubmit={handlePublishCarousel} className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Carousel Interactive Slider Preview */}
                <div className="lg:col-span-5 flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>Carousel Slide Preview</span>
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
                        Slide {activeSlide + 1} of {items.length}
                      </span>
                    </label>
                    {items.length < 2 && (
                      <span className="text-[10px] text-rose-500 font-bold">Min 2 required</span>
                    )}
                  </div>

                  {/* Main Slide Card */}
                  <div className="w-full aspect-square rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center overflow-hidden relative shadow-inner group">
                    {currentItem?.imageUrl ? (
                      <img 
                        src={currentItem.imageUrl} 
                        alt={currentItem.name} 
                        className="w-full h-full object-cover transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800';
                        }}
                      />
                    ) : (
                      <div className="p-4 text-center text-slate-400 flex flex-col items-center gap-2">
                        <ImageIcon className="h-8 w-8 stroke-1" />
                        <span className="text-xs font-medium">No image URL specified</span>
                      </div>
                    )}

                    {/* Slide Navigation Arrows */}
                    {items.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveSlide((prev) => (prev > 0 ? prev - 1 : items.length - 1))}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-md cursor-pointer"
                          title="Previous slide"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSlide((prev) => (prev < items.length - 1 ? prev + 1 : 0))}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-md cursor-pointer"
                          title="Next slide"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {/* Product Name Overlay */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
                      <p className="font-bold text-xs truncate">{activeSlide + 1}. {currentItem?.name}</p>
                      <p className="text-[10px] text-white/80">${Number(currentItem?.price || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  {currentItem && (
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono truncate bg-indigo-50 dark:bg-indigo-950/40 py-1 px-2 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center gap-1">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span>{(import.meta.env.VITE_FRONTEND_URL || window.location.origin).replace(/\/+$/, '')}/product/{currentItem.id}</span>
                    </div>
                  )}

                  {/* Thumbnail Strip */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Carousel Slides ({items.length}/10):</span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {items.map((it, idx) => (
                        <div 
                          key={it.id} 
                          className="relative shrink-0 group"
                        >
                          <button
                            type="button"
                            onClick={() => setActiveSlide(idx)}
                            className={`h-14 w-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                              activeSlide === idx 
                                ? 'border-rose-500 shadow-md ring-2 ring-rose-500/20 scale-105' 
                                : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img 
                              src={it.imageUrl} 
                              alt={it.name} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800';
                              }}
                            />
                          </button>
                          {!isSubmitting && items.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeItem(it.id)}
                              className="absolute -top-1 -right-1 p-0.5 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow cursor-pointer"
                              title="Remove slide"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                          <span className="absolute bottom-0.5 left-1 text-[8px] font-black text-white bg-black/60 px-1 rounded">
                            {idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Slide URL Editor */}
                  {currentItem && (
                    <div className="space-y-1 pt-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Slide #{activeSlide + 1} Image URL:
                      </label>
                      <input 
                        type="url"
                        value={currentItem.imageUrl}
                        onChange={(e) => handleImageUrlChange(currentItem.id, e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-1.5 px-2.5 text-[11px] font-semibold focus:outline-none focus:border-rose-500 transition-colors"
                        disabled={isSubmitting}
                      />
                    </div>
                  )}
                </div>

                {/* Right Column: Combined Master Caption Editor */}
                <div className="lg:col-span-7 flex flex-col space-y-4 bg-slate-50/60 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-rose-500" />
                      <span>Single Carousel Caption</span>
                    </span>
                    <button
                      type="button"
                      onClick={resetCaption}
                      disabled={isSubmitting}
                      className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Regenerate Caption
                    </button>
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                        Combined Caption & Details
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">{caption.length} chars</span>
                    </div>
                    <textarea 
                      rows={11}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write your Instagram carousel caption..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3 text-xs font-normal focus:outline-none focus:border-rose-500 resize-none transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Quick Hashtags */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add Hashtags:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['#TrendVibe', '#Fashion', '#Style', '#OOTD', '#NewArrivals', '#Streetwear', '#Carousel', '#Sale'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addHashtag(tag)}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info Notice */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px]">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>All {items.length} products will be published inside a <strong>single swipable Carousel post</strong> on your Instagram feed.</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
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
                  disabled={isSubmitting || items.length < 2 || items.length > 10}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-black shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: isSubmitting || items.length < 2 || items.length > 10 ? '#94a3b8' : 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    boxShadow: '0 4px 14px rgba(220, 39, 67, 0.35)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Instagram Carousel ({items.length} images)...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Publish Carousel ({items.length} items in 1 Post)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
