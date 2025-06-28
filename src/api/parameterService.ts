// import axios, { type AxiosInstance, type AxiosResponse } from "axios";
// // import { API_URL, HOME_PARAMETERS, PARAMETER_URL } from "../config/benedetta.api.config";
// import { handleRequestError } from "../utils/errorHandler";

// export interface Parameter{
//     value: string;
//     name: string;
// }

// export default class ParameterService{
//     private static _axios: AxiosInstance;

//     constructor(){
//         ParameterService._axios = axios.create({baseURL: `${API_URL}${PARAMETER_URL}`});
//     }

//     public static async getHomePageParameters(): Promise<Parameter[]> {
//         try{
//             const response = await this._axios.get('home');
//             return this.parseResponseToParameterList(response);
//         }catch(e){
//             handleRequestError(e);
//             return [];
//         }
//     }

//     public static getDummyHomePageParameters(): Promise<Parameter[]> {
//         return new Promise(resolve => {
//             setTimeout(() => {
//                 resolve([
//                     this.createParameter(HOME_PARAMETERS.ADDRESS_MESSAGE, 'Estamos en Av. América #459, entre Av. Santa Cruz y Pantaleón Dalence. ¡Te esperamos!'),
//                     this.createParameter(HOME_PARAMETERS.MAP_IMAGE, '')
//                 ]);
//             }, 1400);
//         });
//     }

//     private static parseResponseToParameterList(response: AxiosResponse): Parameter[]{
//         const data = response.data;
//         if (Array.isArray(data)) {
//             return data
//                 .filter(item => typeof item === 'object' && typeof item.name === 'string' && typeof item.value === 'string')
//                 .map(item => this.createParameter(item.name, item.value));
//         }
//         return [];
//     }

//     private static createParameter(name: string, value: string): Parameter{
//         return {name, value};
//     }

// }