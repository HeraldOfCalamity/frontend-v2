export const loginUser = async (email: string, password: string) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(`Usuario loggeado con exito ${email} ${password}`);
        }, 1400);
    });
}