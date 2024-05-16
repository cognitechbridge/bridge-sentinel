import axios from 'axios';

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

}