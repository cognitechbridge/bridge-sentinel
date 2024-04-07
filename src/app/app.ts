import { Command } from '@tauri-apps/api/shell';
import { Store } from "tauri-plugin-store-api";
import { invoke } from '@tauri-apps/api/tauri';
import { shortenFilePath } from "./utils";

// Define the interface for a repository
interface RepositoryCore {
    name: string;
    path: string;
    salt: string;
}

interface UserData {
    email: string;
    salt: string;
    hahsed_secret: string;
}

interface Repository extends RepositoryCore {
    status: RepositoryStatus;
    shortenPath: string;
    mounted: boolean;
    mountPoint?: string;
}

interface AppResult<T> {
    ok: boolean;
    result: T;
}

interface RepositoryStatus {
    is_valid: boolean;
    is_empty: boolean;
    is_joined: boolean;
    public_key: string;
    repoid: string;
}

type MountResult = string;

class App {

    // Store object to save and load data
    store = new Store("config.json");

    constructor() {
    }

    // Function to get the status of a repository using App CLI
    async getRepositoryStatus(repositoryPath: string): Promise<RepositoryStatus> {
        const output = await invoke('get_status', { path: repositoryPath }) as string;
        const jsonOutput = JSON.parse(output) as AppResult<RepositoryStatus>;
        return jsonOutput.result;
    }

    // Function to mount a repository using App CLI
    async mountRepository(repositoryPath: string): Promise<MountResult> {
        let output = await invoke('mount', { path: repositoryPath }) as string;
        console.log("output: ", output);
        const jsonOutput = JSON.parse(output) as AppResult<MountResult>;
        return jsonOutput.result;
    }

    // Function to unmount a repository using termination child process
    async unmountRepository(repositoryPath: string): Promise<void> {
        await invoke('unmount', { path: repositoryPath });
        return;
    }

    // Function to initialize an empty repository using App CLI
    async initRepository(repositoryPath: string): Promise<void> {
        let res = await invoke('init', { path: repositoryPath });
        console.log("Init repository result: ", res);
        return;
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
    async loadRepositories(): Promise<Repository[]> {
        let list = await this.loadCoreRepositories();
        const repositories = await Promise.all(list.map(repo => this.extendRepository(repo)));
        return repositories;
    }

    async remove_repository(path: string) {
        let core_repositories = (await this.loadCoreRepositories()).filter(
            (repo) => repo.path !== path
        );
        this.saveRepositories(core_repositories);
    }

    // Function to save the user data
    async saveUserData(email: string, secret: string): Promise<void> {
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
    }

    // Function to save the user data
    async login(secret: string): Promise<boolean> {
        let user_data = await this.store.get('user_data') as UserData;
        let salt = user_data.salt;
        let hash = user_data.hahsed_secret;
        let res = await invoke('check_set_secret', { hash: hash, secret: secret, salt: salt }) as boolean;
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
        console.log("Adding folder to repositories: ", folderPath);
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
}

const app = new App();

export type { Repository };
export {
    app
};