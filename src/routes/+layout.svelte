<script lang="ts">
  import { dev } from '$app/environment';
  import '../styles/globals.css';

  import { TailwindIndicator } from '$components/pages';
  import { DevNav } from '$components/elements';
  import { cn } from '$lib/utils';
  import { ChevronRight } from 'lucide-svelte';
  import LightSwitch from '$components/pages/light-switch/LightSwitch.svelte';
  import { Toaster } from '$components/ui/sonner';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';

  import { onMount } from 'svelte';
  import { app } from '$api/app';

  import { getMatches } from '@tauri-apps/api/cli';

  onMount(async () => {
    const matches = await getMatches();
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
      <ChevronRight class="h-5 w-5 " />

      <DevNav data-tauri-drag-region class="pl-1" />
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
