import { Store } from "tauri-plugin-store-api";
import { Command } from '@tauri-apps/api/shell';
import { shortenFilePath } from "./utils";
import { invoke } from '@tauri-apps/api/tauri';

// Define the interface for a repository
interface RepositoryCore {
    name: string;
    path: string;
    salt: string;
    public: string;
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
    mountPid?: number;
}

interface AppResult<T> {
    ok: boolean;
    result: T;
}

interface RepositoryStatus {
    is_valid: boolean;
    is_empty: boolean;
    is_joined: boolean;
    repoid: string;
}

const store = new Store("config.json");

// Function to get the status of a repository using App CLI
async function getRepositoryStatus(repositoryPath: string): Promise<RepositoryStatus> {
    const output = await invoke('get_status', { path: repositoryPath }) as string;
    const jsonOutput = JSON.parse(output) as AppResult<RepositoryStatus>;
    return jsonOutput.result;
}

// Function to mount a repository using App CLI
async function mountRepository(repositoryPath: string): Promise<number> {
    let r = await invoke('mount', { path: repositoryPath }) as number;
    return r;
}

// Function to unmount a repository using termination child process
async function unmountRepository(repositoryPath: string): Promise<void> {
    await invoke('unmount', { path: repositoryPath });
    return;
}

// Function to initialize an empty repository using App CLI
async function initRepository(repositoryPath: string): Promise<void> {
    invoke('init', { path: repositoryPath });
    return;
}

// Function to extend a repository object with additional properties
async function extendRepository(repo: RepositoryCore): Promise<Repository> {
    let shortenPath = shortenFilePath(repo.path);
    let status = await getRepositoryStatus(repo.path); 
    let rep = {
        ...repo,
        status,
        shortenPath,
        mounted: false,
    }
    return rep;
}


// Function to save the list of repositories
async function saveRepositories(repositories: RepositoryCore[]): Promise<void> {
    await store.set('repositories', repositories);
    await store.save();
}

// Function to load the list of repositories from the store
async function loadCoreRepositories(): Promise<RepositoryCore[]> {
    return (await store.get('repositories') || []) as RepositoryCore[];
}

// Function to retrieve the list of repositories
async function loadRepositories(): Promise<Repository[]> {
    let list = await loadCoreRepositories();
    const repositories = await Promise.all(list.map(repo => extendRepository(repo)));
    return repositories;
}

// Function to save the user data
async function saveUserData(email: string, secret: string): Promise<void> {
    let salt = generateRandomString(32);
    let hahsed_secret = await invoke('set_new_secret', { secret: secret, salt: salt }) as string;
    if (hahsed_secret.length === 0) {
        console.error("Failed to set secret");
    }
    let userData: UserData = {
        email: email,
        salt: salt,
        hahsed_secret: hahsed_secret
    };
    await store.set('user_data', userData);
    await store.save();
}

// Function to save the user data
async function login(secret: string): Promise<boolean> {
    let user_data = await store.get('user_data') as UserData;
    let salt = user_data.salt;
    let hash = user_data.hahsed_secret;
    let res = await invoke('check_set_secret', {hash: hash, secret: secret, salt: salt}) as boolean;
    return res; 
}

// Function to load the user data
async function loadUserData(): Promise<UserData|null> {
    return (await store.get('user_data') as UserData || null);
}

// Function to generate a random string with a given length
function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}

async function addFolderToRepositories(folderPath: string): Promise<Repository> {
    console.log("Adding folder to repositories: ", folderPath);
    let newRepo = {
        path: folderPath,
        name: folderPath.split('/').pop() || '',
        salt: generateRandomString(32),
        public: generateRandomString(16)
    };
    let extendedNewRepo = await extendRepository(newRepo);
    if (extendedNewRepo.status.is_valid  === false) {
        return extendedNewRepo;
    }
    let repositories = await loadCoreRepositories();
    repositories.push(newRepo);
    await saveRepositories(repositories);
    return extendedNewRepo;
}

export type { Repository };
export { 
    saveRepositories, 
    loadRepositories, 
    generateRandomString, 
    addFolderToRepositories, 
    mountRepository, 
    unmountRepository, 
    initRepository,
    loadUserData,
    saveUserData,
    login
};