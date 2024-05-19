<script>
  import { app } from '$api/app';
  import { goto } from '$app/navigation';
  import LoginSide from '../login-shared/LoginSide.svelte';
  import { Button } from '$components/ui/button';

  function useCloud() {
    app.set_use_cloud(true);
    goto('/login');
  }

  function useLocalStorage() {
    app.set_use_cloud(false);
    goto('/login');
  }
</script>

<LoginSide>
  <div class="flex flex-col items-center justify-center w-full">
    <Button
      variant="default"
      class="w-full py-2 px-4 rounded mb-4 flex flex-col h-16"
      on:click={useCloud}
    >
      <div class="font-bold">Use Cloud</div>
      <div class="text-xs font-normal">
        Use CTB Cloud to be able to use email-based sharing, easy migration, and other features.
      </div></Button
    >
    <Button
      variant="outline"
      class="w-full font-semibold py-2 px-4 rounded h-10"
      on:click={useLocalStorage}
    >
      Use Local Storage
    </Button>
  </div>
</LoginSide>
