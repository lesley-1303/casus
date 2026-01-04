'use client';
import { useState, ChangeEvent } from 'react';
import Button from '../components/button/button';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;

    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
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

    } catch (err: any) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const GetRuleImports = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rule-imports", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch rule imports");
      }

      return await response.json();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  // const handleCheck = async () => {
  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const response = await fetch('/api/rule-checker', { method: 'GET' });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.detail || 'Failed to do checks');
  //     }

  //     const data = await response.json();
  //     console.log('Check result:', data);
  //   } catch (err: any) {
  //     setError(err.message);
  //     console.error('Error:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div>
      <label>
        Choose PDF File
      </label>
      <div>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
        />
        <Button
          title={loading ? "extracting" : "extract"}
          onClick={handleUpload}
          disabled={!file || loading}
        />
      </div>
      {file && (
        <p>
          Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
        </p>
      )}
      <Button title='get rule imports' onClick={GetRuleImports}/>
    </div>
  );
}
