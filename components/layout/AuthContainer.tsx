import type { ReactNode } from "react";

export function AuthContainer({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 text-2xl font-semibold text-slate-900">
            <span role="img" aria-label="broom">
              🧹
            </span>
            CleanSync
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
