import { useState } from "react";
import { StickyNote, Plus, ThumbsUp } from "lucide-react";
import BlockBody from "./BlockBody";

export interface CollaborativeBoardConfig {
  prompt: string;
  max_posts?: number;
  allow_reactions?: boolean;
  anonymous?: boolean;
  image_url?: string;
  images?: string[];
}

interface Post {
  id: string;
  text: string;
  mine: boolean;
  reactions: number;
}

interface Props {
  config: CollaborativeBoardConfig;
  body: string | null;
  onComplete: (response: { posts: string[] }) => void;
  isLive?: boolean;
}

export default function CollaborativeBoardStep({ config, body, onComplete, isLive }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const maxPosts = config.max_posts || 5;

  function addPost() {
    if (!newPost.trim() || posts.filter(p => p.mine).length >= maxPosts) return;
    setPosts(prev => [...prev, {
      id: crypto.randomUUID(),
      text: newPost.trim(),
      mine: true,
      reactions: 0,
    }]);
    setNewPost("");
  }

  function handleReact(postId: string) {
    if (!config.allow_reactions) return;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, reactions: p.reactions + 1 } : p));
  }

  const myPosts = posts.filter(p => p.mine);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <StickyNote className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-lg">Collaborative Board</h3>
          <p className="text-muted-foreground text-sm mt-0.5">{config.prompt}</p>
        </div>
      </div>

      {body && <p className="text-sm text-muted-foreground">{body}</p>}

      {!submitted && (
        <>
          <div className="flex gap-2">
            <input value={newPost} onChange={e => setNewPost(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addPost()}
              placeholder="Add your idea..."
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground" />
            <button onClick={addPost}
              disabled={!newPost.trim() || myPosts.length >= maxPosts}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{myPosts.length}/{maxPosts} posts</p>
        </>
      )}

      {/* Board */}
      <div className="grid grid-cols-2 gap-2">
        {posts.map(post => (
          <div key={post.id}
            className="rounded-xl border border-border bg-card p-3 space-y-2 text-sm">
            <p className="text-foreground">{post.text}</p>
            {config.allow_reactions && (
              <button onClick={() => handleReact(post.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <ThumbsUp className="w-3 h-3" /> {post.reactions}
              </button>
            )}
            {!config.anonymous && post.mine && (
              <span className="text-[10px] text-primary font-medium">You</span>
            )}
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No posts yet. Add your first idea above!
        </div>
      )}

      {!submitted && myPosts.length > 0 && (
        <button onClick={() => { setSubmitted(true); onComplete({ posts: myPosts.map(p => p.text) }); }}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
          Submit Posts
        </button>
      )}

      {submitted && (
        <div className="rounded-xl border border-border bg-primary/5 p-5 text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">✅ Posts submitted!</p>
          <p className="text-xs text-muted-foreground">
            {isLive ? "Waiting for teacher to continue..." : "Great contributions!"}
          </p>
        </div>
      )}
    </div>
  );
}
