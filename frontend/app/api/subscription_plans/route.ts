// app/api/subscription_plans/route.ts
// CORRECT VERSION matching your database schema

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Helper function to map duration_months to duration enum
function durationMonthsToDuration(months: number | null): string {
    if (months === 1) return 'monthly';
    if (months === 12) return 'yearly';
    return 'lifetime';
}

// Helper function to map duration enum to months
function durationToDurationMonths(duration: string): number {
    if (duration === 'monthly') return 1;
    if (duration === 'yearly') return 12;
    return 0; // lifetime
}

// ----------------------------
// GET → fetch all subscription plans + features
// ----------------------------
export async function GET() {
    try {
        const sql = `
            SELECT
                sp.id,
                sp.plan_type_id,
                pt.name AS plan_type_name,
                sp.label_suffix,
                sp.duration_months,
                sp.price,
                sp.currency,
                sp.description,
                sp.is_default,
                sp.is_active,
                sp.created_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', f.id,
                            'label', f.label,
                            'description', f.description
                        )
                    ) FILTER (WHERE f.id IS NOT NULL),
                    '[]'::json
                ) AS features
            FROM subscription_plans sp
            JOIN plan_types pt ON sp.plan_type_id = pt.id
            LEFT JOIN plan_features pf ON sp.id = pf.plan_id
            LEFT JOIN features f ON pf.feature_id = f.id
            GROUP BY sp.id, pt.name
            ORDER BY sp.created_at DESC;
        `;

        const result = await query(sql);

        const plans = result.rows.map((row: any) => ({
            id: row.id,
            plan_type_id: row.plan_type_id,
            plan_type_name: row.plan_type_name,
            name: row.label_suffix || 'Untitled Plan',
            label_suffix: row.label_suffix,
            duration: durationMonthsToDuration(row.duration_months),
            duration_months: row.duration_months,
            price: Number(row.price),
            currency: row.currency,
            description: row.description,
            is_default: Boolean(row.is_default),
            is_active: Boolean(row.is_active),
            features: Array.isArray(row.features) ? row.features : [],
            created_at: row.created_at
        }));

        return NextResponse.json(plans, { status: 200 });

    } catch (error) {
        console.error("GET /api/subscription_plans error:", error);
        return NextResponse.json(
            { error: "Failed to fetch subscription plans." },
            { status: 500 }
        );
    }
}

// ----------------------------
// POST → create new subscription plan + insert features
// ----------------------------
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name,
            label_suffix,
            plan_type_id,
            duration,
            price,
            currency = 'USD',
            description = null,
            is_default = false,
            feature_ids = [],
        } = body;

        // Use either name or label_suffix
        const planName = (label_suffix || name || '').trim();

        // Validation
        if (!planName) {
            return NextResponse.json(
                { error: "Plan name (or label_suffix) is required." },
                { status: 400 }
            );
        }

        if (!plan_type_id) {
            return NextResponse.json(
                { error: "plan_type_id is required." },
                { status: 400 }
            );
        }

        if (!duration) {
            return NextResponse.json(
                { error: "duration is required." },
                { status: 400 }
            );
        }

        if (price == null || price < 0) {
            return NextResponse.json(
                { error: "Price must be a positive number." },
                { status: 400 }
            );
        }

        if (!Array.isArray(feature_ids)) {
            return NextResponse.json(
                { error: "feature_ids must be an array of UUIDs." },
                { status: 400 }
            );
        }

        // Convert duration to months
        const durationMonths = durationToDurationMonths(duration);

        // Insert plan + features (atomic transaction)
        const sql = `
            WITH inserted AS (
                INSERT INTO subscription_plans (
                    plan_type_id,
                    label_suffix,
                    duration_months,
                    price,
                    currency,
                    description,
                    is_default,
                    is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
                RETURNING id, label_suffix, plan_type_id, duration_months, price, currency, description, is_default, is_active, created_at
            ),
            insert_features AS (
                INSERT INTO plan_features (plan_id, feature_id)
                SELECT i.id, f
                FROM inserted i,
                     unnest($8::uuid[]) AS f
            )
            SELECT 
                i.id, 
                i.label_suffix,
                i.plan_type_id,
                i.duration_months,
                i.price,
                i.currency,
                i.description,
                i.is_default,
                i.is_active,
                i.created_at,
                pt.name as plan_type_name
            FROM inserted i
            JOIN plan_types pt ON i.plan_type_id = pt.id;
        `;

        const params = [
            plan_type_id,
            planName,
            durationMonths,
            price,
            currency,
            description,
            is_default,
            feature_ids,
        ];

        const result = await query(sql, params);
        const newPlan = result.rows[0];

        // Fetch the features for the response
        const featuresResult = await query(
            `SELECT f.id, f.label, f.description
             FROM features f
             JOIN plan_features pf ON f.id = pf.feature_id
             WHERE pf.plan_id = $1`,
            [newPlan.id]
        );

        const response = {
            id: newPlan.id,
            plan_type_id: newPlan.plan_type_id,
            plan_type_name: newPlan.plan_type_name,
            name: newPlan.label_suffix,
            label_suffix: newPlan.label_suffix,
            duration: durationMonthsToDuration(newPlan.duration_months),
            duration_months: newPlan.duration_months,
            price: Number(newPlan.price),
            currency: newPlan.currency,
            description: newPlan.description,
            is_default: Boolean(newPlan.is_default),
            is_active: Boolean(newPlan.is_active),
            features: featuresResult.rows,
            created_at: newPlan.created_at
        };

        return NextResponse.json(response, { status: 201 });

    } catch (error: any) {
        if (error.code === "23505") {
            return NextResponse.json(
                { error: "A subscription plan with this name already exists." },
                { status: 409 }
            );
        }

        if (error.code === "23503") {
            return NextResponse.json(
                { error: "Invalid plan_type_id or feature_ids provided." },
                { status: 400 }
            );
        }

        console.error("POST /api/subscription_plans error:", error);
        return NextResponse.json(
            { error: "Server error while creating subscription plan." },
            { status: 500 }
        );
    }
}

// ----------------------------
// DELETE → delete a subscription plan by ID (query param)
// ----------------------------
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Subscription plan ID is required." },
                { status: 400 }
            );
        }

        // Check if the plan exists first
        const check = await query(
            `SELECT id, label_suffix FROM subscription_plans WHERE id = $1`,
            [id]
        );

        if (check.rowCount === 0) {
            return NextResponse.json(
                { error: "Subscription plan not found." },
                { status: 404 }
            );
        }

        // Delete plan (cascade will handle plan_features)
        const result = await query(
            `DELETE FROM subscription_plans WHERE id = $1 RETURNING id`,
            [id]
        );

        return NextResponse.json(
            {
                message: "Subscription plan deleted successfully.",
                id: result.rows[0].id,
            },
            { status: 200 }
        );

    } catch (error: any) {
        if (error.code === "23503") {
            return NextResponse.json(
                {
                    error:
                        "Cannot delete this plan because it is linked to users, subscriptions, or other records.",
                },
                { status: 409 }
            );
        }

        console.error("DELETE /api/subscription_plans error:", error);
        return NextResponse.json(
            { error: "Failed to delete subscription plan." },
            { status: 500 }
        );
    }
}