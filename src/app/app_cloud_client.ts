import type { Store } from "tauri-plugin-store-api";
import axios from 'axios';
import { jwtDecode } from "jwt-decode";

interface Tokens {
    access_token: string;
    refresh_token: string;
    id_token?: string;
}

export class AppCloudClient {
    private baseURL: string = 'https://api.cognitechbridge.com/';
    private token: string = '';
    private refresh_token: string = '';
    private id_token: string = '';

    private store: Store;

    constructor(store: Store) {
        this.store = store;
    }

    async is_user_registered(email: string): Promise<boolean> {
        const token = await this.get_token();
        const headers = {
            Authorization: `Bearer ${token}`
        };
        let response;
        try {
            response = await axios.get(this.baseURL + 'user/salt', {
                headers: headers,
                params: {
                    email: email
                }
            })
        } catch (error) {
            return false;
        }
        return response.status === 200 ? true : false;
    }

    async get_user_salt(email: string): Promise<string> {
        const token = await this.get_token();
        const headers = {
            Authorization: `Bearer ${token}`
        };
        const response = await axios.get(this.baseURL + 'user/salt', {
            headers: headers,
            params: {
                email: email
            }
        });
        return response.data;
    }

    async get_encrypted_private_key(email: string): Promise<string> {
        const token = await this.get_token();
        const headers = {
            Authorization: `Bearer ${token}`
        };
        const response = await axios.get(this.baseURL + 'user/priv', {
            headers: headers,
            params: {
                email: email
            }
        });
        return response.data;
    }

    // Get user tokens using code and verifier after login redirect
    async get_tokens(code: string, verifier: string): Promise<Tokens | null> {
        var options = {
            method: 'POST',
            url: 'https://dev-65toamv7157f23vq.us.auth0.com/oauth/token',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            data: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: 'ZBRZXrV3FrzvZfO3Zz8OCnKEwXnyxrDf',
                code_verifier: verifier,
                code: code,
                redirect_uri: 'https://api.cognitechbridge.com/callback'
            })
        };

        let token_res = await axios.request(options).catch((error) => {
            console.log(error);
        });

        if (!token_res) {
            return null;
        }

        let result = {
            access_token: token_res.data.access_token,
            refresh_token: token_res.data.refresh_token,
            id_token: token_res.data.id_token
        }

        this.token = result.access_token;
        this.refresh_token = result.refresh_token;
        this.id_token = result.id_token;

        console.log('Token: ' + this.token);

        await this.save_refresh_token_to_store(this.refresh_token);

        return result;
    }

    // Get user tokens using refresh token
    async use_refresh_token(refresh_token: string): Promise<Tokens | null> {
        console.log('Using refresh token: ' + refresh_token);
        var options = {
            method: 'POST',
            url: 'https://dev-65toamv7157f23vq.us.auth0.com/oauth/token',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            data: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: 'ZBRZXrV3FrzvZfO3Zz8OCnKEwXnyxrDf',
                refresh_token: refresh_token
            })
        };

        let token_res = await axios.request(options).catch((error) => {
            console.log(error);
        });

        if (!token_res) {
            return null;
        }

        let result = {
            access_token: token_res.data.access_token,
            refresh_token: token_res.data.refresh_token,
            id_token: token_res.data.id_token
        }

        this.token = result.access_token;
        this.refresh_token = result.refresh_token;
        this.id_token = result.id_token;

        console.log('Token (By Refresh): ' + this.token);

        await this.save_refresh_token_to_store(this.refresh_token);

        return result;
    }

    private async load_refresh_token_from_store() {
        this.refresh_token = await this.store.get('refresh_token') || '';
    }

    private async save_refresh_token_to_store(refresh_token: string) {
        await this.store.set('refresh_token', this.refresh_token);
        await this.store.save();
    }

    async has_any_access_token(): Promise<boolean> {
        return this.has_access_token() || (await this.has_refresh_token());
    }

    async has_refresh_token(): Promise<boolean> {
        return await this.store.has('refresh_token');
    }

    has_access_token(): boolean {
        return this.token.length > 0 && is_valid_jwt(this.token);
    }

    // Get access token directly from memory or using refresh token
    async get_token(): Promise<String> {
        if (this.token.length > 0 && is_valid_jwt(this.token)) {
            return this.token;
        }
        if (!(this.refresh_token.length > 0)) {
            await this.load_refresh_token_from_store();
        }
        if (this.refresh_token.length > 0) {
            await this.use_refresh_token(this.refresh_token);
            return this.token;
        }
        return '';
    }

    // Register a user using email, public key, private key and salt
    async register_user(email: string, pub_key: string, priv_key: string, salt: string): Promise<boolean> {
        const token = await this.get_token();
        const headers = {
            Authorization: `Bearer ${token}`
        };
        const response = await axios.post(this.baseURL + 'user/register', {
            email: email,
            pub_key: pub_key,
            priv_key: priv_key,
            salt: salt
        }, {
            headers: headers
        });
        return response.status === 200 ? true : false;
    }

    // Get id token directly from memory or using refresh token
    async get_id_token(): Promise<string> {
        if (this.id_token.length > 0 && is_valid_jwt(this.id_token)) {
            return this.id_token;
        } else if (await this.has_refresh_token()) {
            await this.get_token();
            return this.id_token;
        }
        return '';
    }

    // Get email from id token
    async get_email(): Promise<string> {
        if (!(await this.get_id_token())) {
            return '';
        }
        const decodedToken = decode_token<{ email: string }>(this.id_token);
        return decodedToken ? decodedToken.email : '';
    }

    // Get public key from user email
    async get_public_key(email: string): Promise<string> {
        const token = await this.get_token();
        const headers = {
            Authorization: `Bearer ${token}`
        };
        const response = await axios.get(this.baseURL + 'user/pub', {
            headers: headers,
            params: {
                email: email
            }
        });
        return response.data;
    }

    // Get email from public key
    async get_email_from_public_key(pub_key: string): Promise<string> {
        const token = await this.get_token();
        const headers = {
            Authorization: `Bearer ${token}`
        };
        try {
            const response = await axios.get(this.baseURL + 'user/email', {
                headers: headers,
                params: {
                    pub_key: pub_key
                }
            });
            return response.data;
        } catch (error) {
            return '';
        }
    }
}

function decode_token<T>(token: string): T | null {
    try {
        return jwtDecode<T>(token);
    } catch (error) {
        return null;
    }
}

function is_valid_jwt(token: string): boolean {
    const decodedToken = jwtDecode(token);
    if (!decodedToken || !decodedToken.exp) {
        return false;
    }
    const expirationTime = decodedToken.exp * 1000; // Convert expiration time to milliseconds
    const currentTime = Date.now();
    if (expirationTime < currentTime) {
        return false;
    } else {
        return true;
    }
}