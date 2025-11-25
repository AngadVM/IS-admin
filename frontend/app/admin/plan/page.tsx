'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, PlusCircle, DollarSign, Package, List, Check, Trash2 } from 'lucide-react';

// --- Type Definitions (Reflecting DB Schema) ---
type PlanTypeRow = { id: string; name: string; };
type FeatureRow = { id: string; label: string; description: string | null; };
type Duration = 'monthly' | 'yearly' | 'lifetime';

// This structure reflects the JOIN result from the backend API for a single plan
type SubscriptionPlanRow = {
    id: string;
    plan_type_id: string; // Foreign key
    plan_type_name?: string; // Denormalized name from plan_types for display
    name: string; // UI-friendly name (mapped from label_suffix if needed)
    label_suffix?: string; // original DB field
    duration: Duration;
    duration_months?: number; // original DB field
    price: number;
    currency: string;
    is_active: boolean;
    features: FeatureRow[]; // Array of associated features (from 'features' table)
    created_at?: string | null;
    updated_at?: string | null;
};

// --- API Helper Functions ---
const parseResponse = async (res: Response) => {
    if (res.status === 204) return null;

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return res.json();
    }

    let text = '';
    try {
        text = await res.text();
    } catch (e) {
        // no-op
    }
    return { error: `Server responded with status ${res.status}. Expected JSON response. ${text ? `Body: ${text}` : ''}` };
};

