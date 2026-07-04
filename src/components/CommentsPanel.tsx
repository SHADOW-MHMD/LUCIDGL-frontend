import { useState, useEffect } from "react";
import { X, Heart, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Comment } from "@/types";
import { env } from "@/lib/env";

interface CommentsPanelProps {
  postId: string;
  onClose: () => void;
  onCommentAdded: (newCount: number) => void;
}

export function CommentsPanel({ postId, onClose, onCommentAdded }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`${env.apiUrl}/api/feed/comments/${postId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (err) {
        console.error("Failed to fetch comments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`${env.apiUrl}/api/feed/comments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ postId, text })
      });
      
      if (res.ok) {
        const data = await res.json();
        setComments([...comments, data.comment]);
        onCommentAdded(comments.length + 1);
        setText("");
      }
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string, currentLiked: boolean) => {
    // Optimistic UI
    setComments(comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          is_liked: !currentLiked,
          like_count: currentLiked ? Math.max(0, c.like_count - 1) : c.like_count + 1
        };
      }
      return c;
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(`${env.apiUrl}/api/feed/comments/like`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ commentId })
      });
    } catch (err) {
      console.error("Failed to like comment", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />
      
      {/* Slide-up Sheet */}
      <div className="w-full max-w-md h-[70vh] bg-slate-900 border-t border-white/10 rounded-t-3xl flex flex-col pointer-events-auto shadow-2xl transform transition-transform duration-300 translate-y-0">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-white font-bold text-lg">{comments.length} comments</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-t-indigo-500 border-white/10 rounded-full animate-spin"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-white/40 mt-10">
              Be the first to comment!
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/60 font-medium text-xs">@{comment.username || "anonymous"}</span>
                    {comment.badge_tier && (
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-bold text-white/80 tracking-wider">
                        {comment.badge_tier}
                      </span>
                    )}
                  </div>
                  <p className="text-white text-sm break-words">{comment.text}</p>
                  <div className="mt-2 text-white/40 text-[10px]">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0 pt-2">
                  <button onClick={() => handleLike(comment.id, !!comment.is_liked)} className={`p-1.5 rounded-full transition-colors ${comment.is_liked ? 'text-red-500' : 'text-white/40 hover:text-white/80'}`}>
                    <Heart className={`w-4 h-4 ${comment.is_liked ? 'fill-red-500' : ''}`} />
                  </button>
                  <span className="text-white/50 text-[10px]">{comment.like_count}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 shrink-0"></div>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button 
              type="submit" 
              disabled={!text.trim() || isSubmitting}
              className="p-2 rounded-full bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
