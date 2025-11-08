export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-[#0D1117]/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 h-14 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 grid place-items-center text-white font-bold">
            DP
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold tracking-tight">DevPilot</h1>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 border border-zinc-700/70 rounded px-1.5 py-0.5">
                AI Code Mentor
              </span>
            </div>
            <p className="hidden sm:block text-[12px] text-zinc-500">
              Understand, improve, and document your code.
            </p>
          </div>
        </div>

        {/* Right: Actions (placeholders for now) */}
        <div className="flex items-center gap-2">
          {/* Theme toggle placeholder */}

        </div>
      </div>
    </header>
  );
}
