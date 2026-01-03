"use client";

import { useState, ChangeEvent } from "react";
import styles from "./xlslup.module.css";
import Button from "../components/button/button";

export default function Xlslup() {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] ?? null;

        if (selectedFile) {
            const extension = selectedFile.name.split('.').pop()?.toLowerCase();

            const allowedExtensions = ["xls", "xlsx", "xlsm"];

            if (!extension || !allowedExtensions.includes(extension)) {
                setError("Please select a valid Excel file (.xls, .xlsx, or .xlsm)");
                setFile(null);
                return;
            }

            setFile(selectedFile);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first");
            return;
        }

        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/upload-excel", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to upload Excel file");
            }

            const data = await response.json();
            console.log("Upload result:", data);
            alert("File uploaded successfully!");
        } catch (err: any) {
            setError(err.message);
            console.error("Upload error:", err);
        }
    };

    return (
        <div className={styles["xlslup-container"]}>
            <h2>Upload Excel File</h2>

            <div className={styles["input-group"]}>
                <input type="file" accept=".xls,.xlsx,.xlsm" onChange={handleFileChange} />
                {file && <p className={styles["file-info"]}>{file.name}</p>}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <Button title="Upload" onClick={handleUpload} disabled={!file} />
        </div>
    );
}
