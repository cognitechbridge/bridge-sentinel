<script lang="ts">
  import { open } from '@tauri-apps/api/shell';
  import { onMount } from 'svelte';
  import { listen } from '@tauri-apps/api/event';
  import pkceChallenge from 'pkce-challenge';
  import axios from 'axios';
  import { app } from '$api/app';
  import { Button } from '$components/ui/button';
  import LoginSide from '../login-shared/LoginSide.svelte';
  import { goto } from '$app/navigation';

  type instanceEvent = {
    args: string[];
    cwd: string;
  };

  async function generateChallenge(): Promise<{ verifier: string; challenge: string }> {
    let r = await pkceChallenge();
    let verifier = r.code_verifier;
    let challenge = r.code_challenge;
    return { verifier, challenge };
  }

  async function get_token(code: string, verifier: string) {
    var options = {
      method: 'POST',
      url: 'https://dev-65toamv7157f23vq.us.auth0.com/oauth/token',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: 'ZBRZXrV3FrzvZfO3Zz8OCnKEwXnyxrDf',
        code_verifier: verifier,
        code: code,
        redirect_uri: 'http://localhost:1323/callback'
      })
    };

    axios
      .request(options)
      .then(function (response) {
        app.saveToken(response.data.access_token, response.data.refresh_token);
        goto('/login');
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function loginWeb() {
    const { verifier, challenge } = await generateChallenge();
    const callbackUrl = 'http://localhost:1323/callback';
    const apiAudience = 'https://cognitechbridge.com/api';
    const state = Math.random().toString(36).substring(2);
    const url = new URL('https://dev-65toamv7157f23vq.us.auth0.com/authorize');
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('code_challenge', challenge);
    url.searchParams.append('code_challenge_method', 'S256');
    url.searchParams.append('client_id', 'ZBRZXrV3FrzvZfO3Zz8OCnKEwXnyxrDf');
    url.searchParams.append('redirect_uri', callbackUrl);
    url.searchParams.append('scope', 'profile offline_access');
    url.searchParams.append('audience', apiAudience);
    url.searchParams.append('state', state);

    open(url.toString());

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

  onMount(async () => {});
</script>

<LoginSide>
  <div class="px-5">
    <di class="flex justify-center">
      <h1 class="text-2xl font-bold py-3">Login to CTB Cloud</h1>
    </di>
    <p>First you need to login to CTB Cloud to access the web version of the app.</p>
    <div class="flex justify-center py-3">
      <Button on:click={loginWeb}>Login to CTB Cloud</Button>
    </div>
  </div>
</LoginSide>
