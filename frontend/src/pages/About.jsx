import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Heart, Recycle } from 'lucide-react';

export default function About() {
  return (
    <div className="page-shell" style={{ padding: '2rem 1rem 4rem' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="hero-panel grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr]" style={{ gap: '0', borderRadius: '32px' }}>
          <div style={{ padding: '3.5rem 3rem' }}>
            <span style={{ display: 'inline-flex', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--coffee)', marginBottom: '1rem' }}>Our Story</span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--brown-dark)', marginBottom: '1rem' }}>Elevated essentials for a timeless wardrobe.</h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', lineHeight: 1.9, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Founded on the belief that clothing should feel effortless, enduring, and quietly luxurious, TrendVibe blends modern silhouettes with premium textures and thoughtful craftsmanship.</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', lineHeight: 1.9, color: 'var(--text-secondary)' }}>Every piece is selected with longevity in mind—from quality fabrics to polished finishes—so your wardrobe feels refined from day to night.</p>
          </div>
          <div style={{ position: 'relative', overflow: 'hidden', borderTopRightRadius: '32px', borderBottomRightRadius: '32px' }}>
            <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80" alt="Premium fashion workshop" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          </div>
        </motion.section>

        <section style={{ padding: '0 0.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto 2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', color: 'var(--text-primary)', marginBottom: '0.65rem' }}>Crafted With Intention</h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>The values behind our collection are rooted in quality, comfort, and a sense of lasting style.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {[
              { icon: <Sparkles className="h-6 w-6" />, title: 'Premium Styling', text: 'Timeless silhouettes that feel refined, polished, and easy to wear.' },
              { icon: <Shield className="h-6 w-6" />, title: 'High Quality', text: 'Meticulous materials and durable finishes designed to last.' },
              { icon: <Recycle className="h-6 w-6" />, title: 'Sustainably Driven', text: 'Thoughtful sourcing and responsible materials with a lighter footprint.' },
              { icon: <Heart className="h-6 w-6" />, title: 'Client Comfort', text: 'Every detail is considered to make the experience feel effortless.' },
            ].map(({ icon, title, text }, index) => (
              <motion.div key={title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.35, delay: index * 0.06 }} className="soft-card" style={{ padding: '1.4rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: '14px', background: 'rgba(111,78,55,0.08)', color: 'var(--brown-primary)', marginBottom: '0.9rem' }}>{icon}</div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>{title}</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.77rem', lineHeight: 1.75, color: 'var(--text-secondary)' }}>{text}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
