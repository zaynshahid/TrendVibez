import React from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { ArrowRight, Sparkles } from 'lucide-react';

// Swiper core & module styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const slides = [
  {
    id: 1,
    tagline: 'AUTUMN EDIT 2026',
    title: 'Warm Cashmeres & Tailored Silhouette',
    subtitle: 'Wrap yourself in soft luxury textures and timeless outerwear designed for crisp days.',
    image: '/images/slider/slide1.jpg',
    badge: 'Trending Now',
    link: '/products?category=Women'
  },
  {
    id: 2,
    tagline: 'MENSWEAR HIGHLIGHT',
    title: 'Sophisticated Modern Tailoring',
    subtitle: 'Effortless confidence meets sharp cuts, earthy mocha tones, and premium fabrics.',
    image: '/images/slider/slide2.jpg',
    badge: 'New Season',
    link: '/products?category=Men'
  },
  {
    id: 3,
    tagline: 'ARTISAN CRAFT',
    title: 'Statement Leather & Accessories',
    subtitle: 'Elevate your daily ensemble with rich leather bags and signature gold accents.',
    image: '/images/slider/slide3.jpg',
    badge: 'Best Seller',
    link: '/products?category=Accessories'
  },
  {
    id: 4,
    tagline: 'MINIMALIST LINE',
    title: 'Pure Textures & Neutral Harmony',
    subtitle: 'Understated elegance crafted with sustainable fabrics and quiet luxury detailing.',
    image: '/images/slider/slide4.jpg',
    badge: 'Editor Pick',
    link: '/products'
  }
];

export default function ModelSlider() {
  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '28px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
      <style>{`
        .trendvibez-swiper .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.45);
          opacity: 0.7;
          width: 10px;
          height: 10px;
          transition: all 0.3s ease;
        }
        .trendvibez-swiper .swiper-pagination-bullet-active {
          background: #DDD1C3 !important;
          opacity: 1;
          width: 32px;
          border-radius: 6px;
        }
        .trendvibez-swiper .swiper-button-next,
        .trendvibez-swiper .swiper-button-prev {
          color: #F7F2EB;
          background: rgba(44, 24, 16, 0.45);
          backdrop-filter: blur(8px);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid rgba(221, 209, 195, 0.3);
          transition: all 0.3s ease;
        }
        .trendvibez-swiper .swiper-button-next:hover,
        .trendvibez-swiper .swiper-button-prev:hover {
          background: rgba(111, 78, 55, 0.85);
          transform: scale(1.08);
        }
        .trendvibez-swiper .swiper-button-next::after,
        .trendvibez-swiper .swiper-button-prev::after {
          font-size: 1.1rem;
          font-weight: bold;
        }
        @media (max-width: 640px) {
          .trendvibez-swiper .swiper-button-next,
          .trendvibez-swiper .swiper-button-prev {
            display: none;
          }
        }
      `}</style>

      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        speed={1000}
        autoplay={{
          delay: 4500,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        loop={true}
        className="trendvibez-swiper"
        style={{ width: '100%', height: '540px' }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img
                src={slide.image}
                alt={slide.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 20%',
                }}
              />
              
              {/* Soft vignette & gradient mask for readability */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, rgba(28, 16, 11, 0.82) 0%, rgba(28, 16, 11, 0.45) 55%, rgba(28, 16, 11, 0.15) 100%)',
                }}
              />

              {/* Slide Content Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '3rem 4rem',
                  color: '#F7F2EB',
                  zIndex: 2,
                }}
              >
                <div style={{ maxWidth: '580px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'rgba(111, 78, 55, 0.4)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(221, 209, 195, 0.35)',
                      padding: '0.35rem 0.9rem',
                      borderRadius: '50px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: '#EDE4D8',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <Sparkles size={13} style={{ color: '#DDD1C3' }} /> {slide.tagline}
                  </div>

                  <h2
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                      fontWeight: 800,
                      lineHeight: 1.15,
                      color: '#F7F2EB',
                      marginBottom: '1rem',
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    }}
                  >
                    {slide.title}
                  </h2>

                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'clamp(0.88rem, 1.5vw, 1.05rem)',
                      lineHeight: 1.75,
                      color: '#EDE4D8',
                      marginBottom: '2rem',
                      opacity: 0.92,
                    }}
                  >
                    {slide.subtitle}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link
                      to={slide.link}
                      className="btn-primary"
                      style={{
                        padding: '0.85rem 1.8rem',
                        fontSize: '0.85rem',
                        letterSpacing: '0.05em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      Shop Featured Look <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
