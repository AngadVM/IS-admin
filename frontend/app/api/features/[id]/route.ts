// app/api/features/[id]/route.ts
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
        { error: "Feature ID is required." },
        { status: 400 }
      );
    }

    // Step 1 — Check if feature exists
    const check = await query(`SELECT id FROM features WHERE id = $1`, [id]);

    if (check.rowCount === 0) {
      return NextResponse.json(
        { error: "Feature not found." },
        { status: 404 }
      );
    }

    // Step 2 — Attempt delete (foreign key constraints will throw)
    const result = await query(
      `DELETE FROM features WHERE id = $1 RETURNING id`,
      [id]
    );

    return NextResponse.json(
      {
        message: "Feature deleted successfully.",
        id: result.rows[0].id,
      },
      { status: 200 }
    );

  } catch (error: any) {
    // Foreign key constraint error (feature linked to plan, etc.)
    if (error.code === "23503") {
      return NextResponse.json(
        {
          error:
            "Cannot delete this feature because it is linked to subscription plans or other records.",
        },
        { status: 409 }
      );
    }

    console.error("DELETE /api/features/:id error:", error);
    return NextResponse.json(
      { error: "Failed to delete feature." },
      { status: 500 }
    );
  }
}
