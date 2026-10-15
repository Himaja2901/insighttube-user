
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Identify the currently signed-in Clerk user.
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    console.log(
  "Supabase URL format:",
  supabaseUrl
    ? {
        startsWithHttps: supabaseUrl.startsWith("https://"),
        hostname: new URL(supabaseUrl).hostname,
      }
    : "Missing"
);
    console.log("Supabase URL details:", supabaseUrl ? {
  hostname: new URL(supabaseUrl).hostname,
  pathname: new URL(supabaseUrl).pathname,
  search: new URL(supabaseUrl).search,
} : "Missing");
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error("Supabase server configuration is missing.");

      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    // This client must only be used on the server.
    const supabase = createClient(
      supabaseUrl,
      supabaseSecretKey
    );

    // Return records belonging only to this Clerk user.
    const { data, error } = await supabase
      .from("research_history")
      .select(
        "id, file_name, summary, key_insights, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Research history query failed:", error.message);

      return NextResponse.json(
        { success: false, message: "Unable to load research history" },
        { status: 500 }
      );
    }

    const history = (data ?? []).map((record) => ({
      id: record.id,
      fileName: record.file_name,
      summary: record.summary ?? "",
      keyInsights: record.key_insights ?? [],
      createdAt: record.created_at,
    }));

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Research history error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load research history" },
      { status: 500 }
    );
  }
}
