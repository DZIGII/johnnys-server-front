import { useEffect, useRef, useState } from "react"
import mammoth from "mammoth"
import Papa from "papaparse"
import { Loader2, Download, FileText } from "lucide-react"

interface Props {
  blob: Blob
  mime: string
  fileName: string
  downloadUrl: string
}

// ── PDF ──────────────────────────────────────────────────────────────────────

function PdfViewer({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])

  if (!url) return null

  return (
    <embed
      src={url}
      type="application/pdf"
      style={{ width: "100%", height: "75vh", border: "none", display: "block" }}
    />
  )
}

// ── CSV ──────────────────────────────────────────────────────────────────────

function CsvViewer({ blob }: { blob: Blob }) {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [err, setErr] = useState(false)

  useEffect(() => {
    blob.text().then((text) => {
      const result = Papa.parse<string[]>(text, { skipEmptyLines: true })
      if (result.errors.length && result.data.length === 0) { setErr(true); return }
      const [head, ...body] = result.data
      setHeaders(head)
      setRows(body)
    })
  }, [blob])

  if (err) return <p style={{ color: "#a39d96", padding: 24 }}>Nije moguće parsirati CSV fajl.</p>

  return (
    <div style={{ overflow: "auto", maxHeight: "75vh" }}>      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          color: "#e8e3de",
          fontFamily: "'Geist Mono', monospace",
        }}
      >
        <thead>
          <tr style={{ background: "#161412", position: "sticky", top: 0 }}>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  borderBottom: "1px solid #2a2724",
                  color: "#ff7a1a",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  fontSize: 12,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{ background: ri % 2 === 0 ? "#0f0e0d" : "#121110" }}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: "8px 14px",
                    borderBottom: "1px solid #1a1816",
                    whiteSpace: "nowrap",
                    maxWidth: 320,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── DOCX / DOC ────────────────────────────────────────────────────────────────

function DocxViewer({ blob }: { blob: Blob }) {
  const [html, setHtml] = useState<string | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    blob.arrayBuffer().then((ab) => {
      mammoth
        .convertToHtml({ arrayBuffer: ab })
        .then((res) => setHtml(res.value))
        .catch(() => setErr(true))
    })
  }, [blob])

  if (err) return <p style={{ color: "#a39d96", padding: 24 }}>Nije moguće prikazati dokument.</p>

  if (html === null) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
        <Loader2 style={{ width: 28, height: 28, color: "#ff7a1a", animation: "docSpin 1s linear infinite" }} />
      </div>
    )
  }

  return (
    <>
      <div
        style={{
          padding: "24px 32px",
          overflowY: "auto",
          maxHeight: "75vh",
          color: "#e8e3de",
          fontSize: 15,
          lineHeight: 1.7,
        }}
        // mammoth output from user's own files — acceptable
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style>{`
        .docx-viewer h1, .docx-viewer h2, .docx-viewer h3 { color: #f3f0ec; margin: 1.2em 0 0.5em; font-weight: 600; }
        .docx-viewer p { margin: 0 0 0.8em; }
        .docx-viewer table { width: 100%; border-collapse: collapse; margin: 1em 0; }
        .docx-viewer td, .docx-viewer th { border: 1px solid #2a2724; padding: 6px 10px; }
        .docx-viewer th { background: #161412; color: #ff7a1a; }
        .docx-viewer strong { color: #f3f0ec; }
        .docx-viewer a { color: #ff7a1a; }
      `}</style>
    </>
  )
}

// ── Unsupported ───────────────────────────────────────────────────────────────

function UnsupportedViewer({ fileName, downloadUrl, reason }: { fileName: string; downloadUrl: string; reason?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "56px 24px",
        textAlign: "center",
        color: "#a39d96",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: "rgba(255,122,26,0.08)",
          border: "1px solid rgba(255,122,26,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FileText style={{ width: 24, height: 24, color: "#ff7a1a" }} />
      </div>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#e8e3de" }}>
          Preview nije podržan
        </p>
        <p style={{ margin: 0, fontSize: 13, maxWidth: "28rem", lineHeight: 1.55 }}>
          {reason ?? "Ovaj format nije moguće prikazati u browseru."}
        </p>
      </div>
      <a
        href={downloadUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 38,
          padding: "0 16px",
          borderRadius: 9,
          background: "#ff7a1a",
          color: "#150a02",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#ff8f3d" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#ff7a1a" }}
      >
        <Download style={{ width: 15, height: 15 }} />
        Preuzmi {fileName}
      </a>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DocumentViewer({ blob, mime, fileName, downloadUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const isPdf  = mime === "application/pdf"
  const isCsv  = mime === "text/csv" || mime === "application/csv" || mime.includes("csv")
  // DOCX only — mammoth does NOT support binary .doc (Word 97-2003)
  const isDocx = mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  // Binary .doc, PPTX, PPT — no reliable client-side renderer
  const isUnsupported =
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mime === "application/vnd.ms-powerpoint"

  function unsupportedReason() {
    if (mime === "application/msword") return "Binarni .doc format (Word 97-2003) nije moguće prikazati u browseru. Sačuvajte fajl kao .docx da biste ga otvorili ovde."
    return "PPTX/PPT format nije moguće prikazati u browseru."
  }

  return (
    <div
      ref={containerRef}
      style={{
        background: "#0f0e0d",
        borderRadius: 12,
        border: "1px solid #221f1c",
        overflow: "hidden",
      }}
    >
      {isPdf && <PdfViewer blob={blob} />}
      {isCsv && <CsvViewer blob={blob} />}
      {isDocx && <DocxViewer blob={blob} />}
      {(isUnsupported || (!isPdf && !isCsv && !isDocx)) && (
        <UnsupportedViewer fileName={fileName} downloadUrl={downloadUrl} reason={unsupportedReason()} />
      )}
      <style>{`@keyframes docSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
