import { type NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Create a mysql2 connection pool (configure with your DB credentials)
const pool = mysql.createPool({
  host: "localhost",
  user: "your_user",
  password: "your_password",
  database: "your_database",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const id = Number.parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    if (Object.keys(body).length === 1 && "is_active" in body) {
      const [result] = await pool.execute(
        "UPDATE app_features SET is_active = ? WHERE id = ?",
        [body.is_active ? 1 : 0, id]
      );
    } else {
      const { title, description, icon, gradient, is_active } = body;

      const [result] = await pool.execute(
        `UPDATE app_features 
         SET title = ?, description = ?, icon = ?, gradient = ?, is_active = ?
         WHERE id = ?`,
        [title, description, icon, gradient, is_active ? 1 : 0, id]
      );
    }

    const [rows] = await pool.execute(
      "SELECT * FROM app_features WHERE id = ?",
      [id]
    );
    const updatedFeature = (rows as any[])[0];

    if (!updatedFeature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, feature: updatedFeature });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update feature" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number.parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await pool.execute("DELETE FROM app_features WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to delete feature" },
      { status: 500 }
    );
  }
}
