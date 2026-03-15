import { INITIAL_PRICES } from '@/shared/lib/constants';
import type { Product, ProductOverride, BudgetItem, BudgetResult, Project } from '@/shared/types';

/**
 * Calculates the budget items and final total based on quantities, prices, and project settings.
 * @param quantities - Map of product ID to quantity
 * @param prices - Array of product objects with prices (from store)
 * @param project - Project object containing overrides and adjustment info
 * @returns { items: Array, total: Number, subtotal: Number }
 */
export const calculateBudget = (
  quantities: Record<string, number>,
  prices: Product[],
  project: Partial<Project>
): BudgetResult => {
  const adjustmentPercentage = project?.projectInfo?.adjustmentPercentage || 0;
  const markupMultiplier = adjustmentPercentage > 0 ? (1 + adjustmentPercentage / 100) : 1;
  const discountFactor = adjustmentPercentage < 0 ? (1 + adjustmentPercentage / 100) : 1;

  const safeQuantities: Record<string, number> = quantities || {};
  const safeOverrides: Record<string, ProductOverride> = project?.overrides || {};
  const safePrices: Product[] = prices || [];

  const allProductIds = new Set([...Object.keys(safeQuantities), ...Object.keys(safeOverrides)]);

  const items: BudgetItem[] = [];

  allProductIds.forEach(fullId => {
    // Strip usage suffix if present (e.g., "ID@@USAGE")
    const [id, usage] = fullId.split('@@');

    // Priority: INITIAL_PRICES for metadata to ensure consistent names/categories
    const latestProduct = INITIAL_PRICES.find((p: Product) => p.id === id);
    // Priority: Store prices for the actual price value (user might have updated it)
    const stateProduct = safePrices.find((p: Product) => p.id === id);

    const product: Product = (latestProduct || stateProduct) ? { ...(latestProduct || stateProduct)! } : {
      id: id,
      name: `Panel Desconocido (${id})`,
      unit: 'UNID',
      category: '1. SISTEMA DE PANELES',
      price: 0,
    };
    const override: ProductOverride | undefined = safeOverrides[fullId]; // Check overrides with full ID

    // Quantity logic: Override wins, then calculated quantity
    const qty = override?.qty !== undefined ? Number(override.qty) : (Number(safeQuantities[fullId]) || 0);

    if (qty <= 0 && !override) return;

    // Add usage suffix to name for clarity if it's a panel
    if (usage) {
      const usageLabels: Record<string, string> = {
        'EXTERIOR': ' (Perimetral)',
        'INTERIOR': ' (Tabiquería)',
        'PISO': ' (Piso)',
        'TECHO': ' (Cubierta)',
      };
      product.name = `${product.name}${usageLabels[usage] || ''}`;
    }

    // Price logic: Override wins, then state price, then static initial price
    const basePrice = override?.price !== undefined ? Number(override.price) : (Number(stateProduct?.price) || Number(latestProduct?.price) || 0);

    const effectivePrice = basePrice * markupMultiplier;

    items.push({
      ...product,
      name: override?.name || product.name,
      unit: override?.unit || product.unit,
      category: override?.category || product.category,
      id: fullId, // Use the unique ID for budget state
      price: effectivePrice,
      qty: qty,
      total: Math.ceil(qty * effectivePrice),
      isOverridden: !!override,
    });
  });

  // Subtotal
  const subtotal = Math.ceil(items.reduce((acc, item) => acc + item.total, 0));

  // Final Total (Apply discount if negative adjustment)
  const total = Math.ceil(subtotal * (adjustmentPercentage < 0 ? discountFactor : 1));

  // Sort by category
  items.sort((a, b) => (a.category || '').localeCompare(b.category || ''));

  return { items, total, subtotal };
};
