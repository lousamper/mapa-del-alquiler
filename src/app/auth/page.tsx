import { Suspense } from "react";
import AuthClient from "./AuthClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Cargando…</div>}>
      <AuthClient />
    </Suspense>
  );
}
