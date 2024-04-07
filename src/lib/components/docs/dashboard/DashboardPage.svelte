<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$components/ui/card';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$components/ui/tabs';
  import Search from './Search.svelte';
  import { open } from '@tauri-apps/api/dialog';
  import RepositoryDashboard from './RepositoryDashboard.svelte';
  import type { Repository } from '$api/app';
  import { app } from '$api/app';
  import { onMount } from 'svelte';
  import RepositorySettings from './RepositorySettings.svelte';
  import InvalidRepositoryDialog from './InvalidRepositoryDialog.svelte';
  import EmptyRepositoryDialog from './EmptyRepositoryDialog.svelte';

  let repositories: Repository[] = [];
  let selectedRepository: Repository | null = null;
  let openInvalidRepositoryDialog = false;
  let openEmptyRepositoryDialog = false;

  onMount(async () => {
    repositories = await app.loadRepositories();
  });

  const openDirectory = async () => {
    const result = await open({ directory: true });
    if (result === null || Array.isArray(result)) return;
    addRepository(result);
  };

  const initRepo = async () => {
    if (!selectedRepository) return;
    await app.initRepository(selectedRepository.path);
    await addRepository(selectedRepository.path);
  };

  // Check if the repository is valid and add it to the repositories list if it is valid
  async function addRepository(repositoryPath: string) {
    let repository = await app.addFolderToRepositories(repositoryPath);
    console.log('Repository status: ', repository.status);
    if (repository.status.is_empty === true) {
      console.log('Empty');
      openEmptyRepositoryDialog = true;
      selectedRepository = repository;
      return;
    } else if (repository.status.is_valid === false) {
      console.log('Invalid');
      openInvalidRepositoryDialog = true;
      return;
    }
    await loadRepositoriesUsingApp();
  }

  const selectRepository = (repository: Repository) => {
    selectedRepository = repository;
  };

  async function loadRepositoriesUsingApp() {
    repositories = await app.loadRepositories();
  }

  async function handleRemove(event: CustomEvent<Repository>) {
    await app.remove_repository(event.detail.path);
    await loadRepositoriesUsingApp();
    selectedRepository = repositories[0] || null;
  }
</script>

<div class="flex-col md:flex">
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="flex items-center justify-between space-y-2">
      <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
    </div>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
      <div class="col-span-2 space-y-2">
        {#each repositories as repository}
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
          Add new card
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
          <Tabs value="overview" class="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="setting">Settings</TabsTrigger>
            </TabsList>
            <Card>
              <TabsContent value="overview" class="space-y-4">
                <RepositoryDashboard repository={selectedRepository} />
              </TabsContent>
              <TabsContent value="setting" class="space-y-4">
                <RepositorySettings repository={selectedRepository} on:remove={handleRemove} />
              </TabsContent>
            </Card>
          </Tabs>
        {/if}
      </div>
    </div>
  </div>
</div>

<InvalidRepositoryDialog bind:open={openInvalidRepositoryDialog} />
<EmptyRepositoryDialog bind:open={openEmptyRepositoryDialog} on:init={initRepo} />
