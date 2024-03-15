<script lang="ts">
  import { Activity, CreditCard, DollarSign, Download, Users } from 'lucide-svelte';
  import { Avatar, AvatarFallback, AvatarImage } from '$components/ui/avatar';
  import { Button } from '$components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$components/ui/card';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$components/ui/tabs';
  import RecentSales from './RecentSales.svelte';
  import Search from './Search.svelte';
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
        <div class="rounded-md border px-4 py-3 font-mono text-sm">@melt-ui/melt-ui</div>
        <div class="rounded-md border px-4 py-3 font-mono text-sm">@sveltejs/svelte</div>
        <div
          class="rounded-md border px-4 py-3 font-mono text-sm text-center bg-gray-200 hover:bg-gray-300"
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
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>You made 265 sales this month.</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales />
              </CardContent>
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </div>
  </div>
</div>
