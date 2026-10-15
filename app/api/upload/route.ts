
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "path";
import { pathToFileURL } from "url";

export const runtime = "nodejs";

GlobalWorkerOptions.workerSrc = pathToFileURL(
  path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs"
  )
).href;

function createSummary(text: string) {
  const cleanText = text.replace(/\s+/g, " ").trim();

  if (!cleanText) {
    return "No readable text was found in this document.";
  }

  const sentences = cleanText
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20);

  if (sentences.length === 0) {
    return cleanText.slice(0, 400);
  }

  return sentences.slice(0, 3).join(". ") + ".";
}

function createKeyInsights(text: string) {
  const insights: string[] = [];
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes("education") ||
    lowerText.includes("b.tech") ||
    lowerText.includes("bachelor")
  ) {
    insights.push(
      "The document contains educational background information."
    );
  }

  if (
    lowerText.includes("skills") ||
    lowerText.includes("technical skills")
  ) {
    insights.push(
      "The document contains technical or professional skills."
    );
  }

  if (
    lowerText.includes("project") ||
    lowerText.includes("projects")
  ) {
    insights.push(
      "The document includes project-related experience."
    );
  }

  if (
    lowerText.includes("certification") ||
    lowerText.includes("certificate")
  ) {
    insights.push(
      "The document includes certifications or courses."
    );
  }

  if (
    lowerText.includes("achievement") ||
    lowerText.includes("award")
  ) {
    insights.push(
      "The document contains achievements or awards."
    );
  }

  if (insights.length === 0) {
    insights.push(
      "Important information was successfully extracted from the document."
    );
    insights.push(
      "The document is ready for further analysis."
    );
  }

  return insights;
}

async function extractPdfText(buffer: Buffer) {
  const data = new Uint8Array(buffer);

  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDocument = await loadingTask.promise;

  let fullText = "";

  for (
    let pageNumber = 1;
    pageNumber <= pdfDocument.numPages;
    pageNumber++
  ) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");

    fullText += pageText + "\n";
  }

  return fullText;
}
function cleanExtractedText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "")
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
}
export async function POST(request: Request) {
  try {
    // Require a signed-in Clerk user.
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Please sign in to upload documents." },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
    console.log("Supabase URL loaded:", Boolean(supabaseUrl));
console.log("Supabase secret loaded:", Boolean(supabaseSecretKey));

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error("Supabase server configuration is missing.");

      return NextResponse.json(
        { success: false, error: "Server configuration error." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file was received." },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = "";

    if (fileName.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (fileName.endsWith(".pdf")) {
      text = await extractPdfText(buffer);
    } else if (fileName.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported file format. Please upload a PDF, DOCX, or TXT file.",
        },
        { status: 400 }
      );
    }
    text = cleanExtractedText(text);
    const summary = createSummary(text);
    const keyInsights = createKeyInsights(text);

    // Save the document under the authenticated user's Clerk ID.
    const supabase = createClient(
      supabaseUrl,
      supabaseSecretKey
    );

    const { data: savedRecord, error: saveError } = await supabase
      .from("research_history")
      .insert({
        user_id: userId,
        file_name: file.name,
        summary,
        key_insights: keyInsights,
        document_text: text,
      })
      .select("id, created_at")
      .single();

    if (saveError) {
      console.error("Saving research history failed:", saveError.message);

      return NextResponse.json(
        {
          success: false,
          error: "The document was processed, but its history could not be saved.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: savedRecord.id,
      createdAt: savedRecord.created_at,
      fileName: file.name,
      text,
      summary,
      keyInsights,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "The server could not process this document.",
      },
      { status: 500 }
    );
  }
}
