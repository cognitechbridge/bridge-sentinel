import { Store } from "tauri-plugin-store-api";
import { Command } from '@tauri-apps/api/shell';
import { shortenFilePath } from "./utils";

// Define the interface for a repository
interface RepositoryCore {
    name: string;
    path: string;
    salt: string;
    public: string;
}

interface Repository extends RepositoryCore {
    status: RepositoryStatus;
    shortenPath: string;
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

// Function to extend a repository object with additional properties
async function extendRepository(repo: RepositoryCore): Promise<Repository> {
    let shortenPath = shortenFilePath(repo.path);
    let status = await getRepositoryStatus(repo.path); 
    let rep = {
        ...repo,
        status,
        shortenPath
    }
    return rep;
}


// Function to save the list of repositories
async function saveRepositories(repositories: RepositoryCore[]): Promise<void> {
    await store.set('repositories', repositories);
    await store.save();
}

async function loadCoreRepositories(): Promise<RepositoryCore[]> {
    return (await store.get('repositories') || []) as RepositoryCore[];
}

// Function to retrieve the list of repositories
async function loadRepositories(): Promise<Repository[]> {
    let list = await loadCoreRepositories();
    const repositories = await Promise.all(list.map(repo => extendRepository(repo)));
    return repositories;
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
export { saveRepositories, loadRepositories, generateRandomString, addFolderToRepositories };