from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import io
import json
from typing import List, Dict, Any
from pathlib import Path

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

def is_title(line_text: str, chars: List[Dict]) -> bool:
    """
    Determine if a line is a title based on specific font characteristics
    A title must be Arial-BoldMT with font size >= 12
    
    Args:
        line_text: The text content of the line
        chars: List of character dictionaries for this line
    
    Returns:
        bool: True if the line is a title
    """
    if not chars or not line_text.strip():
        return False
    
    # Get font information from characters in this line
    font_sizes = [char['size'] for char in chars if 'size' in char]
    font_names = [char.get('fontname', '') for char in chars if 'fontname' in char]
    
    if not font_sizes or not font_names:
        return False
    
    # Get average font size
    line_font_size = sum(font_sizes) / len(font_sizes)
    
    # Get most common font name
    most_common_font = max(set(font_names), key=font_names.count) if font_names else ""
    
    # Check if it's Arial-BoldMT with size >= 12
    is_arial_bold = most_common_font == "Arial-BoldMT"
    is_large_enough = line_font_size >= 12
    
    return is_arial_bold and is_large_enough

def get_line_font_info(chars: List[Dict]) -> Dict[str, Any]:
    """
    Extract font information from a line's characters
    
    Returns:
        Dictionary with font name and size info
    """
    if not chars:
        return {"fontname": None, "fontsize": None}
    
    font_sizes = [char['size'] for char in chars if 'size' in char]
    font_names = [char.get('fontname', '') for char in chars if 'fontname' in char]
    
    # Get the most common font name
    fontname = max(set(font_names), key=font_names.count) if font_names else None
    
    # Get average font size
    fontsize = sum(font_sizes) / len(font_sizes) if font_sizes else None
    
    return {
        "fontname": fontname,
        "fontsize": round(fontsize, 2) if fontsize else None
    }

def extract_text_with_formatting(page) -> List[Dict[str, Any]]:
    """
    Extract text from page with line-by-line formatting information
    
    Returns:
        List of dictionaries with text and formatting info (sorted top to bottom)
    """
    lines = []
    chars = page.chars
    
    if not chars:
        return lines
    
    # Group characters by y-coordinate (same line)
    y_tolerance = 3
    char_groups = {}
    
    for char in chars:
        y = round(char['top'] / y_tolerance) * y_tolerance
        if y not in char_groups:
            char_groups[y] = []
        char_groups[y].append(char)
    
    # Sort by y-coordinate (top to bottom - smaller y values come first)
    sorted_y = sorted(char_groups.keys())
    
    for y in sorted_y:
        line_chars = sorted(char_groups[y], key=lambda c: c['x0'])
        line_text = ''.join(char['text'] for char in line_chars)
        
        if line_text.strip():
            lines.append({
                'text': line_text,
                'chars': line_chars,
                'y': y
            })
    
    return lines

