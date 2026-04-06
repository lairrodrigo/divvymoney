// Categories table does not exist in this DB schema.
// Categories are stored as text strings on transactions.
// This hook is a stub to prevent import errors.

import { CATEGORIES } from '@/types/finance';

export function useCategories(_workspaceId: string | null) {
  // Return the static CATEGORIES list as fake data
  const data = CATEGORIES.map((name, i) => ({ id: name, name, type: 'expense' as const }));
  return { data, isLoading: false };
}

export function useCreateCategory() {
  return {
    mutateAsync: async () => { throw new Error('categories table does not exist'); },
    isPending: false,
  };
}
