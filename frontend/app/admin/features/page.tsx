'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Tag, Trash2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Feature = {
    id: string;
    label: string;
    description: string | null;
    created_at?: string | null;
};

export default function FeaturesPage() {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [newLabel, setNewLabel] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchFeatures();
    }, []);

    const fetchFeatures = async () => {
        try {
            const res = await fetch('/api/features');
            if (res.ok) {
                const data = await res.json();
                setFeatures(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching features:', error);
            setMessage({ text: 'Failed to load features', type: 'error' });
        } finally {
            setInitialLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newLabel.trim()) {
            setMessage({ text: 'Feature name is required', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    label: newLabel.trim(),
                    description: newDescription.trim() || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                const newFeature = data?.feature || data;
                setFeatures(prev => [...prev, newFeature]);
                setNewLabel('');
                setNewDescription('');
                setMessage({ text: `Feature "${newFeature.label}" created successfully`, type: 'success' });
            } else {
                const error = await res.json();
                setMessage({ text: error.error || 'Failed to create feature', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Network error', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, label: string) => {
        if (!confirm(`Delete feature "${label}"?`)) return;

        setDeletingId(id);
        setMessage(null);

        try {
            const res = await fetch(`/api/features?id=${encodeURIComponent(id)}`, { 
                method: 'DELETE' 
            });
            
            if (res.ok) {
                setFeatures(prev => prev.filter(f => f.id !== id));
                setMessage({ text: `Feature "${label}" deleted`, type: 'success' });
            } else {
                const error = await res.json();
                setMessage({ text: error.error || 'Failed to delete feature', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Network error', type: 'error' });
        } finally {
            setDeletingId(null);
        }
    };

    if (initialLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#F9FAFB'
            }}>
                <Loader2 style={{ width: '32px', height: '32px', color: '#4F46E5' }} className="animate-spin" />
            </div>
        );
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#F9FAFB', 
            padding: '32px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <Link href="/admin" style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        color: '#4F46E5',
                        fontWeight: '600',
                        marginBottom: '16px',
                        textDecoration: 'none',
                        fontSize: '15px'
                    }}>
                        <ArrowLeft style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                        Back to Dashboard
                    </Link>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Tag style={{ width: '40px', height: '40px', color: '#4F46E5' }} />
                        <h1 style={{ 
                            fontSize: '36px', 
                            fontWeight: 'bold', 
                            color: '#111827',
                            margin: 0
                        }}>
                            Product Features
                        </h1>
                    </div>
                    
                    <p style={{ 
                        color: '#374151', 
                        fontSize: '16px', 
                        fontWeight: '500',
                        margin: 0
                    }}>
                        Define features that can be included in subscription plans
                    </p>
                </div>

                {/* Alert */}
                {message && (
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '16px',
                        borderRadius: '8px',
                        border: `2px solid ${message.type === 'success' ? '#86EFAC' : '#FCA5A5'}`,
                        backgroundColor: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                        color: message.type === 'success' ? '#14532D' : '#7F1D1D',
                        marginBottom: '32px'
                    }}>
                        <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{message.text}</p>
                    </div>
                )}

                {/* Create Form */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    border: '2px solid #E5E7EB',
                    overflow: 'hidden',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        background: 'linear-gradient(to right, #4F46E5, #4338CA)',
                        padding: '20px 24px'
                    }}>
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: 0
                        }}>
                            <Plus style={{ width: '24px', height: '24px' }} />
                            Create New Feature
                        </h2>
                    </div>
                    
                    <div style={{ padding: '24px', backgroundColor: '#F9FAFB' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '8px'
                            }}>
                                Feature Name <span style={{ color: '#DC2626' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid #D1D5DB',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    color: '#111827',
                                    backgroundColor: 'white',
                                    boxSizing: 'border-box',
                                    outline: 'none'
                                }}
                                placeholder="e.g., Priority Support, API Access"
                                disabled={loading}
                                onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '8px'
                            }}>
                                Description <span style={{ color: '#6B7280', fontWeight: 'normal' }}>(Optional)</span>
                            </label>
                            <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid #D1D5DB',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    color: '#111827',
                                    backgroundColor: 'white',
                                    resize: 'none',
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                                placeholder="Describe what this feature provides..."
                                disabled={loading}
                                onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                            />
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={loading || !newLabel.trim()}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '16px 24px',
                                backgroundColor: loading || !newLabel.trim() ? '#9CA3AF' : '#4F46E5',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: loading || !newLabel.trim() ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading && newLabel.trim()) {
                                    e.currentTarget.style.backgroundColor = '#4338CA';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading && newLabel.trim()) {
                                    e.currentTarget.style.backgroundColor = '#4F46E5';
                                }
                            }}
                        >
                            {loading ? <Loader2 style={{ width: '20px', height: '20px' }} className="animate-spin" /> : <Plus style={{ width: '20px', height: '20px' }} />}
                            {loading ? 'Creating...' : 'Create Feature'}
                        </button>
                    </div>
                </div>

                {/* Features List */}
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '24px'
                    }}>
                        <h2 style={{ 
                            fontSize: '30px', 
                            fontWeight: 'bold', 
                            color: '#111827',
                            margin: 0
                        }}>
                            All Features
                        </h2>
                        <span style={{
                            padding: '8px 16px',
                            backgroundColor: '#4F46E5',
                            color: 'white',
                            borderRadius: '9999px',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}>
                            {features.length}
                        </span>
                    </div>

                    {features.length === 0 ? (
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: '2px solid #D1D5DB',
                            padding: '64px',
                            textAlign: 'center'
                        }}>
                            <Tag style={{ width: '64px', height: '64px', color: '#9CA3AF', margin: '0 auto 16px' }} />
                            <p style={{ 
                                color: '#111827', 
                                fontWeight: 'bold', 
                                fontSize: '18px',
                                margin: '0 0 8px 0'
                            }}>
                                No features yet
                            </p>
                            <p style={{ 
                                color: '#6B7280', 
                                fontSize: '16px', 
                                fontWeight: '500',
                                margin: 0
                            }}>
                                Create your first feature to get started
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            {features.map((feature) => (
                                <div key={feature.id} style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    border: '2px solid #D1D5DB',
                                    padding: '24px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#4F46E5';
                                    e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        gap: '16px',
                                        alignItems: 'flex-start'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{
                                                fontSize: '20px',
                                                fontWeight: 'bold',
                                                color: '#111827',
                                                marginBottom: '8px',
                                                marginTop: 0
                                            }}>
                                                {feature.label}
                                            </h3>
                                            <p style={{
                                                fontSize: '16px',
                                                color: '#374151',
                                                fontWeight: '500',
                                                margin: 0
                                            }}>
                                                {feature.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleDelete(feature.id, feature.label)}
                                            disabled={deletingId === feature.id}
                                            style={{
                                                padding: '12px',
                                                color: '#6B7280',
                                                backgroundColor: 'transparent',
                                                border: '2px solid transparent',
                                                borderRadius: '8px',
                                                cursor: deletingId === feature.id ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (deletingId !== feature.id) {
                                                    e.currentTarget.style.color = '#DC2626';
                                                    e.currentTarget.style.backgroundColor = '#FEE2E2';
                                                    e.currentTarget.style.borderColor = '#FCA5A5';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.color = '#6B7280';
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                e.currentTarget.style.borderColor = 'transparent';
                                            }}
                                        >
                                            {deletingId === feature.id ? (
                                                <Loader2 style={{ width: '24px', height: '24px' }} className="animate-spin" />
                                            ) : (
                                                <Trash2 style={{ width: '24px', height: '24px' }} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}