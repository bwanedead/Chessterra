import Link from 'next/link';

/** Phase 0 app navigation — discoverable entry points. */
export const EndgameNav = () => (
  <nav
    className="flex flex-wrap items-center justify-center gap-4 text-sm"
    aria-label="Main navigation"
  >
    <Link href="/" className="text-slate-400 transition hover:text-slate-200">
      Analytics
    </Link>
    <Link href="/play" className="font-medium text-sky-400 transition hover:text-sky-300">
      Play
    </Link>
    <Link href="/auth" className="text-slate-400 transition hover:text-slate-200">
      Account
    </Link>
  </nav>
);
