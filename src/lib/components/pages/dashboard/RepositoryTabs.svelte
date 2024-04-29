<script lang="ts">
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$components/ui/tabs';
  import { Card } from '$components/ui/card';
  import RepositoryDashboard from './RepositoryDashboard.svelte';
  import RepositorySettings from './RepositorySettings.svelte';
  import type { Repository } from '$api/app';

  export let selectedRepository: Repository | null = null;
  export let shareDialogOpen = false;
  export let sharePath = '';
</script>

<Tabs value="overview" class="space-y-4">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="setting">Settings</TabsTrigger>
  </TabsList>
  <Card>
    <TabsContent value="overview" class="space-y-4">
      <RepositoryDashboard repository={selectedRepository} bind:shareDialogOpen bind:sharePath />
    </TabsContent>
    <TabsContent value="setting" class="space-y-4">
      <RepositorySettings repository={selectedRepository} />
    </TabsContent>
  </Card>
</Tabs>
