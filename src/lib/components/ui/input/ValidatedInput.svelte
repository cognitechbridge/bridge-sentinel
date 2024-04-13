<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';
  import { slide } from 'svelte/transition';

  let className: string | undefined | null = undefined;

  export let value: HTMLInputAttributes['value'] = undefined;
  export { className as class };
  export let error: string | undefined | null = undefined;
  export let prefix: string | undefined | null = undefined;
</script>

<template>
  <div
    class={cn(
      'flex h-10 w-full rounded-md border border-input text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
  >
    {#if prefix}
      <span class="bg-gray-200 px-3 py-2 text-gray-700 rounded-l-md border border-input">
        {prefix}
      </span>
    {/if}
    <input
      class="px-3 py-2 bg-transparent w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      bind:value
      on:blur
      on:change
      on:click
      on:focus
      on:keydown
      on:keypress
      on:keyup
      on:mouseover
      on:mouseenter
      on:mouseleave
      on:paste
      on:input
      {...$$restProps}
    />
  </div>
  {#if error}
    <p transition:slide class="text-red-500 text-sm">{error}</p>
  {/if}
</template>
