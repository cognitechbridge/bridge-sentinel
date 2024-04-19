<script lang="ts">
  import { Copy } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
  } from '$lib/components/ui/dialog/index.js';
  import { toast } from 'svelte-sonner';

  import * as bip39 from '@scure/bip39';
  import { wordlist } from '@scure/bip39/wordlists/english';
  import bs58 from 'bs58';

  export let open = false;
  let mnemonic = '';
  export let key: string = '';
  let temp_key: string = '';

  async function generateKey() {
    mnemonic = bip39.generateMnemonic(wordlist, 128);
    let bytes = (await bip39.mnemonicToSeed(mnemonic)).slice(0, 32);
    temp_key = bs58.encode(bytes);
  }

  function useClose() {
    key = temp_key;
    open = false;
  }

  function close() {
    open = false;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.info('Copied');
      },
      () => {
        toast.error('Error copying to clipboard');
      }
    );
  }

  $: open && generateKey();
</script>

<Dialog bind:open>
  <DialogContent class="sm:max-w-[1000px]">
    <DialogHeader>
      <DialogTitle>Generate Key</DialogTitle>
      <!-- <DialogDescription>Generate a new key</DialogDescription> -->
    </DialogHeader>
    <div>
      <div class="mt-4">Key:</div>
      <div class="flex text-xl border border-dotted border-gray-200 p-2 rounded-md">
        <p class="text-center flex-1">{temp_key}</p>
        <button
          on:click={() => {
            copyToClipboard(temp_key);
          }}
        >
          <Copy class="flex-none" />
        </button>
      </div>
      <div class="text-sm text-gray-500">
        This is your new key. Please keep it safe and do not share it with anyone.
      </div>

      <div class="mt-4">Recovery Phrases:</div>
      <div class="flex text-xl border border-dotted border-gray-200 p-2 rounded-md">
        <p class="text-center flex-1">{mnemonic}</p>
        <button
          on:click={() => {
            copyToClipboard(mnemonic);
          }}
        >
          <Copy class="flex-none" />
        </button>
      </div>
      <div class="text-sm text-gray-500">
        Please write down the following recovery phrases. You will need them to recover your key.
      </div>
    </div>
    <DialogFooter>
      <Button variant="default" on:click={useClose}>Use and Close</Button>
      <Button variant="outline" on:click={close}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
