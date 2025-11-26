// app/admin/subscription_plans/page.tsx
// This version uses INLINE STYLES to bypass any Tailwind caching issues
// Copy this ENTIRE file and replace your current subscription_plans/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Package, CheckCircle, DollarSign, Clock, AlertCircle, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

type PlanType = { id: string; name: string; };
type Feature = { id: string; label: string; description: string | null; };
type Duration = 'monthly' | 'yearly' | 'lifetime';
type SubscriptionPlan = {
    id: string;
    plan_type_id: string;
    name: string;
    duration: Duration;
    price: number;
    currency: string;
    description?: string | null;
    is_active: boolean;
    is_default: boolean;
    features: Feature[];
    plan_type_name?: string;
};

export default function SubscriptionPlansPage() {
    const [planTypes, setPlanTypes] = useState<PlanType[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPlanTypeId, setSelectedPlanTypeId] = useState('');
    const [duration, setDuration] = useState<Duration>('monthly');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [planTypesRes, featuresRes, plansRes] = await Promise.all([
                fetch('/api/plan_types'),
                fetch('/api/features'),
                fetch('/api/subscription_plans')
            ]);

            if (planTypesRes.ok) {
                const data = await planTypesRes.json();
                setPlanTypes(data);
                if (data.length > 0) setSelectedPlanTypeId(data[0].id);
            }

            if (featuresRes.ok) {
                const data = await featuresRes.json();
                setFeatures(data);
            }

            if (plansRes.ok) {
                const data = await plansRes.json();
                setPlans(data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage({ text: 'Failed to load data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim() || !selectedPlanTypeId || !price.trim()) {
            setMessage({ text: 'Please fill in all required fields (Name, Plan Type, Price)', type: 'error' });
            return;
        }

        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum < 0) {
            setMessage({ text: 'Please enter a valid price', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch('/api/subscription_plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    label_suffix: name.trim(),
                    plan_type_id: selectedPlanTypeId,
                    duration,
                    price: priceNum,
                    currency,
                    description: description.trim() || null,
                    feature_ids: selectedFeatureIds
                })
            });

            if (res.ok) {
                const data = await res.json();
                setPlans(prev => [...prev, data]);
                setName('');
                setDescription('');
                setPrice('');
                setSelectedFeatureIds([]);
                setMessage({ text: `Plan "${data.name}" created successfully!`, type: 'success' });
            } else {
                const error = await res.json();
                setMessage({ text: error.error || 'Failed to create plan', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Network error', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, planName: string) => {
        if (!confirm(`Delete plan "${planName}"?`)) return;

        setDeletingId(id);
        setMessage(null);

        try {
            const res = await fetch(`/api/subscription_plans?id=${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setPlans(prev => prev.filter(p => p.id !== id));
                setMessage({ text: `Plan "${planName}" deleted`, type: 'success' });
            } else {
                const error = await res.json();
                setMessage({ text: error.error || 'Failed to delete plan', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Network error', type: 'error' });
        } finally {
            setDeletingId(null);
        }
    };

    const toggleFeature = (id: string) => {
        setSelectedFeatureIds(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#F9FAFB'
            }}>
                <Loader2 style={{ width: '32px', height: '32px', color: '#2563EB' }} className="animate-spin" />
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
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <Link href="/admin" style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        color: '#2563EB',
                        fontWeight: '600',
                        marginBottom: '16px',
                        textDecoration: 'none',
                        fontSize: '15px'
                    }}>
                        <ArrowLeft style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                        Back to Dashboard
                    </Link>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Package style={{ width: '40px', height: '40px', color: '#2563EB' }} />
                        <h1 style={{ 
                            fontSize: '36px', 
                            fontWeight: 'bold', 
                            color: '#111827',
                            margin: 0
                        }}>
                            Subscription Plans
                        </h1>
                    </div>
                    
                    <p style={{ 
                        color: '#374151', 
                        fontSize: '16px', 
                        fontWeight: '500',
                        margin: 0
                    }}>
                        Create and manage subscription plans with pricing and features
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

                {/* Create Plan Form */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    border: '2px solid #E5E7EB',
                    overflow: 'hidden',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        background: 'linear-gradient(to right, #2563EB, #1D4ED8)',
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
                            Create New Plan
                        </h2>
                    </div>
                    
                    <div style={{ padding: '24px', backgroundColor: '#F9FAFB' }}>
                        {/* Plan Details Grid */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '20px',
                            marginBottom: '24px'
                        }}>
                            {/* Plan Name */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '8px'
                                }}>
                                    Plan Name <span style={{ color: '#DC2626' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
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
                                    placeholder="e.g., Pro Monthly"
                                    disabled={isSubmitting}
                                    onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                                />
                            </div>

                            {/* Plan Type */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '8px'
                                }}>
                                    Base Plan Type <span style={{ color: '#DC2626' }}>*</span>
                                </label>
                                <select
                                    value={selectedPlanTypeId}
                                    onChange={(e) => setSelectedPlanTypeId(e.target.value)}
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
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                    disabled={isSubmitting || planTypes.length === 0}
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#2563EB'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                                >
                                    {planTypes.length === 0 && <option>No plan types available</option>}
                                    {planTypes.map(pt => (
                                        <option key={pt.id} value={pt.id}>{pt.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Duration */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '8px'
                                }}>
                                    Billing Duration <span style={{ color: '#DC2626' }}>*</span>
                                </label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value as Duration)}
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
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                    disabled={isSubmitting}
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#2563EB'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                    <option value="lifetime">Lifetime</option>
                                </select>
                            </div>
                        </div>

                        {/* Price and Currency */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '2fr 1fr',
                            gap: '20px',
                            marginBottom: '24px'
                        }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '8px'
                                }}>
                                    Price <span style={{ color: '#DC2626' }}>*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
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
                                    placeholder="0.00"
                                    disabled={isSubmitting}
                                    onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: '8px'
                                }}>
                                    Currency
                                </label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
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
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
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
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid #D1D5DB',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    color: '#111827',
                                    backgroundColor: 'white',
                                    resize: 'vertical',
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                                placeholder="Describe this subscription plan..."
                                disabled={isSubmitting}
                                onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                            />
                        </div>

                        {/* Features Selection */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginBottom: '12px'
                            }}>
                                Included Features
                            </label>
                            {features.length === 0 ? (
                                <div style={{
                                    padding: '20px',
                                    backgroundColor: '#FEF3C7',
                                    border: '2px solid #FCD34D',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <p style={{ 
                                        fontSize: '16px', 
                                        fontWeight: '600', 
                                        color: '#92400E',
                                        margin: 0
                                    }}>
                                        ⚠️ No features available. <Link href="/admin/features" style={{ color: '#1D4ED8', textDecoration: 'underline' }}>Create features first</Link>
                                    </p>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: '12px',
                                    padding: '16px',
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    border: '2px solid #D1D5DB'
                                }}>
                                    {features.map(feature => (
                                        <label key={feature.id} style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '10px',
                                            cursor: 'pointer',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            border: '2px solid transparent',
                                            backgroundColor: selectedFeatureIds.includes(feature.id) ? '#DBEAFE' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#2563EB';
                                            e.currentTarget.style.backgroundColor = selectedFeatureIds.includes(feature.id) ? '#DBEAFE' : '#F3F4F6';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'transparent';
                                            e.currentTarget.style.backgroundColor = selectedFeatureIds.includes(feature.id) ? '#DBEAFE' : 'transparent';
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedFeatureIds.includes(feature.id)}
                                                onChange={() => toggleFeature(feature.id)}
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    cursor: 'pointer',
                                                    marginTop: '2px',
                                                    flexShrink: 0
                                                }}
                                                disabled={isSubmitting}
                                            />
                                            <span style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#111827',
                                                lineHeight: '1.4'
                                            }}>
                                                {feature.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !name.trim() || !selectedPlanTypeId || !price.trim()}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '16px 24px',
                                backgroundColor: (isSubmitting || !name.trim() || !selectedPlanTypeId || !price.trim()) ? '#9CA3AF' : '#2563EB',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: (isSubmitting || !name.trim() || !selectedPlanTypeId || !price.trim()) ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!isSubmitting && name.trim() && selectedPlanTypeId && price.trim()) {
                                    e.currentTarget.style.backgroundColor = '#1D4ED8';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSubmitting && name.trim() && selectedPlanTypeId && price.trim()) {
                                    e.currentTarget.style.backgroundColor = '#2563EB';
                                }
                            }}
                        >
                            {isSubmitting ? <Loader2 style={{ width: '20px', height: '20px' }} className="animate-spin" /> : <Plus style={{ width: '20px', height: '20px' }} />}
                            {isSubmitting ? 'Creating...' : 'Create Plan'}
                        </button>
                    </div>
                </div>

                {/* Existing Plans */}
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
                            All Plans
                        </h2>
                        <span style={{
                            padding: '8px 16px',
                            backgroundColor: '#2563EB',
                            color: 'white',
                            borderRadius: '9999px',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}>
                            {plans.length}
                        </span>
                    </div>

                    {plans.length === 0 ? (
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: '2px solid #D1D5DB',
                            padding: '64px',
                            textAlign: 'center'
                        }}>
                            <Package style={{ width: '64px', height: '64px', color: '#9CA3AF', margin: '0 auto 16px' }} />
                            <p style={{ 
                                color: '#111827', 
                                fontWeight: 'bold', 
                                fontSize: '18px',
                                margin: '0 0 8px 0'
                            }}>
                                No subscription plans yet
                            </p>
                            <p style={{ 
                                color: '#6B7280', 
                                fontSize: '16px', 
                                fontWeight: '500',
                                margin: 0
                            }}>
                                Create your first plan to get started
                            </p>
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                            gap: '24px' 
                        }}>
                            {plans.map(plan => (
                                <div key={plan.id} style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    border: '2px solid #D1D5DB',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#2563EB';
                                    e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}>
                                    <div style={{ padding: '24px' }}>
                                        {/* Plan Header */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            marginBottom: '16px'
                                        }}>
                                            <h3 style={{
                                                fontSize: '20px',
                                                fontWeight: 'bold',
                                                color: '#111827',
                                                margin: 0,
                                                flex: 1
                                            }}>
                                                {plan.name}
                                            </h3>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    borderRadius: '9999px',
                                                    backgroundColor: plan.is_active ? '#D1FAE5' : '#F3F4F6',
                                                    color: plan.is_active ? '#065F46' : '#374151',
                                                    border: `2px solid ${plan.is_active ? '#6EE7B7' : '#D1D5DB'}`
                                                }}>
                                                    {plan.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <button
                                                    onClick={() => handleDelete(plan.id, plan.name)}
                                                    disabled={deletingId === plan.id}
                                                    style={{
                                                        padding: '8px',
                                                        color: '#6B7280',
                                                        backgroundColor: 'transparent',
                                                        border: '2px solid transparent',
                                                        borderRadius: '6px',
                                                        cursor: deletingId === plan.id ? 'not-allowed' : 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (deletingId !== plan.id) {
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
                                                    {deletingId === plan.id ? (
                                                        <Loader2 style={{ width: '18px', height: '18px' }} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 style={{ width: '18px', height: '18px' }} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'baseline',
                                            gap: '6px',
                                            marginBottom: '16px'
                                        }}>
                                            <DollarSign style={{ width: '24px', height: '24px', color: '#2563EB' }} />
                                            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
                                                {plan.price.toFixed(2)}
                                            </span>
                                            <span style={{ fontSize: '16px', fontWeight: '600', color: '#6B7280' }}>
                                                {plan.currency} / {plan.duration === 'monthly' ? 'month' : plan.duration === 'yearly' ? 'year' : 'lifetime'}
                                            </span>
                                        </div>

                                        {/* Plan Type */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            paddingBottom: '16px',
                                            marginBottom: '16px',
                                            borderBottom: '2px solid #E5E7EB'
                                        }}>
                                            <Clock style={{ width: '18px', height: '18px', color: '#6B7280' }} />
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                                {plan.plan_type_name || planTypes.find(pt => pt.id === plan.plan_type_id)?.name || 'N/A'}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        {plan.description && (
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#6B7280',
                                                fontWeight: '500',
                                                marginBottom: '16px',
                                                lineHeight: '1.6'
                                            }}>
                                                {plan.description}
                                            </p>
                                        )}

                                        {/* Features */}
                                        <div>
                                            <h4 style={{
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                color: '#111827',
                                                marginBottom: '12px',
                                                marginTop: 0
                                            }}>
                                                Features:
                                            </h4>
                                            {plan.features && plan.features.length > 0 ? (
                                                <ul style={{ 
                                                    listStyle: 'none', 
                                                    padding: 0, 
                                                    margin: 0,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '8px'
                                                }}>
                                                    {plan.features.map(f => (
                                                        <li key={f.id} style={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: '8px'
                                                        }}>
                                                            <CheckCircle style={{ 
                                                                width: '18px', 
                                                                height: '18px', 
                                                                color: '#10B981',
                                                                flexShrink: 0,
                                                                marginTop: '2px'
                                                            }} />
                                                            <span style={{
                                                                fontSize: '14px',
                                                                fontWeight: '500',
                                                                color: '#374151'
                                                            }}>
                                                                {f.label}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: '#9CA3AF',
                                                    fontStyle: 'italic',
                                                    margin: 0
                                                }}>
                                                    No features assigned
                                                </p>
                                            )}
                                        </div>
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