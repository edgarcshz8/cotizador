export const getToken    = ()  => localStorage.getItem('token');
export const setToken    = (t) => localStorage.setItem('token', t);
export const removeToken = ()  => localStorage.removeItem('token');
export const isLoggedIn  = ()  => !!getToken();
