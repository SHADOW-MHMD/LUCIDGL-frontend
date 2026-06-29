"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { CodeFile } from "@/types";
import { Upload, Download, FileArchive, Smartphone, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.div
      className="min-h-screen pt-28 pb-16 px-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="text-4xl font-bold text-white tracking-tight">Code Hub</h1>
          <p className="text-white/50 mt-2 text-sm">Share your ZIP projects &amp; APK builds with the community</p>
        </motion.div>

        {/* Upload Section */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6"
          >
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <Upload size={18} className="text-indigo-400" /> Upload a File
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div
                className="group border-2 border-dashed border-white/[0.10] rounded-xl p-6 text-center hover:border-indigo-500/40 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.apk"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size > 20 * 1024 * 1024) {
                      setUploadError("File exceeds 20MB limit");
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    } else {
                      setSelectedFile(file ?? null);
                      setUploadError(null);
                    }
                  }}
                />
                {selectedFile ? (
                  <p className="text-white/90 font-medium">{selectedFile.name}</p>
                ) : (
                  <>
                    <FileArchive className="mx-auto text-white/25 group-hover:text-indigo-400 transition-colors mb-2" size={32} />
                    <p className="text-white/50 text-sm">Click to select a <span className="text-cyan-400 font-medium">.zip</span> or <span className="text-indigo-400 font-medium">.apk</span> file</p>
                    <p className="text-white/30 text-xs mt-1">Max size: 20 MB</p>
                  </>
                )}
              </div>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)..."
                rows={2}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
              />

              <AnimatePresence>
                {uploadError && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                  >
                    {uploadError}
                  </motion.p>
                )}
                {uploadSuccess && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2"
                  >
                    ✓ File uploaded successfully!
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={!selectedFile || uploading}
                whileHover={!selectedFile || uploading ? {} : { scale: 1.02 }}
                whileTap={!selectedFile || uploading ? {} : { scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload</>}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Files List */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Community Files</h2>
          {loadingFiles ? (
            <div className="flex justify-center py-16">
              <Loader2 className="text-indigo-400/40 animate-spin" size={36} />
            </div>
          ) : files.length === 0 ? (
            <div className="bg-white/[0.03] backdrop-blur-lg border border-white/[0.08] rounded-2xl p-12 text-center">
              <FileArchive className="mx-auto text-white/20 mb-3" size={40} />
              <p className="text-white/40 text-sm">No files uploaded yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {files.map((file, i) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    whileHover={{ x: 4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                    className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 flex items-center gap-4 hover:bg-white/[0.04] hover:border-indigo-500/20 transition-colors duration-300"
                  >
                    <div className={`p-3 rounded-xl ${file.file_type === "apk" ? "bg-indigo-500/10" : "bg-cyan-500/10"}`}>
                      {file.file_type === "apk"
                        ? <Smartphone size={20} className="text-indigo-400" />
                        : <FileArchive size={20} className="text-cyan-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm truncate">{file.file_name}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          file.file_type === "apk"
                            ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                            : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/25"
                        }`}>
                          {file.file_type.toUpperCase()}
                        </span>
                      </div>
                      {file.caption && (
                        <p className="text-white/50 text-xs mt-0.5 truncate">{file.caption}</p>
                      )}
                      <p className="text-white/40 text-xs mt-1">
                        {file.username ? `@${file.username} · ` : ""}{file.download_count} download{file.download_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file.id}
                      whileHover={downloadingId !== file.id ? { scale: 1.04 } : {}}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-indigo-500/15 hover:text-indigo-400 hover:border-indigo-500/25 border border-white/[0.08] text-white/60 transition-colors duration-200 text-sm font-medium disabled:opacity-40 whitespace-nowrap"
                    >
                      {downloadingId === file.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Download size={14} />
                      }
                      Download
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
