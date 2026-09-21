import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RunView } from '@/components/RunView';
import { loadRun } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = loadRun(id);
  if (!record) notFound();
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm underline">
        ← к лаборатории
      </Link>
      <RunView record={record} />
    </main>
  );
}
