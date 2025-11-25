// app/admin/features/page.tsx
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

        setLoading(true);
        try {
            const res = await fetch(`/api/features?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setFeatures(prev => prev.filter(f => f.id !== id));
                setMessage({ text: `Feature "${label}" deleted`, type: 'success' });
            } else {
                setMessage({ text: 'Failed to delete feature', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Network error', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <Link href="/admin" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <Tag className="w-10 h-10 text-indigo-600" />
                        <h1 className="text-4xl font-bold text-gray-800">Product Features</h1>
                    </div>
                    <p className="text-gray-600">Define features that can be included in subscription plans</p>
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

                {/* Create Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="bg-linear-to-r from-indigo-500 to-purple-600 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Create New Feature
                        </h2>
                    </div>
                    
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Feature Name
                            </label>
                            <input
                                type="text"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Priority Support, API Access"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description <span className="text-gray-400">(Optional)</span>
                            </label>
                            <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                placeholder="Describe what this feature provides..."
                                disabled={loading}
                            />
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={loading || !newLabel.trim()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            {loading ? 'Creating...' : 'Create Feature'}
                        </button>
                    </div>
                </div>

                {/* Features List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold text-gray-800">All Features</h2>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                            {features.length}
                        </span>
                    </div>

                    {features.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No features yet</p>
                            <p className="text-gray-400 text-sm mt-1">Create your first feature to get started</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {features.map((feature) => (
                                <div key={feature.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                                {feature.label}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {feature.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleDelete(feature.id, feature.label)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            disabled={loading}
                                        >
                                            <Trash2 className="w-5 h-5" />
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