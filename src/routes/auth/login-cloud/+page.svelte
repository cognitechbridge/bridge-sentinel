<script lang="ts">
  import { open } from '@tauri-apps/api/shell';
  import { onMount } from 'svelte';
  import { listen } from '@tauri-apps/api/event';
  import pkceChallenge from 'pkce-challenge';
  import { userService } from '$lib/stores/user';
  import { Button } from '$components/ui/button';
  import { goto } from '$app/navigation';
  import { get_api_base_url } from '$api/app_cloud_client';

  let state = '';
  let verifier = '';

  type instanceEvent = {
    args: string[];
    cwd: string;
  };

  function openLoginUrl(challenge: string, is_signup: boolean = false) {
    state = Math.random().toString(36).substring(2);
    const callbackUrl = `${get_api_base_url()}/callback`;
    const apiAudience = 'https://cognitechbridge.com/api';
    const url = new URL('https://dev-65toamv7157f23vq.us.auth0.com/authorize');
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('code_challenge', challenge);
    url.searchParams.append('code_challenge_method', 'S256');
    url.searchParams.append('client_id', 'ZBRZXrV3FrzvZfO3Zz8OCnKEwXnyxrDf');
    url.searchParams.append('redirect_uri', callbackUrl);
    url.searchParams.append('scope', 'openid email offline_access');
    url.searchParams.append('audience', apiAudience);
    url.searchParams.append('state', state);
    if (is_signup) url.searchParams.append('screen_hint', 'signup');

    open(url.toString());
  }

  async function listenToLoginResult() {
    const appWindow = (await import('@tauri-apps/api/window')).appWindow;

    await listen<instanceEvent>('new-instance', (event) => {
      if (event.payload.args.length == 3 && event.payload.args[1] == 'login-callback') {
        appWindow.unminimize();
        appWindow.setFocus();
        let fullPath = event.payload.args[2];
        const urlObj = new URL(fullPath);
        const searchParams = urlObj.searchParams;
        const code = searchParams.get('code');
        if (code && searchParams.get('state') === state) {
          get_token(code, verifier);
        }
      }
    });
  }

  async function openRegister() {
    const ch = await generateChallenge();
    verifier = ch.verifier;
    await openLoginUrl(ch.challenge, true);
  }

  async function generateChallenge(): Promise<{ verifier: string; challenge: string }> {
    let r = await pkceChallenge();
    let verifier = r.code_verifier;
    let challenge = r.code_challenge;
    return { verifier, challenge };
  }

  async function get_token(code: string, verifier: string) {
    let tokens = await userService.client.get_tokens(code, verifier);
    if (!tokens) {
      console.error('Failed to get tokens');
      return;
    }
    if (await userService.is_user_registered()) {
      goto('/auth/login');
    } else {
      goto('/auth/register-cloud');
    }
  }

  async function loginWeb() {
    const ch = await generateChallenge();
    verifier = ch.verifier;
    openLoginUrl(ch.challenge);
  }

  onMount(async () => {
    await listenToLoginResult();
  });
</script>

<div class="px-5">
  <di class="flex justify-center">
    <h1 class="text-2xl font-bold py-3">Login to CTB Cloud</h1>
  </di>
  <p>First you need to login to CTB Cloud to access the web version of the app.</p>
  <div class="flex justify-center py-3">
    <Button on:click={loginWeb}>Login to CTB Cloud</Button>
  </div>
  <div class="flex justify-center">
    <Button size="sm" variant="link" on:click={openRegister}>or click here to Signup</Button>
  </div>
</div>
