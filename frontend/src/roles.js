/**
 * Demo role catalog for the seeded accounts. Loaded from REACT_APP_DEMO_ROLES so
 * no credentials are hardcoded in source. Falls back to an empty list if unset.
 */
const parseRoles = () => {
  try {
    const raw = process.env.REACT_APP_DEMO_ROLES;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const roles = parseRoles();
