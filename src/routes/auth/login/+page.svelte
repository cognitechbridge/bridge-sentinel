<script lang="ts">
  import { Icons } from '$components/elements';
  import { Button } from '$components/ui/button';
  import { Input } from '$components/ui/input';
  import { Label } from '$components/ui/label';
  import { cn } from '$lib/utils';
  import { app } from '$api/app';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let className: string | undefined | null = undefined;
  export { className as class };

  let isLoading = false;
  let secret = '';

  onMount(async () => {
    if (await app.get_is_first_run()) {
      goto('/auth/first-time');
    } else if (!(await app.get_use_cloud())) {
      let userData = await app.loadUserData();
      if (!userData) {
        goto('/auth/register');
      }
    } else if (await app.needs_login_to_cloud()) {
      goto('/auth/login-cloud');
    }
  });

  async function onSubmit() {
    isLoading = true;
    let res = await app.login(secret);
    if (res === false) {
      toast.error('Invalid secret', {
        description: 'Please try again'
      });
    } else {
      goto('/dashboard');
    }
    isLoading = false;
  }
</script>

<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[500px]">
  <div class="flex flex-col space-y-2">
    <h1 class="text-2xl font-semibold tracking-tight text-center">Login</h1>
    <p class="text-sm text-muted-foreground">Enter your secret (password) below to login.</p>
  </div>
  <div class={cn('grid gap-6', className)} {...$$restProps}>
    <form>
      <div class="grid gap-2">
        <div class="grid gap-1 mt-2">
          <Label class="mb-1" for="password">Secret:</Label>
          <Input
            id="password"
            placeholder="Your secret"
            type="password"
            autoCapitalize="none"
            autoCorrect="off"
            disabled={isLoading}
            bind:value={secret}
            class="mb-8"
          />
        </div>
        <Button disabled={isLoading} on:click={onSubmit}>
          {#if isLoading}
            <Icons.spinner class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          Login
        </Button>
      </div>
    </form>
  </div>
</div>
