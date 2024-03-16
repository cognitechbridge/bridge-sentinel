<script lang="ts">
  import { Activity, CreditCard, DollarSign, Download, Users } from 'lucide-svelte';
  import { Avatar, AvatarFallback, AvatarImage } from '$components/ui/avatar';
  import { Button } from '$components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$components/ui/card';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$components/ui/tabs';
  import Search from './Search.svelte';
  import { open } from '@tauri-apps/api/dialog';
  import RepositoryDashboard from './RepositoryDashboard.svelte';

  let repositories = ['@melt-ui/melt-ui', '@sveltejs/svelte'];
  let selectedRepository: string = '';

  const openDirectory = async () => {
    const result = await open({ directory: true });
    console.log(result);
    if (result === null || Array.isArray(result)) return;
    repositories = [...repositories, result];
  };

  const selectRepository = (repository: string) => {
    selectedRepository = repository;
  };

  function shortenFilePath(filePath: string, maxLength: number = 45): string {
    if (filePath.length <= maxLength) {
      return filePath;
    }
    const separator = filePath.includes('/') ? '/' : '\\';
    const segments = filePath.split(separator);

    // Handle cases where path length is too short to be meaningfully shortened
    if (segments.length < 3) {
      return filePath.slice(0, maxLength - 3) + separator + '...';
    }

    let start = segments[0];
    let end = segments[segments.length - 1];

    // Include the leading separator for absolute paths
    if (filePath.startsWith(separator)) {
      start = separator + start;
    }

    let middle = '...';

    // Adjust according to the maximum length allowed
    const startMaxLength = Math.ceil((maxLength - middle.length - end.length) / 2);
    const endMaxLength = Math.floor((maxLength - middle.length - start.length) / 2);

    console.log(startMaxLength, endMaxLength);

    if (start.length > startMaxLength) {
      start = start.slice(0, startMaxLength - 1) + '…';
    }

    if (end.length > endMaxLength) {
      end = '…' + end.slice(-endMaxLength + 1);
    }

    // Reassemble the path using the determined separator
    return start + separator + middle + separator + end;
  }

  $: shortenRepositories = repositories.map((repository) => shortenFilePath(repository));
</script>

<div class="flex-col md:flex">
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="flex items-center justify-between space-y-2">
      <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div class="flex items-center space-x-2">
        <Button size="sm">
          <Download class="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
      <div class="col-span-2 space-y-2">
        {#each shortenRepositories as repository}
          <div
            class="rounded-md border px-4 py-3 font-mono text-sm"
            on:click={() => selectRepository(repository)}
            on:keydown={(event) => {
              if (event.key === 'Enter') selectRepository(repository);
            }}
            role="button"
            tabindex="0"
          >
            {repository}
          </div>
        {/each}
        <div
          class="rounded-md border px-4 py-3 font-mono text-sm text-center bg-muted hover:bg-muted/60"
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
        <Tabs value="overview" class="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics" disabled>Analytics</TabsTrigger>
            <TabsTrigger value="reports" disabled>Reports</TabsTrigger>
            <TabsTrigger value="notifications" disabled>Notifications</TabsTrigger>
          </TabsList>
          <Card>
            <TabsContent value="overview" class="space-y-4">
              <RepositoryDashboard repository={selectedRepository} />
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </div>
  </div>
</div>
