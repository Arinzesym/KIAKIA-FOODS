export const appRoles = ['owner', 'cofounder', 'runner', 'rider'] as const;

export type AppRole = (typeof appRoles)[number];
export type AuthRole = AppRole | '';

const cofounderAllowedAdminPrefixes = [
  '/admin/dashboard',
  '/admin/orders',
  '/admin/dispatch',
  '/admin/estate-batching',
  '/admin/reports'
];

const cofounderDeniedAdminPrefixes = [
  '/admin/team',
  '/admin/settings',
  '/admin/runners',
  '/admin/riders'
];

export function normalizeRole(role?: string | null): AuthRole {
  const normalized = (role ?? '').trim().toLowerCase();
  return appRoles.includes(normalized as AppRole) ? (normalized as AppRole) : '';
}

export function isAdminRole(role: AuthRole) {
  return role === 'owner' || role === 'cofounder';
}

export function isDeliveryRole(role: AuthRole) {
  return role === 'runner' || role === 'rider';
}

export function getLandingPath(role: AuthRole) {
  if (role === 'runner') {
    return '/runner';
  }

  if (role === 'rider') {
    return '/rider';
  }

  return '/admin/dashboard';
}

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function canAccessAdminPath(role: AuthRole, pathname: string) {
  if (role === 'owner') {
    return pathname.startsWith('/admin');
  }

  if (role !== 'cofounder') {
    return false;
  }

  if (cofounderDeniedAdminPrefixes.some((prefix) => matchesPrefix(pathname, prefix))) {
    return false;
  }

  return pathname === '/admin' || cofounderAllowedAdminPrefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

export function canAccessPath(role: AuthRole, pathname: string) {
  if (pathname === '/') {
    return !!role;
  }

  if (pathname.startsWith('/admin')) {
    return canAccessAdminPath(role, pathname);
  }

  if (pathname.startsWith('/runner')) {
    return role === 'owner' || role === 'runner';
  }

  if (pathname.startsWith('/rider')) {
    return role === 'owner' || role === 'rider';
  }

  return true;
}
