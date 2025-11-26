// app/admin/page.tsx
// This version uses INLINE STYLES to bypass any Tailwind caching issues
// Copy this ENTIRE file and replace your current admin/page.tsx

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
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F9FAFB', 
      padding: '32px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: '#111827', 
            marginBottom: '16px',
            marginTop: 0
          }}>
            Subscription Admin
          </h1>
          <p style={{ 
            fontSize: '20px', 
            color: '#6B7280',
            fontWeight: '500',
            margin: 0
          }}>
            Manage your subscription platform
          </p>
        </div>

        {/* Stats Overview */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {/* Features Stat */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '2px solid #E5E7EB',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                <p style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#6B7280',
                  marginBottom: '8px',
                  marginTop: 0
                }}>
                  Total Features
                </p>
                <p style={{ 
                  fontSize: '36px', 
                  fontWeight: 'bold', 
                  color: '#4F46E5',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {loading ? <Loader2 style={{ width: '32px', height: '32px' }} className="animate-spin" /> : stats.totalFeatures}
                </p>
              </div>
              <Tag style={{ width: '48px', height: '48px', color: '#4F46E5', opacity: 0.2 }} />
            </div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
              Features available in plans
            </p>
          </div>

          {/* Plan Types Stat */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '2px solid #E5E7EB',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                <p style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#6B7280',
                  marginBottom: '8px',
                  marginTop: 0
                }}>
                  Plan Types
                </p>
                <p style={{ 
                  fontSize: '36px', 
                  fontWeight: 'bold', 
                  color: '#9333EA',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {loading ? <Loader2 style={{ width: '32px', height: '32px' }} className="animate-spin" /> : stats.totalPlanTypes}
                </p>
              </div>
              <Layers style={{ width: '48px', height: '48px', color: '#9333EA', opacity: 0.2 }} />
            </div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
              Categories of plans
            </p>
          </div>

          {/* Plans Stat */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '2px solid #E5E7EB',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                <p style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#6B7280',
                  marginBottom: '8px',
                  marginTop: 0
                }}>
                  Subscription Plans
                </p>
                <p style={{ 
                  fontSize: '36px', 
                  fontWeight: 'bold', 
                  color: '#2563EB',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {loading ? <Loader2 style={{ width: '32px', height: '32px' }} className="animate-spin" /> : stats.totalPlans}
                </p>
              </div>
              <Package style={{ width: '48px', height: '48px', color: '#2563EB', opacity: 0.2 }} />
            </div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
              Active subscription plans
            </p>
          </div>
        </div>

        {/* Management Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          marginBottom: '48px'
        }}>
          {/* Features Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
            border: '2px solid #C7D2FE',
            overflow: 'hidden',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 20px 25px rgba(0, 0, 0, 0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)'}>
            <div style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
              padding: '24px',
              color: 'white'
            }}>
              <Tag style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', marginTop: 0 }}>
                Features
              </h2>
              <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                Define features for your subscription plans
              </p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', marginBottom: '8px', marginTop: 0 }}>
                  Current Features
                </p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {loading ? '—' : stats.totalFeatures}
                </p>
              </div>
              <Link href="/admin/features" style={{ textDecoration: 'none' }}>
                <button style={{
                  width: '100%',
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  fontWeight: '600',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}>
                  Manage Features
                  <ArrowRight style={{ width: '20px', height: '20px' }} />
                </button>
              </Link>
            </div>
          </div>

          {/* Plan Types Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
            border: '2px solid #E9D5FF',
            overflow: 'hidden',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 20px 25px rgba(0, 0, 0, 0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)'}>
            <div style={{
              background: 'linear-gradient(135deg, #9333EA 0%, #7E22CE 100%)',
              padding: '24px',
              color: 'white'
            }}>
              <Layers style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', marginTop: 0 }}>
                Plan Types
              </h2>
              <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                Categorize your subscription offerings
              </p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', marginBottom: '8px', marginTop: 0 }}>
                  Current Types
                </p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {loading ? '—' : stats.totalPlanTypes}
                </p>
              </div>
              <Link href="/admin/plan_types" style={{ textDecoration: 'none' }}>
                <button style={{
                  width: '100%',
                  backgroundColor: '#9333EA',
                  color: 'white',
                  fontWeight: '600',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7E22CE'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9333EA'}>
                  Manage Plan Types
                  <ArrowRight style={{ width: '20px', height: '20px' }} />
                </button>
              </Link>
            </div>
          </div>

          {/* Subscription Plans Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
            border: '2px solid #BFDBFE',
            overflow: 'hidden',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 20px 25px rgba(0, 0, 0, 0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)'}>
            <div style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              padding: '24px',
              color: 'white'
            }}>
              <Package style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', marginTop: 0 }}>
                Subscription Plans
              </h2>
              <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                Create and manage plans with pricing
              </p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', marginBottom: '8px', marginTop: 0 }}>
                  Active Plans
                </p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {loading ? '—' : stats.totalPlans}
                </p>
              </div>
              <Link href="/admin/subscription_plans" style={{ textDecoration: 'none' }}>
                <button style={{
                  width: '100%',
                  backgroundColor: '#2563EB',
                  color: 'white',
                  fontWeight: '600',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}>
                  Manage Plans
                  <ArrowRight style={{ width: '20px', height: '20px' }} />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div style={{
          background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
          borderRadius: '16px',
          padding: '32px',
          color: 'white',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.2)'
        }}>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '24px',
            marginTop: 0
          }}>
            Quick Start Guide
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            {/* Step 1 */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '24px',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: 'bold', 
                color: '#A78BFA',
                marginBottom: '12px'
              }}>
                1
              </div>
              <h4 style={{ 
                fontWeight: '600', 
                fontSize: '18px', 
                marginBottom: '8px',
                marginTop: 0
              }}>
                Create Features
              </h4>
              <p style={{ 
                fontSize: '14px', 
                color: '#D1D5DB',
                marginBottom: '16px',
                lineHeight: '1.6'
              }}>
                Define the features your subscription plans will include
              </p>
              <Link href="/admin/features" style={{ 
                color: '#A78BFA',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                Go to Features <ArrowRight style={{ width: '16px', height: '16px' }} />
              </Link>
            </div>

            {/* Step 2 */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '24px',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: 'bold', 
                color: '#C084FC',
                marginBottom: '12px'
              }}>
                2
              </div>
              <h4 style={{ 
                fontWeight: '600', 
                fontSize: '18px', 
                marginBottom: '8px',
                marginTop: 0
              }}>
                Define Plan Types
              </h4>
              <p style={{ 
                fontSize: '14px', 
                color: '#D1D5DB',
                marginBottom: '16px',
                lineHeight: '1.6'
              }}>
                Categorize your offerings into different plan types
              </p>
              <Link href="/admin/plan_types" style={{ 
                color: '#C084FC',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                Go to Plan Types <ArrowRight style={{ width: '16px', height: '16px' }} />
              </Link>
            </div>

            {/* Step 3 */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '24px',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: 'bold', 
                color: '#60A5FA',
                marginBottom: '12px'
              }}>
                3
              </div>
              <h4 style={{ 
                fontWeight: '600', 
                fontSize: '18px', 
                marginBottom: '8px',
                marginTop: 0
              }}>
                Build Plans
              </h4>
              <p style={{ 
                fontSize: '14px', 
                color: '#D1D5DB',
                marginBottom: '16px',
                lineHeight: '1.6'
              }}>
                Create subscription plans with pricing and features
              </p>
              <Link href="/admin/subscription_plans" style={{ 
                color: '#60A5FA',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                Go to Plans <ArrowRight style={{ width: '16px', height: '16px' }} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}