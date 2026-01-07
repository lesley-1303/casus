from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import io
import re
from typing import List, Dict, Any

app = FastAPI(title="PDF Extraction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# NORMALIZATION + DEDUPLICATION
# -------------------------------------------------------------------

def normalize_text_for_dedup(text: str) -> str:
    """
    Normalize text ONLY for comparison.
    Does NOT change stored output text.
    """
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\b\d+\b$", "", text)
    return text.strip()


def deduplicate_section_content(content: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Remove semantically duplicate text blocks.
    Keeps the most complete (longest) version.
    """
    seen = {}
    cleaned = []

    for item in content:
        if item["type"] != "text":
            cleaned.append(item)
            continue

        normalized = normalize_text_for_dedup(item["text"])

        if normalized in seen:
            existing_idx = seen[normalized]
            if len(item["text"]) > len(cleaned[existing_idx]["text"]):
                cleaned[existing_idx] = item
        else:
            seen[normalized] = len(cleaned)
            cleaned.append(item)

    return cleaned

# -------------------------------------------------------------------
# FAKE TABLE DETECTION
# -------------------------------------------------------------------

def is_fake_table(table_data: List[List[Any]]) -> bool:
    if not table_data or len(table_data) < 2:
        return True

    non_empty_cells = [
        cell for row in table_data
        for cell in row
        if cell and str(cell).strip()
    ]

    if len(non_empty_cells) == 0:
        return True

    num_columns = max(len(row) for row in table_data)
    non_empty_columns = 0

    for col_idx in range(num_columns):
        for row in table_data:
            if col_idx < len(row) and row[col_idx] and str(row[col_idx]).strip():
                non_empty_columns += 1
                break

    return non_empty_columns <= 1

# -------------------------------------------------------------------
# TITLE DETECTION
# -------------------------------------------------------------------

def is_title(line_text: str, chars: List[Dict]) -> bool:
    if not chars or not line_text.strip():
        return False

    font_sizes = [c["size"] for c in chars if "size" in c]
    font_names = [c.get("fontname", "") for c in chars]

    if not font_sizes or not font_names:
        return False

    avg_size = sum(font_sizes) / len(font_sizes)
    most_common_font = max(set(font_names), key=font_names.count)

    return most_common_font == "Arial-BoldMT" and avg_size >= 12

# -------------------------------------------------------------------
# TEXT EXTRACTION
# -------------------------------------------------------------------

def extract_text_with_formatting(page) -> List[Dict[str, Any]]:
    lines = []
    chars = page.chars
    if not chars:
        return lines

    y_tolerance = 3
    groups = {}

    for char in chars:
        y = round(char["top"] / y_tolerance) * y_tolerance
        groups.setdefault(y, []).append(char)

    for y in sorted(groups.keys()):
        line_chars = sorted(groups[y], key=lambda c: c["x0"])
        text = "".join(c["text"] for c in line_chars)
        if text.strip():
            lines.append({"text": text, "chars": line_chars, "y": y})

    return lines

# -------------------------------------------------------------------
# SECTION EXTRACTION
# -------------------------------------------------------------------

def extract_content_sections(page, page_number: int, tables, table_bboxes, section_id_counter: int):
    sections = []
    current_section = None
    buffer = []

    lines = extract_text_with_formatting(page)
    items = []

    for line in lines:
        items.append({"type": "text", "y": line["y"], "line": line})

    for table, bbox in zip(tables, table_bboxes):
        items.append({"type": "table", "y": bbox[1], "table": table})

    items.sort(key=lambda x: x["y"])

    for item in items:
        if item["type"] == "text":
            line = item["line"]

            if is_title(line["text"], line["chars"]):
                if current_section:
                    if buffer:
                        current_section["content"].append({
                            "type": "text",
                            "text": "\n".join(buffer)
                        })
                        buffer = []

                    current_section["content"] = deduplicate_section_content(
                        current_section["content"]
                    )
                    sections.append(current_section)
                    section_id_counter += 1

                current_section = {
                    "id": section_id_counter,
                    "type": "section",
                    "title": line["text"].strip(),
                    "page": page_number,
                    "content": []
                }
            else:
                buffer.append(line["text"])

        else:
            table_data = item["table"].extract()
            if not table_data:
                continue

            if not current_section:
                current_section = {
                    "id": section_id_counter,
                    "type": "section",
                    "title": None,
                    "page": page_number,
                    "content": []
                }

            if buffer:
                current_section["content"].append({
                    "type": "text",
                    "text": "\n".join(buffer)
                })
                buffer = []

            if is_fake_table(table_data):
                continue
            else:
                current_section["content"].append({
                    "type": "table",
                    "headers": table_data[0],
                    "data": table_data[1:]
                })

    if current_section:
        if buffer:
            current_section["content"].append({
                "type": "text",
                "text": "\n".join(buffer)
            })

        current_section["content"] = deduplicate_section_content(
            current_section["content"]
        )

        sections.append(current_section)
        section_id_counter += 1

    return sections, section_id_counter

# -------------------------------------------------------------------
# API ENDPOINTS
# -------------------------------------------------------------------

@app.get("/")
async def root():
    return {"status": "ok"}

@app.post("/api/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF required")

    try:
        contents = await file.read()
        pdf_file = io.BytesIO(contents)

        result = {"content": [], "metadata": {}}
        section_id_counter = 0

        with pdfplumber.open(pdf_file) as pdf:
            result["metadata"] = {
                "filename": file.filename,
                "pages": len(pdf.pages)
            }

            for i, page in enumerate(pdf.pages):
                tables = page.find_tables()
                table_bboxes = [t.bbox for t in tables]

                sections, section_id_counter = extract_content_sections(
                    page,
                    i + 1,
                    tables,
                    table_bboxes,
                    section_id_counter
                )

                result["content"].extend(sections)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
