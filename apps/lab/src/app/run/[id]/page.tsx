import { notFound } from 'next/navigation';
import { RunView } from '@/components/RunView';
import { TopBar } from '@/components/TopBar';
import { loadRun } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = loadRun(id);
  if (!record) notFound();
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-8 sm:px-6">
      <TopBar current="lab" />
      <RunView record={record} />
    </main>
  );
}
