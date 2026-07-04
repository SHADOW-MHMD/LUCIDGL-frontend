"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Upload, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { env } from "@/lib/env";

export default function FacesUploadPage() {
  const { user, loading: authLoading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
      setErrorMsg("File must be smaller than 20MB.");
      return;
    }

    if (selected.type !== "video/mp4" && selected.type !== "video/webm") {
      setErrorMsg("Only MP4 and WebM videos are supported.");
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setIsUploading(true);
    setErrorMsg("");

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
    <div className="max-w-2xl mx-auto p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl mt-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
          Upload to Faces
        </h1>
        <p className="text-white/60">Share your reel with the world.</p>
      </div>

      {success ? (
        <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
          <CheckCircle className="w-20 h-20 text-green-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Upload Successful!</h2>
          <p className="text-slate-400">Your video is now live on the neural net.</p>
          <p className="text-white/40 text-sm mt-4">Redirecting to feed...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#0d0d1a] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
              {errorMsg}
            </div>
          )}

          <motion.div
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.01, borderColor: "rgb(139, 92, 246)" }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgb(139, 92, 246)"; }}
            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = ""; }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = "";
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) handleFileChange({ target: { files: [dropped] } } as any);
            }}
            className={`relative flex flex-col items-center justify-center w-full min-h-[300px] rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
              file ? "border-violet-500/50 bg-violet-500/5" : "border-white/20 bg-white/[0.02]"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/mp4,video/webm,image/jpeg,image/png"
              className="hidden"
            />
            
            {file ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-xl bg-violet-500/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-violet-400" />
                </div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-white/50 text-sm mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-white/5 rounded-xl flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white/60" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center border-2 border-[#0d0d1a]">
                    <span className="text-white text-lg font-bold leading-none mb-0.5">+</span>
                  </div>
                </div>
                <p className="text-white font-medium mb-1">
                  <span className="text-violet-400">Choose a file</span> or drag & drop it here
                </p>
                <p className="text-gray-400 text-sm">JPEG, PNG, and MP4 formats, up to 100MB</p>
              </div>
            )}
          </motion.div>

          <div>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={150}
              placeholder="Add a caption..."
              className="w-full bg-white/[0.02] border-b border-white/[0.08] text-white px-4 py-3 placeholder:text-white/30 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <motion.button
            type="submit"
            disabled={!file || isUploading}
            whileTap={!file || isUploading ? {} : { scale: 0.98 }}
            className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 text-white font-bold transition-colors flex items-center justify-center gap-2"
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
        </form>
      )}
    </div>
  );
}
