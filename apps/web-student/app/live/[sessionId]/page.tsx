interface LiveSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

import LiveSessionClient from "./runtime-client";
import { Suspense } from "react";

export function generateStaticParams() {
  return [{ sessionId: "demo-session" }];
}

export default async function LiveSessionPage({ params }: LiveSessionPageProps) {
  const resolved = await params;
  return (
    <Suspense fallback={<main><p className="status info">Loading live session...</p></main>}>
      <LiveSessionClient initialSessionId={resolved.sessionId} />
    </Suspense>
  );
}
