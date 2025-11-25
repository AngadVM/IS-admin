// app/api/subscription_plans/route.ts

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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
                sp.name,
                sp.duration,
                sp.price,
                sp.currency,
                sp.is_active,
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
            ORDER BY sp.price ASC;
        `;

        const result = await query(sql);

        const plans = result.rows.map((row: any) => ({
            ...row,
            price: Number(row.price),
            is_active: Boolean(row.is_active),
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
            plan_type_id,
            duration,
            price,
            currency,
            feature_ids = [],
        } = body;

        // --------------------
        // Validation
        // ----------------------
        if (!name?.trim()) {
            return NextResponse.json({ error: "Plan name is required." }, { status: 400 });
        }

        if (!plan_type_id) {
            return NextResponse.json({ error: "plan_type_id is required." }, { status: 400 });
        }

        if (!duration) {
            return NextResponse.json({ error: "duration is required." }, { status: 400 });
        }

        if (price == null || price < 0) {
            return NextResponse.json({ error: "Price must be a positive number." }, { status: 400 });
        }

        if (!currency) {
            return NextResponse.json({ error: "currency is required." }, { status: 400 });
        }

        if (!Array.isArray(feature_ids)) {
            return NextResponse.json(
                { error: "feature_ids must be an array of UUIDs." },
                { status: 400 }
            );
        }

        // --------------------
        // Insert plan + features (atomic)
        // --------------------
        const sql = `
            WITH inserted AS (
                INSERT INTO subscription_plans (
                    plan_type_id,
                    name,
                    duration,
                    price,
                    currency,
                    is_active
                )
                VALUES ($1, $2, $3, $4, $5, TRUE)
                RETURNING id, name
            ),
            insert_features AS (
                INSERT INTO plan_features (plan_id, feature_id)
                SELECT i.id, f
                FROM inserted i,
                     unnest($6::uuid[]) AS f
            )
            SELECT id, name FROM inserted;
        `;

        const params = [
            plan_type_id,
            name.trim(),
            duration,
            price,
            currency,
            feature_ids,
        ];

        const result = await query(sql, params);
        const newPlan = result.rows[0];

        return NextResponse.json(
            {
                id: newPlan.id,
                name: newPlan.name,
                message: "Subscription plan created successfully.",
            },
            { status: 201 }
        );

        } catch (error: any) {
            if (error.code === "23505") {
                return NextResponse.json(
                    { error: "A subscription plan with this name already exists." },
                    { status: 409 }
                );
            }
    
            console.error("POST /api/subscription_plans error:", error);
            return NextResponse.json(
                { error: "Server error while creating subscription plan." },
                { status: 500 }
            );
        }
    }
