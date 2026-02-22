import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  role: "owner" | "customer" | null;
  loading: boolean;
  signIn: (email: string, password: string, role: "owner" | "customer") => Promise<void>;
  signUp: (email: string, password: string, role: "owner" | "customer") => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"owner" | "customer" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get custom claims to determine role
        // For simplicity, we'll store role in localStorage after initial login
        // In production, use Firebase Custom Claims
        const storedRole = localStorage.getItem(`user_role_${firebaseUser.uid}`);
        if (storedRole === "owner" || storedRole === "customer") {
          setRole(storedRole);
        } else {
          // Default to customer if no role stored
          setRole("customer");
        }
      } else {
        setRole(null);
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, selectedRole: "owner" | "customer") => {
    await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem(`user_role_${auth.currentUser?.uid}`, selectedRole);
    setRole(selectedRole);
  };

  const signUp = async (email: string, password: string, selectedRole: "owner" | "customer") => {
    await createUserWithEmailAndPassword(auth, email, password);
    localStorage.setItem(`user_role_${auth.currentUser?.uid}`, selectedRole);
    setRole(selectedRole);
  };

  const logout = async () => {
    if (user) {
      localStorage.removeItem(`user_role_${user.uid}`);
    }
    await signOut(auth);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
