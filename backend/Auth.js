import { auth } from "./Firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";


export const register = async (email, password, setUser) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user); // Save user state
      return userCredential.user;
    } catch (error) {
      throw error; // Handle errors in the signup component
    }
  };
  
  // Function to log in an existing user
  export const login = async (email, password, setUser) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };
  
  // Function to check if an email is already in use
  export const isEmailInUse = async (email) => {
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      return signInMethods.length > 0;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  export const logOut = async (setUser) => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

