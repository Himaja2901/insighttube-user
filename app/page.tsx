"use client";

import { useEffect, useState } from "react";

type ResearchRecord = {
  id: string;
  fileName: string;
  summary: string;
  keyInsights: string[];
  createdAt: string;
};

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [summary, setSummary] = useState("");
  const [keyInsights, setKeyInsights] = useState<string[]>([]);
  const [researchHistory, setResearchHistory] = useState<ResearchRecord[]>([]);
const [historyLoading, setHistoryLoading] = useState(true);


const loadResearchHistory = async () => {
  try {
    const response = await fetch("/api/research-history");

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok || !contentType.includes("application/json")) {
      console.error(
        "Research History API returned an unexpected response:",
        response.status,
        await response.text()
      );
      return;
    }

    
const responseText = await response.text();

if (!responseText.trim()) {
  console.error("Research History API returned an empty response.");
  return;
}

let data;

try {
  data = JSON.parse(responseText);
} catch (error) {
  console.error("Research History API returned invalid JSON:", responseText);
  return;
}
    if (data.success && Array.isArray(data.history)) {
      setResearchHistory(data.history);
    } else {
      console.error("Unexpected Research History response:", data);
    }
  } catch (error) {
    console.error("Failed to load research history:", error);
  } finally {
    setHistoryLoading(false);
  }
};

  

