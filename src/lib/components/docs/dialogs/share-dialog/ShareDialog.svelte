<script lang="ts">
  import { app, type Repository } from '$api/app';
  import ValidatedInput from '$components/ui/input/ValidatedInput.svelte';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
  } from '$lib/components/ui/dialog/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { toast } from 'svelte-sonner';

  async function list_access(path: string) {
    if (!repository) return;
    let accessList = await app.listAccess(repository.path, path);
    return accessList;
  }

  async function share() {
    repository =
      app.repositories.find(
        (repo) => repo.mountPoint && repo.mountPoint === path.slice(0, repo.mountPoint.length)
      ) || null;

    if (!repository) {
      toast.error('Invalid Path', {
        description: 'The path not found in the mounted repositories'
      });
      return;
    }

    let res = await app.sharePath(repository?.path, path, publicKey);
    if (res.ok) {
      open = false;
      toast.success('Path shared successfully', {
        description: 'The path has been shared with the user'
      });
    } else {
      toast.error('Failed to share path', {
        description: 'Please try again'
      });
    }
  }

  let mountPoint = '';
  let publicKey = '';
  let pathErr = '';
  let accessList: any = {};

  export let repository: Repository | null = null;
  export let open = false;
  export let path = '';

  $: mountPoint = repository?.mountPoint || '';
  $: {
    list_access(path).then((res) => (accessList = res));
    if (!accessList || accessList.err) {
      pathErr = 'The path is not valid';
    } else {
      pathErr = '';
    }
  }
  $: isValid = !pathErr && publicKey.length > 0;
</script>

<Dialog bind:open>
  <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Share path</DialogTitle>
      <DialogDescription>
        Share the path with the user to give them access to the selected file or folder.
      </DialogDescription>
    </DialogHeader>
    <div class="grid gap-1 py-4 mt-2">
      <div class="grid gap-1">
        <Label for="path">Path:</Label>
        <ValidatedInput id="path" bind:value={path} error={pathErr} prefix={mountPoint} />
      </div>
      <div class="grid gap-1 mt-2">
        <Label for="recipient">Recipient:</Label>
        <ValidatedInput id="recipient" bind:value={publicKey} />
      </div>
    </div>
    <DialogFooter>
      <Button type="submit" on:click={share} disabled={!isValid}>Share</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
