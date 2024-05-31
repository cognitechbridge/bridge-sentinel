import * as bip39 from '@scure/bip39';

import { HDKey } from '@scure/bip32';
import bs58 from 'bs58';
import { wordlist } from '@scure/bip39/wordlists/english';

type GeneratedKeyResult = {
    mnemonic: string;
    privateKey: string;
}

async function generateRootKey(): Promise<GeneratedKeyResult> {
    //Generate a mnemonic using english wordlist with 128 bits of entropy
    let mnemonic = bip39.generateMnemonic(wordlist, 128);
    //Convert the mnemonic to a seed using bip39
    let seed = await bip39.mnemonicToSeed(mnemonic);
    //Create a HDKey object from the seed
    const hdkey = HDKey.fromMasterSeed(seed);
    if (hdkey.privateKey === undefined) {
        throw new Error('Private key is undefined');
    }
    //Encode the private key to base58
    let key = bs58.encode(hdkey.privateKey as Uint8Array);
    //Return the mnemonic and the private key
    return { mnemonic: mnemonic, privateKey: key };
}

export { generateRootKey };