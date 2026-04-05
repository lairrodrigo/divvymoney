import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useQuery } from "@tanstack/react-query";

interface Workspace {
  id: string;
  name: string;
  created_by: string;
  role: "owner" | "editor" | "viewer";
}

interface WorkspaceContextType {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  workspaces: Workspace[];
  isLoading: boolean;
  activeWorkspace: Workspace | undefined;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  activeWorkspaceId: null,
  setActiveWorkspaceId: () => {},
  workspaces: [],
  isLoading: true,
  activeWorkspace: undefined,
});

const STORAGE_KEY = "divvymoney_active_workspace";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, isReady: authReady } = useAuth();
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(
    localStorage.getItem(STORAGE_KEY)
  );

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["my_workspaces", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch memberships first
      const { data: memberships, error: mErr } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", user.id);

      if (mErr) throw mErr;
      if (!memberships || memberships.length === 0) return [];

      const wsIds = memberships.map((m) => m.workspace_id);

      // Fetch workspace details
      const { data: wsDetails, error: wsErr } = await supabase
        .from("workspaces")
        .select("*")
        .in("id", wsIds);

      if (wsErr) throw wsErr;

      return (wsDetails || []).map((w) => ({
        ...w,
        role: memberships.find((m) => m.workspace_id === w.id)?.role || "viewer",
      })) as Workspace[];
    },
    enabled: authReady && !!user,
  });

  const setActiveWorkspaceId = (id: string | null) => {
    setActiveWorkspaceIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (!isLoading && workspaces.length > 0 && !activeWorkspaceId) {
      setActiveWorkspaceId(workspaces[0].id);
    }
  }, [isLoading, workspaces, activeWorkspaceId]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspaceId,
        setActiveWorkspaceId,
        workspaces,
        isLoading,
        activeWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspacesContext = () => useContext(WorkspaceContext);
