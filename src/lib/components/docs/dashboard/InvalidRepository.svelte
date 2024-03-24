<script lang="ts">
  import { Trash2 } from 'lucide-svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$components/ui/card';
  import { Button } from '$components/ui/button';
  import { createEventDispatcher } from 'svelte';
  import type { Repository } from '$api/app';

  export let repository: Repository | null = null;

  const dispatch = createEventDispatcher();

  function removeRepository() {
    dispatch('remove', repository);
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Invalid repository</CardTitle>
    <CardDescription>{repository?.path}</CardDescription>
  </CardHeader>
  <CardContent>
    <div class="space-y-8">
      <div class="flex justify-between items-center">
        <div class="font-medium">
          The selected repository is invalid. Please remove it from the list.
        </div>
        <Button variant="default" on:click={removeRepository}>
          <Trash2 class="mr-2 h-4 w-4" />
          Remove
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
