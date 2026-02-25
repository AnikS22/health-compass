import { Link } from "react-router-dom";
import { Scale } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 mx-auto flex items-center justify-center">
          <Scale className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-7xl font-extrabold text-primary tracking-tight">404</h1>
          <p className="text-muted-foreground mt-2 text-sm">This page doesn't exist.</p>
        </div>
        <Link
          to="/"
          className="inline-flex px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
