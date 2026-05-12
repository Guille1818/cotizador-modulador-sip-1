'use client';

import dynamic from 'next/dynamic';

const ExportPage = dynamic(
  () => import('@/features/export/components/export-page'),
  { ssr: false }
);

export default function ExportRoute() {
  return <ExportPage />;
}
