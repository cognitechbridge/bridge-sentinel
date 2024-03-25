import { Store } from "tauri-plugin-store-api";
import { Command, Child } from '@tauri-apps/api/shell';
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
    is_joined: boolean;
    repoid: string;
}

const store = new Store("config.json");

// Function to get the status of a repository using App CLI
async function getRepositoryStatus(repositoryPath: string): Promise<RepositoryStatus> {
    const command = Command.sidecar('binaries/storage', ['status', "-p", repositoryPath ,"-o", "json"]);
    const output = await command.execute();
    const jsonOutput = JSON.parse(output.stdout) as AppResult<RepositoryStatus>;
    return jsonOutput.result;
}

// Function to mount a repository using App CLI
async function mountRepository(repositoryPath: string): Promise<number> {
    const command = Command.sidecar('binaries/storage', ['mount', "-p", repositoryPath, "-k", "79dvjtK2jcPpfXi1HsKa2S9GV5qjhbKgJHQyoWevg6ZQ", "-o", "json"]);
    let process = await command.spawn();
    return process.pid;
}

// Function to unmount a repository using termination child process
async function unmountRepository(pid: number): Promise<void> {
    let ch = new Child(pid);
    ch.kill();
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
    let userData = {
        email: email,
        salt: generateRandomString(32)
    };
    await store.set('user_data', userData);
    await store.save();
    let res = await invoke('set_secret', { secret: secret }) as boolean;
    if (!res) {
        console.error("Failed to set secret");
    }
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

async function addFolderToRepositories(folderPath: string) {
    console.log("Adding folder to repositories: ", folderPath);
    let newRepo = {
        path: folderPath,
        name: folderPath.split('/').pop() || '',
        salt: generateRandomString(32),
        public: generateRandomString(16)
    };
    let repositories = await loadCoreRepositories();
    repositories.push(newRepo);
    await saveRepositories(repositories);
}

export type { Repository };
export { saveRepositories, loadRepositories, generateRandomString, addFolderToRepositories, mountRepository, unmountRepository, loadUserData, saveUserData};