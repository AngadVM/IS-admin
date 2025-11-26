// app/api/plan_types/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Plan Type ID is required." },
        { status: 400 }
      );
    }

    // Step 1 — Check if plan_type exists
    const check = await query(`SELECT id FROM plan_types WHERE id = $1`, [id]);

    if (check.rowCount === 0) {
      return NextResponse.json(
        { error: "Plan type not found." },
        { status: 404 }
      );
    }

    // Step 2 — Attempt delete (FK constraints on subscription_plans will throw)
    const result = await query(
      `DELETE FROM plan_types WHERE id = $1 RETURNING id`,
      [id]
    );

    return NextResponse.json(
      {
        message: "Plan type deleted successfully.",
        id: result.rows[0].id,
      },
      { status: 200 }
    );

  } catch (error: any) {
    // Cannot delete because subscription_plans depend on this
    if (error.code === "23503") {
      return NextResponse.json(
        {
          error:
            "Cannot delete this plan type because it is linked to subscription plans or other records.",
        },
        { status: 409 }
      );
    }

    console.error("DELETE /api/plan_types/:id error:", error);
    return NextResponse.json(
      { error: "Failed to delete plan type." },
      { status: 500 }
    );
  }
}
