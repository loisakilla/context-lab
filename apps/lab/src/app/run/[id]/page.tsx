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
    <>
      <TopBar current="lab" />
      <main className="wrap flex flex-col gap-10 pt-10 pb-24">
        <RunView record={record} />
      </main>
    </>
  );
}
