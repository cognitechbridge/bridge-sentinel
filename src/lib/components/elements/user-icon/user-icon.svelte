<script lang="ts">
  import { app } from '$api/app';
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

  let user_email = '';
  onMount(async () => {
    user_email = await app.get_user_email();
  });

  function logout() {
    app.logout();
    goto('/first-time');
  }
</script>

<DropdownMenu>
  <DropdownMenuTrigger asChild let:builder>
    <Button builders={[builder]} size="sm" variant="outline">
      {user_email}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent class="w-56">
    <!-- <DropdownMenuLabel>Account</DropdownMenuLabel>
    <DropdownMenuSeparator /> -->
    <DropdownMenuItem on:click={logout}>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
