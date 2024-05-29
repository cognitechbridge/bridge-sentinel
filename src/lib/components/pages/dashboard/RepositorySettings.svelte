<script lang="ts">
  import { Trash2 } from 'lucide-svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$components/ui/card';
  import { Button } from '$components/ui/button';
  import { createEventDispatcher } from 'svelte';
  import type { Repository } from '$api/app';
  import { app } from '$api/app';

  export let repository: Repository | null = null;

  async function removeRepository() {
    if (!repository) return;
    await app.remove_repository(repository.path);
  }
</script>

<CardHeader>
  <div class="grid grid-cols-6">
    <div class="col-span-6">
      <CardTitle>Repository Settings</CardTitle>
      <CardDescription>{repository?.path}</CardDescription>
    </div>
  </div></CardHeader
>
<CardContent>
  <div class="space-y-8">
    <div class="flex justify-between items-center">
      <div class="font-medium">Remove Repository</div>
      <Button variant="default" class="bg-red-600" on:click={removeRepository}>
        <Trash2 class="mr-2 h-4 w-4" />
        Remove
      </Button>
    </div>
  </div>
</CardContent>
