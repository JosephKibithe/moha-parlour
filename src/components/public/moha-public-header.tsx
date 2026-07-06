import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type MohaPublicHeaderProps = {
  bookCtaLabel?: string;
};

export function MohaPublicHeader({
  bookCtaLabel = "Book your set",
}: MohaPublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d0c0e]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="group">
          <p className="text-xs font-bold tracking-[0.32em] text-[#d97b98]">
            MOHA
          </p>

          <p className="mt-1 text-sm font-medium text-white/80 transition group-hover:text-white">
            Nail Parlour
          </p>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex">
          <Link href="/#mood" className="transition hover:text-white">
            The MOHA mood
          </Link>

          <Link href="/#services" className="transition hover:text-white">
            Services
          </Link>

          <Link href="/#visit" className="transition hover:text-white">
            Visit us
          </Link>
        </nav>

        <Link
          href="/book"
          className="inline-flex items-center gap-2 rounded-full border border-[#d97b98] bg-[#d97b98] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#f0a1ba] hover:bg-[#f0a1ba]"
        >
          {bookCtaLabel}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
