import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({
  children,
  email,
}: {
  children: ReactNode;
  email?: string | null;
}) {
  return (
    <div className="min-h-screen bg-[#01161E]">
      <div className="flex h-screen flex-col md:flex-row">
        <Sidebar email={email} />
        <div className="flex flex-1 flex-col">
          <main className="flex-1 overflow-y-auto bg-[#01161E] p-6 md:p-8">
            <div className="space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
