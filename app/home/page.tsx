'use client';
import { useState, ChangeEvent } from 'react';
import Button from '../components/button/button';
import GenericSelect from '../components/genericselect/genericselect';

export default function Home() {

  const emptyRuleImport: RuleImport = {
    id: '',
    user_id: '',
    file_name: '',
    created_at: '',
  };

    const emptyRuleType: RuleType = {
    id: '',
    name: '',
    rule_import_id: '',
  };

  const [ruleImports, setRuleImports] = useState<RuleImport[]>([]);
  const [selectedRuleImport, setSelectedRuleImport] = useState<RuleImport>(emptyRuleImport);
  const [ruleTypes, setRuleTypes] = useState<RuleType[]>([]);
  const [selectedRuleType, setSelectedRuleType] = useState<RuleType>(emptyRuleType);
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


      const data = await response.json();
      setRuleImports(data);
      return data;

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRuleImportChange = async (ruleImport: RuleImport) => {
    if(ruleImport === emptyRuleImport){setSelectedRuleImport(ruleImport); setRuleTypes([]);return}
    setSelectedRuleImport(ruleImport)
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rule-type?import_id=${ruleImport.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch rule types");
      }


      const data = await response.json();
      setRuleTypes(data)
      return data;

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
      <Button title='get rule imports' onClick={GetRuleImports} />
      <GenericSelect<RuleImport>
        title="Select a excel file"
        items={ruleImports}
        selectedItem={selectedRuleImport}
        onChange={(item) => onRuleImportChange(item)}
        Label={(m) => m.file_name}
        emptyItem={emptyRuleImport}
      />

      <GenericSelect<RuleType>
        title="Select a rule type"
        items={ruleTypes}
        selectedItem={selectedRuleType}
        onChange={(item) => setSelectedRuleType(item)}
        Label={(m) => m.name}
        emptyItem={emptyRuleType}
      />
    </div>
  );
}
