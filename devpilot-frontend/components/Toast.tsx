"use client";

import { useEffect, useState } from "react";

export default function Toast({ notice }: { notice: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 4 seconds
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!notice || !visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm px-4 py-2 rounded-lg shadow-lg max-w-xs">
        {notice}
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
