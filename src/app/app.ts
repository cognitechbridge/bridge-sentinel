import { get, writable } from 'svelte/store';

import { AppCloudClient } from './app_cloud_client';
import { Command } from '@tauri-apps/api/shell';
import { Store } from "tauri-plugin-store-api";
import { invoke } from '@tauri-apps/api/tauri';
import { shortenFilePath } from "./utils";

type RepositoryCore = {
    name: string;
    path: string;
}

type UserData = {
    email: string;
    salt: string;
    use_cloud?: boolean;
}

export type Repository = RepositoryCore & {
    status: RepositoryStatus;
    shortenPath: string;
    mounted: boolean;
    mountPoint?: string;
}

export type AppResult<T> = {
    ok: boolean;
    result: T;
    err: string;
}

type RepositoryStatus = {
    is_valid: boolean;
    is_empty: boolean;
    is_joined: boolean;
    public_key: string;
    repoid: string;
}

export type AccessList = {
    PublicKey: string;
    Inherited: boolean;
}[]

type MountResult = string;

export let repositories = writable<Repository[]>([]);

class App {

    // Store object to save and load data
    store = new Store("config.json");

    client = new AppCloudClient();

    // Token to authenticate the user
    token: string = "";
    refresh_token: string = "";

    constructor() {
    }

    // Function to get the status of a repository using App CLI
    async getRepositoryStatus(repositoryPath: string): Promise<RepositoryStatus> {
        const output = await this.invokeCli<RepositoryStatus>('get_status', { path: repositoryPath });
        return output.result;
    }

    // Function to mount a repository using App CLI
    async mountRepository(repositoryPath: string): Promise<MountResult> {
        let repo = get(repositories).find((repo) => repo.path === repositoryPath);
        if (!repo) {
            throw new Error("Repository not found");
        }
        let output = await this.invokeCli<MountResult>('mount', { path: repositoryPath });
        repo.mounted = true;
        repo.mountPoint = output.result;
        return output.result;
    }

    // Function to unmount a repository using termination child process
    async unmountRepository(repositoryPath: string): Promise<void> {
        await invoke('unmount', { path: repositoryPath });
        return;
    }

    // Function to initialize an empty repository using App CLI
    async initRepository(repositoryPath: string): Promise<void> {
        await invoke('init', { path: repositoryPath });
        return;
    }


    // Function to share a path with a user
    async sharePath(repositoryPath: string, path: string, recipient: string): Promise<AppResult<void>> {
        let res = await this.invokeCli<void>('share', { repoPath: repositoryPath, recipient: recipient, path: path });
        return res;
    }

    // Function to unshare a path with a user
    async unsharePath(repositoryPath: string, path: string, recipient: string): Promise<AppResult<void>> {
        let res = await this.invokeCli<void>('unshare', { repoPath: repositoryPath, recipient: recipient, path: path });
        return res;
    }

    // Function to list the access of a path
    async listAccess(repositoryPath: string, path: string): Promise<AppResult<AccessList>> {
        let res = await this.invokeCli<AccessList>('list_access', { repoPath: repositoryPath, path: path });
        return res;
    }

    // Function to extend a repository object with additional properties
    async extendRepository(repo: RepositoryCore): Promise<Repository> {
        let shortenPath = shortenFilePath(repo.path);
        let status = await this.getRepositoryStatus(repo.path);
        let rep = {
            ...repo,
            status,
            shortenPath,
            mounted: false,
        }
        return rep;
    }

    // Function to save the list of repositories
    async saveRepositories(repositories: RepositoryCore[]): Promise<void> {
        await this.store.set('repositories', repositories);
        await this.store.save();
        this.loadRepositories();
    }

    // Function to load the list of repositories from the store
    async loadCoreRepositories(): Promise<RepositoryCore[]> {
        return (await this.store.get('repositories') || []) as RepositoryCore[];
    }

    // Function to retrieve the list of repositories
    async loadRepositories(): Promise<void> {
        let list = await this.loadCoreRepositories();
        repositories.set(await Promise.all(list.map(repo => this.extendRepository(repo))));
    }

