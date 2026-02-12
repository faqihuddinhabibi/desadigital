import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface Branding {
  app_name: string | null;
  site_subtitle: string | null;
  logo_url: string | null;
  splash_logo_url: string | null;
  favicon_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
}

const DEFAULT_BRANDING: Branding = {
  app_name: 'Desa Digital',
  site_subtitle: 'BY FIBERNODE INTERNET',
  logo_url: null,
  splash_logo_url: null,
  favicon_url: null,
  meta_title: 'Desa Digital - Monitoring CCTV | Fibernode',
  meta_description: 'Sistem monitoring CCTV terintegrasi untuk desa digital. Pantau keamanan lingkungan RT/RW secara real-time.',
  og_image_url: null,
};

const BrandingContext = createContext<Branding>(DEFAULT_BRANDING);

export function BrandingProvider({ children, initialBranding }: { children: ReactNode; initialBranding: Branding | null }) {
  const [branding, setBranding] = useState<Branding>(() => ({
    ...DEFAULT_BRANDING,
    ...Object.fromEntries(Object.entries(initialBranding || {}).filter(([, v]) => v !== null)),
  }));

  // Apply dynamic meta tags + favicon to document head
  useEffect(() => {
    const b = branding;

    // Title
    if (b.meta_title) document.title = b.meta_title;

    // Favicon
    if (b.favicon_url) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (link) {
        link.href = b.favicon_url;
        link.type = b.favicon_url.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
      } else {
        link = document.createElement('link');
        link.rel = 'icon';
        link.href = b.favicon_url;
        document.head.appendChild(link);
      }
    }

    // Meta description
    if (b.meta_description) {
      setMeta('description', b.meta_description);
      setMetaProperty('og:description', b.meta_description);
      setMetaProperty('twitter:description', b.meta_description);
    }

    // Meta title (OG)
    if (b.meta_title) {
      setMetaProperty('og:title', b.meta_title);
      setMetaProperty('twitter:title', b.meta_title);
    }

    // OG Image
    if (b.og_image_url) {
      setMetaProperty('og:image', b.og_image_url);
      setMetaProperty('twitter:image', b.og_image_url);
    }
  }, [branding]);

  // Re-sync when initialBranding prop changes
  useEffect(() => {
    if (initialBranding) {
      setBranding({
        ...DEFAULT_BRANDING,
        ...Object.fromEntries(Object.entries(initialBranding).filter(([, v]) => v !== null)),
      });
    }
  }, [initialBranding]);

  // Listen for live branding updates via WebSocket
  useEffect(() => {
    const handler = () => {
      fetch('/api/settings/branding')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setBranding({
              ...DEFAULT_BRANDING,
              ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null)),
            });
          }
        })
        .catch(() => {});
    };
    window.addEventListener('branding:updated', handler);
    return () => window.removeEventListener('branding:updated', handler);
  }, []);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

// ── Helpers ──

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (el) {
    el.content = content;
  } else {
    el = document.createElement('meta');
    el.name = name;
    el.content = content;
    document.head.appendChild(el);
  }
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (el) {
    el.content = content;
  } else {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    el.content = content;
    document.head.appendChild(el);
  }
}
