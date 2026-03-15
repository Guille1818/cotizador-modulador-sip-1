'use client';

import dynamic from 'next/dynamic';

const EngineeringPage = dynamic(
  () => import('@/features/engineering/components/engineering-page'),
  { ssr: false }
);

export default function EngineeringRoute() {
  return <EngineeringPage />;
}
