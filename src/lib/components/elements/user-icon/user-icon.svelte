<script lang="ts">
  import { userService } from '$lib/stores/user';
  import { goto } from '$app/navigation';
  import Button from '$components/ui/button/button.svelte';
  import {
    DropdownMenu,
    DropdownMenuSeparator,
    DropdownMenuTrigger
  } from '$components/ui/dropdown-menu';
  import DropdownMenuContent from '$components/ui/dropdown-menu/dropdown-menu-content.svelte';
  import DropdownMenuItem from '$components/ui/dropdown-menu/dropdown-menu-item.svelte';
  import DropdownMenuLabel from '$components/ui/dropdown-menu/dropdown-menu-label.svelte';
  import { onMount } from 'svelte';
  import { user_email } from '$lib/stores/user';

  onMount(async () => {});

  function logout() {
    userService.logout();
    goto('/auth/first-time');
  }
</script>

{#if $user_email}
  <DropdownMenu>
    <DropdownMenuTrigger asChild let:builder>
      <Button builders={[builder]} size="sm" variant="outline">
        {$user_email}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56">
      <!-- <DropdownMenuLabel>Account</DropdownMenuLabel>
    <DropdownMenuSeparator /> -->
      <DropdownMenuItem on:click={logout}>Logout</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
{/if}
