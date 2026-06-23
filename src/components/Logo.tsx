import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-slate-950 transition hover:text-brand-700">
      <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-transparent">
        <Image src="/logo.svg" alt="KiaKia Foods logo" width={48} height={48} className="h-10 w-10" priority />
      </span>
      <span className="leading-[1.05]">
        <span className="block text-base font-bold">KiaKia Foods</span>
        <span className="block text-xs uppercase tracking-[0.22em] text-slate-500">WE GO. YOU REST.</span>
      </span>
    </Link>
  );
}
