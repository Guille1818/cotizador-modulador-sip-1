'use client';

import dynamic from 'next/dynamic';

const AdminPage = dynamic(
  () => import('@/features/admin/components/admin-page'),
  { ssr: false }
);

export default function AdminRoute() {
  return <AdminPage />;
}
