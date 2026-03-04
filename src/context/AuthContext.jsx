import { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('agebatp_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem('agebatp_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const result = await API.login(email, password);
        if (result.success) {
            const userData = {
                ...result.user,
                token: result.token,
                permisos: result.user.permisos || []
            };
            setUser(userData);
            localStorage.setItem('agebatp_user', JSON.stringify(userData));
            return { success: true, user: userData };
        }
        return { success: false, message: result.message || 'Credenciales incorrectas' };
    };

    const register = async (data) => {
        const result = await API.register(data);
        return result;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('agebatp_user');
    };

    const can = (permiso) => {
        if (!user) return false;
        return user.permisos?.includes(permiso) || false;
    };

    const isRole = (rol) => {
        if (!user) return false;
        return user.rol === rol;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, can, isRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return ctx;
}
