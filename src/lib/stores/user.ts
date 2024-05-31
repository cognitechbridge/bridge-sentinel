import { get, writable } from 'svelte/store';

import { AppCloudClient } from '../../app/app_cloud_client';
import { BridgeCli } from '$lib/services/bridge-cli';
import type { Store } from "tauri-plugin-store-api";
import type { Tokens } from '../../app/app_cloud_client';
import { invoke } from '@tauri-apps/api/tauri';
import { store } from "$lib/stores/store";

type UserData = {
    email: string;
    salt: string;
    encrypted_key?: string;
}

export let user_email = writable<string | null>(null);

class UserService {

    // Store object to save and load data
    store: Store;
    // Cloud client object to interact with the cloud
    private client: AppCloudClient;
    // Bridge CLI object to interact with the bridge CLI
    cli: BridgeCli;

    constructor(store: Store) {
        this.store = store;
        this.client = new AppCloudClient(store);
        this.cli = new BridgeCli();
    }

    // Function to save the user data
    async saveUserData(email: string, secret: string, rootKey: string): Promise<void> {
        let salt = this.generateRandomString(32);
        let encrypted_key = await invoke('set_new_secret', { secret: secret, salt: salt, rootKey: rootKey }) as string;
        if (encrypted_key.length === 0) {
            console.error("Failed to set secret");
        }
        let userData: UserData = {
            email: email,
            salt: salt,
            encrypted_key: encrypted_key,
        };
        await this.store.set('user_data', userData);
        await this.store.save();
    }

    // Function to register a user using email, public key, private key and salt
    async registerUserCloud(secret: string, rootKey: string): Promise<boolean> {
        let email = await this.get_user_email();

        let salt = this.generateRandomString(32);
        let encrypted_key = await invoke('set_new_secret', { secret: secret, salt: salt, rootKey: rootKey }) as string;
        if (encrypted_key.length === 0) {
            console.error("Failed to set secret");
        }
        let publicKey = (await this.cli.getPublicKey(rootKey)).result;
        return await this.client.register_user(email, publicKey, encrypted_key, salt);
    }

    // Function to login the user using a secret
    async login(secret: string): Promise<boolean> {
        let salt = await this.get_user_salt();
        let encryptedRootKey = await this.get_user_encrypted_key();
        let res = await invoke('check_set_secret', { secret: secret, salt: salt, encryptedRootKey: encryptedRootKey }) as boolean;
        return res;
    }

    // Function to load the user data
    async loadUserData(): Promise<UserData | null> {
        return (await this.store.get('user_data') as UserData || null);
    }

    // Function to generate a random string with a given length
    private generateRandomString(length: number): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const randomValues = new Uint8Array(length); // Create a typed array of the required length
        crypto.getRandomValues(randomValues); // Populate it with cryptographically secure random values

        for (let i = 0; i < length; i++) {
            const randomIndex = randomValues[i] % characters.length; // Use modulo to get a valid index
            result += characters.charAt(randomIndex);
        }
        return result;
    }

    // Get the email of the user from the store
    async get_user_email(): Promise<string> {
        if (await this.get_use_cloud()) {
            let email = await this.client.get_email();
            return email;
        } else {
            let user_data = await this.store.get('user_data') as UserData;
            return user_data.email;
        }
    }

    // Get the salt of the user from the cloud or from the store
    async get_user_salt(): Promise<string> {
        let email = await this.get_user_email();
        if (await this.get_use_cloud()) {
            return await this.client.get_user_salt(email);
        }
        let user_data = await this.store.get('user_data') as UserData;
        return user_data.salt;
    }

    // Get the encrypted key of the user from the cloud or from the store
    async get_user_encrypted_key(): Promise<string> {
        let email = await this.get_user_email();
        if (await this.get_use_cloud()) {
            return await this.client.get_encrypted_private_key(email);
        }
        let user_data = await this.store.get('user_data') as UserData;
        let encrypted_key = user_data.encrypted_key;
        return encrypted_key || '';
    }

    // Check if the app is running for the first time
    async get_is_first_run(): Promise<boolean> {
        let use_cloud = await this.store.get('use_cloud');
        return use_cloud === null || use_cloud === undefined;
    }

    // Check if the use enabled the cloud
    async get_use_cloud(): Promise<boolean> {
        let use_cloud = await this.store.get('use_cloud') as boolean;
        return use_cloud;
    }

    // Check if the user is required to login to the cloud (if the cloud is enabled and the user is not logged in)
    async needs_login_to_cloud(): Promise<boolean> {
        if (!await userService.get_use_cloud()) {
            return false;
        }
        return await userService.client.is_user_logged_in();
    }

    // Check if the user is registered on (local or cloud)
    async is_user_registered(): Promise<boolean> {
        let email = await this.get_user_email();
        if (!email) {
            return false;
        }
        if (!await this.get_use_cloud()) {
            return true;
        }
        return await this.client.is_user_registered(email);
    }

    // Set the use of the cloud
    async set_use_cloud(use_cloud: boolean): Promise<void> {
        await this.store.set('use_cloud', use_cloud);
        await this.store.save();

    }

    // Logout the user from the cloud and remove the user data from the store
    async logout(): Promise<void> {
        user_email.set(null);
        if (await this.get_use_cloud()) {
            await this.client.logout();
        }
        await this.store.set('user_data', null);
        await this.store.save();
    }

    // Get the public key of the user from the cloud
    async get_email_from_public_key(publicKey: string): Promise<string> {
        return await this.client.get_email_from_public_key(publicKey);
    }

    // Get the tokens using the code and the verifier
    async get_tokens(code: string, verifier: string): Promise<Tokens | null> {
        return await this.client.get_tokens(code, verifier);
    }

}

export const userService = new UserService(store);
