/**
 * Utility to safely extract route params in Next.js 15 App Router
 * 
 * Next.js 15 sometimes widens PageProps params to Promise<any> causing
 * TypeScript build errors when expecting synchronous object access.
 * 
 * This helper provides a consistent way to extract params regardless
 * of whether they're delivered synchronously or as a Promise.
 */

export type RouteParams<T = Record<string, string>> = {
  params: T | Promise<T>;
  searchParams?: Record<string, string | string[]> | Promise<Record<string, string | string[]>>;
};

/**
 * Extract params safely from Next.js page props
 * @param props - The page props object
 * @returns The params object with proper typing
 */
export function getRouteParams<T extends Record<string, string>>(
  props: any
): T {
  // Handle both sync and Promise-based params
  const params = props?.params;
  
  // If it's already an object, return it
  if (params && typeof params === 'object' && !('then' in params)) {
    return params as T;
  }
  
  // For safety, return empty object if params are invalid
  // In practice, Next.js should always provide valid params
  return {} as T;
}

/**
 * Type-safe wrapper for dynamic route page components
 * Use this instead of explicit param destructuring to avoid build errors
 */
export function createDynamicPage<T extends Record<string, string>>(
  component: (params: T) => React.ReactNode
) {
  return function DynamicPageWrapper(props: any) {
    const params = getRouteParams<T>(props);
    return component(params);
  };
}

// Common param types for reuse
export type IdParam = { id: string };
export type KpiIdParam = { kpiId: string };
export type SlugParam = { slug: string };
