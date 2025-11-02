"use client";

import Lottie from "lottie-react";
import loaderAnimation from "@/lib/data/loader.json";

export function Loader({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center ${className || ""}`}
      style={{ width: "100%", height: "100%", minHeight: "400px" }}
    >
      <Lottie
        animationData={loaderAnimation}
        loop={true}
        style={{ width: 200, height: 200 }}
      />
    </div>
  );
}
