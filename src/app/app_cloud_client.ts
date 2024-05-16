import axios from 'axios';

interface Tokens {
    access_token: string;
    refresh_token: string;
    id_token: string;
}

export class AppCloudClient {
    private baseURL: string = 'http://localhost:1323/';
    private token: string = '';
    private refresh_token: string = '';

    async get_user_salt(email: string): Promise<string> {
        const response = await axios.get(this.baseURL + 'user/salt', {
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
                redirect_uri: 'http://localhost:1323/callback'
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

        return result;
    }
}