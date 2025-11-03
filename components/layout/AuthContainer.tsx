import type { ReactNode } from "react";
import Image from "next/image";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#01161E] via-[#124559] to-[#01161E] px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-[#124559]/50 bg-[#124559] p-8 shadow-xl animate-fadeIn">
        <div className="mb-8 text-center">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#124559]/50 border border-[#124559]/50">
              <Image
                src="/staysync-logo.svg"
                alt="CleanSync logo"
                width={60}
                height={60}
              />
            </div>
            <Image
              src="/CleanSync.svg"
              alt="CleanSync"
              width={160}
              height={36}
            />
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-[#EFF6E0]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[#EFF6E0]/70">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
