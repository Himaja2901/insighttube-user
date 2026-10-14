
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const HISTORY_FILE = path.join(
  process.cwd(),
  "data",
  "research-history.json"
);

export async function GET() {
  try {
    const content = await fs.readFile(HISTORY_FILE, "utf8");
    const history = JSON.parse(content);

    return NextResponse.json({
      success: true,
      history: Array.isArray(history) ? history : [],
    });
  } catch (error) {
    console.error("Research history read error:", error);

    return NextResponse.json({
      success: true,
      history: [],
    });
  }
}
