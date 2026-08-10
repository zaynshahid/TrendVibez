import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../context/AuthContext.jsx';
import { 
  HelpCircle, 
  Truck, 
  RotateCcw, 
  Mail, 
  Phone, 
  Clock, 
  MessageSquare, 
  ChevronDown, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';

const faqsList = [
  {
    question: "How long does shipping take?",
    answer: "Standard shipping takes 3-5 business days. Express shipping options (1-2 business days) are available at checkout. All domestic orders over $75 qualify for free standard delivery."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a relaxed 30-day return policy. Items must be unworn, in their original condition, with all tags attached. Returns are processed within 5-7 business days of arrival at our warehouse."
  },
  {
    question: "How can I track my order status?",
    answer: "Once shipped, you will receive a confirmation email with a tracking number. Alternatively, you can log into your account dashboard under 'Order History' to check live shipping status."
  },
  {
    question: "Do you offer international shipping?",
    answer: "Currently, we ship within North America. We are actively expanding shipping services globally and hope to support international deliveries soon."
  },
  {
    question: "Are payment transactions secure?",
    answer: "Yes, absolutely. We use industry-standard encryption protocol integrations. Payment card data is processed securely through a simulated payment gate with zero storage on our local servers."
  }
];

export default function Support() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Shipping');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          category,
          message
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to submit support request');
      }

      setFormSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');

      // Auto dismiss success screen after 4.5 seconds
      setTimeout(() => {
        setFormSubmitted(false);
      }, 4500);

    } catch (err) {
      console.error('Support submit error:', err);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: '4rem' }}>
      
      {/* Hero Header */}
      <section style={{ 
        padding: '4.5rem 2rem 3.5rem', 
        textAlign: 'center', 
        background: 'linear-gradient(180deg, rgba(111,78,55,0.06) 0%, rgba(111,78,55,0) 100%)',
        borderBottom: '1px solid rgba(221,209,195,0.3)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(111,78,55,0.08)', border: '1px solid rgba(111,78,55,0.15)', padding: '0.35rem 0.9rem', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--coffee)', marginBottom: '1.25rem' }}>
            <HelpCircle size={13} /> Support Center
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 800, color: 'var(--brown-dark)', marginBottom: '1rem', lineHeight: 1.15 }}>
            How Can We Assist You?
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto' }}>
            Find answers to frequently asked questions, trace shipment policies, or reach out to our dedicated client care team.
          </p>
        </div>
      </section>

      {/* Support Info Cards Grid */}
      <section style={{ maxWidth: '1200px', width: '100%', margin: '-2rem auto 3rem', padding: '0 2rem', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
          
          {[
            { icon: <Truck size={20} style={{ color: 'var(--brown-primary)' }} />, title: "Shipping & Delivery", desc: "Trace shipping speed guidelines, costs, and packaging handling standards." },
            { icon: <RotateCcw size={20} style={{ color: 'var(--brown-primary)' }} />, title: "30-Day Returns", desc: "Easy refunds and replacements. Free labels on qualifying clothing size updates." },
            { icon: <ShieldCheck size={20} style={{ color: 'var(--brown-primary)' }} />, title: "Secure Checkout", desc: "We utilize multi-layer encryption. Checkout safely with simulated verification." }
          ].map((card, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="soft-card"
              style={{ padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(111,78,55,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {card.icon}
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>{card.title}</h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{card.desc}</p>
            </motion.div>
          ))}

        </div>
      </section>

      {/* Main Support Panel: FAQ & Form Split */}
      <section style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '4rem' }}>
          
          {/* FAQ Accordion Accordion */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Frequently Asked Questions</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>Quick solutions to common questions from our shoppers.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {faqsList.map((faq, index) => {
                const isActive = activeFaq === index;
                return (
                  <div 
                    key={index} 
                    style={{ 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '16px', 
                      background: isActive ? 'rgba(221,209,195,0.15)' : 'var(--bg-card)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease' 
                    }}
                  >
                    <button 
                      onClick={() => toggleFaq(index)}
                      style={{ 
                        width: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '1.25rem 1.5rem', 
                        border: 'none', 
                        background: 'none', 
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {faq.question}
                      </span>
                      <ChevronDown 
                        size={16} 
                        style={{ 
                          color: 'var(--text-muted)', 
                          transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s' 
                        }} 
                      />
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                          <div style={{ padding: '0 1.5rem 1.25rem', fontSize: '0.78rem', lineHeight: 1.7, color: 'var(--text-secondary)', borderTop: '1px solid rgba(221,209,195,0.2)' }}>
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Support Form */}
          <div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-md)', position: 'relative', overflow: 'hidden' }}>
              
              <AnimatePresence>
                {formSubmitted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: 'absolute', inset: 0, background: 'var(--bg-card)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}
                  >
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(90,122,82,0.1)', display: 'flex', alignItems: 'center', justifycontent: 'center', marginBottom: '1.25rem' }}>
                      <CheckCircle2 size={26} style={{ color: 'var(--success)', margin: 'auto' }} />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>Request Received</h3>
                    <p style={{ fontSize: '0.78rem', lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: '280px' }}>
                      We have logged your query. A TrendVibe client specialist will reach out within 12–24 business hours.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Reach Out</h2>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Drop us a message and we'll solve your product or shipment query.</p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Name</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter name"
                    style={{ padding: '0.65rem 0.85rem', fontSize: '0.78rem', borderRadius: '10px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter email"
                    style={{ padding: '0.65rem 0.85rem', fontSize: '0.78rem', borderRadius: '10px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query Topic</label>
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{ padding: '0.65rem 0.85rem', fontSize: '0.78rem', borderRadius: '10px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  >
                    <option value="Shipping">Shipping & Delivery</option>
                    <option value="Returns">Returns & Refunds</option>
                    <option value="Product Details">Product Inquiries</option>
                    <option value="Other">Other Settings</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</label>
                  <textarea 
                    rows={4}
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="How can we help you?"
                    style={{ padding: '0.65rem 0.85rem', fontSize: '0.78rem', borderRadius: '10px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
                  />
                </div>

                {errorMessage && (
                  <p style={{ color: '#b91c1c', fontSize: '0.75rem', fontWeight: 500, margin: 0 }}>
                    {errorMessage}
                  </p>
                )}

                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', fontSize: '0.8rem', width: '100%', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Sending Request...' : 'Send Support Request'} <ArrowRight size={14} />
                </button>
              </form>

            </div>
          </div>

        </div>
      </section>

      {/* Quick Direct Contacts Panel */}
      <section style={{ borderTop: '1px solid rgba(221,209,195,0.3)', marginTop: '4.5rem', paddingTop: '3.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(111,78,55,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Phone size={18} style={{ color: 'var(--brown-primary)' }} />
            </div>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Direct Line</h4>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brown-primary)' }}>+1 (800) 555-8423</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Toll-free client care support line.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(111,78,55,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Mail size={18} style={{ color: 'var(--brown-primary)' }} />
            </div>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Email Inquiries</h4>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brown-primary)' }}>support@trendvibe.com</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Direct inquiry inbox support.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(111,78,55,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Clock size={18} style={{ color: 'var(--brown-primary)' }} />
            </div>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Support Hours</h4>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brown-primary)' }}>Mon – Fri: 9:00 AM – 6:00 PM EST</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Excluding standard public holidays.</p>
          </div>

        </div>
      </section>

    </div>
  );
}
