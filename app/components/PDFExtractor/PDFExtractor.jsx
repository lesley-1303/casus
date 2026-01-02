import { useState } from 'react';

export default function PDFExtractor() {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    setExtractedData(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to extract PDF');
      }

      const data = await response.json();
      setExtractedData(data);
      
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to count tables
  const getTableCount = () => {
    if (!extractedData?.content) return 0;
    return extractedData.content.filter(item => item.type === 'table').length;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">PDF Text & Table Extractor</h2>
        
        {/* Upload Section */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Choose PDF File
          </label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
            />
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
            >
              {loading ? 'Extracting...' : 'Extract'}
            </button>
          </div>
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Processing PDF...</p>
          </div>
        )}

        {/* Results */}
        {extractedData && !loading && (
          <div className="mt-8">
            {/* Metadata */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Document Info</h3>
              <p className="text-sm text-blue-800">
                Filename: <span className="font-medium">{extractedData.metadata.filename}</span>
              </p>
              <p className="text-sm text-blue-800">
                Pages: <span className="font-medium">{extractedData.metadata.pages}</span>
              </p>
              <p className="text-sm text-blue-800">
                Tables found: <span className="font-medium">{getTableCount()}</span>
              </p>
            </div>

            {/* Content in Order */}
            {extractedData.content && extractedData.content.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">
                  📄 Document Content (in order)
                </h3>
                <div className="space-y-6">
                  {extractedData.content.map((item, i) => (
                    <div key={i}>
                      {/* Text Content */}
                      {item.type === 'text' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <span className="bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded">
                              Page {item.page} - Text
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                            {item.content}
                          </p>
                        </div>
                      )}

                      {/* Table Content */}
                      {item.type === 'table' && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-blue-700 text-white px-4 py-2">
                            <p className="text-sm font-medium">
                              Page {item.page} - Table
                            </p>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              {item.headers && item.headers.length > 0 && (
                                <thead className="bg-gray-100">
                                  <tr>
                                    {item.headers.map((header, cellIndex) => (
                                      <th
                                        key={cellIndex}
                                        className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                                      >
                                        {header || `Column ${cellIndex + 1}`}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                              )}
                              <tbody className="bg-white divide-y divide-gray-200">
                                {item.data && item.data.map((row, rowIndex) => (
                                  <tr key={rowIndex} className="hover:bg-gray-50">
                                    {row.map((cell, cellIndex) => (
                                      <td
                                        key={cellIndex}
                                        className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                                      >
                                        {cell || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No data found */}
            {(!extractedData.content || extractedData.content.length === 0) && (
              <div className="text-center py-12">
                <p className="text-gray-500">No text or tables found in this PDF.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}