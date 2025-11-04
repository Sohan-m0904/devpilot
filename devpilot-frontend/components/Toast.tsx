"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function Toast({ notice }: { notice: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!notice) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm shadow",
        show ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      {notice}
    </div>
  );
}
