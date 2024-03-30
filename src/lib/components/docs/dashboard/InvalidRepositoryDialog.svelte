<script lang="ts">
  import * as AlertDialog from '$components/ui/alert-dialog/index.js';

  import { Button } from '$components/ui/button';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let open = false;
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Invalid repository</AlertDialog.Title>
      <AlertDialog.Description>
        The selected folder is not a valid repository
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Action>OK</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
