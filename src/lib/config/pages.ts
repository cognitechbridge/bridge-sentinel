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
    href: '/register'
  },
  {
    name: 'Sign Up Could',
    href: '/register-cloud'
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
