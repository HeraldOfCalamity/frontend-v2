import BENEDETTA_API from "../config/benedetta.api.config";


const LOGIN_ROUTE = '/auth/login';

export interface LoginResponse{
    access_token: string;
    token_type: string;
}

export const loginApi = async (email: string, password: string): Promise<LoginResponse> => {
    const response = await BENEDETTA_API.post(`${LOGIN_ROUTE}`, new URLSearchParams({
        username: email,
        password
    }),{
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
    });
    return response.data;
}