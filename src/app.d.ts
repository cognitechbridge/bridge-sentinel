// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import * as Sentry from '@sentry/browser';

declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }
  namespace svelteHTML {
    interface HTMLAttributes<T> {
      'on:copy-done'?: (e: CustomEvent<T>) => void;
      'on:copy-error'?: (e: CustomEvent<T>) => void;
    }
  }
  interface Window {
    Sentry: typeof Sentry; // Use a more specific type if you know the exact type of Sentry
  }
}

export { };
