'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Phone, MessageCircle, ArrowRight, Shield, Award, Gem, Heart, RefreshCw } from 'lucide-react';
import GoldParticles from '@/components/GoldParticles';
import ProductCard from '@/components/ProductCard';
import RateCard from '@/components/RateCard';
import RevealOnScroll from '@/components/RevealOnScroll';
import { sampleProducts } from '@/data/sample-products';

const FALLBACK_RATES = { gold24k: 7250, gold22k: 6645, silver: 92, lastUpdated: new Date().toISOString() };

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [ratesConfig, setRatesConfig] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [products, setProducts] = useState<any[]>(sampleProducts);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch rates, settings, and products on mount
  useEffect(() => {
    fetchRates();
    fetch('/api/settings', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setSettings(data.data);
      })
      .catch(err => console.error('Failed to fetch settings:', err));
      
    fetch('/api/products', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setProducts(data.data);
      })
      .catch(err => console.error('Failed to fetch products:', err));
  }, []);

  const fetchRates = async (force = false) => {
    try {
      if (force) setIsUpdating(true);
      const res = await fetch(`/api/rates${force ? '?force=true' : ''}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setRatesConfig(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch rates:', err);
    } finally {
      if (force) setIsUpdating(false);
    }
  };

  // Simple entrance animation
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const els = hero.querySelectorAll('.hero-animate');
    els.forEach((el, i) => {
      const e = el as HTMLElement;
      e.style.opacity = '0';
      e.style.transform = 'translateY(30px)';
      setTimeout(() => {
        e.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        e.style.opacity = '1';
        e.style.transform = 'translateY(0)';
      }, 300 + i * 200);
    });
  }, []);

  const featuredGold = products.filter(p => p.metalType === 'gold' && p.featured && p.active);
  const featuredSilver = products.filter(p => p.metalType === 'silver' && p.featured && p.active);

  const currentRates = ratesConfig?.currentRates || FALLBACK_RATES;
  const gst = ratesConfig?.gstPercentage || 3;

  return (
    <>
      {/* ═══ Hero Section ═══ */}
      <section className="hero" ref={heroRef}>
        <GoldParticles />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge hero-animate">
            <Gem size={14} />
            <span>Since 1990 &middot; Trusted by Generations</span>
          </div>
          <h1 className="hero-title hero-animate" style={{ whiteSpace: 'pre-line' }}>
            {settings?.heroHeadline || 'Crafted for Generations.\nDesigned to Shine.'}
          </h1>
          <p className="hero-subtitle hero-animate">
            {settings?.tagline || 'Discover exquisite gold and silver ornaments, handcrafted with precision and passion by master artisans.'}
          </p>
          <div className="hero-ctas hero-animate">
            <Link href="/collections/gold" className="btn btn-gold btn-lg">
              Explore Gold Collection
              <ArrowRight size={18} />
            </Link>
            <Link href="/collections/silver" className="btn btn-outline-silver btn-lg">
              Explore Silver Collection
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="hero-scroll-indicator hero-animate">
          <div className="scroll-mouse">
            <div className="scroll-wheel" />
          </div>
          <span>Scroll to Explore</span>
        </div>
      </section>

      {/* ═══ Live Rates Section ═══ */}
      {settings?.showLiveRates !== false && (
        <section className="section section-dark">
          <div className="container">
            <RevealOnScroll>
              <div className="section-header" style={{ position: 'relative' }}>
                <h2>Live <span className="text-gold-gradient">Market Rates</span></h2>
                <p>Today&apos;s precious metal rates per gram</p>
                
                <button 
                  onClick={() => fetchRates(true)} 
                  disabled={isUpdating}
                  className="btn btn-outline"
                  style={{ 
                    position: 'absolute', 
                    right: 0, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    padding: '8px 16px',
                    fontSize: '0.9rem'
                  }}
                >
                  <RefreshCw size={16} className={isUpdating ? 'spin' : ''} />
                  {isUpdating ? 'Updating...' : 'Update Rate'}
                </button>

                <div className="section-accent-line" />
              </div>
            </RevealOnScroll>
            <div className="rates-grid">
              <RevealOnScroll delay={100}>
                <RateCard label="Gold" purity="24K" rate={currentRates.gold24k} metalType="gold" />
              </RevealOnScroll>
              <RevealOnScroll delay={200}>
                <RateCard label="Gold" purity="22K" rate={currentRates.gold22k} metalType="gold" />
              </RevealOnScroll>
              <RevealOnScroll delay={300}>
                <RateCard label="Silver" purity="999" rate={currentRates.silver} metalType="silver" />
              </RevealOnScroll>
            </div>
            <RevealOnScroll>
              <p className="rates-updated">Last updated: {new Date(currentRates.lastUpdated || Date.now()).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* ═══ Featured Gold Collection ═══ */}
      <section className="section">
        <div className="container">
          <RevealOnScroll>
            <div className="section-header">
              <h2><span className="text-gold-gradient">Gold</span> Collection</h2>
              <p>Handcrafted masterpieces in pure gold</p>
              <div className="section-accent-line" />
            </div>
          </RevealOnScroll>
          {featuredGold.length > 0 ? (
            <>
              <div className="products-grid">
                {featuredGold.slice(0, 4).map((product, i) => (
                  <RevealOnScroll key={product.id} delay={i * 100}>
                    <ProductCard product={product} />
                  </RevealOnScroll>
                ))}
              </div>
              <div className="section-footer" style={{ marginTop: '40px', textAlign: 'center' }}>
                <Link href="/collections/gold" className="btn btn-outline">
                  View All Gold Collection
                  <ArrowRight size={16} />
                </Link>
              </div>
            </>
          ) : (
            <p className="empty-state">New gold collections arriving soon.</p>
          )}
        </div>
      </section>

      {/* ═══ Featured Silver Collection ═══ */}
      <section className="section section-darker">
        <div className="container">
          <RevealOnScroll>
            <div className="section-header">
              <h2><span className="text-silver-gradient">Silver</span> Collection</h2>
              <p>Elegant and timeless silver pieces</p>
              <div className="section-accent-line" style={{ background: 'linear-gradient(90deg, transparent, var(--silver-primary), transparent)' }} />
            </div>
          </RevealOnScroll>
          {featuredSilver.length > 0 ? (
            <>
              <div className="products-grid">
                {featuredSilver.slice(0, 4).map((product, i) => (
                  <RevealOnScroll key={product.id} delay={i * 100}>
                    <ProductCard product={product} />
                  </RevealOnScroll>
                ))}
              </div>
              <div className="section-footer" style={{ marginTop: '40px', textAlign: 'center' }}>
                <Link href="/collections/silver" className="btn btn-outline-silver">
                  View All Silver Collection
                  <ArrowRight size={16} />
                </Link>
              </div>
            </>
          ) : (
            <p className="empty-state">New silver collections arriving soon.</p>
          )}
        </div>
      </section>

      {/* ═══ About Preview ═══ */}
      <section className="section about-preview">
        <div className="container">
          <div className="about-preview-grid">
            <RevealOnScroll animation="fadeLeft">
              <div className="about-preview-content">
                <h2>A Legacy of <span className="text-gold-gradient">Trust</span></h2>
                <p>
                  For over three decades, GVR Gold &amp; Silver has been the most trusted name
                  in fine jewelry. Our master artisans craft each piece with unparalleled
                  precision, blending timeless tradition with contemporary elegance.
                </p>
                <div className="about-values">
                  <div className="about-value">
                    <Shield size={24} className="about-value-icon" />
                    <div>
                      <h4>Certified Purity</h4>
                      <p>Every piece hallmarked and certified</p>
                    </div>
                  </div>
                  <div className="about-value">
                    <Award size={24} className="about-value-icon" />
                    <div>
                      <h4>Master Craftsmanship</h4>
                      <p>Handcrafted by skilled artisans</p>
                    </div>
                  </div>
                  <div className="about-value">
                    <Heart size={24} className="about-value-icon" />
                    <div>
                      <h4>Customer First</h4>
                      <p>Personalized service &amp; lifetime support</p>
                    </div>
                  </div>
                </div>
                <Link href="/about" className="btn btn-outline" style={{ marginTop: '20px' }}>
                  Our Story
                  <ArrowRight size={16} />
                </Link>
              </div>
            </RevealOnScroll>
            <RevealOnScroll animation="fadeRight">
              <div className="about-preview-visual">
                <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <img 
                    src="/images/craftsmanship.png" 
                    alt="Master jeweler crafting" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div className="about-visual-card">
                    <div className="about-visual-stat">
                      <span className="about-stat-number text-gold-gradient">30+</span>
                      <span className="about-stat-label">Years of Excellence</span>
                    </div>
                    <div className="about-visual-stat">
                      <span className="about-stat-number text-gold-gradient">50K+</span>
                      <span className="about-stat-label">Happy Customers</span>
                    </div>
                    <div className="about-visual-stat">
                      <span className="about-stat-number text-gold-gradient">10K+</span>
                      <span className="about-stat-label">Unique Designs</span>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section className="section cta-section">
        <div className="container">
          <RevealOnScroll animation="scaleIn">
            <div className="cta-card glass-gold">
              <h2>Visit Our <span className="text-gold-gradient">Showroom</span></h2>
              <p>Experience the brilliance of our collections in person. Our experts are ready to help you find the perfect piece.</p>
              <div className="cta-actions">
                <a href="tel:+919876543210" className="btn btn-gold btn-lg">
                  <Phone size={18} />
                  Call Us Now
                </a>
                <a
                  href="https://wa.me/919876543210?text=Hello%2C%20I%20would%20like%20to%20know%20more%20about%20your%20jewelry%20collections."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-lg"
                >
                  <MessageCircle size={18} />
                  WhatsApp Us
                </a>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}
