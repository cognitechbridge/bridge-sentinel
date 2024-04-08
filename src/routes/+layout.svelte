<script lang="ts">
  import { dev } from '$app/environment';
  import '../styles/globals.css';

  import { ExamplesNav, TailwindIndicator } from '$components/docs';
  import { cn } from '$lib/utils';
  import { Sailboat } from 'lucide-svelte';
  import LightSwitch from '$components/docs/light-switch/LightSwitch.svelte';
  import { Toaster } from '$components/ui/sonner';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';

  import { listen } from '@tauri-apps/api/event';
  import { onMount } from 'svelte';
  import { app } from '$api/app';

  import { getMatches } from '@tauri-apps/api/cli';
  import ShareDialog from '$components/docs/dialogs/share-dialog/ShareDialog.svelte';

  type instanceEvent = {
    args: string[];
    cwd: string;
  };

  let openShare = false;
  let sharePath = '';
  onMount(async () => {
    await listen<instanceEvent>('new-instance', (event) => {
      if (event.payload.args.length == 3 && event.payload.args[1] == 'share') {
        sharePath = event.payload.args[2];
        openShare = true;
      }
    });
  });

  onMount(async () => {
    const matches = await getMatches();
    console.log(matches);
    if (matches.args.secret?.value) {
      let secret = matches.args.secret.value as string;
      let res = await app.login(secret);
      if (res === false) {
        toast.error('Invlid secret', {
          description: 'Please try again'
        });
      } else {
        goto('/dashboard');
      }
    }
  });
</script>

<Toaster />
<div class="h-screen overflow-clip">
  <div class="ml-2">
    <div class="pl-2 flex items-center p-1">
      <Sailboat class="h-5 w-5 " />

      <ExamplesNav data-tauri-drag-region class="pl-1" />
      <LightSwitch />
    </div>
  </div>

  <div
    class={cn(
      'h-screen overflow-auto border-t bg-background pb-8',
      // "scrollbar-none"
      'scrollbar scrollbar-track-transparent scrollbar-thumb-accent scrollbar-thumb-rounded-md'
    )}
  >
    <slot />
  </div>
  {#if dev}
    <TailwindIndicator />
  {/if}
</div>

<ShareDialog bind:open={openShare} path={sharePath} />
