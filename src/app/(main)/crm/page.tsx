'use client';

import dynamic from 'next/dynamic';

const CrmPage = dynamic(
  () => import('@/features/crm/components/crm-page'),
  { ssr: false }
);

export default function CrmRoute() {
  return <CrmPage />;
}
