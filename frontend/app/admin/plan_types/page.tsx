// app/admin/plan_types/page.tsx
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
        if (!confirm(`Delete plan type "${name}"?`)) return;

        setLoading(true);
        try {
            const res = await fetch('/api/plan_types', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                setPlanTypes(prev => prev.filter(pt => pt.id !== id));
                setMessage({ text: `Plan type "${name}" deleted`, type: 'success' });
            } else {
                setMessage({ text: 'Failed to delete plan type', type: 'error' });
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
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <Link href="/admin" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <Layers className="w-10 h-10 text-purple-600" />
                        <h1 className="text-4xl font-bold text-gray-800">Plan Types</h1>
                    </div>
                    <p className="text-gray-600">Categorize your subscription offerings into different plan types</p>
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
                    <div className="bg-linear-to-r from-purple-500 to-pink-600 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Create New Plan Type
                        </h2>
                    </div>
                    
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Plan Type Name
                            </label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="e.g., Standard, Premium, Enterprise"
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
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                placeholder="Briefly describe this plan type..."
                                disabled={loading}
                            />
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={loading || !newName.trim()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            {loading ? 'Creating...' : 'Create Plan Type'}
                        </button>
                    </div>
                </div>

                {/* Plan Types List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold text-gray-800">All Plan Types</h2>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                            {planTypes.length}
                        </span>
                    </div>

                    {planTypes.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No plan types yet</p>
                            <p className="text-gray-400 text-sm mt-1">Create your first plan type to get started</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {planTypes.map((planType) => (
                                <div key={planType.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                                {planType.name}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {planType.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleDelete(planType.id, planType.name)}
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