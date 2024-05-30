<script lang="ts">
  import { Input } from '$components/ui/input';
  import { slide } from 'svelte/transition';
  import owasp from 'owasp-password-strength-test';

  export let value = '';

  let isLoading = false;
  let isStrong = false;
  let strength = 0;
  let passwordError = '';
  let barColor = 'bg-gray-400';


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

  $: calculateStrength(value);
</script>

<template>
  <Input
    id="password"
    placeholder="Your strong password"
    type="password"
    autoCapitalize="none"
    autoCorrect="off"
    disabled={isLoading}
    bind:value={value}
  />
  <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-1">
    <div class={barColor + ' h-2.5 rounded-full'} style="width: {strength}%;"></div>
  </div>
  {#if passwordError && value.length > 0}
    <p transition:slide class="text-red-500 text-sm">{passwordError}</p>
  {/if}
</template>

<style>
</style>