useEffect(() => {
  loadResearchHistory();
}, []);

  
const handleUpload = async () => {
  if (!selectedFile) {
    setMessage("Please choose a document first.");
    return;
  }

  setUploading(true);
  setMessage("");
  setAnswer("");
  setQuestion("");

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();

    let data;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      console.error("Upload API returned non-JSON response:", responseText);
      setMessage("The server returned an invalid response. Check the terminal.");
      return;
    }

    if (!response.ok) {
      console.error("Upload failed:", response.status, data);
      setMessage(data.error || data.message || "Upload failed.");
      return;
    }

    console.log("Extracted document text:", data.text);

    setMessage("✅ Document uploaded successfully!");
    setDocumentText(data.text);
    setSummary(data.summary);
    setKeyInsights(data.keyInsights);

    await loadResearchHistory();
  } catch (error) {
    console.error("Upload request failed:", error);
    setMessage("❌ Something went wrong while uploading.");
  } finally {
    setUploading(false);
  }
};

   const handleAskAI = () => {
    if (!question.trim()) {
      setAnswer("Please enter a question about your document.");
      return;
    }

    setAsking(true);
    setAnswer("");

    setTimeout(() => {
      const lowerQuestion = question.toLowerCase();
      const lowerDocument = documentText.toLowerCase();

      // Helper function to extract content between document sections
      const getSection = (
        startSection: string,
        endSections: string[]
      ) => {
        const startIndex = lowerDocument.indexOf(startSection);

        if (startIndex === -1) {
          return null;
        }

        let endIndex = documentText.length;

        for (const endSection of endSections) {
          const index = lowerDocument.indexOf(
            endSection,
            startIndex + startSection.length
          );

          if (index !== -1 && index < endIndex) {
            endIndex = index;
          }
        }

        return documentText.slice(startIndex, endIndex).trim();
      };

      if (
        lowerQuestion.includes("technical skill") ||
        lowerQuestion.includes("skills") ||
        lowerQuestion.includes("technology") ||
        lowerQuestion.includes("technologies")
      ) {
        const skills = getSection("technical skills", [
          "projects",
          "leadership & responsibilities",
          "certifications",
          "achievements",
          "workshops & technical learning",
          "areas of interest",
          "additional information",
        ]);

        setAnswer(
          skills
            ? `Based on your document:\n\n${skills}`
            : "I couldn't find a Technical Skills section in your document."
        );
      } else if (
        lowerQuestion.includes("education") ||
        lowerQuestion.includes("qualification") ||
        lowerQuestion.includes("degree")
      ) {
        const education = getSection("education", [
          "technical skills",
          "projects",
          "leadership & responsibilities",
          "certifications",
          "achievements",
          "workshops & technical learning",
          "areas of interest",
          "additional information",
        ]);

        setAnswer(
          education
            ? `Based on your document:\n\n${education}`
            : "I couldn't find an Education section in your document."
        );
      } else if (
        lowerQuestion.includes("project") ||
        lowerQuestion.includes("projects")
      ) {
        const projects = getSection("projects", [
          "leadership & responsibilities",
          "certifications",
          "achievements",
          "workshops & technical learning",
          "areas of interest",
          "additional information",
        ]);

        setAnswer(
          projects
            ? `Based on your document:\n\n${projects}`
            : "I couldn't find a Projects section in your document."
        );
      } else if (
        lowerQuestion.includes("certification") ||
        lowerQuestion.includes("certificate")
      ) {
        const certifications = getSection("certifications", [
          "achievements",
          "workshops & technical learning",
          "areas of interest",
          "additional information",
        ]);

        setAnswer(
          certifications
            ? `Based on your document:\n\n${certifications}`
            : "I couldn't find a Certifications section in your document."
        );
      } else if (
        lowerQuestion.includes("achievement") ||
        lowerQuestion.includes("award") ||
        lowerQuestion.includes("prize")
      ) {
        const achievements = getSection("achievements", [
          "workshops & technical learning",
          "areas of interest",
          "additional information",
        ]);

        setAnswer(
          achievements
            ? `Based on your document:\n\n${achievements}`
            : "I couldn't find an Achievements section in your document."
        );
      } else if (
        lowerQuestion.includes("interest") ||
        lowerQuestion.includes("interests")
      ) {
        const interests = getSection("areas of interest", [
          "additional information",
        ]);

        setAnswer(
          interests
            ? `Based on your document:\n\n${interests}`
            : "I couldn't find an Areas of Interest section in your document."
        );
      } else {
        setAnswer(
          "I can answer questions about your document. Try asking about your technical skills, education, projects, certifications, achievements, or areas of interest."
        );
      }

      setAsking(false);
    }, 700);
  };

  // Get file type from the selected file
  const getFileType = () => {
    if (!selectedFile) return "Document";

    const extension = selectedFile.name
      .split(".")
      .pop()
      ?.toUpperCase();

    return extension || "Document";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              InsightTube<span className="text-purple-600">-AI</span>
            </h1>

            <p className="text-xs font-medium text-purple-600">
              AI Document Assistant
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-800">User</p>
              <p className="text-xs text-gray-500">Welcome back</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700 ring-4 ring-purple-50">
              U
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {/* Hero */}
        <section className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700">
            ✨ Intelligent Document Analysis
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Understand your documents
            <span className="block text-purple-600">in seconds.</span>
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Upload your resume, project report, notes, or any supported
            document and get a quick summary, key insights, and answers.
          </p>
        </section>

        {/* Upload Card */}
        <section className="rounded-3xl border border-purple-100 bg-white p-6 shadow-xl shadow-purple-100/50 sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-3xl shadow-sm">
              📄
            </div>

            <h3 className="text-xl font-bold text-gray-900">
              Upload your document
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Upload your resume, project report, notes or any other document.
            </p>

            <p className="mt-2 text-xs font-medium text-purple-500">
              Supported formats: PDF, DOCX, TXT
            </p>

            <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 hover:shadow-purple-300">
              📁 Choose File

              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    setSelectedFile(file);
                    setMessage("");
                    setDocumentText("");
                    setSummary("");
                    setKeyInsights([]);
                    setAnswer("");
                    setQuestion("");
                  }
                }}
              />
            </label>

            {/* Selected File */}
            {selectedFile && (
              <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-purple-100 bg-purple-50/70 p-5 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    📄
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-800">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="mt-4 w-full rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading
                    ? "⏳ Analyzing document..."
                    : "Upload Document"}
                </button>
              </div>
            )}

            {/* Message */}
            {message && (
              <div
                className={`mx-auto mt-5 max-w-xl rounded-xl px-4 py-3 text-sm font-medium ${
                  message.includes("successfully")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </section>

        {/* Results */}
        
{/* Research History */}
<section className="mx-auto mt-8 max-w-4xl rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
  <div className="mb-5 flex items-center justify-between gap-3">
    <div>
      <h2 className="text-xl font-bold text-gray-900">
        Research History
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Revisit your previously analyzed documents.
      </p>
    </div>

    <button
      onClick={loadResearchHistory}
      className="rounded-lg border border-purple-200 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50"
    >
      Refresh
    </button>
  </div>

  {historyLoading ? (
    <p className="text-sm text-gray-500">Loading research history...</p>
  ) : researchHistory.length === 0 ? (
    <div className="rounded-xl bg-gray-50 p-6 text-center">
      <p className="font-medium text-gray-700">
        No research history yet
      </p>
      <p className="mt-2 text-sm text-gray-500">
        Upload a document to see its summary and insights here.
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      {researchHistory.map((record) => (
        <article
          key={record.id}
          className="rounded-xl border border-gray-200 p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="break-words font-semibold text-gray-900">
              📄 {record.fileName}
            </h3>
            <p className="shrink-0 text-xs text-gray-500">
              {new Date(record.createdAt).toLocaleDateString()}
            </p>
          </div>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            {record.summary}
          </p>

          {record.keyInsights?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                Key Insights
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                {record.keyInsights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ))}
    </div>
  )}
</section>

        {documentText && (
          <div className="mx-auto mt-8 max-w-4xl space-y-6">
            {/* Document Information Card */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-xl">
                  📄
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Document Overview
                  </h3>

                  <p className="text-xs text-gray-500">
                    Information about your uploaded document
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      File Name
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                      {selectedFile?.name || "Uploaded document"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 sm:flex sm:items-center sm:gap-8">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        File Type
                      </p>

                      <p className="mt-1 text-sm font-semibold text-purple-600">
                        {getFileType()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        File Size
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {selectedFile
                          ? `${(
                              selectedFile.size /
                              1024 /
                              1024
                            ).toFixed(2)} MB`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3">
                  <span>✓</span>

                  <p className="text-sm font-medium text-green-700">
                    Successfully analyzed
                  </p>
                </div>
              </div>
            </section>

           {/* AI Summary */}
<div className="rounded-2xl bg-white p-6 shadow-sm">
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-xl">
      ✨
    </div>

    <div>
      <h2 className="text-xl font-bold text-gray-900">
        AI Summary
      </h2>
      <p className="text-sm text-gray-500">
        A quick overview of your document
      </p>
    </div>
  </div>

  {/* Summary */}
  <div className="mt-6 rounded-xl bg-gray-50 p-5">
    <h3 className="font-semibold text-gray-900">
      Summary
    </h3>

    <p className="mt-3 leading-7 text-gray-600">
      {summary}
    </p>
  </div>

  {/* Document Focus */}
  <div className="mt-5">
    <div>
  <h3 className="font-semibold text-gray-900">
    🎯 Document Focus
  </h3>
  <p className="mt-1 text-xs text-gray-500">
    Key topics identified in your document
  </p>
</div>

    <div className="mt-3 flex flex-wrap gap-3">
      {documentText.toLowerCase().includes("cyber") && (
        <span className="whitespace-nowrap rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700">
          Cyber Security
        </span>
      )}

      {documentText.toLowerCase().includes("web") && (
        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
          Web Development
        </span>
      )}

      {documentText.toLowerCase().includes("generative ai") ||
      documentText.toLowerCase().includes("generative artificial intelligence") ||
      documentText.toLowerCase().includes("gemini") ? (
        <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
          Generative AI
        </span>
      ) : null}

      {documentText.toLowerCase().includes("machine learning") && (
        <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
          Machine Learning
        </span>
      )}

      {documentText.toLowerCase().includes("javascript") && (
        <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700">
          JavaScript
        </span>
      )}

      {documentText.toLowerCase().includes("python") && (
        <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
          Python
        </span>
      )}
    </div>
  </div>

  {/* Analysis Status */}
  <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">
      ✓
    </div>

    <div>
      <p className="font-semibold text-green-800">
        Analysis Status
      </p>

      <p className="text-sm text-green-700">
        Successfully analyzed
      </p>
    </div>
  </div>
</div>

            {/* Key Insights */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                  🔍
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">Key Insights</h3>

                  <p className="text-xs text-gray-500">
                    Important points extracted from your document
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {keyInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-purple-200 hover:bg-purple-50/40"
                  >
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600">
                        {index + 1}
                      </span>

                      <p className="text-sm leading-6 text-gray-600">
                        {insight}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Ask AI */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-xl">
                  💬
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">Ask AI</h3>

                  <p className="text-xs text-gray-500">
                    Ask questions about your uploaded document
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAskAI();
                    }
                  }}
                  placeholder="e.g. What are my technical skills?"
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-100"
                />

                <button
                  onClick={handleAskAI}
                  disabled={asking}
                  className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {asking ? "Thinking..." : "Ask AI"}
                </button>
              </div>

              <div className="mt-4">
  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
    Suggested Questions
  </p>

  <div className="flex flex-wrap gap-3">
    {[
      {
        label: "💻 Technical Skills",
        question: "What are my technical skills?",
      },
      {
        label: "🎓 Education",
        question: "What is my educational qualification?",
      },
      {
        label: "🚀 Projects",
        question: "What are my projects?",
      },
      {
        label: "📜 Certifications",
        question: "What are my certifications?",
      },
      {
        label: "🏆 Achievements",
        question: "What are my achievements?",
      },
      {
        label: "👥 Leadership",
        question: "What are my leadership responsibilities?",
      },
      {
        label: "🎯 Areas of Interest",
        question: "What are my areas of interest?",
      },
    ].map((suggestion) => (
      <button
        key={suggestion.label}
        onClick={() => {
  setQuestion(suggestion.question);

  setAsking(true);
  setAnswer("");

  setTimeout(() => {
    const lowerQuestion = suggestion.question.toLowerCase();
    const lowerDocument = documentText.toLowerCase();

    const getSection = (
      startSection: string,
      endSections: string[]
    ) => {
      const startIndex = lowerDocument.indexOf(startSection);

      if (startIndex === -1) {
        return null;
      }

      let endIndex = documentText.length;

      for (const endSection of endSections) {
        const index = lowerDocument.indexOf(
          endSection,
          startIndex + startSection.length
        );

        if (index !== -1 && index < endIndex) {
          endIndex = index;
        }
      }

      return documentText.slice(startIndex, endIndex).trim();
    };

    let result = "";

    if (
      lowerQuestion.includes("technical skill") ||
      lowerQuestion.includes("skills")
    ) {
      result =
        getSection("technical skills", [
          "projects",
          "leadership & responsibilities",
          "certifications",
          "achievements",
          "workshops & technical learning",
          "areas of interest",
          "additional information",
        ]) ||
        "I couldn't find a Technical Skills section in your document.";
    } else if (
      lowerQuestion.includes("education") ||
      lowerQuestion.includes("qualification")
    ) {
      result =
       getSection("education ", [
          "technical skills",
          "projects",
          "leadership & responsibilities",
          "certifications",
          "achievements",
          "workshops & technical learning",
          "areas of interest",
          "additional information",
        ]) ||
        "I couldn't find an Education section in your document.";
    } else if (lowerQuestion.includes("project")) {
      result =
        getSection("projects", [
          "leadership & responsibilities",
          "certifications",
          "achievements",
          "workshops & technical learning",
          "areas of interest",
          "additional information",
        ]) ||
        "I couldn't find a Projects section in your document.";
    } else if (
      lowerQuestion.includes("certification") ||
      lowerQuestion.includes("certificate")
    ) {
      result =
        getSection("certifications", [
          "achievements",
          "workshops & technical learning",
          "areas of interest",
          "additional information",
        ]) ||
        "I couldn't find a Certifications section in your document.";
    } else if (
      lowerQuestion.includes("achievement") ||
      lowerQuestion.includes("award")
    ) {
      result =
        getSection("achievements", [
          "workshops & technical learning",
          "areas of interest",
          "additional information",
        ]) ||
        "I couldn't find an Achievements section in your document.";
    } else if (lowerQuestion.includes("leadership")) {
      result =
        getSection("leadership & responsibilities", [
          "certifications",
          "achievements",
          "workshops & technical learning",
          "areas of interest",
          "additional information",
        ]) ||
        "I couldn't find a Leadership section in your document.";
    } else if (
      lowerQuestion.includes("interest") ||
      lowerQuestion.includes("interests")
    ) {
      result =
        getSection("areas of interest", [
          "additional information",
        ]) ||
        "I couldn't find an Areas of Interest section in your document.";
    } else {
      result =
        "I can answer questions about your uploaded document.";
    }

    setAnswer(`Based on your document:\n\n${result}`);
    setAsking(false);
  }, 500);
}}
        className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-600 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 hover:shadow"
      >
        {suggestion.label}
      </button>
    ))}
  </div>
</div>

              {answer && (
                <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50/60 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-lg">🤖</span>

                    <p className="text-sm font-bold text-gray-900">
                      AI Answer
                    </p>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                    {answer}
                  </p>
                </div>
              )}
            </section>

            {/* Extracted Text */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-xl">
                  📄
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Extracted Document Text
                  </h3>

                  <p className="text-xs text-gray-500">
                    Text extracted from your uploaded file
                  </p>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-600">
                  {documentText}
                </p>
              </div>
            </section>
          </div>
        )}

    {/* How It Works */}
<section className="mx-auto mt-12 max-w-5xl">
  <div className="mb-6 text-center">
    <p className="text-sm font-semibold text-purple-600">
      Simple & Intelligent
    </p>

    <h3 className="mt-1 text-2xl font-bold text-gray-900">
      How InsightTube-AI Works
    </h3>

    <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
      Turn your documents into useful information in just a few simple steps.
    </p>
  </div>

  
    {/* Step 1 */}<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-purple-200 hover:shadow-md">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-xl">
        📤
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-purple-500">
        Step 01
      </p>

      <h4 className="mt-1 font-bold text-gray-900">
        Upload
      </h4>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        Upload your PDF, DOCX, or TXT document.
      </p>
    </div>

    {/* Step 2 */}
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-purple-200 hover:shadow-md">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl">
        📄
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-blue-500">
        Step 02
      </p>

      <h4 className="mt-1 font-bold text-gray-900">
        Extract
      </h4>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        Text is extracted from your uploaded document.
      </p>
    </div>

    {/* Step 3 */}
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-purple-200 hover:shadow-md">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-xl">
        ✨
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-green-500">
        Step 03
      </p>

      <h4 className="mt-1 font-bold text-gray-900">
        Analyze
      </h4>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        Get a summary and important insights from your document.
      </p>
    </div>

    {/* Step 4 */}
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-purple-200 hover:shadow-md">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-xl">
        💬
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-orange-500">
        Step 04
      </p>

      <h4 className="mt-1 font-bold text-gray-900">
        Ask
      </h4>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        Ask questions and quickly find information from your document.
      </p>
    </div>
  </div>
</section>


        {/* Footer */}
        <footer className="py-10 text-center">
          <p className="text-sm text-gray-500">
            © 2026 InsightTube-AI. Intelligent Document Assistant.
          </p>
        </footer>
      </div>
    </main>
  );
}
