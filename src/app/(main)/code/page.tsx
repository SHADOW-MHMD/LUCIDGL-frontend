"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { CodeFile } from "@/types";
import { Upload, Download, FileArchive, Smartphone, Loader2 } from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://lucid-gl.muhammed1515mishal.workers.dev";

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function CodeHubPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<CodeFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const token = await getToken();
      const res = await fetch(`${apiUrl}/api/code/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files ?? data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploadError(null);
    setUploadSuccess(false);
    setUploading(true);

    try {
      const token = await getToken();
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      const fileType = ext === "apk" ? "apk" : "zip";

      const formData = new FormData();
      formData.append("file", selectedFile);
      if (caption) formData.append("caption", caption);

      const res = await fetch(`${apiUrl}/api/code/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-File-Name": selectedFile.name,
          "X-File-Type": fileType,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      setUploadSuccess(true);
      setCaption("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchFiles();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: CodeFile) => {
    setDownloadingId(file.id);
    try {
      const token = await getToken();
      await fetch(`${apiUrl}/api/code/download/${file.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      window.open(`${apiUrl}/api/code/stream/${file.id}`, "_blank");
      await fetchFiles();
    } catch {
      // silent
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">Code Hub</h1>
          <p className="text-white/50 mt-2 text-sm">Share your ZIP projects &amp; APK builds with the community</p>
        </div>

        {/* Upload Section */}
        {user && (
          <div className="bg-white/[0.03] backdrop-blur-lg border border-white/[0.1] rounded-2xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <Upload size={18} className="text-blue-400" /> Upload a File
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div
                className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-blue-400/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.apk"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                {selectedFile ? (
                  <p className="text-white/90 font-medium">{selectedFile.name}</p>
                ) : (
                  <>
                    <FileArchive className="mx-auto text-white/30 mb-2" size={32} />
                    <p className="text-white/50 text-sm">Click to select a <span className="text-green-400 font-medium">.zip</span> or <span className="text-blue-400 font-medium">.apk</span> file</p>
                    <p className="text-white/30 text-xs mt-1">Max size: 40 MB</p>
                  </>
                )}
              </div>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)..."
                rows={2}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-500/50 resize-none transition-colors"
              />

              {uploadError && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{uploadError}</p>
              )}
              {uploadSuccess && (
                <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">✓ File uploaded successfully!</p>
              )}

              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload</>}
              </button>
            </form>
          </div>
        )}

        {/* Files List */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Community Files</h2>
          {loadingFiles ? (
            <div className="flex justify-center py-16">
              <Loader2 className="text-white/40 animate-spin" size={36} />
            </div>
          ) : files.length === 0 ? (
            <div className="bg-white/[0.03] backdrop-blur-lg border border-white/[0.1] rounded-2xl p-12 text-center">
              <FileArchive className="mx-auto text-white/20 mb-3" size={40} />
              <p className="text-white/40 text-sm">No files uploaded yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-white/[0.03] backdrop-blur-lg border border-white/[0.1] rounded-2xl p-5 flex items-center gap-4 hover:bg-white/[0.05] hover:border-white/[0.15] transition-all duration-300"
                >
                  <div className={`p-3 rounded-xl ${file.file_type === "apk" ? "bg-blue-500/10" : "bg-green-500/10"}`}>
                    {file.file_type === "apk"
                      ? <Smartphone size={20} className="text-blue-400" />
                      : <FileArchive size={20} className="text-green-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm truncate">{file.file_name}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        file.file_type === "apk"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-green-500/20 text-green-300 border border-green-500/30"
                      }`}>
                        {file.file_type.toUpperCase()}
                      </span>
                    </div>
                    {file.caption && (
                      <p className="text-white/50 text-xs mt-0.5 truncate">{file.caption}</p>
                    )}
                    <p className="text-white/30 text-xs mt-1">
                      {file.username ? `@${file.username} · ` : ""}{file.download_count} download{file.download_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(file)}
                    disabled={downloadingId === file.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30 border border-white/10 text-white/70 transition-all duration-300 text-sm font-medium disabled:opacity-40 whitespace-nowrap"
                  >
                    {downloadingId === file.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Download size={14} />
                    }
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
