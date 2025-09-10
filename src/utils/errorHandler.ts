export const handleError = (err: any, defaultMessage: string) => {
    const errResponse = err?.response?.data?.detail;

    if(errResponse){
        console.error(
            errResponse ||
            err?.message ||
            defaultMessage
        )

        if(Array.isArray(errResponse) && errResponse.length > 0){
            const msg = errResponse.map(err => {
                const campo = err.loc?.slice(1).join('.') || 'Campo desconocido';
                return `• ${campo}: ${err.msg}`;
            }).join('\n');
            throw new Error(msg);
        }

        throw new Error(
            errResponse ||
            err?.message ||
            defaultMessage
        )
    }
    
    throw new Error(
        err?.message ||
        defaultMessage
    );
}