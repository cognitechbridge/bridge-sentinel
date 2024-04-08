<script lang="ts">
  import { app, type Repository } from '$api/app';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
  } from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { toast } from 'svelte-sonner';

  let publicKey = '';

  async function share() {
    let repo = app.repositories.find(
      (repo) => repo.mountPoint && repo.mountPoint === path.slice(0, repo.mountPoint.length)
    );

    if (!repo) {
      toast.error('Invlid Path', {
        description: 'The path not found in the mounted repositories'
      });
      return;
    }

    let itemPath = path.slice(repo.mountPoint?.length);
    app.sharePath(repo?.path, itemPath, publicKey);

    open = false;
    toast.success('Path shared successfully', {
      description: 'The path has been shared with the user'
    });
  }

  export let open = false;
  export let path = '';
</script>

<Dialog bind:open>
  <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Share path</DialogTitle>
      <DialogDescription>
        Share the path with the user to give them access to the selected file or folder.
      </DialogDescription>
    </DialogHeader>
    <div class="grid gap-4 py-4">
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="name" class="text-right">Path</Label>
        <Input id="name" class="col-span-3" bind:value={path} />
      </div>
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="username" class="text-right">Public Key</Label>
        <Input id="username" class="col-span-3" bind:value={publicKey} />
      </div>
    </div>
    <DialogFooter>
      <Button type="submit" on:click={share}>Share</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
