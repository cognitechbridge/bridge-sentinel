import { invoke } from '@tauri-apps/api/tauri';

export type AppResult<T> = {
    ok: boolean;
    result: T;
    err: string;
}

export type AccessList = {
    PublicKey: string;
    Inherited: boolean;
}[]

export type RepositoryStatus = {
    is_valid: boolean;
    is_empty: boolean;
    is_joined: boolean;
    public_key: string;
    repoid: string;
}

export type MountResult = string;

export class BridgeCli {

    // Function to get the status of a repository using App CLI
    async getRepositoryStatus(repositoryPath: string): Promise<RepositoryStatus> {
        const output = await this.invokeCli<RepositoryStatus>('get_status', { path: repositoryPath });
        return output.result;
    }

    // Function to mount a repository using App CLI
    async mountRepository(repositoryPath: string): Promise<MountResult> {
        let output = await this.invokeCli<MountResult>('mount', { path: repositoryPath });
        return output.result;
    }

    // Function to share a path with a public key
    async sharePathWithPublicKey(repositoryPath: string, path: string, publicKey: string): Promise<AppResult<void>> {
        let res = await this.invokeCli<void>('share', { repoPath: repositoryPath, recipient: publicKey, path: path });
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

    // Function to get the public key of a private key
    async getPublicKey(privateKey: string): Promise<AppResult<string>> {
        let res = await this.invokeCli<string>('get_public_key', { privateKey: privateKey });
        return res;
    }

    // Function to invoke a the ctb-cli with a given command and arguments
    private async invokeCli<T>(command: string, args: any): Promise<AppResult<T>> {
        let res = await invoke(command, args) as string;
        return JSON.parse(res) as AppResult<T>;
    }
}