"use client";
import { Suspense } from "react";
import { ProtectedPage } from "../../components/nav/sidebar";
import Charts from "../../components/charts/charts";

export default function Dashboard() {
  return (
    <ProtectedPage>
      <Suspense fallback={<div>Carregando...</div>}>
        <Charts />
      </Suspense>
    </ProtectedPage>
  );
}
