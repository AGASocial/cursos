import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User } from 'firebase/auth';
import { onAuthStateChange } from '../lib/auth';
import { isAdmin as checkIsAdmin, verifyAcademySetup } from '../lib/admin';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  currentAcademy: string | null;
  setIsAdmin: (value: boolean) => void;
  setCurrentAcademy: (value: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  currentAcademy: null,
  setIsAdmin: () => {},
  setCurrentAcademy: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentAcademy, setCurrentAcademy] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      setIsAdmin(false); // Reset admin status
      setCurrentAcademy(null); // Reset current academy
      
      if (user) {
        // First verify academy setup
        const academySetup = await verifyAcademySetup();
        console.log('Academy setup verification:', academySetup);

        if (!academySetup.success) {
          console.error('Academy setup error:', academySetup.error);
          setLoading(false);
          return;
        }

        // Add a small delay to allow Firebase Auth to fully initialize
        setTimeout(async () => {
          try {
            const adminStatus = await checkIsAdmin(user.uid);
            setIsAdmin(adminStatus);
          } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          }
        }, 1000);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, currentAcademy, setIsAdmin, setCurrentAcademy }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);