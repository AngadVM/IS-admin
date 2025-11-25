// app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Package, Tag, Layers, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

type Stats = {
  totalPlans: number;
  totalFeatures: number;
  totalPlanTypes: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalPlans: 0, totalFeatures: 0, totalPlanTypes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [plansRes, featuresRes, typesRes] = await Promise.all([
        fetch('/api/subscription_plans'),
        fetch('/api/features'),
        fetch('/api/plan_types')
      ]);

      const plans = await plansRes.json();
      const features = await featuresRes.json();
      const types = await typesRes.json();

      setStats({
        totalPlans: Array.isArray(plans) ? plans.length : 0,
        totalFeatures: Array.isArray(features) ? features.length : 0,
        totalPlanTypes: Array.isArray(types) ? types.length : 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Subscription Admin</h1>
          <p className="text-xl text-gray-600">Manage your subscription platform</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Features</p>
                <p className="text-4xl font-bold text-indigo-600">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.totalFeatures}
                </p>
              </div>
              <Tag className="w-12 h-12 text-indigo-600 opacity-20" />
            </div>
            <p className="text-xs text-gray-500">Features available in plans</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Plan Types</p>
                <p className="text-4xl font-bold text-purple-600">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.totalPlanTypes}
                </p>
              </div>
              <Layers className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
            <p className="text-xs text-gray-500">Categories of plans</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Subscription Plans</p>
                <p className="text-4xl font-bold text-blue-600">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.totalPlans}
                </p>
              </div>
              <Package className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
            <p className="text-xs text-gray-500">Active subscription plans</p>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Features Section */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-100 overflow-hidden hover:shadow-xl transition-all">
            <div className="bg-linear-to-br from-indigo-500 to-indigo-600 p-6 text-white">
              <Tag className="w-12 h-12 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Features</h2>
              <p className="text-indigo-100 text-sm">Define features for your subscription plans</p>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-2">Current Features</p>
                <p className="text-4xl font-bold text-gray-800">
                  {loading ? '—' : stats.totalFeatures}
                </p>
              </div>
              <Link href="/admin/features">
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all">
                  Manage Features
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Plan Types Section */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 overflow-hidden hover:shadow-xl transition-all">
            <div className="bg-linear-to-br from-purple-500 to-purple-600 p-6 text-white">
              <Layers className="w-12 h-12 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Plan Types</h2>
              <p className="text-purple-100 text-sm">Categorize your subscription offerings</p>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-2">Current Types</p>
                <p className="text-4xl font-bold text-gray-800">
                  {loading ? '—' : stats.totalPlanTypes}
                </p>
              </div>
              <Link href="/admin/plan_types">
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all">
                  Manage Plan Types
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Subscription Plans Section */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden hover:shadow-xl transition-all">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 p-6 text-white">
              <Package className="w-12 h-12 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Subscription Plans</h2>
              <p className="text-blue-100 text-sm">Create and manage plans with pricing</p>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-2">Active Plans</p>
                <p className="text-4xl font-bold text-gray-800">
                  {loading ? '—' : stats.totalPlans}
                </p>
              </div>
              <Link href="/admin/subscription_plans">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all">
                  Manage Plans
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-xl">
          <h3 className="text-2xl font-bold mb-6">Quick Start Guide</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-10 rounded-xl p-6 backdrop-blur">
              <div className="text-4xl font-bold text-indigo-400 mb-3">1</div>
              <h4 className="font-semibold text-lg mb-2">Create Features</h4>
              <p className="text-sm text-gray-300 mb-4">Define the features your subscription plans will include</p>
              <Link href="/admin/features" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                Go to Features →
              </Link>
            </div>
            <div className="bg-white bg-opacity-10 rounded-xl p-6 backdrop-blur">
              <div className="text-4xl font-bold text-purple-400 mb-3">2</div>
              <h4 className="font-semibold text-lg mb-2">Define Plan Types</h4>
              <p className="text-sm text-gray-300 mb-4">Categorize your offerings into different plan types</p>
              <Link href="/admin/plan_types" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                Go to Plan Types →
              </Link>
            </div>
            <div className="bg-white bg-opacity-10 rounded-xl p-6 backdrop-blur">
              <div className="text-4xl font-bold text-blue-400 mb-3">3</div>
              <h4 className="font-semibold text-lg mb-2">Build Plans</h4>
              <p className="text-sm text-gray-300 mb-4">Create subscription plans with pricing and features</p>
              <Link href="/admin/subscription_plans" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                Go to Plans →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}