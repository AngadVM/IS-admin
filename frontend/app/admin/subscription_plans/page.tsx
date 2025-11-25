// app/admin/subscription_plans/page.tsx
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
    is_active: boolean;
    features: Feature[];
    plan_type_name?: string;
};

export default function SubscriptionPlansPage() {
    const [planTypes, setPlanTypes] = useState<PlanType[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [name, setName] = useState('');
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
            setMessage({ text: 'Please fill in all required fields', type: 'error' });
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
                    feature_ids: selectedFeatureIds
                })
            });

            if (res.ok) {
                const data = await res.json();
                setPlans(prev => [...prev, data]);
                setName('');
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
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 font-semibold transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <Package className="w-10 h-10 text-blue-600" />
                        <h1 className="text-4xl font-bold text-gray-900">Subscription Plans</h1>
                    </div>
                    <p className="text-gray-700 text-base font-medium">Create and manage subscription plans with pricing and features</p>
                </div>

                {/* Alert */}
                {message && (
                    <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-sm ${
                        message.type === 'success' 
                            ? 'bg-green-50 border-green-300 text-green-900' 
                            : 'bg-red-50 border-red-300 text-red-900'
                    }`}>
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold">{message.text}</p>
                    </div>
                )}

                {/* Create Plan Form */}
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                    <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-5">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Plus className="w-6 h-6" />
                            Create New Plan
                        </h2>
                    </div>
                    
                    <div className="p-6 space-y-6 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Plan Name <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-500 bg-white transition-all"
                                    placeholder="e.g., Pro Monthly"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Base Plan Type <span className="text-red-600">*</span>
                                </label>
                                <select
                                    value={selectedPlanTypeId}
                                    onChange={(e) => setSelectedPlanTypeId(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white transition-all"
                                    disabled={isSubmitting || planTypes.length === 0}
                                >
                                    {planTypes.length === 0 && <option>No plan types available</option>}
                                    {planTypes.map(pt => (
                                        <option key={pt.id} value={pt.id}>{pt.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Billing Duration <span className="text-red-600">*</span>
                                </label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value as Duration)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white transition-all"
                                    disabled={isSubmitting}
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                    <option value="lifetime">Lifetime</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Price <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-500 bg-white transition-all"
                                    placeholder="0.00"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Currency</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white transition-all"
                                    disabled={isSubmitting}
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-3">Included Features</label>
                            {features.length === 0 ? (
                                <div className="text-base text-gray-900 italic p-5 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                                    ⚠️ No features available. <Link href="/admin/features" className="text-blue-700 hover:text-blue-900 font-bold underline">Create features first</Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5 bg-white rounded-lg border-2 border-gray-300">
                                    {features.map(feature => (
                                        <label key={feature.id} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-blue-50 border-2 border-transparent hover:border-blue-300 transition-all">
                                            <input
                                                type="checkbox"
                                                checked={selectedFeatureIds.includes(feature.id)}
                                                onChange={() => toggleFeature(feature.id)}
                                                className="w-5 h-5 text-blue-600 border-gray-400 rounded focus:ring-blue-500 cursor-pointer mt-0.5"
                                                disabled={isSubmitting}
                                            />
                                            <span className="text-sm text-gray-900 font-semibold flex-1">
                                                {feature.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !name.trim() || !selectedPlanTypeId || !price.trim()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-bold text-base rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            {isSubmitting ? 'Creating...' : 'Create Plan'}
                        </button>
                    </div>
                </div>

                {/* Existing Plans */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">All Plans</h2>
                        <span className="px-4 py-2 bg-blue-600 text-white rounded-full text-base font-bold shadow-md">
                            {plans.length}
                        </span>
                    </div>

                    {plans.length === 0 ? (
                        <div className="bg-white rounded-xl border-2 border-gray-300 p-16 text-center shadow-md">
                            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-900 font-bold text-lg">No subscription plans yet</p>
                            <p className="text-gray-600 text-base mt-2 font-medium">Create your first plan to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plans.map(plan => (
                                <div key={plan.id} className="bg-white rounded-xl border-2 border-gray-300 hover:border-blue-400 hover:shadow-xl transition-all overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-gray-900 flex-1">{plan.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                                    plan.is_active ? 'bg-green-100 text-green-800 border-2 border-green-300' : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
                                                }`}>
                                                    {plan.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <button
                                                    onClick={() => handleDelete(plan.id, plan.name)}
                                                    className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50 border-2 border-transparent hover:border-red-300"
                                                    disabled={deletingId === plan.id}
                                                    title={`Delete ${plan.name}`}
                                                >
                                                    {deletingId === plan.id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <DollarSign className="w-6 h-6 text-blue-600 font-bold" />
                                            <span className="text-3xl font-bold text-gray-900">{plan.price.toFixed(2)}</span>
                                            <span className="text-gray-700 text-base font-semibold ml-1">
                                                {plan.currency} / {plan.duration === 'monthly' ? 'month' : plan.duration === 'yearly' ? 'year' : 'lifetime'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-4 pb-4 border-b-2 border-gray-200">
                                            <Clock className="w-5 h-5 text-gray-500" />
                                            <span className="font-bold">{plan.plan_type_name || planTypes.find(pt => pt.id === plan.plan_type_id)?.name || 'N/A'}</span>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-gray-900">Features:</h4>
                                            {plan.features && plan.features.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {plan.features.map(f => (
                                                        <li key={f.id} className="flex items-start gap-2 text-sm text-gray-800">
                                                            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                                            <span className="font-medium">{f.label}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-600 italic font-medium">No features assigned</p>
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