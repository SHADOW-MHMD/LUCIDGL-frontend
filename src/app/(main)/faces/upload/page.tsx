"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Upload, Loader2, CheckCircle, Sparkles, Bot, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { env } from "@/lib/env";
import { UploadRobotHelper, UploadStatus } from "@/components/UploadRobotHelper";

export default function FacesUploadPage() {
  const { user, loading: authLoading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [lucidRobots, setLucidRobots] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  const robotStatus: UploadStatus = errorMsg ? "error" : success ? "success" : isDragging ? "dragging" : "idle";
  const robotMessage =
    errorMsg ||
    (success
      ? "Boom. The robot approved your clip and is currently doing tiny victory dances."
      : file
      ? `Nice. ${file.name} looks dangerously close to content. I respect the chaos.`
      : isDragging
      ? "Drop the file already. I have opinions and they are getting impatient."
      : "Hey, human. Bring me a clip and I will make it look suspiciously expensive.");

  if (!user && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-400 opacity-50" />
        <h2 className="text-2xl font-bold text-white/90">Authentication Required</h2>
        <p className="text-slate-400">Sign in to upload Faces.</p>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setErrorMsg("");
    if (!selected) return;

    if (selected.size > 20 * 1024 * 1024) {
      setFile(null);
      setSuccess(false);
      setErrorMsg("20MB max. This file is not a video, it is a personal problem.");
      return;
    }

    if (selected.type !== "video/mp4" && selected.type !== "video/webm") {
      setFile(null);
      setSuccess(false);
      setErrorMsg("MP4 or WebM only. Your file arrived wearing the wrong costume.");
      return;
    }

    setFile(selected);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setIsUploading(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const apiUrl = env.apiUrl;
      
      const formData = new FormData();
      formData.append("video", file);

      const backendRes = await fetch(`${apiUrl}/api/faces/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Post-Caption": encodeURIComponent(caption),
        },
        body: formData,
      });

      if (!backendRes.ok) {
        const data = await backendRes.json().catch(() => ({}));
        const detailedError = data.detail ? `${data.error}: ${data.detail}` : data.error;
        throw new Error(`Backend Error: ${detailedError || "Failed to log on server"}`);
      }

      // 6. Optimistic UI update
      setSuccess(true);
      setFile(null);
      setCaption("");
      setIsDragging(false);
      
      setTimeout(() => {
        router.push("/reels");
      }, 3000);
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 lg:py-14">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
        <motion.div
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:28px_28px] opacity-20 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3 mb-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <Bot size={20} />
            </span>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Upload to Faces
              </h1>
              <p className="text-white/55 text-sm md:text-base">Your clip gets a robot host, a quick roast, and a clean runway.</p>
            </div>
          </div>

          <div className="relative z-10 grid gap-6 xl:grid-cols-[1fr_320px] items-start">
            <form onSubmit={handleSubmit} className="bg-[#0d0d1a]/75 border border-white/[0.08] rounded-[1.75rem] p-5 md:p-6 shadow-2xl space-y-6 backdrop-blur-xl">
              {success ? (
                <div className="flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in duration-500">
                  <CheckCircle className="w-20 h-20 text-green-400 mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Upload Successful!</h2>
                  <p className="text-slate-400">Your video is now live on the neural net.</p>
                  <p className="text-white/40 text-sm mt-4">Redirecting to feed...</p>
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm text-center">
                      {errorMsg}
                    </div>
                  )}

                  <motion.div
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ scale: 1.01, rotate: -0.15 }}
                    onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); e.currentTarget.style.borderColor = "rgb(34, 211, 238)"; }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); e.currentTarget.style.borderColor = ""; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      e.currentTarget.style.borderColor = "";
                      const dropped = e.dataTransfer.files?.[0];
                      if (dropped) handleFileChange({ target: { files: [dropped] } } as any);
                    }}
                    className={`relative flex flex-col items-center justify-center w-full min-h-[320px] rounded-[1.5rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                      file ? "border-cyan-400/50 bg-cyan-400/5" : isDragging ? "border-cyan-300 bg-cyan-400/10" : "border-white/20 bg-white/[0.02]"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="video/mp4,video/webm"
                      className="hidden"
                    />

                    {file ? (
                      <div className="text-center px-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/15 flex items-center justify-center mb-4 border border-cyan-400/20">
                          <CheckCircle className="w-8 h-8 text-cyan-300" />
                        </div>
                        <p className="text-white font-medium break-all">{file.name}</p>
                        <p className="text-white/50 text-sm mt-1">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="text-center px-4">
                        <motion.div
                          className="relative w-24 h-24 mx-auto mb-5"
                          animate={{ y: isDragging ? -8 : 0, rotate: isDragging ? -8 : 0 }}
                          transition={{ type: "spring", stiffness: 180, damping: 16 }}
                        >
                          <div className="absolute inset-0 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10" />
                          <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-cyan-400/20 via-sky-400/10 to-fuchsia-500/10" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isDragging ? <Sparkles className="w-9 h-9 text-cyan-300" /> : <Upload className="w-8 h-8 text-white/70" />}
                          </div>
                        </motion.div>
                        <p className="text-white font-semibold mb-1">
                          <span className="text-cyan-300">Choose a file</span> or drag & drop it here
                        </p>
                        <p className="text-gray-400 text-sm">MP4/WebM only, up to 20MB. The robot is not negotiating.</p>
                      </div>
                    )}
                  </motion.div>

                  <div>
                    <input
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      maxLength={150}
                      placeholder="Add a caption..."
                      className="w-full rounded-2xl bg-white/[0.02] border border-white/[0.08] text-white px-4 py-3 placeholder:text-white/30 focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={!file || isUploading}
                    whileTap={!file || isUploading ? {} : { scale: 0.98 }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:hover:from-cyan-500 disabled:hover:to-blue-500 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </motion.button>
                </>
              )}
            </form>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                <UploadRobotHelper
                  status={robotStatus}
                  message={robotMessage}
                  disableAnimations={!lucidRobots}
                  className="w-full"
                />
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl space-y-3 text-sm text-white/70">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <ImageOff className="w-4 h-4 text-cyan-300" />
                  Upload rules
                </div>
                <p>• MP4 or WebM only.</p>
                <p>• 20MB max. Tiny restraint goes a long way.</p>
                <p>• Better captions get better robot respect.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
