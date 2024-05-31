import type { AccessList, AppResult, MountResult, RepositoryStatus } from '../services/bridge-cli';
import { get, writable } from 'svelte/store';

import type { AppCloudClient } from '$api/app_cloud_client';
import { BridgeCli } from './../services/bridge-cli';
import type { Store } from "tauri-plugin-store-api";
import { appCloudClient } from '$api/app_cloud_client';
import { invoke } from '@tauri-apps/api/tauri';
import { shortenFilePath } from '../../app/utils';
import { store } from "./store";

//TODO Fix the path for shortenFilePath


type RepositoryCore = {
    name: string;
    path: string;
}

export type Repository = RepositoryCore & {
    status: RepositoryStatus;
    shortenPath: string;
    mounted: boolean;
    mountPoint?: string;
}

export let repositories = writable<Repository[]>([]);

export class RepositoryService {
    store: Store;
    cli: BridgeCli = new BridgeCli();
    cloud: AppCloudClient;

    constructor(store: Store, cloud: AppCloudClient) {
        this.store = store;
        this.cloud = cloud;
    }

    // Function to get the status of a repository using App CLI
    async getRepositoryStatus(repositoryPath: string): Promise<RepositoryStatus> {
        return this.cli.getRepositoryStatus(repositoryPath);
    }

    // Function to mount a repository using App CLI
    async mount(repositoryPath: string): Promise<MountResult> {
        let repo = get(repositories).find((repo) => repo.path === repositoryPath);
        if (!repo) {
            throw new Error("Repository not found");
        }
        let output = await this.cli.mountRepository(repositoryPath);
        repo.mounted = true;
        repo.mountPoint = output;
        return output;
    }

    // Function to unmount a repository using termination child process
    async unmount(repositoryPath: string): Promise<void> {
        await invoke('unmount', { path: repositoryPath });
        return;
    }

    // Function to initialize an empty repository using App CLI
    async initRepository(repositoryPath: string): Promise<void> {
        await invoke('init', { path: repositoryPath });
        return;
    }


    // Function to share a path with a user's email
    async sharePathWithEmail(repositoryPath: string, path: string, recipient: string): Promise<AppResult<void>> {
        let publicKey = await this.getPublicKey(await this.cloud.get_public_key(recipient));
        let res = this.sharePathWithPublicKey(repositoryPath, path, publicKey.result);
        return res;
    }

    // Function to share a path with a public key
    async sharePathWithPublicKey(repositoryPath: string, path: string, publicKey: string): Promise<AppResult<void>> {
        let res = await this.cli.sharePathWithPublicKey(repositoryPath, path, publicKey);
        return res;
    }

    // Function to unshare a path with a user
    async unsharePath(repositoryPath: string, path: string, recipient: string): Promise<AppResult<void>> {
        let res = await this.cli.unsharePath(repositoryPath, path, recipient);
        return res;
    }

    // Function to list the access of a path
    async listAccess(repositoryPath: string, path: string): Promise<AppResult<AccessList>> {
        let res = await this.cli.listAccess(repositoryPath, path);
        return res;
    }

    // Function to get the public key of a private key
    async getPublicKey(privateKey: string): Promise<AppResult<string>> {
        let res = await this.cli.getPublicKey(privateKey);
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

    // Function to remove a repository from the list
    async remove_repository(path: string) {
        let core_repositories = (await this.loadCoreRepositories()).filter(
            (repo) => repo.path !== path
        );
        this.saveRepositories(core_repositories);
    }

    // Function to add a folder to the list of repositories
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
}

export let repositoryService: RepositoryService = new RepositoryService(store, appCloudClient);