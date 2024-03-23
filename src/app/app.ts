import { Store } from "tauri-plugin-store-api";

// Define the interface for a repository
interface Repository {
    name: string;
    path: string;
    salt: string;
    shortenPath: string;
}

const store = new Store("config.json");

// Function to save the list of repositories
function saveRepositories(repositories: Repository[]): void {
    store.set('repositories', repositories);
    store.save();
}

// Function to retrieve the list of repositories
async function loadRepositories(): Promise<Repository[]> {
    return await store.get('repositories') || [];
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

export type { Repository };
export { saveRepositories, loadRepositories, generateRandomString };