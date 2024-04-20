import { Command } from '@tauri-apps/api/shell';
import { Store } from "tauri-plugin-store-api";
import { invoke } from '@tauri-apps/api/tauri';
import { shortenFilePath } from "./utils";

type RepositoryCore = {
    name: string;
    path: string;
    salt: string;
}

type UserData = {
    email: string;
    salt: string;
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

class App {

    // Store object to save and load data
    store = new Store("config.json");

    repositories = [] as Repository[];

    constructor() {
    }

    // Function to get the status of a repository using App CLI
    async getRepositoryStatus(repositoryPath: string): Promise<RepositoryStatus> {
        const output = await this.invokeCli<RepositoryStatus>('get_status', { path: repositoryPath, encryptedKey: await this.getEncryptedKey() });
        return output.result;
    }

    // Function to mount a repository using App CLI
    async mountRepository(repositoryPath: string): Promise<MountResult> {
        let repo = this.repositories.find((repo) => repo.path === repositoryPath);
        if (!repo) {
            throw new Error("Repository not found");
        }
        let output = await this.invokeCli<MountResult>('mount', { path: repositoryPath, encryptedKey: await this.getEncryptedKey() });
        repo.mounted = true;
        repo.mountPoint = output.result;
        return output.result;
    }

    // Function to unmount a repository using termination child process
    async unmountRepository(repositoryPath: string): Promise<void> {
        await invoke('unmount', { path: repositoryPath, encryptedKey: await this.getEncryptedKey() });
        return;
    }

    // Function to initialize an empty repository using App CLI
    async initRepository(repositoryPath: string): Promise<void> {
        await invoke('init', { path: repositoryPath, encryptedKey: await this.getEncryptedKey() });
        return;
    }


    // Function to share a path with a user
    async sharePath(repositoryPath: string, path: string, recipient: string): Promise<AppResult<void>> {
        let res = await this.invokeCli<void>('share', { repoPath: repositoryPath, recipient: recipient, path: path, encryptedKey: await this.getEncryptedKey() });
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
    }

    // Function to load the list of repositories from the store
    async loadCoreRepositories(): Promise<RepositoryCore[]> {
        return (await this.store.get('repositories') || []) as RepositoryCore[];
    }

    // Function to retrieve the list of repositories
    async loadRepositories(): Promise<void> {
        let list = await this.loadCoreRepositories();
        this.repositories = await Promise.all(list.map(repo => this.extendRepository(repo)));
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
    async saveUserData(email: string, secret: string, key: string): Promise<void> {
        let salt = this.generateRandomString(32);
        let hahsed_secret = await invoke('set_new_secret', { secret: secret, salt: salt }) as string;
        if (hahsed_secret.length === 0) {
            console.error("Failed to set secret");
        }
        let userData: UserData = {
            email: email,
            salt: salt,
            hahsed_secret: hahsed_secret
        };
        await this.store.set('user_data', userData);
        await this.store.save();
        await this.encryptAndSetKey(key);
    }

    // Function to save the user data
    async login(secret: string): Promise<boolean> {
        let user_data = await this.store.get('user_data') as UserData;
        let salt = user_data.salt;
        let encrypted_key = await this.store.get('encrypted_key') as string;
        let res = await invoke('check_set_secret', { secret: secret, salt: salt, encryptedKey: encrypted_key }) as boolean;
        return res;
    }

    // Function to save the user data
    async encrypt_repo_key(encoded_key: string): Promise<string> {
        let res = await invoke('encrypt_repo_key', { encodedKey: encoded_key }) as string;
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
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters.charAt(randomIndex);
        }
        return result;
    }

    async addFolderToRepositories(folderPath: string): Promise<Repository> {
        let newRepo = {
            path: folderPath,
            name: folderPath.split('/').pop() || '',
            salt: this.generateRandomString(32),
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

    async getEncryptedKey(): Promise<string> {
        return await this.store.get('encrypted_key') as string;
    }

    async encryptAndSetKey(key: string): Promise<void> {
        let encoded_key = await this.encrypt_repo_key(key);
        await this.store.set('encrypted_key', encoded_key);
        await this.store.save();
    }
}

let app = new App();

export {
    app
};