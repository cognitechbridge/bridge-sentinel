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
    name: 'Sign Up',
    href: '/auth/register'
  },
  {
    name: 'Sign Up Could',
    href: '/auth/register-cloud'
  },
  {
    name: 'Login',
    href: '/auth/login'
  },
  {
    name: 'Login Clound',
    href: '/auth/login-cloud'
  },
  {
    name: 'First Time Setup',
    href: '/auth/first-time'
  }
];
