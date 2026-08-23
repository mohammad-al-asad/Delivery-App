import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

type UserRole = 'user' | null;

interface AuthContextType {
    userRole: UserRole;
    isLoading: boolean;
    signIn: (role: UserRole) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    userRole: null,
    isLoading: true,
    signIn: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadRole();
    }, []);

    const loadRole = async () => {
        try {
            const storedRole = await AsyncStorage.getItem('userRole');
            if (storedRole === 'user') {
                setUserRole(storedRole);
            }
        } catch (error) {
            console.error('Failed to load user role', error);
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = async (role: UserRole) => {
        try {
            if (role) {
                await AsyncStorage.setItem('userRole', role);
                setUserRole(role);
            }
        } catch (error) {
            console.error('Failed to save user role', error);
        }
    };

    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('userRole');
            setUserRole(null);
            router.replace('/(auth)/sign-in');
        } catch (error) {
            console.error('Failed to sign out', error);
        }
    };

    return (
        <AuthContext.Provider value={{ userRole, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
