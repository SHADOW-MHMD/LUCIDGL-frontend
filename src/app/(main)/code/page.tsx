"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { CodeFile } from "@/types";
import { Upload, Download, FileArchive, Smartphone, Loader2, Code2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { env } from "@/lib/env";
import { UploadRobotHelper, UploadStatus } from "@/components/UploadRobotHelper";
import Link from "next/link";

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
      className="bg-black min-h-screen"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="max-w-3xl mx-auto px-8 py-16 space-y-10">

        {/* Page Header */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <Code2 size={32} strokeWidth={1.5} className="text-[var(--accent-color)]" />
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">Code Hub</h1>
            <p className="text-white/40 text-sm mt-0.5">
              Share your <span className="text-cyan-400">.zip</span> projects &amp;{" "}
              <span className="text-[var(--accent-color)]">.apk</span> builds.
            </p>
          </div>
        </motion.div>

        {/* Upload Card */}
        {user && (
          <motion.div
            className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <form onSubmit={handleUpload} className="space-y-6">
              {/* Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
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
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer group ${
                  isDragging
                    ? "border-white/40 bg-white/[0.02]"
                    : selectedFile
                    ? "border-[var(--accent-color)]/40 bg-[var(--accent-color)]/[0.03]"
                    : "border-white/[0.12] hover:border-white/40 hover:bg-white/[0.02]"
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
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
                      <FileArchive size={24} strokeWidth={1.5} className="text-[var(--accent-color)]" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm break-all">{selectedFile.name}</p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <FileArchive
                      size={48}
                      strokeWidth={1.5}
                      className="text-white/20 group-hover:text-white/50 transition-colors"
                    />
                    <div>
                      <p className="text-white/60 text-sm font-medium">
                        {isDragging ? "Drop it here" : "Choose a file or drag & drop"}
                      </p>
                      <p className="text-white/40 text-sm mt-0.5">
                        <span className="text-cyan-400">.zip</span> or{" "}
                        <span className="text-[var(--accent-color)]">.apk</span> only · max 20MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Caption Input */}
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] text-white px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] transition-all"
              />

              {/* Status Messages */}
              <AnimatePresence>
                {uploadError && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm"
                  >
                    {uploadError}
                  </motion.p>
                )}
                {uploadSuccess && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm"
                  >
                    ✓ File uploaded successfully!
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={!selectedFile || uploading}
                whileTap={!selectedFile || uploading ? {} : { scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="w-full bg-white text-black font-bold rounded-xl px-6 py-3 hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload size={16} strokeWidth={1.5} />
                    Upload
                  </>
                )}
              </motion.button>
            </form>

            {/* Robot Helper */}
            {lucidRobots && (
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <UploadRobotHelper status={robotStatus} message={robotMessage} disableAnimations={!lucidRobots} className="w-full" />
              </div>
            )}
          </motion.div>
        )}

        {/* Files List */}
        <div>
          <motion.h2
            className="text-white font-semibold tracking-tight mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            Community Files
          </motion.h2>

          {loadingFiles ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 flex items-center gap-4">
                  <div className="skeleton w-[38px] h-[38px] rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="skeleton h-4 w-32 rounded-md" />
                      <div className="skeleton h-4 w-12 rounded-full" />
                    </div>
                    <div className="skeleton h-3 w-48 rounded-md" />
                  </div>
                  <div className="skeleton h-9 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <FileArchive size={40} strokeWidth={1.5} className="text-white/20" />
              <p className="text-white/40 text-sm">No files uploaded yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {files.map((file, i) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 flex items-center gap-4 hover:bg-white/[0.05] hover:border-[var(--accent-color)]/30 transition-all duration-200"
                  >
                    {/* File type icon */}
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                      file.file_type === "apk"
                        ? "bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20"
                        : "bg-cyan-400/10 border border-cyan-400/20"
                    }`}>
                      {file.file_type === "apk"
                        ? <Smartphone size={18} strokeWidth={1.5} className="text-[var(--accent-color)]" />
                        : <FileArchive size={18} strokeWidth={1.5} className="text-cyan-400" />
                      }
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm truncate">{file.file_name}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                          file.file_type === "apk"
                            ? "bg-[var(--accent-color)]/10 text-[var(--accent-color)] border-[var(--accent-color)]/20"
                            : "bg-cyan-400/10 text-cyan-400 border-cyan-400/20"
                        }`}>
                          {file.file_type.toUpperCase()}
                        </span>
                      </div>
                      {file.caption && (
                        <p className="text-white/40 text-xs mt-1 truncate">{file.caption}</p>
                      )}
                      <p className="text-white/30 text-xs mt-1">
                        {file.username ? (
                          <>
                            <Link href={`/user/${file.user_id}`} className="hover:text-white transition-colors">@{file.username}</Link> &middot;{" "}
                          </>
                        ) : ""}{file.download_count} download{file.download_count !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Download button */}
                    <motion.button
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file.id}
                      whileHover={downloadingId !== file.id ? { scale: 1.04 } : {}}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      className="border border-white/[0.08] rounded-lg px-4 py-2 text-white/60 text-sm hover:bg-[var(--accent-color)]/10 hover:text-[var(--accent-color)] hover:border-[var(--accent-color)]/30 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-40"
                    >
                      {downloadingId === file.id
                        ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                        : <Download size={13} strokeWidth={1.5} />
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
