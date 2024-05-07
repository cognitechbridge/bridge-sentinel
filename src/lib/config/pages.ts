type Page = {
  name: string;
  href: string;
  label?: string;
};
export const pages: Page[] = [
  {
    name: 'Dashboard',
    href: '/dashboard'
  },
  {
    name: 'Authentication',
    href: '/register'
  },
  {
    name: 'Login',
    href: '/login'
  },
  {
    name: 'Login Clound',
    href: '/login-cloud'
  }
];
