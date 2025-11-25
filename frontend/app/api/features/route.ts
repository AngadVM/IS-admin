// app/api/features/route.ts

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Common JSON response wrapper
function handleResponse(data: any, status = 200) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

// ----------------------------
// GET → Fetch all features
// ----------------------------
export async function GET() {
    try {
        const result = await query(
            `SELECT id, label, description, created_at 
             FROM features 
             ORDER BY created_at DESC`
        );

        return handleResponse(result.rows, 200);
    } catch (err) {
        console.error("GET /api/features error:", err);
        return handleResponse({ error: "Failed to fetch features." }, 500);
    }
}

// ----------------------------
// POST → Create new feature
// ----------------------------
export async function POST(req: Request) {
    try {
        const { label, description } = await req.json();

        if (!label?.trim()) {
            return handleResponse({ error: "Feature label is required." }, 400);
        }

        const result = await query(
            `
            INSERT INTO features (label, description) 
            VALUES ($1, $2)
            RETURNING id, label, description, created_at
            `,
            [label, description || null]
        );

        return handleResponse(result.rows[0], 201);
    } catch (err: any) {
        if (err.code === "23505") {
            return handleResponse(
                { error: "A feature with this label already exists." },
                409
            );
        }

        console.error("POST /api/features error:", err);
        return handleResponse({ error: "Failed to create feature." }, 500);
    }
}

// ----------------------------
// DELETE → Delete feature by ID
// ----------------------------
export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();

        if (!id) {
            return handleResponse(
                { error: "Feature ID is required for deletion." },
                400
            );
        }

        const result = await query(
            `DELETE FROM features WHERE id = $1 RETURNING id`,
            [id]
        );

        if (result.rowCount === 0) {
            return handleResponse({ error: "Feature not found." }, 404);
        }

        return handleResponse(
            { message: "Feature deleted successfully.", id },
            200
        );
    } catch (err: any) {
        if (err.code === "23503") {
            return handleResponse(
                {
                    error:
                        "Cannot delete feature: it is linked to a subscription plan.",
                },
                409
            );
        }

        console.error("DELETE /api/features error:", err);
        return handleResponse({ error: "Failed to delete feature." }, 500);
    }
}
