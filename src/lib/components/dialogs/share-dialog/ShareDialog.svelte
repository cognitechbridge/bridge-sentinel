<script lang="ts">
  import { userService } from '$lib/stores/user';
  import { repositoryService, type Repository } from '$lib/stores/repository';
  import type { AppResult, AccessList } from '$lib/services/bridge-cli';
  import ValidatedInput from '$components/ui/input/ValidatedInput.svelte';
  import Separator from '$components/ui/separator/Separator.svelte';
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
  } from '$components/ui/table';
  import { Trash2 } from 'lucide-svelte';
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
  import UnshareDialog from '$components/dialogs/unshare-dialog/UnshareDialog.svelte';
  import { onMount } from 'svelte';

  type RenderedAccessList = {
    PublicKey: string;
    Inherited: string;
    Removable: boolean;
    Email: string;
  }[];

  let use_cloud = false;

  onMount(async () => {
    use_cloud = await userService.get_use_cloud();
  });

  async function list_access(path: string) {
    if (!repository) return;
    let accessList = await repositoryService.listAccess(repository.path, path);
    return accessList;
  }

  async function share() {
    if (!repository) return;
    let res: AppResult<void>;
    if (isValidEmail(recipient)) {
      res = await repositoryService.sharePathWithEmail(repository?.path, path, recipient);
    } else {
      res = await repositoryService.sharePathWithPublicKey(repository?.path, path, recipient);
    }
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

  let openUnshare = false;
  let unsharePublicKey = '';
  async function openUnshareDialog(public_key: string) {
    unsharePublicKey = public_key;
    openUnshare = true;
  }

  async function unshare() {
    if (!repository) return;
    let res = await repositoryService.unsharePath(repository?.path, path, unsharePublicKey);
    if (res.ok) {
      toast.success('Path unshared successfully', {
        description: 'The path has been unshared with the user'
      });
    } else {
      toast.error('Failed to unshare path', {
        description: 'Please try again'
      });
    }
  }

  function cancelUnshare() {
    open = true;
  }

  async function render_access_list(accessList: AccessList): Promise<RenderedAccessList> {
    let res = await Promise.all(
      accessList.map(async (access) => {
        let publickey = access.PublicKey;
        let removable = access.PublicKey != repository?.status.public_key;
        let email = '';
        if (await userService.get_use_cloud()) {
          email = await userService.client.get_email_from_public_key(access.PublicKey);
        }
        // Check if the access is yours
        let isYou = access.PublicKey == repository?.status.public_key;
        if (isYou) {
          email += ' (You)';
        }
        return {
          PublicKey: publickey,
          Inherited: access.Inherited ? 'Yes' : 'No',
          Removable: removable,
          Email: email
        };
      })
    );
    return res;
  }

  function isValidPublicKey(recipient: string) {
    return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{44}$/.test(recipient);
  }

  function isValidEmail(recipient: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
  }

  let mountPoint = '';
  let recipient = '';
  let pathErr = '';
  let accessList: RenderedAccessList = [];

  export let repository: Repository | null = null;
  export let open = false;
  export let path = '';

  $: mountPoint = repository?.mountPoint || '';
  $: {
    open &&
      repository &&
      list_access(path).then(async (res) => {
        if (!res || res.err) {
          pathErr = 'The path is not valid';
          accessList = [];
        } else {
          pathErr = '';
          accessList = await render_access_list(res.result);
        }
      });
  }
  $: isValid = !pathErr && (isValidEmail(recipient) || isValidPublicKey(recipient));
</script>

<Dialog bind:open>
  <DialogContent class="sm:max-w-[1000px]">
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
        <Label for="recipient">
          Recipient
          {#if use_cloud}
            (Email or Public Key):
          {:else}
            (Public Key):
          {/if}
        </Label>
        <ValidatedInput id="recipient" bind:value={recipient} />
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
          {#if use_cloud}
            <TableHead>Email</TableHead>
          {/if}
          <TableHead>Public Key</TableHead>
          <TableHead>Inherited</TableHead>
          <TableHead>Remove</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each accessList as access, i (i)}
          <TableRow>
            <TableCell>{i + 1}</TableCell>
            {#if use_cloud}
              <TableCell>{access.Email}</TableCell>
            {/if}
            <TableCell>{access.PublicKey}</TableCell>
            <TableCell>{access.Inherited}</TableCell>
            <TableCell>
              {#if access.Removable}
                <Button
                  variant="outline"
                  class="border-none bg-transparent hover:bg-transparent h-0"
                  on:click={() => openUnshareDialog(access.PublicKey)}
                >
                  <Trash2 class="h-4 w-4 text-red-600" />
                </Button>
              {/if}
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </DialogContent>
</Dialog>
<UnshareDialog bind:open={openUnshare} on:unshare={unshare} on:cancel={cancelUnshare} />
