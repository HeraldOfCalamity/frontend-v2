import { createContext, useContext, useEffect, useState } from "react";
import { getOfficeConfig, type OfficeConfiguration } from "../api/configService";

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

    const fetchParams = async () => {
        setLoading(true);
        try{
            const res = await getOfficeConfig();
            console.log('params', res)
            setParams(res || []);
            setError(null);
        }catch(err: any){   
            setError(err as Error);
            console.error(err);
        }finally{
            setLoading(false);
        }
    }

    const getParam = (name: string) => {
        const param = params.find(p => p.name === name);
        return param ? param.value : null;
    }

    useEffect(() => {
        fetchParams();
    }, [])
    
    return(
        <paramsContext.Provider value={{params, loading, error, getParam}}>
            {children}
        </paramsContext.Provider>
    )
}

export const useParams = () => {
    const context = useContext(paramsContext);
    if(!context){
        throw new Error("useParams must be used within a ParamsProvider");
    }
    return context;
}