def extract_content_sections(page, page_number: int, tables, table_bboxes) -> List[Dict[str, Any]]:
    """
    Extract content and identify sections based on titles
    
    Returns:
        List of sections with their content
    """
    sections = []
    current_section = None
    
    # Get formatted lines for title detection
    lines = extract_text_with_formatting(page)
    
    if not tables:
        # No tables - collect all text and split by titles
        title_positions = []
        
        # Find all title positions
        for idx, line in enumerate(lines):
            if is_title(line['text'], line['chars']):
                font_info = get_line_font_info(line['chars'])
                title_positions.append({
                    'index': idx,
                    'text': line['text'].strip(),
                    'font': font_info['fontname'],
                    'fontsize': font_info['fontsize']
                })
        
        # If no titles found, return all text as one section
        if not title_positions:
            full_text = page.extract_text()
            if full_text and full_text.strip():
                return [{
                    "type": "section",
                    "title": None,
                    "title_font": None,
                    "title_fontsize": None,
                    "page": page_number,
                    "content": full_text.strip()
                }]
            return []
        
        # Split content by titles
        for i, title_info in enumerate(title_positions):
            # Get the range of lines for this section
            start_idx = title_info['index'] + 1  # Start after the title
            end_idx = title_positions[i + 1]['index'] if i + 1 < len(title_positions) else len(lines)
            
            # Collect text for this section
            section_lines = lines[start_idx:end_idx]
            section_text = '\n'.join([line['text'] for line in section_lines])
            
            sections.append({
                "type": "section",
                "title": title_info['text'],
                "title_font": title_info['font'],
                "title_fontsize": title_info['fontsize'],
                "page": page_number,
                "content": section_text.strip() if section_text.strip() else ""
            })
        
        return sections
    
    else:
        # Has tables - need to handle mixed content
        all_items = []
        
        # Add text lines
        for line in lines:
            all_items.append({
                'type': 'text',
                'y': line['y'],
                'line': line
            })
        
        # Add tables
        for table_obj, bbox in zip(tables, table_bboxes):
            all_items.append({
                'type': 'table',
                'y': bbox[1],
                'table_obj': table_obj,
                'bbox': bbox
            })
        
        # Sort by position
        all_items.sort(key=lambda x: x['y'])
        
        # Process items
        current_text_buffer = []
        
        for item in all_items:
            if item['type'] == 'text':
                line = item['line']
                
                if is_title(line['text'], line['chars']):
                    # Save previous section if exists
                    if current_section is not None:
                        # Add any buffered text to previous section
                        if current_text_buffer:
                            if isinstance(current_section['content'], str):
                                current_section['content'] += '\n' + '\n'.join(current_text_buffer)
                            current_text_buffer = []
                        sections.append(current_section)
                    
                    # Start new section
                    font_info = get_line_font_info(line['chars'])
                    current_section = {
                        "type": "section",
                        "title": line['text'].strip(),
                        "title_font": font_info['fontname'],
                        "title_fontsize": font_info['fontsize'],
                        "page": page_number,
                        "content": ""
                    }
                else:
                    # Regular text - add to buffer
                    if line['text'].strip():
                        current_text_buffer.append(line['text'])
            
            elif item['type'] == 'table':
                # Add buffered text before table
                if current_text_buffer:
                    text_content = '\n'.join(current_text_buffer)
                    if current_section is None:
                        current_section = {
                            "type": "section",
                            "title": None,
                            "title_font": None,
                            "title_fontsize": None,
                            "page": page_number,
                            "content": text_content
                        }
                    else:
                        if current_section['content']:
                            current_section['content'] += '\n' + text_content
                        else:
                            current_section['content'] = text_content
                    current_text_buffer = []
                
                # Add table
                if current_section is None:
                    current_section = {
                        "type": "section",
                        "title": None,
                        "title_font": None,
                        "title_fontsize": None,
                        "page": page_number,
                        "content": ""
                    }
                
                table_data = item['table_obj'].extract()
                if table_data and len(table_data) > 0:
                    # Convert content to list if needed
                    if isinstance(current_section['content'], str):
                        text_so_far = current_section['content']
                        current_section['content'] = []
                        if text_so_far:
                            current_section['content'].append({
                                "type": "text",
                                "text": text_so_far
                            })
                    
                    current_section['content'].append({
                        "type": "table",
                        "headers": table_data[0] if len(table_data) > 0 else [],
                        "data": table_data[1:] if len(table_data) > 1 else [],
                        "raw_data": table_data
                    })
        
        # Add any remaining buffered text
        if current_text_buffer:
            text_content = '\n'.join(current_text_buffer)
            if current_section is None:
                current_section = {
                    "type": "section",
                    "title": None,
                    "title_font": None,
                    "title_fontsize": None,
                    "page": page_number,
                    "content": text_content
                }
            else:
                if isinstance(current_section['content'], str):
                    if current_section['content']:
                        current_section['content'] += '\n' + text_content
                    else:
                        current_section['content'] = text_content
                else:
                    current_section['content'].append({
                        "type": "text",
                        "text": text_content
                    })
        
        # Add last section
        if current_section is not None:
            sections.append(current_section)
        
        return sections

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "PDF Extraction API is running",
        "version": "1.0.0"
    }

@app.post("/api/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    """
    Extract content from uploaded PDF, splitting at titles
    Titles are defined as text with Arial-BoldMT font and size >= 12
    
    Returns:
    - content: Array of sections (each starting with a title)
    - metadata: PDF information (pages, filename)
    """
    
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    result = {
        "content": [],
        "metadata": {}
    }
    
    try:
        # Read the uploaded file
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        
        with pdfplumber.open(pdf_file) as pdf:
            # Add metadata
            result["metadata"] = {
                "pages": len(pdf.pages),
                "filename": file.filename
            }
            
            # Extract from each page
            for i, page in enumerate(pdf.pages):
                page_number = i + 1
                
                # Get all tables with their positions
                tables = page.find_tables()
                table_bboxes = [table.bbox for table in tables] if tables else []
                
                # Extract sections from this page
                page_sections = extract_content_sections(page, page_number, tables, table_bboxes)
                result["content"].extend(page_sections)
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)