import { Suspense } from "react";
import AddNeighborhoodReviewClient from "./AddNeighborhoodReviewClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Cargando…</div>}>
      <AddNeighborhoodReviewClient />
    </Suspense>
  );
}