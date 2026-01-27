import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
// @ts-expect-error - virtual module provided by Starlight
import starlightConfig from 'virtual:starlight/user-config';
import type { TelescopePage } from '../schemas/config.js';
import { getLocaleFromPath, stripLocaleFromPath } from '../libs/url.js';

/**
 * Generate static paths for all supported locales.
 * Creates /pages.json for root locale and /[locale]/pages.json for each configured locale.
 */
export const getStaticPaths: GetStaticPaths = () => {
  const configuredLocales = starlightConfig.locales
    ? Object.keys(starlightConfig.locales).filter((l) => l !== 'root')
    : [];

  return [
    // Root locale (no prefix)
    { params: { locale: undefined } },
    // Each configured locale
    ...configuredLocales.map((locale) => ({
      params: { locale },
    })),
  ];
};

export const GET: APIRoute = async ({ params }) => {
  const { locale } = params;

  try {
    const allPages = await getCollection('docs');

    // Filter pages by locale
    const localePages = allPages.filter((page) => {
      const pageLocale = getLocaleFromPath(page.id);

      if (locale === undefined) {
        // Root locale: pages without locale prefix
        return pageLocale === undefined;
      }
      // Specific locale: pages with matching locale prefix
      return pageLocale === locale;
    });

    // Filter out the home page (served at /, not /index)
    const filteredPages = localePages.filter(
      (page) => stripLocaleFromPath(page.id) !== 'index'
    );

    // Format pages, stripping locale from path since it's already implicit
    const formattedPages: TelescopePage[] = filteredPages.map((page) => ({
      title: page.data.title,
      // Strip locale prefix from path - navigation will add it back
      path: stripLocaleFromPath(page.id),
      description: page.data.description || '',
      tags: page.data.tags || [],
    }));

    return new Response(JSON.stringify(formattedPages), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating pages.json:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate pages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
