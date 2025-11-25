// app/api/plan_types/route.ts

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Helper for consistent JSON responses
function handleResponse(data: any, status = 200) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

// ----------------------------
// GET → fetch all plan types
// ----------------------------
export async function GET() {
    try {
        const result = await query("SELECT * FROM plan_types ORDER BY id ASC");
        return handleResponse(result.rows, 200);
    } catch (err) {
        console.error("GET /api/plan_types error:", err);
        return handleResponse({ error: "Failed to fetch plan types." }, 500);
    }
}

// ----------------------------
// POST → create new plan type
// ----------------------------
export async function POST(req: Request) {
    try {
        const { name } = await req.json();

        if (!name) {
            return handleResponse({ error: "Name is required." }, 400);
        }

        const result = await query(
            "INSERT INTO plan_types (name) VALUES ($1) RETURNING *",
            [name]
        );

        return handleResponse(result.rows[0], 201);
    } catch (err: any) {
        console.error("POST /api/plan_types error:", err);

        if (err.code === "23505") {
            return handleResponse(
                { error: "Plan Type name must be unique." },
                409
            );
        }

        return handleResponse({ error: "Failed to create plan type." }, 500);
    }
}

// ----------------------------
// DELETE → delete a plan type by ID
// ----------------------------
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return handleResponse({ error: "Missing plan type ID." }, 400);
        }

        const result = await query(
            "DELETE FROM plan_types WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rowCount === 0) {
            return handleResponse({ error: "Plan Type not found." }, 404);
        }

        return handleResponse({ message: "Plan Type deleted." }, 200);
    } catch (error: any) {
        if (error.code === "23503") {
            return handleResponse(
                {
                    error:
                        "Cannot delete plan type: it is linked to Subscription Plans.",
                },
                409
            );
        }

        console.error("DELETE /api/plan_types error:", error);
        return handleResponse({ error: "Failed to delete plan type." }, 500);
    }
}
