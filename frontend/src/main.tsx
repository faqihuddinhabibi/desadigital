import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { AuthProvider, useAuth } from './hooks/useAuth';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
});

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
    queryClient,
  },
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

interface Branding {
  app_name: string | null;
  logo_url: string | null;
  splash_logo_url: string | null;
}

function SplashScreen({ branding, onDone }: { branding: Branding | null; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const logoSrc = branding?.splash_logo_url || branding?.logo_url;
  const appName = branding?.app_name || 'Desa Digital';

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center animate-fade-in">
      {logoSrc ? (
        <img src={logoSrc} alt={appName} className="w-24 h-24 object-contain mb-4 animate-pulse" />
      ) : (
        <div className="w-20 h-20 bg-[#ED1C24] rounded-2xl flex items-center justify-center mb-4 animate-pulse">
          <span className="text-white font-bold text-4xl">F</span>
        </div>
      )}
      <h1 className="text-2xl font-bold tracking-tight">{appName}</h1>
      <p className="text-sm text-muted-foreground mt-1 italic">More Than Internet—A True Partner</p>
      <div className="mt-8 w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth, queryClient }} />;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [branding, setBranding] = useState<Branding | null>(null);

  useEffect(() => {
    fetch('/api/settings/branding')
      .then(r => r.ok ? r.json() : null)
      .then(data => setBranding(data))
      .catch(() => {});
  }, []);

  if (showSplash) {
    return <SplashScreen branding={branding} onDone={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