const makeApiCall = async (path: string, method = 'GET', body?: any) => {
    // FIX: Construct the full absolute URL using window.location.origin to resolve the 'not a valid URL' error.
    let apiUrl = path;
    if (typeof window !== 'undefined' && !path.startsWith('http')) {
        apiUrl = `${window.location.origin}${path.startsWith('/') ? '' : '/'}${path}`;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    // Placeholder for application ID
    const appId = typeof window !== 'undefined' ? (window as any).__app_id : undefined;
    if (appId) headers['X-App-ID'] = appId;

    const options: RequestInit = {
        method,
        headers,
        credentials: 'same-origin',
    };

    if (body && method !== 'GET' && method !== 'HEAD') options.body = JSON.stringify(body);

    console.log(`[API CALL] Making ${method} request to: ${apiUrl}`);

    try {
        const res = await fetch(apiUrl, options);
        if (!res.ok) {
            const errorBody = await parseResponse(res);
            const errorMessage = (errorBody && (errorBody as any).error) ? (errorBody as any).error : `API call to ${path} failed with status: ${res.status}`;
            throw new Error(errorMessage);
        }
        return parseResponse(res);
    } catch (error: any) {
        throw new Error(`Failed to fetch from ${path}: ${error?.message || String(error)}`);
    }
};

// --- Utility mapping functions ---
const monthsToDuration = (months?: number): Duration => {
    if (months === 1) return 'monthly';
    if (months === 12) return 'yearly';
    return 'lifetime';
};
const durationToMonths = (d: Duration) => {
    if (d === 'monthly') return 1;
    if (d === 'yearly') return 12;
    return 0; // for lifetime
};

// --- Main Component ---
const SubscriptionPlanAdminPage = () => {
    const [planTypes, setPlanTypes] = useState<PlanTypeRow[]>([]);
    const [features, setFeatures] = useState<FeatureRow[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlanRow[]>([]);

    // Form State
    const [name, setName] = useState('');
    const [selectedPlanTypeId, setSelectedPlanTypeId] = useState<string>('');
    const [duration, setDuration] = useState<Duration>('monthly');
    const [price, setPrice] = useState<string>(''); // Use string for input field
    const [currency, setCurrency] = useState('USD');
    const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(true);

    // General State
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        // Placeholder for auth readiness
        setIsAuthReady(true);
    }, []);

    const fetchDependencies = useCallback(async () => {
        if (!isAuthReady) return;
        setLoading(true);
        setMessage(null);

        try {
            // Plan types
            const planTypesResp = await makeApiCall('/api/plan_types');
            const planTypesData = Array.isArray(planTypesResp) ? planTypesResp : (planTypesResp?.plan_types || planTypesResp?.planTypes || []);
            setPlanTypes(planTypesData);
            if (planTypesData.length > 0) setSelectedPlanTypeId(planTypesData[0].id);

            // Features
            const featuresResp = await makeApiCall('/api/features');
            const featuresData = Array.isArray(featuresResp) ? featuresResp : (featuresResp?.features || []);
            setFeatures(featuresData);

            // Subscription plans
            const subResp = await makeApiCall('/api/subscription_plans');
            let rawPlans: any[] = Array.isArray(subResp) ? subResp : (subResp?.plans || subResp?.data || []);

            // map DB fields into UI-friendly shape
            const plansWithNames: SubscriptionPlanRow[] = rawPlans.map((p: any) => {
                const mapped: SubscriptionPlanRow = {
                    id: p.id,
                    plan_type_id: p.plan_type_id,
                    plan_type_name: p.plan_type_name || planTypesData.find((pt: PlanTypeRow) => pt.id === p.plan_type_id)?.name,
                    label_suffix: p.label_suffix || p.name || '',
                    name: p.name || p.label_suffix || 'Untitled Plan',
                    duration_months: p.duration_months ?? (p.duration ? durationToMonths(p.duration) : undefined),
                    duration: monthsToDuration(p.duration_months ?? (p.duration ? durationToMonths(p.duration) : undefined)),
                    price: typeof p.price === 'number' ? p.price : parseFloat(p.price || 0),
                    currency: p.currency || 'USD',
                    is_active: typeof p.is_active === 'boolean' ? p.is_active : (p.is_active === 'true' || p.is_active === 1),
                    features: Array.isArray(p.features) ? p.features : [],
                    created_at: p.created_at || p.createdAt || null,
                    updated_at: p.updated_at || p.updatedAt || null,
                };
                return mapped;
            });

            setPlans(plansWithNames);
        } catch (error: any) {
            console.error("Failed to fetch dependencies:", error?.message || error);
            setMessage({ text: error?.message || 'Error fetching required configuration data. Check API endpoints and server logs for 404/500 errors.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [isAuthReady]);

    useEffect(() => {
        fetchDependencies();
    }, [fetchDependencies]);

    const toggleFeature = (featureId: string) => {
        setSelectedFeatureIds(prev =>
            prev.includes(featureId)
                ? prev.filter(id => id !== featureId)
                : [...prev, featureId]
        );
    };

    // Create new plan — send payload compatible with your DB
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const planPrice = parseFloat(price);
        if (name.trim() === '' || selectedPlanTypeId === '' || isNaN(planPrice) || planPrice < 0) {
            setMessage({ text: 'Please fill out all required fields correctly.', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            // Build payload matching DB columns
            const payload = {
                plan_type_id: selectedPlanTypeId,
                label_suffix: name.trim(),                 // label_suffix is the DB field
                price: planPrice,
                currency,
                duration_months: durationToMonths(duration),
                is_active: isActive,
                feature_ids: selectedFeatureIds,           // List of feature UUIDs
            };

            const newPlanResp = await makeApiCall('/api/subscription_plans', 'POST', payload);
            const created = newPlanResp?.plan || newPlanResp || newPlanResp?.data || null;
            if (!created) throw new Error('Invalid response from server when creating plan.');

            // normalize created plan into UI shape
            const createdNormalized: SubscriptionPlanRow = {
                id: created.id,
                plan_type_id: created.plan_type_id,
                plan_type_name: planTypes.find(pt => pt.id === created.plan_type_id)?.name,
                label_suffix: created.label_suffix || created.name || name.trim(),
                name: created.name || created.label_suffix || name.trim(),
                duration_months: created.duration_months ?? payload.duration_months,
                duration: monthsToDuration(created.duration_months ?? payload.duration_months),
                price: typeof created.price === 'number' ? created.price : parseFloat(created.price || planPrice),
                currency: created.currency || currency,
                is_active: typeof created.is_active === 'boolean' ? created.is_active : payload.is_active,
                features: Array.isArray(created.features) ? created.features : [],
                created_at: created.created_at || null,
                updated_at: created.updated_at || null,
            };

            setPlans(prev => [...prev, createdNormalized]);

            // reset form
            setName('');
            setPrice('');
            setSelectedFeatureIds([]);
            setMessage({ text: `Subscription Plan "${createdNormalized.name}" created successfully.`, type: 'success' });
        } catch (error: any) {
            console.error('Create plan error:', error);
            setMessage({ text: error?.message || 'Error creating plan.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Delete plan — call DELETE with query param for maximum compatibility
    const handleDeletePlan = async (id: string, planName: string) => {
        if (!window.confirm(`Are you sure you want to delete the plan: ${planName}?`)) {
            return;
        }
        setMessage(null);
        setLoading(true);

        try {
            await makeApiCall(`/api/subscription_plans?id=${encodeURIComponent(id)}`, 'DELETE');

            setPlans(prev => prev.filter(plan => plan.id !== id));
            setMessage({ text: `Subscription Plan "${planName}" deleted successfully.`, type: 'success' });
        } catch (error: any) {
            console.error('Delete plan error:', error);
            setMessage({ text: error?.message || 'Error deleting plan.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthReady || (loading && plans.length === 0)) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <span className="ml-3 text-lg text-gray-700">Loading Configuration Data...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-2xl font-sans">
            <h1 className="text-3xl font-extrabold mb-6 text-indigo-700 flex items-center">
                <Package className="h-8 w-8 mr-3" /> Manage Subscription Plans
            </h1>
            <p className="text-sm text-gray-600 mb-6 border-b pb-4">
                Configure your product offerings by defining pricing, duration, and associated features.
            </p>

            {message && (
                <div className={`mb-6 p-3 rounded-lg font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="mb-10 p-6 border border-indigo-200 rounded-xl bg-indigo-50 space-y-6 shadow-inner">
                <h2 className="text-xl font-bold text-indigo-800 flex items-center border-b pb-3 mb-4">
                    <PlusCircle className="h-5 w-5 mr-2" /> Create New Plan
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-indigo-800">Plan Label</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition duration-150"
                            placeholder="e.g., Pro Annual"
                        />
                    </div>

                    <div>
                        <label htmlFor="planTypeId" className="block text-sm font-semibold text-indigo-800">Base Plan Type</label>
                        {planTypes.length > 0 ? (
                            <select
                                id="planTypeId"
                                value={selectedPlanTypeId}
                                onChange={(e) => setSelectedPlanTypeId(e.target.value)}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition duration-150"
                            >
                                {planTypes.map(pt => (
                                    <option key={pt.id} value={pt.id}>{pt.name}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="mt-2 text-red-600 text-sm">
                                <List className="inline h-4 w-4 mr-1" /> No Plan Types found. Run `setup-db.js`.
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="duration" className="block text-sm font-semibold text-indigo-800">Billing Cycle</label>
                        <select id="duration" value={duration} onChange={(e) => setDuration(e.target.value as Duration)} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition duration-150">
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="lifetime">Lifetime</option>
                        </select>
                    </div>

                    <div className="flex space-x-2">
                        <div className="flex-1">
                            <label htmlFor="price" className="block text-sm font-semibold text-indigo-800">Price</label>
                            <input
                                type="number"
                                id="price"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                                min="0"
                                step="0.01"
                                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition duration-150"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="w-1/4">
                            <label htmlFor="currency" className="block text-sm font-semibold text-indigo-800">Currency</label>
                            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition duration-150">
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="border-t border-indigo-300 pt-5">
                    <label className="block text-base font-bold text-indigo-800 mb-3">Select Features</label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {features.length > 0 ? (
                            features.map((feature) => (
                                <div
                                    key={feature.id}
                                    className={`p-3 rounded-xl transition-all duration-200 border ${selectedFeatureIds.includes(feature.id) ? 'bg-indigo-100 border-indigo-600 shadow-md' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                                >
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedFeatureIds.includes(feature.id)}
                                            onChange={() => toggleFeature(feature.id)}
                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className={`text-sm font-medium ${selectedFeatureIds.includes(feature.id) ? 'text-indigo-800' : 'text-gray-900'}`}>
                                            {feature.label}
                                        </span>
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1 ml-6 italic">Description: {feature.description || "No description provided."}</p>
                                </div>
                            ))
                        ) : (
                            <p className="col-span-2 text-sm text-red-600">No Features found. Create some in the Features Admin page.</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center border-t border-indigo-300 pt-5 mt-4">
                    <div className="flex items-center">
                        <input id="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                        <label htmlFor="isActive" className="ml-2 text-sm font-semibold text-indigo-800">Is Active</label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || name.trim() === '' || !selectedPlanTypeId || isNaN(parseFloat(price)) || planTypes.length === 0}
                        className="w-auto flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors shadow-lg active:shadow-none"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <PlusCircle className="h-5 w-5 mr-2" />} Save Subscription Plan
                    </button>
                </div>
            </form>

            <h2 className="text-2xl font-bold mb-5 text-gray-800 flex items-center border-b pb-3">
                <List className="h-6 w-6 mr-2" /> Existing Plans ({plans.length})
            </h2>

            {plans.length === 0 ? (
                <p className="text-gray-500 italic p-4 border border-gray-200 rounded-lg">No subscription plans found. Create one above.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="p-5 border border-gray-200 rounded-xl shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                <div className="flex items-center space-x-2">
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {plan.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id, plan.name); }}
                                        className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                                        title={`Delete ${plan.name}`}
                                        disabled={loading}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-indigo-600 font-medium mb-3">
                                <span className="capitalize">{plan.duration}</span> | Base Type: <span className="font-bold">{plan.plan_type_name || 'N/A'}</span>
                            </p>

                            <div className="flex items-center mb-4">
                                <DollarSign className="h-6 w-6 text-indigo-700 mr-2" />
                                <span className="text-2xl font-extrabold text-indigo-700">
                                    {plan.currency} {(typeof plan.price === 'number' ? plan.price.toFixed(2) : String(plan.price))}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">Created At: {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : 'N/A'}</p>

                            <h4 className="text-sm font-bold text-gray-700 mb-2 border-t pt-3 mt-3">Included Features:</h4>
                            <div className="flex flex-wrap gap-2">
                                {plan.features && plan.features.length > 0 ? (
                                    plan.features.map(f => (
                                        <div key={f.id} className="flex items-center text-xs px-3 py-1 bg-indigo-50 border border-indigo-300 rounded-full text-indigo-800 transition-colors hover:bg-indigo-200 cursor-help" title={f.description || f.label}>
                                            <Check className="h-3 w-3 mr-1" /> {f.label}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm italic text-gray-500">No features assigned.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubscriptionPlanAdminPage;