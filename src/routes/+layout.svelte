<script lang="ts">
  import { dev } from '$app/environment';
  import '../styles/globals.css';

  import TailwindIndicator from '$components/TailWindIndicator.svelte';
  import { DevNav } from '$components/elements';
  import { cn } from '$lib/utils';
  import { ChevronRight } from 'lucide-svelte';
  import { LightSwitch } from '$components/elements';
  import { Toaster } from '$components/ui/sonner';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { userService } from '$lib/stores/user';
  import { isDev } from '$lib/utils';

  import { getMatches } from '@tauri-apps/api/cli';
  import Button from '$components/ui/button/button.svelte';
  import UserIcon from '$components/elements/user-icon/user-icon.svelte';

  let development = false;

  let user_email = '';

  onMount(async () => {
    development = isDev();
    user_email = await userService.get_user_email();
    const matches = await getMatches();
    if (matches.args.secret?.value) {
      let secret = matches.args.secret.value as string;
      let res = await userService.login(secret);
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
      {#if development}
        <DevNav data-tauri-drag-region class="pl-1" />
      {:else}
        <div class="w-full">Cognitech Bridge Secure Storage GUI</div>
      {/if}
      <div>
        <UserIcon />
      </div>
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
