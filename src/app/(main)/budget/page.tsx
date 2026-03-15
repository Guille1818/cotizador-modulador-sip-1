'use client';

import dynamic from 'next/dynamic';

const BudgetPage = dynamic(
  () => import('@/features/budget/components/budget-page'),
  { ssr: false }
);

export default function BudgetRoute() {
  return <BudgetPage />;
}
