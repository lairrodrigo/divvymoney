import { ChevronDown, Briefcase, Home, User } from "lucide-react";
import { useWorkspacesContext } from "@/contexts/WorkspaceContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WorkspaceSelector() {
  const { workspaces, activeWorkspace, setActiveWorkspaceId } = useWorkspacesContext();

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("casa") || n.includes("home")) return <Home className="h-4 w-4" />;
    if (n.includes("pessoal") || n.includes("personal")) return <User className="h-4 w-4" />;
    return <Briefcase className="h-4 w-4" />;
  };

  if (!activeWorkspace && workspaces.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full bg-secondary/50 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary">
        {activeWorkspace ? (
          <>
            {getIcon(activeWorkspace.name)}
            <span>{activeWorkspace.name}</span>
          </>
        ) : (
          <span>Selecionar Espaço</span>
        )}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => setActiveWorkspaceId(ws.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            {getIcon(ws.name)}
            <span>{ws.name}</span>
            {activeWorkspace?.id === ws.id && (
              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
        {workspaces.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Nenhum espaço encontrado
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
