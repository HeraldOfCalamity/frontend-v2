import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getOfficeConfig, type OfficeConfiguration } from "../api/configService";
import { useAuth } from "./AuthContext";

interface ParamsContextType{
    params: OfficeConfiguration[];
    loading: boolean;
    error: Error | null;
    getParam: (name: string) => any;
}

const paramsContext = createContext<ParamsContextType | undefined>(undefined);

export const ParamsProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [params, setParams] = useState<OfficeConfiguration[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const {isAuthenticated} = useAuth();
    const hasRun = useRef(false);

    const fetchParams = async () => {
        setLoading(true);
        try{
            const res = await getOfficeConfig();
            setParams(res || []);
            setError(null);
        }catch(err: any){   
            setError(err as Error);
            console.error(err);
        }finally{
            setLoading(false);
        }
    }

    const getParam = async (name: string) => {
        try {
            const res = await getOfficeConfig();
            const param = res?.find((p: OfficeConfiguration) => p.name === name);
            console.log(`founded param: ${name}`, param);
            return param ? param.value : null;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    useEffect(() => {
        if(!hasRun.current){
            hasRun.current = true;
            fetchParams();
        }
    }, [])
    
    return(
        <paramsContext.Provider value={{params, loading, error, getParam}}>
            {children}
        </paramsContext.Provider>
    )
}

export const useConfig = () => {
    const context = useContext(paramsContext);
    if(!context){
        throw new Error("useParams must be used within a ParamsProvider");
    }
    return context;
}