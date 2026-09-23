import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export default function AuthHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-base-700/60 bg-base-950/90 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-base-500 hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
        <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-tight">
          <span className="w-6 h-6 rounded-md bg-accent-500 text-white flex items-center justify-center">
            <Printer size={12} />
          </span>
          Print<span className="text-accent-400">MyDoc</span>
        </Link>
      </div>
    </header>
  );
}