    // Function to invoke a the ctb-cli with a given command and arguments
    async invokeCli<T>(command: string, args: any): Promise<AppResult<T>> {
        let res = await invoke(command, args) as string;
        return JSON.parse(res) as AppResult<T>;
    }

    // Function to remove a repository from the list
    async remove_repository(path: string) {
        let core_repositories = (await this.loadCoreRepositories()).filter(
            (repo) => repo.path !== path
        );
        this.saveRepositories(core_repositories);
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
            salt: salt
        };
        await this.store.set('user_data', userData);
        await this.store.set('encrypted_key', encrypted_key);
        await this.store.save();
    }

    // Function to save the user data
    async login(secret: string): Promise<boolean> {
        let user_data = await this.store.get('user_data') as UserData;
        let salt = user_data.salt;
        let encryptedRootKey = await this.store.get('encrypted_key') as string;
        let res = await invoke('check_set_secret', { secret: secret, salt: salt, encryptedRootKey: encryptedRootKey }) as boolean;
        return res;
    }

    // Function to load the user data
    async loadUserData(): Promise<UserData | null> {
        return (await this.store.get('user_data') as UserData || null);
    }

    // Function to generate a random string with a given length
    generateRandomString(length: number): string {
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

    async addFolderToRepositories(folderPath: string): Promise<Repository> {
        let newRepo = {
            path: folderPath,
            name: folderPath.split('/').pop() || '',
        };
        let extendedNewRepo = await this.extendRepository(newRepo);
        if (extendedNewRepo.status.is_valid === false) {
            return extendedNewRepo;
        }
        let repositories = await this.loadCoreRepositories();
        repositories.push(newRepo);
        await this.saveRepositories(repositories);
        return extendedNewRepo;
    }

    saveToken(token: string, refresh_token: string) {
        console.log("Token: ", token);
        this.token = token;
        this.refresh_token = refresh_token;
    }

    async get_user_email(): Promise<string> {
        let user_data = await this.store.get('user_data') as UserData;
        return user_data.email;
    }

    has_valid_token(): boolean {
        return (this.token.length > 0) && (this.refresh_token.length > 0);
    }

    async has_valid_salt(): Promise<boolean> {
        let user_data = await this.store.get('user_data') as UserData;
        return user_data.salt.length > 0;
    }

    async user_has_recoverable_refresh_token(): Promise<boolean> {
        if (this.refresh_token.length > 0)
            return true;
        if (await this.has_valid_salt() && await this.has_valid_encrypted_refresh_token())
            return true;
        return false;
    }

    async has_valid_encrypted_refresh_token(): Promise<boolean> {
        let encrypted_refresh_token = await this.store.get('encrypted_refresh_token') as string;
        return encrypted_refresh_token.length > 0;
    }

    // Function to save the the refresh token in the store
    async save_refresh_token(secret: string): Promise<void> {
        let salt = (await this.store.get('user_data') as UserData).salt;
        let encrypted_refresh_token = await invoke('encrypt_by_secret', { secret: secret, salt: salt, plain: this.refresh_token }) as string;
        if (encrypted_refresh_token.length === 0) {
            console.error("Failed to set secret");
        }
        await this.store.set('encrypted_refresh_token', encrypted_refresh_token);
        await this.store.save();
    }

    // Function to restore the refresh token from the store and decrypt it
    async restore_refresh_token(secret: string): Promise<string> {
        let salt = (await this.store.get('user_data') as UserData).salt;
        let encrypted_refresh_token = await this.store.get('encrypted_refresh_token') as string;
        let refresh_token = await invoke('decrypt_by_secret', { secret: secret, salt: salt, encrypted: encrypted_refresh_token }) as string;
        this.refresh_token = refresh_token;
        return refresh_token;
    }

    // Update the salt in the store if it is different from the given salt
    async update_salt_if_needed(salt: string): Promise<void> {
        let user_data = await this.store.get('user_data') as UserData;
        if (user_data.salt !== salt) {
            user_data.salt = salt;
            await this.store.set('user_data', user_data);
            await this.store.save();
        }
    }
}

export let app = new App();
