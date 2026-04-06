// Accounts table does not exist in this DB schema.
// This hook is a stub to prevent import errors.
// Credit cards are managed via useCreditCards hook.

export function useAccounts(_workspaceId: string | null) {
  return { data: [] as never[], isLoading: false };
}

export function useCreateAccount() {
  return {
    mutateAsync: async () => { throw new Error('accounts table does not exist'); },
    isPending: false,
  };
}
