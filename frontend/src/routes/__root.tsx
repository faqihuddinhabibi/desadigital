import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from '../hooks/useTheme';

interface RouterContext {
  auth: {
    user: { id: string; username: string; name: string; role: string; rtId: string | null } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider>
      <Outlet />
    </ThemeProvider>
  );
}
