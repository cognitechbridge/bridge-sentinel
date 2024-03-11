<script lang="ts">
  import { Icons } from '$components/docs';
  import { Button } from '$components/ui/button';
  import { Input } from '$components/ui/input';
  import { Label } from '$components/ui/label';
  import { fade, slide } from 'svelte/transition';
  import owasp from 'owasp-password-strength-test';
  import { cn } from '$lib/utils';
  import InputPassword from './InputPassword.svelte';
  import { Command } from '@tauri-apps/api/shell';
  import { Store } from "tauri-plugin-store-api";
  import { appDataDir } from '@tauri-apps/api/path';

  let className: string | undefined | null = undefined;
  export { className as class };

  let isLoading = false;
  let password = '';
  let password2 = '';
  let isStrong = false;
  let strength = 0;
  let passwordsMatch = false;
  let passwordError = '';
  let barColor = 'bg-gray-400'; // Default color

console.log(appDataDir())
console.log("AAAX")

  async function onSubmit() {
    isLoading = true;


    const store = new Store("config.json");

    //await store.set("some-key", { value: 5 });

    const val = await store.get("some-key");
    console.log(val);
    console.log("ss");

    await store.save();


    const command = Command.sidecar('binaries/storage', ['help'])
    console.log(command)
    const output = await command.execute()  
    console.log(output.stdout)

    setTimeout(() => {
      isLoading = false;
    }, 3000);
  }

  function calculateStrength(password: string) {
    var result = owasp.test(password);
    passwordError = result.errors.length > 0 ? result.errors[0] : '';
    strength = Math.max(
      Math.min(password.length * 5 + result.passedTests.length * 10, 100) -
        result.errors.length * 30,
      0
    );
    if (strength < 20 || result.errors.length > 0) {
      barColor = 'bg-red-500';
    } else if (strength < 40) {
      barColor = 'bg-yellow-500';
    } else if (strength < 60) {
      barColor = 'bg-blue-500';
    } else if (strength < 80) {
      barColor = 'bg-green-500';
    } else {
      barColor = 'bg-green-500';
    }
    isStrong = result.strong;
    strength = password.length > 0 ? strength : 0;
  }

  $: calculateStrength(password);
  $: passwordsMatch = password === password2;
</script>

<div class={cn('grid gap-6', className)} {...$$restProps}>
  <form on:submit|preventDefault={onSubmit}>
    <div class="grid gap-2">
      <div class="grid gap-1">
        <Label class="mb-1" for="email">Email:</Label>
        <Input
          id="email"
          placeholder="Your email"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          disabled={isLoading}
        />
      </div>
      <div class="grid gap-1 mt-2">
        <Label class="mb-1" for="password">Password:</Label>
        <InputPassword bind:value={password}/>
      </div>
      <div class="grid gap-1">
        <Label class="sr-only" for="password-2">Password repeat</Label>
        <Input
          id="password-2"
          placeholder="Repeat your strong password"
          type="password"
          autoCapitalize="none"
          autoCorrect="off"
          disabled={isLoading}
          bind:value={password2}
        />
        {#if !passwordsMatch && password2.length > 0}
          <p transition:slide class="text-red-500 text-sm">Passwords do not match</p>
        {/if}
      </div>
      <Button disabled={isLoading || !passwordsMatch || !isStrong}>
        {#if isLoading}
          <Icons.spinner class="mr-2 h-4 w-4 animate-spin" />
        {/if}
        Join
      </Button>
    </div>
  </form>
  <div class="relative">
    <div class="absolute inset-0 flex items-center">
      <span class="w-full border-t" />
    </div>
    <div class="relative flex justify-center text-xs uppercase">
      <span class="bg-background px-2 text-muted-foreground"> Or continue with </span>
    </div>
  </div>
  <Button variant="outline" type="button" disabled={isLoading}>
    {#if isLoading}
      <Icons.spinner class="mr-2 h-4 w-4 animate-spin" />
    {:else}
      <Icons.gitHub class="mr-2 h-4 w-4" />
    {/if}
    {' '}
    Github
  </Button>
</div>
