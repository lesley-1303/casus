from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import io
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

def extract_content_sections(page, page_number: int, tables, table_bboxes, section_id_counter: int = 0) -> tuple[List[Dict[str, Any]], int]:
    """
    Extract content and identify sections based on titles
    
    Args:
        page: pdfplumber page object
        page_number: current page number
        tables: list of table objects
        table_bboxes: list of table bounding boxes
        section_id_counter: starting ID for sections (default 0)
    
    Returns:
        Tuple of (List of sections with their content, next section_id counter)
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
                title_positions.append({
                    'index': idx,
                    'text': line['text'].strip()
                })
        
        # If no titles found, return all text as one section
        if not title_positions:
            full_text = page.extract_text()
            if full_text and full_text.strip():
                return ([{
                    "id": section_id_counter,
                    "type": "section",
                    "title": None,
                    "page": page_number,
                    "content": full_text.strip()
                }], section_id_counter + 1)
            return ([], section_id_counter)
        
        # Split content by titles
        for i, title_info in enumerate(title_positions):
            # Get the range of lines for this section
            start_idx = title_info['index'] + 1  # Start after the title
            end_idx = title_positions[i + 1]['index'] if i + 1 < len(title_positions) else len(lines)
            
            # Collect text for this section
            section_lines = lines[start_idx:end_idx]
            section_text = '\n'.join([line['text'] for line in section_lines])
            
            sections.append({
                "id": section_id_counter,
                "type": "section",
                "title": title_info['text'],
                "page": page_number,
                "content": section_text.strip() if section_text.strip() else ""
            })
            section_id_counter += 1
        
        return (sections, section_id_counter)
    
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
                        section_id_counter += 1
                    
                    # Start new section
                    current_section = {
                        "id": section_id_counter,
                        "type": "section",
                        "title": line['text'].strip(),
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
                            "id": section_id_counter,
                            "type": "section",
                            "title": None,
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
                        "id": section_id_counter,
                        "type": "section",
                        "title": None,
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
                    })
        
        # Add any remaining buffered text
        if current_text_buffer:
            text_content = '\n'.join(current_text_buffer)
            if current_section is None:
                current_section = {
                    "id": section_id_counter,
                    "type": "section",
                    "title": None,
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
            section_id_counter += 1
        
        return (sections, section_id_counter)

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
    - content: Array of sections (each starting with a title, with unique IDs)
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
        
        # Initialize section ID counter
        section_id_counter = 0
        
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
                page_sections, section_id_counter = extract_content_sections(
                    page, page_number, tables, table_bboxes, section_id_counter
                )
                result["content"].extend(page_sections)
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)