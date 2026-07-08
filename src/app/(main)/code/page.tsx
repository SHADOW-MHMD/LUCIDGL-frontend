"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { CodeFile } from "@/types";
import { Upload, Download, FileArchive, Smartphone, Loader2, Bot, Sparkles, Package2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { env } from "@/lib/env";
import { UploadRobotHelper, UploadStatus } from "@/components/UploadRobotHelper";

const apiUrl = env.apiUrl;

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
  const [isDragging, setIsDragging] = useState(false);
  const [lucidRobots, setLucidRobots] = useState(true);

  useEffect(() => {
    try {
      const app = localStorage.getItem("settings_appearance");
      if (!app) return;
      const parsed = JSON.parse(app);
      if (parsed.lucidRobots !== undefined) setLucidRobots(Boolean(parsed.lucidRobots));
    } catch {
      // silent
    }
  }, []);

  const robotStatus: UploadStatus = uploadError ? "error" : uploadSuccess ? "success" : isDragging ? "dragging" : "idle";
  const robotMessage =
    uploadError ||
    (uploadSuccess
      ? "Bundle received. The robot has promoted your archive to legendary status."
      : selectedFile
      ? `${selectedFile.name} looks usable. I expected a disaster and got a package. Respect.`
      : isDragging
      ? "Drop the archive. I am trying very hard not to look excited."
      : "Bring me a ZIP or APK and I will sort out the drama.");

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

      if (!ext || (ext !== "zip" && ext !== "apk")) {
        throw new Error("Only ZIP or APK files are allowed. This file is dressed wrong.");
      }

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
      setIsDragging(false);
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
        <motion.div
          className="rounded-[2rem] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:26px_26px] opacity-20 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3 mb-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-400/10 text-indigo-300">
              <Bot size={20} />
            </span>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">Code Hub</h1>
              <p className="text-white/55 mt-1 text-sm">Share your ZIP projects &amp; APK builds with a robot that talks too much.</p>
            </div>
          </div>

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_300px] items-start">
            {/* Upload Section */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <form onSubmit={handleUpload} className="bg-[#0d0d1a]/75 border border-white/[0.08] rounded-[1.75rem] p-6 shadow-2xl space-y-6 backdrop-blur-xl">
                  <motion.div
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ scale: 1.01, rotate: -0.15 }}
                    onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); e.currentTarget.style.borderColor = "rgb(99, 102, 241)"; }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); e.currentTarget.style.borderColor = ""; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      e.currentTarget.style.borderColor = "";
                      const dropped = e.dataTransfer.files?.[0];
                      if (dropped) {
                        if (dropped.size > 20 * 1024 * 1024) {
                          setUploadError("20MB max. This archive is hauling too much ego.");
                          setSelectedFile(null);
                        } else {
                          const ext = dropped.name.split(".").pop()?.toLowerCase();
                          if (ext !== "zip" && ext !== "apk") {
                            setUploadError("Only ZIP or APK files are allowed. Not whatever this is.");
                            setSelectedFile(null);
                          } else {
                            setSelectedFile(dropped);
                            setUploadError(null);
                            setUploadSuccess(false);
                          }
                        }
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center w-full min-h-[320px] rounded-[1.5rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                      selectedFile ? "border-indigo-400/50 bg-indigo-500/5" : isDragging ? "border-indigo-300 bg-indigo-500/10" : "border-white/20 bg-white/[0.02]"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip,.apk"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const ext = file.name.split(".").pop()?.toLowerCase();
                        if (file.size > 20 * 1024 * 1024) {
                          setUploadError("20MB max. Please stop trying to ship the whole internet.");
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        } else if (ext !== "zip" && ext !== "apk") {
                          setUploadError("Only ZIP or APK files are allowed. This one is not invited.");
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        } else {
                          setSelectedFile(file);
                          setUploadError(null);
                          setUploadSuccess(false);
                        }
                      }}
                    />

                    {selectedFile ? (
                      <div className="text-center px-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/15 flex items-center justify-center mb-4 border border-indigo-400/20">
                          <FileArchive className="w-8 h-8 text-indigo-300" />
                        </div>
                        <p className="text-white font-medium break-all">{selectedFile.name}</p>
                        <p className="text-white/50 text-sm mt-1">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="text-center px-4">
                        <motion.div
                          className="relative w-24 h-24 mx-auto mb-5"
                          animate={{ y: isDragging ? -8 : 0, rotate: isDragging ? 8 : 0 }}
                          transition={{ type: "spring", stiffness: 180, damping: 16 }}
                        >
                          <div className="absolute inset-0 rounded-3xl bg-white/5 backdrop-blur-md border border-white/[0.08]" />
                          <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-indigo-400/20 via-cyan-400/10 to-violet-500/10" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isDragging ? <Sparkles className="w-9 h-9 text-indigo-300" /> : <Package2 className="w-8 h-8 text-white/70" />}
                          </div>
                        </motion.div>
                        <p className="text-white font-semibold mb-1">
                          <span className="text-indigo-300">Choose a file</span> or drag & drop it here
                        </p>
                        <p className="text-gray-400 text-sm">ZIP or APK only, up to 20MB. The robot already checked your confidence.</p>
                      </div>
                    )}
                  </motion.div>

                  <div>
                    <input
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Add a caption..."
                      className="w-full rounded-2xl bg-white/[0.02] border border-white/[0.08] text-white px-4 py-3 placeholder:text-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <AnimatePresence>
                    {uploadError && (
                      <motion.p
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-center"
                      >
                        {uploadError}
                      </motion.p>
                    )}
                    {uploadSuccess && (
                      <motion.p
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 text-center"
                      >
                        ✓ File uploaded successfully!
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    whileTap={!selectedFile || uploading ? {} : { scale: 0.98 }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 disabled:opacity-50 disabled:hover:from-indigo-500 disabled:hover:to-cyan-500 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl">
                <UploadRobotHelper status={robotStatus} message={robotMessage} disableAnimations={!lucidRobots} className="w-full" />
              </div>

              <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl space-y-3 text-sm text-white/70">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <XCircle className="w-4 h-4 text-indigo-300" />
                  Upload rules
                </div>
                <p>• ZIP or APK only.</p>
                <p>• 20MB max. The robot is not a storage-based life form.</p>
                <p>• Small captions. Big energy.</p>
              </div>
            </div>
          </div>

        </motion.div>

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
