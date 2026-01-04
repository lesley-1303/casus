import { saveJsonToFile } from '@/lib/services/pdfService';
import { getUserIdFromRequest } from '@/lib/services/auth';

export async function POST(request) {
  try {
    const pythonApiUrl = 'http://localhost:8000';
    getUserIdFromRequest(request);
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = request.headers.get('content-type');

    const response = await fetch(`${pythonApiUrl}/api/extract-pdf`, {
      method: 'POST',
      body: buffer,
      headers: {
        'Content-Type': contentType,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json(error, { status: response.status });
    }

    const data = await response.json();

    const originalFilename = data.metadata?.filename || 'document.pdf';
    const savedPath = saveJsonToFile(data, originalFilename, './data');
    
    return Response.json(savedPath, { status: 200 });
    
  } catch (error) {
    console.error('Error calling Python API:', error);
    return Response.json(
      { 
        error: 'Failed to process PDF',
        details: error.message 
      },
      { status: 500 }
    );
  }
}