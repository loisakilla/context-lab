import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RunView } from '@/components/RunView';
import { ThemeControls } from '@/components/ThemeControls';
import { loadRun } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = loadRun(id);
  if (!record) notFound();
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-sm underline">
          ← к лаборатории
        </Link>
        <ThemeControls />
      </div>
      <RunView record={record} />
    </main>
  );
}
