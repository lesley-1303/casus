from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import io

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
    Extract content from uploaded PDF in the order it appears
    
    Returns:
    - content: Array of content items (text and tables) in order
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
        
        # Open PDF with pdfplumber using BytesIO
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
                
                # Get all text from the page
                full_text = page.extract_text()
                
                # Get all tables with their positions
                tables = page.extract_tables()
                
                if not tables:
                    # No tables, just add the text
                    if full_text:
                        result["content"].append({
                            "type": "text",
                            "page": page_number,
                            "content": full_text.strip()
                        })
                else:
                    # Has tables - need to extract text between/around tables
                    # Get table bounding boxes
                    table_bboxes = []
                    for table in page.find_tables():
                        table_bboxes.append(table.bbox)
                    
                    # Sort tables by vertical position (top to bottom)
                    sorted_tables = sorted(zip(tables, table_bboxes), key=lambda x: x[1][1])
                    
                    # Extract text and tables in order
                    last_bottom = 0
                    
                    for j, (table_data, bbox) in enumerate(sorted_tables):
                        # Extract text before this table (only if there's valid space)
                        if bbox[1] > last_bottom:  # Only if table top is below last bottom
                            text_bbox = (0, last_bottom, page.width, bbox[1])
                            text_before = page.within_bbox(text_bbox).extract_text()
                            
                            if text_before and text_before.strip():
                                result["content"].append({
                                    "type": "text",
                                    "page": page_number,
                                    "content": text_before.strip()
                                })
                        
                        # Add the table
                        if table_data and len(table_data) > 0:
                            result["content"].append({
                                "type": "table",
                                "page": page_number,
                                "headers": table_data[0] if len(table_data) > 0 else [],
                                "data": table_data[1:] if len(table_data) > 1 else [],
                                "raw_data": table_data
                            })
                        
                        last_bottom = bbox[3]
                    
                    # Extract any text after the last table (only if there's valid space)
                    if last_bottom < page.height:  # Only if there's space below
                        text_bbox = (0, last_bottom, page.width, page.height)
                        text_after = page.within_bbox(text_bbox).extract_text()
                        
                        if text_after and text_after.strip():
                            result["content"].append({
                                "type": "text",
                                "page": page_number,
                                "content": text_after.strip()
                            })
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/api/extract-tables-only")
async def extract_tables_only(file: UploadFile = File(...)):
    """Extract only tables from PDF (faster if you only need tables)"""
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        
        tables = []
        
        with pdfplumber.open(pdf_file) as pdf:
            for i, page in enumerate(pdf.pages):
                page_tables = page.extract_tables()
                for j, table in enumerate(page_tables):
                    if table:
                        tables.append({
                            "page": i + 1,
                            "table_index": j + 1,
                            "data": table
                        })
        
        return {"tables": tables, "count": len(tables)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/api/extract-text-only")
async def extract_text_only(file: UploadFile = File(...)):
    """Extract only text from PDF (faster if you only need text)"""
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        
        all_text = []
        
        with pdfplumber.open(pdf_file) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    all_text.append({
                        "page": i + 1,
                        "content": text.strip()
                    })
        
        return {"text": all_text}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)