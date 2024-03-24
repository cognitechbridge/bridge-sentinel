<script>
  import { onMount } from 'svelte';

  let shareCode = '1234-5678-ABCD'; // Example share code
  let buttonLabel = 'Copy Code';

  async function copyCodeToClipboard() {
    try {
      await navigator.clipboard.writeText(shareCode);
      buttonLabel = 'Copied!';
      setTimeout(() => {
        buttonLabel = 'Copy Code'; // Reset button label after 2 seconds
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  export { shareCode };
</script>

<div class="flex items-center space-x-2 p-4 rounded-lg border">
  <div class="flex-1 text-lg font-medium">{shareCode}</div>
  <button
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    on:click={copyCodeToClipboard}
  >
    {buttonLabel}
  </button>
</div>

<style>
  /* Additional styling can go here. Tailwind classes are used primarily. */
</style>
