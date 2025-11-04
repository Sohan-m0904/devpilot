export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-brand-600 grid place-items-center font-bold">DP</div>
          <h1 className="font-semibold">DevPilot</h1>
        </div>
        <p className="text-sm text-zinc-400">AI code mentor dashboard</p>
      </div>
    </header>
  );
}
