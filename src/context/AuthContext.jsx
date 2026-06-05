import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import {
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

function translateAuthError(code) {
    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Correo o contraseña incorrectos.';
        case 'auth/invalid-email':
            return 'El correo electrónico no es válido.';
        case 'auth/email-already-in-use':
            return 'El correo electrónico ya está registrado.';
        case 'auth/weak-password':
            return 'La contraseña debe tener al menos 6 caracteres.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos fallidos. Intente más tarde.';
        default:
            return 'Error en la autenticación. Por favor intente de nuevo.';
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userRef = doc(db, 'usuarios', firebaseUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            ...userSnap.data()
                        });
                    } else {
                        // Fallback si no existe el documento en Firestore
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            nombre: firebaseUser.displayName || 'Usuario público',
                            rol: 'publico',
                            permisos: []
                        });
                    }
                } catch (error) {
                    console.error('Error al obtener datos de usuario de Firestore:', error);
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        nombre: firebaseUser.displayName || 'Usuario público',
                        rol: 'publico',
                        permisos: []
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email.trim().toLowerCase(),
                password.trim()
            );
            const firebaseUser = userCredential.user;

            // Consultar datos del usuario
            const userRef = doc(db, 'usuarios', firebaseUser.uid);
            const userSnap = await getDoc(userRef);
            let userData = null;

            if (userSnap.exists()) {
                userData = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    ...userSnap.data()
                };
            } else {
                userData = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    nombre: firebaseUser.displayName || 'Usuario público',
                    rol: 'publico',
                    permisos: []
                };
            }
            setUser(userData);
            return { success: true, user: userData };
        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                message: translateAuthError(error.code || error.message)
            };
        }
    };

    const register = async (data) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                data.email.trim().toLowerCase(),
                data.password.trim()
            );
            const firebaseUser = userCredential.user;

            const newUserData = {
                nombre: data.nombre.trim(),
                email: data.email.trim().toLowerCase(),
                telefono: data.telefono?.trim() || '',
                cargo: data.cargo?.trim() || '',
                institucion: data.institucion?.trim() || '',
                rol: 'publico',
                permisos: [],
                createdAt: serverTimestamp()
            };

            // Guardar en Firestore
            await setDoc(doc(db, 'usuarios', firebaseUser.uid), newUserData);

            return { success: true };
        } catch (error) {
            console.error('Error en registro:', error);
            return {
                success: false,
                message: translateAuthError(error.code || error.message)
            };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            return { success: true };
        } catch (error) {
            console.error('Error en logout:', error);
            return { success: false, message: error.message };
        }
    };

    const changePassword = async (oldPassword, newPassword) => {
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) throw new Error("No hay usuario autenticado.");

            // Reautenticar primero por seguridad
            const credential = EmailAuthProvider.credential(firebaseUser.email, oldPassword);
            await reauthenticateWithCredential(firebaseUser, credential);

            // Actualizar contraseña en Auth
            await updatePassword(firebaseUser, newPassword);

            // Actualizar Firestore
            const userRef = doc(db, 'usuarios', firebaseUser.uid);
            await updateDoc(userRef, {
                debeCambiarPassword: false,
                updatedAt: serverTimestamp()
            });

            // Actualizar el estado local del usuario
            setUser(prev => ({
                ...prev,
                debeCambiarPassword: false
            }));

            return { success: true };
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            return {
                success: false,
                message: translateAuthError(error.code || error.message)
            };
        }
    };

    const can = (permiso) => {
        if (!user) return false;
        return user.permisos?.includes(permiso) || false;
    };

    const isRole = (rol) => {
        if (!user) return false;
        return user.rol === rol;
    };

    const mustChangePassword = user?.debeCambiarPassword === true;

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, can, isRole, mustChangePassword, changePassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return ctx;
}

