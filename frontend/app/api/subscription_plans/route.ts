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


// GET → fetch all subscription plans + features

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
                sp.offer_type,
                sp.offer_value,
                sp.tag,
                sp.created_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', f.id,
                            'label', f.label,
                            'description', f.description,
                            'feature_key', pf.feature_key,
                            'limit_value', pf.limit_value
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
            offer_type: row.offer_type,
            offer_value: row.offer_value ? Number(row.offer_value) : null,
            tag: row.tag,
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


// POST → create new subscription plan + insert features with limits
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
            offer_type = null,
            offer_value = null,
            tag = null,
            features = [], // Array of {feature_id, feature_key?, limit_value?}
            feature_ids = [], // Legacy support
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

        // Validate offer_type if provided
        if (offer_type && !['percentage', 'fixed'].includes(offer_type)) {
            return NextResponse.json(
                { error: "offer_type must be 'percentage' or 'fixed'." },
                { status: 400 }
            );
        }

        // Convert duration to months
        const durationMonths = durationToDurationMonths(duration);

        // Prepare features array (support both new format and legacy)
        let featuresArray = features;
        if (featuresArray.length === 0 && feature_ids.length > 0) {
            // Legacy format - just feature IDs
            featuresArray = feature_ids.map((id: string) => ({ feature_id: id }));
        }

        if (!Array.isArray(featuresArray)) {
            return NextResponse.json(
                { error: "features must be an array." },
                { status: 400 }
            );
        }

        // Insert plan
        const insertPlanSql = `
            INSERT INTO subscription_plans (
                plan_type_id,
                label_suffix,
                duration_months,
                price,
                currency,
                description,
                is_default,
                is_active,
                offer_type,
                offer_value,
                tag
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, $9, $10)
            RETURNING id, label_suffix, plan_type_id, duration_months, price, 
                      currency, description, is_default, is_active, 
                      offer_type, offer_value, tag, created_at
        `;

        const planParams = [
            plan_type_id,
            planName,
            durationMonths,
            price,
            currency,
            description,
            is_default,
            offer_type,
            offer_value,
            tag,
        ];

        const planResult = await query(insertPlanSql, planParams);
        const newPlan = planResult.rows[0];

        // Insert features with their limits
        if (featuresArray.length > 0) {
            const featureInsertPromises = featuresArray.map((feature: any) => {
                return query(
                    `INSERT INTO plan_features (plan_id, feature_id, feature_key, limit_value)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        newPlan.id,
                        feature.feature_id,
                        feature.feature_key || null,
                        feature.limit_value || null
                    ]
                );
            });
            await Promise.all(featureInsertPromises);
        }

        // Fetch plan type name
        const planTypeResult = await query(
            `SELECT name FROM plan_types WHERE id = $1`,
            [newPlan.plan_type_id]
        );

        // Fetch the features for the response
        const featuresResult = await query(
            `SELECT f.id, f.label, f.description, pf.feature_key, pf.limit_value
             FROM features f
             JOIN plan_features pf ON f.id = pf.feature_id
             WHERE pf.plan_id = $1`,
            [newPlan.id]
        );

        const response = {
            id: newPlan.id,
            plan_type_id: newPlan.plan_type_id,
            plan_type_name: planTypeResult.rows[0]?.name || '',
            name: newPlan.label_suffix,
            label_suffix: newPlan.label_suffix,
            duration: durationMonthsToDuration(newPlan.duration_months),
            duration_months: newPlan.duration_months,
            price: Number(newPlan.price),
            currency: newPlan.currency,
            description: newPlan.description,
            is_default: Boolean(newPlan.is_default),
            is_active: Boolean(newPlan.is_active),
            offer_type: newPlan.offer_type,
            offer_value: newPlan.offer_value ? Number(newPlan.offer_value) : null,
            tag: newPlan.tag,
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

// DELETE → delete a subscription plan by ID (query param)

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