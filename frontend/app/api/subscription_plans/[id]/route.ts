// app/api/subscription_plans/[id]/route.ts

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// ----------------------------
// DELETE → delete a subscription plan by ID
// ----------------------------
export async function DELETE(
    req: Request,
    context: { params: { id: string } }
) {
    try {
        const { id } = context.params;

        if (!id) {
            return NextResponse.json(
                { error: "Subscription plan ID is required." },
                { status: 400 }
            );
        }

        // Optional: Check if the plan exists first
        const check = await query(`SELECT id FROM subscription_plans WHERE id = $1`, [id]);
        if (check.rowCount === 0) {
            return NextResponse.json(
                { error: "Subscription plan not found." },
                { status: 404 }
            );
        }

        // Try deleting — will fail automatically if FK constraints exist
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
        // Foreign key constraint (plan linked to something)
        if (error.code === "23503") {
            return NextResponse.json(
                {
                    error:
                        "Cannot delete this plan because it is linked to users, subscriptions, or other records.",
                },
                { status: 409 }
            );
        }

        console.error("DELETE /api/subscription_plans/:id error:", error);
        return NextResponse.json(
            { error: "Failed to delete subscription plan." },
            { status: 500 }
        );
    }
}
