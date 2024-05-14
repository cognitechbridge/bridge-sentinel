<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$components/ui/card';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$components/ui/tabs';
  import { open } from '@tauri-apps/api/dialog';
  import RepositoryDashboard from './RepositoryDashboard.svelte';
  import type { Repository } from '$api/app';
  import { app, repositories } from '$api/app';
  import { onMount } from 'svelte';
  import RepositorySettings from './RepositorySettings.svelte';
  import InvalidRepositoryDialog from './InvalidRepositoryDialog.svelte';
  import EmptyRepositoryDialog from './EmptyRepositoryDialog.svelte';
  import { listen } from '@tauri-apps/api/event';
  import { toast } from 'svelte-sonner';
  import RepositoryTabs from './RepositoryTabs.svelte';

  let selectedRepository: Repository | null = null;
  let initRepository: Repository | null = null;
  let openInvalidRepositoryDialog = false;
  let openEmptyRepositoryDialog = false;

  let shareDialogOpen = false;
  let sharePath = '';

  type instanceEvent = {
    args: string[];
    cwd: string;
  };

  onMount(async () => {
    await loadRepositories();
    const appWindow = (await import('@tauri-apps/api/window')).appWindow;
    await listen<instanceEvent>('new-instance', (event) => {
      if (event.payload.args.length == 3 && event.payload.args[1] == 'share') {
        appWindow.unminimize();
        appWindow.setFocus();
        let fullPath = event.payload.args[2];
        let shareRepository =
          $repositories.find(
            (repo) =>
              repo.mountPoint && repo.mountPoint === fullPath.slice(0, repo.mountPoint.length)
          ) || null;
        if (!shareRepository) {
          toast.error('Invalid Path', {
            description: 'The path not found in the mounted repositories'
          });
          return;
        }
        selectedRepository = shareRepository;
        sharePath = fullPath.replace(shareRepository.mountPoint || '', '');
        shareDialogOpen = true;
      } else {
        console.log('new-instance:', event.payload.args);
      }
    });
  });

  const openDirectory = async () => {
    const result = await open({ directory: true });
    if (result === null || Array.isArray(result)) return;
    addRepository(result);
  };

  const initRepo = async () => {
    if (!initRepository) return;
    await app.initRepository(initRepository.path);
    await addRepository(initRepository.path);
  };

  async function loadRepositories() {
    await app.loadRepositories();
  }

  // Check if the repository is valid and add it to the repositories list if it is valid
  async function addRepository(repositoryPath: string) {
    if ($repositories.some((repo) => repo.path === repositoryPath)) {
      toast.error('Repository already exists', {
        description: 'The repository is already added to the list'
      });
      return;
    }
    let repository = await app.addFolderToRepositories(repositoryPath);
    if (repository.status.is_empty === true) {
      openEmptyRepositoryDialog = true;
      initRepository = repository;
      return;
    } else if (repository.status.is_valid === false) {
      openInvalidRepositoryDialog = true;
      return;
    }
    await loadRepositories();
  }

  const selectRepository = (repository: Repository) => {
    selectedRepository = repository;
  };

  $: {
    if (selectedRepository) {
      selectedRepository =
        $repositories.find((repo) => repo.path === selectedRepository?.path) || null;
    }
  }
</script>

<div class="flex-col md:flex">
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="flex items-center justify-between space-y-2">
      <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
    </div>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
      <div class="col-span-2 space-y-2">
        {#each $repositories as repository}
          <div
            class="rounded-md border px-4 py-3 font-mono text-sm {selectedRepository === repository
              ? 'bg-muted/50'
              : ''}"
            on:click={() => selectRepository(repository)}
            on:keydown={(event) => {
              if (event.key === 'Enter') selectRepository(repository);
            }}
            role="button"
            tabindex="0"
          >
            {repository.shortenPath}
          </div>
        {/each}
        <div
          class="rounded-md border-dashed border px-4 py-3 font-mono text-sm text-center hover:bg-muted/25"
          on:click={openDirectory}
          on:keydown={(event) => {
            if (event.key === 'Enter') openDirectory();
          }}
          role="button"
          tabindex="0"
        >
          Add new repository
        </div>
      </div>
      <div class="col-span-6">
        {#if selectedRepository === null}
          <Card>
            <CardHeader>
              <CardTitle>No repository selected</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Select a repository from the list to view its details.</p>
            </CardContent>
          </Card>
        {:else}
          <RepositoryTabs {selectedRepository} bind:shareDialogOpen bind:sharePath />
        {/if}
      </div>
    </div>
  </div>
</div>

<InvalidRepositoryDialog bind:open={openInvalidRepositoryDialog} />
<EmptyRepositoryDialog bind:open={openEmptyRepositoryDialog} on:init={initRepo} />
