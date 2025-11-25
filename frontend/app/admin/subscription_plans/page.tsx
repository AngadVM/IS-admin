// app/admin/subscription_plans/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Package, CheckCircle, DollarSign, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
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

        setIsSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch('/api/subscription_plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    plan_type_id: selectedPlanTypeId,
                    duration,
                    price: parseFloat(price),
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

    const toggleFeature = (id: string) => {
        setSelectedFeatureIds(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <Package className="w-10 h-10 text-blue-600" />
                        <h1 className="text-4xl font-bold text-gray-800">Subscription Plans</h1>
                    </div>
                    <p className="text-gray-600">Create and manage subscription plans with pricing and features</p>
                </div>

                {/* Alert */}
                {message && (
                    <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                        message.type === 'success' 
                            ? 'bg-green-50 border-green-200 text-green-800' 
                            : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {/* Create Plan Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="bg-linear-to-r from-blue-500 to-cyan-600 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Create New Plan
                        </h2>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Pro Monthly"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Base Plan Type</label>
                                <select
                                    value={selectedPlanTypeId}
                                    onChange={(e) => setSelectedPlanTypeId(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isSubmitting || planTypes.length === 0}
                                >
                                    {planTypes.length === 0 && <option>No plan types available</option>}
                                    {planTypes.map(pt => (
                                        <option key={pt.id} value={pt.id}>{pt.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Billing Duration</label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value as Duration)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0.00"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isSubmitting}
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Included Features</label>
                            {features.length === 0 ? (
                                <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    No features available. <Link href="/admin/features" className="text-blue-600 hover:text-blue-700">Create features first</Link>
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    {features.map(feature => (
                                        <label key={feature.id} className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedFeatureIds.includes(feature.id)}
                                                onChange={() => toggleFeature(feature.id)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                disabled={isSubmitting}
                                            />
                                            <span className="text-sm text-gray-700 group-hover:text-gray-900">
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
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            {isSubmitting ? 'Creating...' : 'Create Plan'}
                        </button>
                    </div>
                </div>

                {/* Existing Plans */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">All Plans</h2>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                            {plans.length}
                        </span>
                    </div>

                    {plans.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No subscription plans yet</p>
                            <p className="text-gray-400 text-sm mt-1">Create your first plan to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plans.map(plan => (
                                <div key={plan.id} className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                                plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {plan.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <DollarSign className="w-5 h-5 text-blue-600" />
                                            <span className="text-3xl font-bold text-gray-800">{plan.price.toFixed(2)}</span>
                                            <span className="text-gray-500 text-sm ml-1">
                                                {plan.currency} / {plan.duration === 'monthly' ? 'mo' : plan.duration === 'yearly' ? 'yr' : 'lifetime'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>{planTypes.find(pt => pt.id === plan.plan_type_id)?.name || 'N/A'}</span>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-gray-700">Features:</h4>
                                            {plan.features && plan.features.length > 0 ? (
                                                <ul className="space-y-1.5">
                                                    {plan.features.map(f => (
                                                        <li key={f.id} className="flex items-start gap-2 text-sm text-gray-700">
                                                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                            <span>{f.label}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No features assigned</p>
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