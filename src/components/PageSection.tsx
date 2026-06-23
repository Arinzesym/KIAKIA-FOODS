interface PageSectionProps {
  title: string;
  description: string;
}

export function PageSection({ title, description }: PageSectionProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-4 text-slate-600">{description}</p>
    </div>
  );
}
