import { defaultLang, ui, type Lang, type UiKey } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const [, firstSegment] = url.pathname.split('/');
  if (firstSegment === 'en') {
    return 'en';
  }
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

export function getAlternateUrl(url: URL): string {
  const lang = getLangFromUrl(url);
  const pathname = url.pathname;

  if (lang === 'en') {
    const stripped = pathname.replace(/^\/en(?=\/|$)/, '');
    return stripped === '' ? '/' : stripped;
  }

  if (pathname === '/' || pathname === '/index.html') {
    return '/en/';
  }

  return `/en${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

export function getLocalizedPath(path: string, lang: Lang): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'en') {
    if (normalized === '/') return '/en/';
    if (normalized.startsWith('/#')) return `/en${normalized}`;
    return `/en${normalized}`;
  }
  return normalized;
}
