// app/admin/plan_types/page.tsx
// This version uses INLINE STYLES to bypass any Tailwind caching issues
// Copy this ENTIRE file and replace your current plan_types/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Layers, Trash2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type PlanType = {
    id: string;
    name: string;
    description: string | null;
    created_at?: string | null;
};

export default function PlanTypesPage() {
    const [planTypes, setPlanTypes] = useState<PlanType[]>([]);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchPlanTypes();
    }, []);

    const fetchPlanTypes = async () => {
        try {
            const res = await fetch('/api/plan_types');
            if (res.ok) {
                const data = await res.json();
                setPlanTypes(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching plan types:', error);
            setMessage({ text: 'Failed to load plan types', type: 'error' });
        } finally {
            setInitialLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) {
            setMessage({ text: 'Plan type name is required', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/plan_types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName.trim(),
                    description: newDescription.trim() || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                setPlanTypes(prev => [...prev, data]);
                setNewName('');
                setNewDescription('');
                setMessage({ text: `Plan type "${data.name}" created successfully`, type: 'success' });
            } else {
                const error = await res.json();
                setMessage({ text: error.error || 'Failed to create plan type', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Network error', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete plan type "${name}"? This will affect all subscription plans using this type.`)) return;

        setDeletingId(id);
        setMessage(null);

        try {
            const res = await fetch(`/api/plan_types?id=${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setPlanTypes(prev => prev.filter(pt => pt.id !== id));
                setMessage({ text: `Plan type "${name}" deleted`, type: 'success' });
            } else {
                const error = await res.json();
                setMessage({ text: error.error || 'Failed to delete plan type', type: 'error' });
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
                <Loader2 style={{ width: '32px', height: '32px', color: '#9333EA' }} className="animate-spin" />
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
                        color: '#9333EA',
                        fontWeight: '600',
                        marginBottom: '16px',
                        textDecoration: 'none',
                        fontSize: '15px'
                    }}>
                        <ArrowLeft style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                        Back to Dashboard
                    </Link>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Layers style={{ width: '40px', height: '40px', color: '#9333EA' }} />
                        <h1 style={{ 
                            fontSize: '36px', 
                            fontWeight: 'bold', 
                            color: '#111827',
                            margin: 0
                        }}>
                            Plan Types
                        </h1>
                    </div>
                    
                    <p style={{ 
                        color: '#374151', 
                        fontSize: '16px', 
                        fontWeight: '500',
                        margin: 0
                    }}>
                        Categorize your subscription offerings into different plan types
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
                        background: 'linear-gradient(to right, #9333EA, #7E22CE)',
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
                            Create New Plan Type
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
                                Plan Type Name <span style={{ color: '#DC2626' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
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
                                placeholder="e.g., Standard, Premium, Enterprise"
                                disabled={loading}
                                onFocus={(e) => e.target.style.borderColor = '#9333EA'}
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
                                placeholder="Briefly describe this plan type..."
                                disabled={loading}
                                onFocus={(e) => e.target.style.borderColor = '#9333EA'}
                                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                            />
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={loading || !newName.trim()}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '16px 24px',
                                backgroundColor: loading || !newName.trim() ? '#9CA3AF' : '#9333EA',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: loading || !newName.trim() ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading && newName.trim()) {
                                    e.currentTarget.style.backgroundColor = '#7E22CE';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading && newName.trim()) {
                                    e.currentTarget.style.backgroundColor = '#9333EA';
                                }
                            }}
                        >
                            {loading ? <Loader2 style={{ width: '20px', height: '20px' }} className="animate-spin" /> : <Plus style={{ width: '20px', height: '20px' }} />}
                            {loading ? 'Creating...' : 'Create Plan Type'}
                        </button>
                    </div>
                </div>

                {/* Plan Types List */}
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
                            All Plan Types
                        </h2>
                        <span style={{
                            padding: '8px 16px',
                            backgroundColor: '#9333EA',
                            color: 'white',
                            borderRadius: '9999px',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}>
                            {planTypes.length}
                        </span>
                    </div>

                    {planTypes.length === 0 ? (
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: '2px solid #D1D5DB',
                            padding: '64px',
                            textAlign: 'center'
                        }}>
                            <Layers style={{ width: '64px', height: '64px', color: '#9CA3AF', margin: '0 auto 16px' }} />
                            <p style={{ 
                                color: '#111827', 
                                fontWeight: 'bold', 
                                fontSize: '18px',
                                margin: '0 0 8px 0'
                            }}>
                                No plan types yet
                            </p>
                            <p style={{ 
                                color: '#6B7280', 
                                fontSize: '16px', 
                                fontWeight: '500',
                                margin: 0
                            }}>
                                Create your first plan type to get started
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            {planTypes.map((planType) => (
                                <div key={planType.id} style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    border: '2px solid #D1D5DB',
                                    padding: '24px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#9333EA';
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
                                                {planType.name}
                                            </h3>
                                            <p style={{
                                                fontSize: '16px',
                                                color: '#374151',
                                                fontWeight: '500',
                                                margin: 0
                                            }}>
                                                {planType.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleDelete(planType.id, planType.name)}
                                            disabled={deletingId === planType.id}
                                            style={{
                                                padding: '12px',
                                                color: '#6B7280',
                                                backgroundColor: 'transparent',
                                                border: '2px solid transparent',
                                                borderRadius: '8px',
                                                cursor: deletingId === planType.id ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (deletingId !== planType.id) {
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
                                            {deletingId === planType.id ? (
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