'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Edit, Trash2, X, UploadCloud, ImageIcon, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import CategoryFilter from '@/components/CategoryFilter';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [metalFilter, setMetalFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Categories State
  const [allCategories, setAllCategories] = useState<{value: string, label: string, metalType: string}[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '',
    metalType: 'gold',
    purity: '22K',
    weight: 0,
    description: '',
    images: [],
    featured: false,
    active: true,
  });
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Re-map format if needed, but data is already {value, label} from new API, 
          // though we might need metalType to filter dynamically. 
          // Wait, the API returns active categories. For admin, we want all categories we've seen. 
          // But that's fine.
          setAllCategories(data.data);
        }
      });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, debouncedSearch, metalFilter, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (metalFilter !== 'all') params.append('metalType', metalFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const dynamicFilterCategories = allCategories;
  const filteredProducts = products; // already filtered by server

  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({
      name: '',
      category: '',
      metalType: 'gold',
      purity: '22K',
      weight: 0,
      description: '',
      images: [],
      featured: false,
      active: true,
    });
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setModalMode('edit');
    setFormData({ ...product });
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchProducts(); // Refresh list
      } else {
        alert(data.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('An error occurred while deleting the product.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formPayload = new FormData();
        formPayload.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formPayload,
        });
        const data = await res.json();
        if (data.success && data.data?.url) {
          return data.data.url;
        }
        throw new Error(data.error || 'Failed to upload image');
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls]
      }));
    } catch (error: any) {
      console.error('Image upload failed:', error);
      alert(error.message || 'An error occurred during upload.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const url = modalMode === 'add' ? '/api/products' : `/api/products/${formData.id}`;
    const method = modalMode === 'add' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `Product successfully ${modalMode === 'add' ? 'added' : 'updated'}!` });
        fetchProducts();
        setTimeout(() => setIsModalOpen(false), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save product.' });
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner admin-spinner-lg" />
        <span>Loading products...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products Inventory</h1>
          <p className="admin-page-subtitle">Manage your jewelry catalog, add new items, and update details.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} />
          Add New Product
        </button>
      </div>

      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{ display: 'flex', gap: 16, width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="admin-form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Search by product name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: 44 }}
                />
              </div>
            </div>
            <div className="admin-form-group" style={{ width: 200, marginBottom: 0 }}>
              <div style={{ position: 'relative' }}>
                <Filter size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }} />
                <select
                  className="admin-select"
                  value={metalFilter}
                  onChange={(e) => { setMetalFilter(e.target.value); setCategoryFilter('all'); }}
                  style={{ paddingLeft: 44 }}
                >
                  <option value="all">All Metals</option>
                  <option value="gold">Gold Products</option>
                  <option value="silver">Silver Products</option>
                </select>
              </div>
            </div>
            <div style={{ flex: '1 1 auto', display: 'flex', overflowX: 'auto', paddingBottom: '4px' }}>
              <CategoryFilter 
                categories={dynamicFilterCategories} 
                activeCategory={categoryFilter} 
                onCategoryChange={setCategoryFilter} 
                metalType={metalFilter as any} 
              />
            </div>
          </div>
        </div>

        <div className="admin-card-body">
          <div className="admin-table-wrapper">
            {filteredProducts.length === 0 ? (
              <div className="admin-empty" style={{ padding: '60px 20px' }}>
                <h4 className="admin-empty-title">No products found</h4>
                <p className="admin-empty-text">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Metal</th>
                    <th>Weight</th>
                    <th>Visibility</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        {product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="admin-table-thumbnail"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('admin-hidden');
                            }}
                          />
                        ) : (
                          <div className="admin-table-thumbnail-placeholder">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: 4 }}>
                          {product.id}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{product.name}</td>
                      <td>
                        <span className={`admin-badge ${product.metalType === 'gold' ? 'admin-badge-gold' : 'admin-badge-silver'}`}>
                          {product.metalType === 'gold' ? '🥇 Gold' : '🥈 Silver'}
                        </span>
                      </td>
                      <td>{product.weight}g</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {product.active ? (
                            <span className="admin-badge admin-badge-success">Active</span>
                          ) : (
                            <span className="admin-badge admin-badge-danger">Inactive</span>
                          )}
                          {product.featured && (
                            <span className="admin-badge admin-badge-gold">Featured</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button 
                            className="admin-btn admin-btn-ghost admin-btn-sm" 
                            style={{ padding: 8 }}
                            onClick={() => handleOpenEditModal(product)}
                            title="Edit Product"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="admin-btn admin-btn-ghost admin-btn-sm" 
                            style={{ padding: 8, color: '#e74c3c' }}
                            onClick={() => handleDelete(product.id)}
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--admin-border)' }}>
              <div style={{ color: 'var(--admin-text-secondary)', fontSize: '0.9rem' }}>
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} entries
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className="admin-btn admin-btn-outline" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '8px 12px' }}
                >
                  Previous
                </button>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--admin-surface)', borderRadius: 4, fontWeight: 500 }}>
                  Page {page} of {totalPages}
                </div>
                <button 
                  className="admin-btn admin-btn-outline" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: '8px 12px' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}>
          <div className="admin-modal" style={{ maxWidth: 800 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{modalMode === 'add' ? 'Add New Product' : `Edit Product: ${formData.id}`}</h2>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="admin-modal-body" style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
              {message && (
                <div className={`admin-alert admin-alert-${message.type}`} style={{ marginBottom: 24, padding: 16, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, backgroundColor: message.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)', color: message.type === 'success' ? '#2ecc71' : '#e74c3c' }}>
                  {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <span>{message.text}</span>
                </div>
              )}

              <form id="productForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Section 1: Basic Info */}
                <div className="admin-form-section">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--admin-gold)' }}>Basic Information</h3>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Product Name *</label>
                    <input required type="text" className="admin-form-input" placeholder="e.g. 22K Gold Antique Choker" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Metal Type *</label>
                      <select 
                        required 
                        className="admin-form-select" 
                        value={formData.metalType} 
                        onChange={e => {
                          const newMetal = e.target.value as 'gold' | 'silver';
                          const newCats = allCategories.filter(cat => cat.metalType === newMetal);
                          setFormData({...formData, metalType: newMetal, category: newCats[0]?.value || ''});
                        }}
                      >
                        <option value="gold">Gold</option>
                        <option value="silver">Silver</option>
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Category *</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <select 
                          className="admin-form-select" 
                          value={allCategories.find(c => c.value === formData.category) ? formData.category : ''} 
                          onChange={e => {
                            if (e.target.value) setFormData({...formData, category: e.target.value});
                          }}
                        >
                          <option value="" disabled>-- Select existing category --</option>
                          {allCategories.filter(c => c.metalType === formData.metalType).map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                        <input
                          required={!formData.category}
                          className="admin-form-input"
                          placeholder="...or type a brand new category"
                          value={allCategories.find(c => c.value === formData.category) ? '' : formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value.toLowerCase()})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="admin-form-group">
                    <label className="admin-form-label">Description</label>
                    <textarea className="admin-form-input" rows={3} placeholder="Describe the intricate details of this piece..." style={{ resize: 'vertical' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>
                </div>

                {/* Section 2: Technical Details */}
                <div className="admin-form-section">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--admin-gold)' }}>Technical Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Weight (g) *</label>
                      <input required type="number" step="0.01" className="admin-form-input" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Purity *</label>
                      <input required type="text" className="admin-form-input" placeholder="e.g. 22K or 925" value={formData.purity} onChange={e => setFormData({...formData, purity: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Section 3: Visibility & Images */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--admin-gold)' }}>Visibility</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, backgroundColor: 'var(--admin-surface-2)', padding: '24px', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                      <label className="admin-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                        <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} style={{ width: 20, height: 20, accentColor: 'var(--admin-gold)' }} />
                        <span style={{ fontWeight: 500, fontSize: '1.05rem', color: 'var(--admin-text)' }}>Active (Visible to users)</span>
                      </label>
                      <label className="admin-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                        <input type="checkbox" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} style={{ width: 20, height: 20, accentColor: 'var(--admin-gold)' }} />
                        <span style={{ fontWeight: 500, fontSize: '1.05rem', color: 'var(--admin-text)' }}>Featured on Homepage</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="admin-form-group">
                      <label className="admin-form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--admin-gold)' }}>Product Images</span>
                        <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>{formData.images?.length || 0} uploaded</span>
                      </label>
                      
                      <div 
                        style={{ 
                          border: '2px dashed var(--admin-border)', 
                          borderRadius: 8, 
                          padding: 24, 
                          textAlign: 'center',
                          backgroundColor: 'var(--admin-surface-2)',
                          marginBottom: 16,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => !uploadingImage && fileInputRef.current?.click()}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--admin-gold)'; e.currentTarget.style.backgroundColor = 'var(--admin-gold-muted)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.backgroundColor = 'var(--admin-surface-2)'; }}
                      >
                        <UploadCloud size={32} style={{ color: 'var(--admin-text-muted)', margin: '0 auto 12px' }} />
                        <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--admin-text)' }}>Click to upload high-quality product images.</p>
                        
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple
                          ref={fileInputRef} 
                          onChange={handleImageUpload} 
                          style={{ display: 'none' }} 
                        />
                        <button 
                          type="button" 
                          className="admin-btn admin-btn-secondary admin-btn-sm" 
                          style={{ margin: '0 auto', pointerEvents: 'none' }}
                        >
                          {uploadingImage ? <RefreshCw className="spin" size={16} /> : <Plus size={16} />}
                          {uploadingImage ? 'Uploading...' : 'Browse Files'}
                        </button>
                      </div>

                      {/* Image Preview Grid */}
                      {formData.images && formData.images.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                          {formData.images.map((img, idx) => (
                            <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                              <img src={img} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#e74c3c', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                              >
                                <X size={14} />
                              </button>
                              {idx === 0 && (
                                <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(212, 175, 55, 0.9)', color: '#fff', fontSize: '0.7rem', padding: '2px 0', textAlign: 'center', fontWeight: 600 }}>PRIMARY</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" form="productForm" className="admin-btn admin-btn-primary" disabled={saving}>
                {saving ? <RefreshCw className="spin" size={18} /> : <CheckCircle2 size={18} />}
                {saving ? 'Saving...' : (modalMode === 'add' ? 'Create Product' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
