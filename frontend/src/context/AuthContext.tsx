import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface User {
  id: string;
  email: string;
  role: 'donor' | 'ngo' | 'admin';
  name?: string;
  location?: string;
  lat?: number;
  lng?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('token', idToken);
          
          try {
            // Fetch user metadata from Firestore
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              userData.id = firebaseUser.uid;
              setUser(userData);
            } else {
              // New user or metadata missing
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: 'donor', // Default if missing
              });
            }
          } catch (firestoreError) {
            console.error("Firestore data fetch error:", firestoreError);
            // Fallback to minimal user object to prevent redirect loops
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'donor',
            });
          }
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
        }
      } catch (authError) {
        console.error("Auth state change error:", authError);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, token, login: () => {}, logout, loading }}>
        {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
