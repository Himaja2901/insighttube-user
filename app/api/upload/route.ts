import { NextResponse } from "next/server";
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

  const loadingTask = pdfjsLib.getDocument({
    data,
  });

  const pdfDocument = await loadingTask.promise;

  let fullText = "";

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
    const page = await pdfDocument.getPage(pageNumber);

    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item: any) => {
        if ("str" in item) {
          return item.str;
        }

        return "";
      })
      .join(" ");

    fullText += pageText + "\n";
  }

  return fullText;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "No file was received.",
        },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";

    // DOCX
    if (fileName.endsWith(".docx")) {
      const result = await mammoth.extractRawText({
        buffer,
      });

      text = result.value;
    }

    // PDF
    else if (fileName.endsWith(".pdf")) {
      text = await extractPdfText(buffer);
    }

    // TXT
    else if (fileName.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    }

    // Unsupported format
    else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported file format. Please upload a PDF, DOCX, or TXT file.",
        },
        { status: 400 }
      );
    }

    const summary = createSummary(text);
    const keyInsights = createKeyInsights(text);

    return NextResponse.json({
      success: true,
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