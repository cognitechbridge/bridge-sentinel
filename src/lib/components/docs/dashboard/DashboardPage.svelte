<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$components/ui/card';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$components/ui/tabs';
  import Search from './Search.svelte';
  import { open } from '@tauri-apps/api/dialog';
  import RepositoryDashboard from './RepositoryDashboard.svelte';
  import type { Repository } from '$api/app';
  import { saveRepositories, loadRepositories, addFolderToRepositories } from '$api/app';
  import InvalidRepository from './InvalidRepository.svelte';
  import { onMount } from 'svelte';
  import RepositorySettings from './RepositorySettings.svelte';

  let repositories: Repository[] = [];
  let selectedRepository: Repository | null = null;

  onMount(async () => {
    repositories = await loadRepositories();
  });

  const openDirectory = async () => {
    const result = await open({ directory: true });
    console.log(result);
    if (result === null || Array.isArray(result)) return;
    await addFolderToRepositories(result);
    loadRepositoriesUsingApp();
  };

  const selectRepository = (repository: Repository) => {
    selectedRepository = repository;
  };

  async function loadRepositoriesUsingApp() {
    repositories = await loadRepositories();
  }

  function handleRemove(event: CustomEvent<Repository>) {
    const repository = event.detail;
    repositories = repositories.filter((repo) => repo !== repository);
    saveRepositories(repositories);
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
        {:else if selectedRepository?.status.is_valid === false}
          <InvalidRepository repository={selectedRepository} on:remove={handleRemove} />
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
