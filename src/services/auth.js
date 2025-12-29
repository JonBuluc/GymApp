import { GoogleAuthProvider, signInWithPopup, signOut, updateProfile } from "firebase/auth";
import { auth } from "./firebase";

const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("error en login con google:", error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("error en logout:", error);
  }
};

export const updateUserAlias = async (user, newAlias) => {
  try {
    await updateProfile(user, { displayName: newAlias });
  } catch (error) {
    console.error("error en updateProfile:", error);
    throw error;
  }
};
