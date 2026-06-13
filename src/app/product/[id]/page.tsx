'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Truck, Clock } from 'lucide-react';
import ImageGallery from '@/components/ImageGallery';
import ContactActions from '@/components/ContactActions';
import ProductCard from '@/components/ProductCard';
import RevealOnScroll from '@/components/RevealOnScroll';
import { sampleProducts } from '@/data/sample-products';

const DEFAULT_RATES = { gold: 6645, silver: 92 };

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [product, setProduct] = useState<any>(sampleProducts.find(p => p.id === id) || null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [ratesConfig, setRatesConfig] = useState<any>(null);

  useEffect(() => {
    // Fetch this specific product
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setProduct(data.data);
          
          // Also fetch all products to get related ones
          fetch('/api/products')
            .then(r => r.json())
            .then(allData => {
              if (allData.success) {
                const related = allData.data
                  .filter((p: any) => p.metalType === data.data.metalType && p.category === data.data.category && p.id !== data.data.id && p.active)
                  .slice(0, 4);
                setRelatedProducts(related);
              }
            });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch product:', err);
        setLoading(false);
      });

    // Fetch live rates
    fetch('/api/rates')
      .then(r => r.json())
      .then(d => {
        if (d.success) setRatesConfig(d.data);
      });
  }, [id]);
  
  if (loading && !product) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="admin-spinner admin-spinner-lg" /></div>;
  }

  if (!product) {
    notFound();
  }

  const isGold = product.metalType === 'gold';
  
  const getCardRate = (type: 'gold' | 'silver') => {
    if (ratesConfig?.currentRates) return type === 'gold' ? ratesConfig.currentRates.gold22k : ratesConfig.currentRates.silver;
    return DEFAULT_RATES[type];
  };


  return (
    <div className="product-detail-page">
      <div className="container">
        <RevealOnScroll animation="fadeUp">
          <Link href={`/collections/${product.metalType}`} className="product-detail-back">
            <ArrowLeft size={16} />
            Back to {isGold ? 'Gold' : 'Silver'} Collection
          </Link>
        </RevealOnScroll>

        <div className="product-detail-grid">
          <RevealOnScroll animation="fadeRight">
            <ImageGallery 
              images={product.images.length > 0 ? product.images : ['/placeholder']} 
              productName={product.name}
              metalType={product.metalType}
            />
          </RevealOnScroll>

          <div className="product-detail-info">
            <RevealOnScroll animation="fadeLeft" delay={100}>
              <div className="product-detail-id">ID: {product.id}</div>
              <h1 className="product-detail-name">{product.name}</h1>
              
              <div className="product-detail-meta">
                <div className="product-detail-meta-item">
                  <span className={isGold ? 'text-gold-gradient' : 'text-silver-gradient'} style={{ fontWeight: 600 }}>
                    {product.metalType === 'gold' ? 'Gold' : 'Silver'}
                  </span>
                </div>
                <div className="product-detail-meta-item">
                  <span>Purity:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.purity}</span>
                </div>
                <div className="product-detail-meta-item">
                  <span>Weight:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.weight}g</span>
                </div>
                <div className="product-detail-meta-item">
                  <span>Category:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {product.category.replace('-', ' ')}
                  </span>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll animation="fadeLeft" delay={200}>
              <p className="product-detail-description">{product.description}</p>
            </RevealOnScroll>

            <RevealOnScroll animation="fadeLeft" delay={300}>
              <div className="product-detail-contact">
                <h4 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-primary)' }}>Interested in this piece?</h4>
                <p className="product-detail-contact-text">
                  Contact us to check availability or request custom modifications.
                </p>
                <ContactActions productId={product.id} productName={product.name} />
              </div>
            </RevealOnScroll>

            <RevealOnScroll animation="fadeUp" delay={500}>
              <div className="about-values" style={{ marginTop: '40px', gap: '16px' }}>
                <div className="about-value">
                  <ShieldCheck size={20} className="about-value-icon" />
                  <div>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '2px' }}>100% Certified</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hallmarked purity guarantee</p>
                  </div>
                </div>
                <div className="about-value">
                  <Clock size={20} className="about-value-icon" />
                  <div>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '2px' }}>Lifetime Exchange</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Best value exchange policy</p>
                  </div>
                </div>
                <div className="about-value">
                  <Truck size={20} className="about-value-icon" />
                  <div>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '2px' }}>Insured Shipping</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Available across India</p>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="related-section">
            <RevealOnScroll>
              <div className="section-header" style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '2rem' }}>Similar <span className={isGold ? 'text-gold-gradient' : 'text-silver-gradient'}>Pieces</span></h2>
              </div>
            </RevealOnScroll>
            <div className="products-grid">
              {relatedProducts.map((p, i) => (
                <RevealOnScroll key={p.id} delay={i * 100}>
                  <ProductCard product={p} />
                </RevealOnScroll>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
