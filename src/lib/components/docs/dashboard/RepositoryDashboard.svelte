<script lang="ts">
  import { HardDriveDownload } from 'lucide-svelte';
  import { Avatar, AvatarFallback, AvatarImage } from '$components/ui/avatar';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$components/ui/card';
  import { Button } from '$components/ui/button';
  import type { Repository } from '$api/app';
  import ShareKey from './ShareKey.svelte';

  export let repository: Repository | null = null;
</script>

<CardHeader>
  <div class="grid grid-cols-6">
    <div class="col-span-4">
      <CardTitle>Repository Dashboard</CardTitle>
      <CardDescription>{repository?.path}</CardDescription>
    </div>
    <div class="col-span-2 text-end">
      <Button variant="default" class="bg-green-600">
        <HardDriveDownload class="mr-2 h-4 w-4" />
        Mount
      </Button>
    </div>
  </div>
</CardHeader>
<CardContent>
  <div class="space-y-8">
    <ShareKey shareCode={repository?.public} />

    <div class="flex items-center">
      <Avatar class="h-9 w-9">
        <AvatarImage src="/avatars/01.png" alt="Avatar" />
        <AvatarFallback>OM</AvatarFallback>
      </Avatar>
      <div class="ml-4 space-y-1">
        <p class="text-sm font-medium leading-none">Olivia Martin</p>
        <p class="text-sm text-muted-foreground">olivia.martin@email.com</p>
      </div>
      <div class="ml-auto font-medium">+$1,999.00</div>
    </div>
  </div>
</CardContent>
