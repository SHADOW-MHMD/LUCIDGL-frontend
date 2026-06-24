"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Upload, Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const selected = e.dataTransfer.files?.[0];
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setIsUploading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("caption", caption);

      const token = await user.getIdToken();
      const apiUrl = "https://lucid-gl.muhammed1515mishal.workers.dev";

      const res = await fetch(`${apiUrl}/api/faces/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      setSuccess(true);
      setFile(null);
      setCaption("");
      
      setTimeout(() => {
        router.push("/reels");
      }, 3000);
    } catch (error: any) {
      setErrorMsg(error.message || "An error occurred during upload.");
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
              {errorMsg}
            </div>
          )}

          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
              file ? "border-cyan-500/50 bg-cyan-500/5" : "border-white/20 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10"
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
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-cyan-400" />
                </div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-white/50 text-sm mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-white/60" />
                </div>
                <p className="text-white font-medium mb-1">Click to select or drag & drop</p>
                <p className="text-white/50 text-sm">MP4 or WebM (max 20MB)</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={150}
              placeholder="What's this about?"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none"
            />
            <div className="text-right mt-1 text-xs text-white/40">
              {caption.length} / 150
            </div>
          </div>

          <button
            type="submit"
            disabled={!file || isUploading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:hover:from-cyan-500 disabled:hover:to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Encrypting & Streaming to Neural Net...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Stream to Faces
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
