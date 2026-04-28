export const ROLES = {
  SUPERUSER: 'SuperUser',
  HR: 'HR',
  DIRECTOR: 'Director',
  VP: 'VP',
  GM: 'GM',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
  INTERN: 'Intern'
};

export const ADMIN_ROLES = [ROLES.SUPERUSER, ROLES.HR];
export const MANAGEMENT_ROLES = [
  ROLES.SUPERUSER,
  ROLES.HR,
  ROLES.DIRECTOR,
  ROLES.VP,
  ROLES.GM,
  ROLES.MANAGER,
];
export const EDITOR_ROLES = [...MANAGEMENT_ROLES, ROLES.MANAGER];
