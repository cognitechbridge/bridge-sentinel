<script lang="ts">
  import * as AlertDialog from '$components/ui/alert-dialog/index.js';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  function init_repo() {
    dispatch('init');
  }
  export let open = false;
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Empty repository</AlertDialog.Title>
      <AlertDialog.Description>
        The selected folder is empty. Do you want to create a new repository at this location?
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Action on:click={init_repo}>Yes</AlertDialog.Action>
      <AlertDialog.Cancel>No</AlertDialog.Cancel>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
