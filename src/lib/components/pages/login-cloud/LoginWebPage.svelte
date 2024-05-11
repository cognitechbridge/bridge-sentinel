<script lang="ts">
  import { open } from '@tauri-apps/api/shell';
  import { onMount } from 'svelte';
  import { listen } from '@tauri-apps/api/event';
  import pkceChallenge from 'pkce-challenge';
  import axios from 'axios';

  type instanceEvent = {
    args: string[];
    cwd: string;
  };

  let r_verifier = '';

  async function generateChallenge(): Promise<{ verifier: string; challenge: string }> {
    console.log('---------------------------------');
    let r = await pkceChallenge();
    let verifier = r.code_verifier;
    let challenge = r.code_challenge;
    return { verifier, challenge };
  }

  async function get_token(code: string, verifier: string) {
    console.log('get_token:', code, 'verifier:', verifier);
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
        console.log(response.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  onMount(async () => {
    const { verifier, challenge } = await generateChallenge();
    r_verifier = verifier;
    const callbackUrl = 'http://localhost:1323/callback';
    const apiAudience = 'https://cognitechbridge.com/api';
    const state = Math.random().toString(36).substring(2);
    const url = new URL('https://dev-65toamv7157f23vq.us.auth0.com/authorize');
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('code_challenge', challenge);
    url.searchParams.append('code_challenge_method', 'S256');
    url.searchParams.append('client_id', 'ZBRZXrV3FrzvZfO3Zz8OCnKEwXnyxrDf');
    url.searchParams.append('redirect_uri', callbackUrl);
    url.searchParams.append('scope', 'profile');
    url.searchParams.append('audience', apiAudience);
    url.searchParams.append('state', state);

    console.log('Navigate to:', url.toString());

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
          console.log('Got code:', code);
          get_token(code, r_verifier);
        }
      } else {
        console.log('new-instance:', event.payload.args);
      }
    });
  });
</script>

<a href="https://example.com" target="_blank">Open in new tab</a>
