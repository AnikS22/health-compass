import { useState } from "react";

interface TreeNode {
  id: string;
  text: string;
  next?: string | null;
  outcome?: string;
}

export interface DilemmaTreeConfig {
  root_question: string;
  tree: TreeNode[];
}

interface Props {
  config: DilemmaTreeConfig;
  body: string | null;
  onComplete: (response: { path: string[] }) => void;
}

export default function DilemmaTreeStep({ config, body, onComplete }: Props) {
  const [path, setPath] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const tree = config.tree || [];
  
  // Find available choices at current position
  const currentNodeId = path.length > 0 ? path[path.length - 1] : null;
  const currentNode = currentNodeId ? tree.find(n => n.id === currentNodeId) : null;
  
  // Get choices: if at root, show first-level nodes; otherwise show "next" node's children
  const getChoices = (): TreeNode[] => {
    if (path.length === 0) {
      // Show root-level choices (nodes that aren't referenced as "next" by others, or first few)
      return tree.filter((_, i) => i < Math.min(tree.length, 4));
    }
    if (currentNode?.next) {
      const nextNode = tree.find(n => n.id === currentNode.next);
      if (nextNode) return [nextNode];
    }
    return [];
  };

  const choices = getChoices();
  const isEnd = currentNode && (!currentNode.next || !tree.find(n => n.id === currentNode.next));

  function handleChoice(nodeId: string) {
    if (finished) return;
    const newPath = [...path, nodeId];
    setPath(newPath);
    
    const node = tree.find(n => n.id === nodeId);
    if (!node?.next || !tree.find(n => n.id === node.next)) {
      setFinished(true);
      onComplete({ path: newPath });
    }
  }

  function handleRestart() {
    setPath([]);
    setFinished(false);
  }

  return (
    <div className="space-y-5">
      {body && <p className="text-foreground text-base leading-relaxed">{body}</p>}
      
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <p className="text-sm font-semibold text-foreground">{config.root_question}</p>
      </div>

      {/* Show path taken */}
      {path.length > 0 && (
        <div className="space-y-2">
          {path.map((nodeId, i) => {
            const node = tree.find(n => n.id === nodeId);
            return (
              <div key={i} className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="bg-card border border-border rounded-xl p-3 flex-1">
                  <p className="text-sm text-foreground">{node?.text}</p>
                  {node?.outcome && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{node.outcome}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show current choices */}
      {!finished && choices.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {path.length === 0 ? "Choose your path:" : "What happens next:"}
          </p>
          {choices.map(choice => (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice.id)}
              className="w-full text-left px-4 py-3 rounded-xl border-2 border-border bg-card text-sm text-foreground hover:border-primary/50 transition-all"
            >
              {choice.text}
            </button>
          ))}
        </div>
      )}

      {finished && (
        <div className="space-y-3">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-foreground font-medium">
              ✓ You've reached the end of this dilemma path.
            </p>
          </div>
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-secondary text-foreground rounded-xl text-sm font-medium hover:bg-secondary/80"
          >
            Explore a different path
          </button>
        </div>
      )}
    </div>
  );
}
