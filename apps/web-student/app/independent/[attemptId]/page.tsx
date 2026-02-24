interface IndependentAttemptPageProps {
  params: Promise<{ attemptId: string }>;
}

import IndependentAttemptClient from "./runtime-client";
import { Suspense } from "react";

export function generateStaticParams() {
  return [{ attemptId: "demo-attempt" }];
}

export default async function IndependentAttemptPage({ params }: IndependentAttemptPageProps) {
  const resolved = await params;
  return (
    <Suspense fallback={<main><p className="status info">Loading lesson...</p></main>}>
      <IndependentAttemptClient initialAttemptId={resolved.attemptId} />
    </Suspense>
  );
}
