<script lang="ts">
  import { app, type AccessList, type Repository, type AppResult } from '$api/app';
  import ValidatedInput from '$components/ui/input/ValidatedInput.svelte';
  import Separator from '$components/ui/separator/Separator.svelte';
  import Table from '$components/ui/table/Table.svelte';
  import TableBody from '$components/ui/table/TableBody.svelte';
  import TableCell from '$components/ui/table/TableCell.svelte';
  import TableHead from '$components/ui/table/TableHead.svelte';
  import TableHeader from '$components/ui/table/TableHeader.svelte';
  import TableRow from '$components/ui/table/TableRow.svelte';
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

  type RenderedAccessList = {
    PublicKey: string;
    Inherited: string;
  }[];

  async function list_access(path: string) {
    if (!repository) return;
    let accessList = await app.listAccess(repository.path, path);
    return accessList;
  }

  async function share() {
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

  function render_access_list(accessList: AccessList): RenderedAccessList {
    let res = accessList.map((access) => {
      let publickey = repository?.status.public_key == access.PublicKey ? 'You' : access.PublicKey;
      return {
        PublicKey: publickey,
        Inherited: access.Inherited ? 'Yes' : 'No'
      };
    });
    return res;
  }

  let mountPoint = '';
  let publicKey = '';
  let pathErr = '';
  let accessList: RenderedAccessList = [];

  export let repository: Repository | null = null;
  export let open = false;
  export let path = '';

  $: mountPoint = repository?.mountPoint || '';
  $: {
    open &&
      repository &&
      list_access(path).then((res) => {
        console.log('res', res);
        if (!res || res.err) {
          pathErr = 'The path is not valid';
          accessList = [];
        } else {
          pathErr = '';
          accessList = render_access_list(res.result);
        }
      });
  }
  $: isValid = !pathErr && publicKey.length > 0;
</script>

<Dialog bind:open>
  <DialogContent class="sm:max-w-[800px]">
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
    <Separator class="my-1" />
    <!-- ------------------------ Table ---------------------------- -->
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Public Key</TableHead>
          <TableHead>Inherited</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each accessList as access, i (i)}
          <TableRow>
            <TableCell>{i + 1}</TableCell>
            <TableCell>{access.PublicKey}</TableCell>
            <TableCell>{access.Inherited}</TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </DialogContent>
</Dialog>
