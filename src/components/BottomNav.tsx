import { NavLink, useLocation } from 'react-router-dom';
import { Home, Clock, Plus, Target, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/historico', icon: Clock, label: 'Histórico' },
  { path: '/adicionar', icon: Plus, label: 'Adicionar', accent: true },
  { path: '/metas', icon: Target, label: 'Metas' },
  { path: '/perfil', icon: User, label: 'Perfil' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-overlay safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map(({ path, icon: Icon, label, accent }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              {accent ? (
                <div className={`flex h-11 w-11 items-center justify-center rounded-full gradient-gold shadow-lg ${isActive ? 'animate-pulse-gold' : ''}`}>
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
              ) : (
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
              )}
              {!accent && (
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
