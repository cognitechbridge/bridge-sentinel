<script lang="ts">
  import { HardDriveDownload, Share } from 'lucide-svelte';
  import { Avatar, AvatarFallback, AvatarImage } from '$components/ui/avatar';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$components/ui/card';
  import { Button } from '$components/ui/button';
  import type { Repository } from '$api/app';
  import { app } from '$api/app';
  import ShareKey from './ShareKey.svelte';
  import ShareDialog from '../dialogs/share-dialog/ShareDialog.svelte';

  export let shareDialogOpen = false;
  export let sharePath = '';

  // Open the share dialog
  async function openShareDialog() {
    shareDialogOpen = true;
  }

  // Mount the repository
  async function mount() {
    if (!repository) return;
    repository.mounted = true;
    let point = await app.mountRepository(repository?.path || ('' as string));
    repository.mountPoint = point;
  }

  // Unmount the repository
  async function unmount() {
    if (!repository) return;
    repository.mounted = false;
    await app.unmountRepository(repository.path);
  }

  export let repository: Repository | null = null;
</script>

<CardHeader>
  <div class="grid grid-cols-6">
    <div class="col-span-4">
      <CardTitle>Repository Dashboard</CardTitle>
      <CardDescription>{repository?.path}</CardDescription>
    </div>
    <div class="col-span-2 text-end">
      {#if repository?.mounted}
        <Button variant="default" on:click={openShareDialog}>
          <Share class="mr-2 h-4 w-4" />
          Share
        </Button>
      {/if}
      {#if repository?.mounted}
        <Button variant="default" class="bg-red-600" on:click={unmount}>
          <HardDriveDownload class="mr-2 h-4 w-4" />
          Unmount
        </Button>
      {:else}
        <Button variant="default" class="bg-green-600" on:click={mount}>
          <HardDriveDownload class="mr-2 h-4 w-4" />
          Mount
        </Button>
      {/if}
    </div>
  </div>
</CardHeader>
<CardContent>
  <div class="space-y-8">
    <ShareKey shareCode={repository?.status.public_key} />
  </div>
</CardContent>
<ShareDialog bind:open={shareDialogOpen} bind:path={sharePath} {repository} />
