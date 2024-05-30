<script lang="ts">
  import * as AlertDialog from '$components/ui/alert-dialog/index.js';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  function unshare() {
    dispatch('unshare');
  }
  function cancel() {
    dispatch('cancel');
  }
  export let open = false;
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Unshare Path</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to unshare the path with the user?
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Action on:click={unshare}>Yes</AlertDialog.Action>
      <AlertDialog.Cancel on:click={cancel}>No</AlertDialog.Cancel>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
