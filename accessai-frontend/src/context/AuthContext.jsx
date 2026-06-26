import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import API from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]                     = useState(null);
  const [disabilityType, setDisabilityType] = useState(null);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const res = await API.get(`/users/${firebaseUser.uid}`);
          setDisabilityType(res.data.user.disabilityType);
        } catch (e) {
          console.error("Could not load user profile:", e);
        }
      } else {
        setUser(null);
        setDisabilityType(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setDisabilityType(null);
  };

  return (
    <AuthContext.Provider value={{ user, disabilityType, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);