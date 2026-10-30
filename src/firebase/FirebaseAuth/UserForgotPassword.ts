import {
  sendPasswordResetEmail,
  EmailAuthProvider,
  updatePassword,
  reauthenticateWithCredential,
} from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

export const UserForgotPassword = async (mail: string) => {
  const normalizedEmail = mail.trim().toLowerCase();
  const rawEmail = mail.trim();

  const usersRef = collection(db, "users");
  const qLower = query(usersRef, where("email", "==", normalizedEmail));
  let querySnapshot = await getDocs(qLower);

  if (querySnapshot.empty && rawEmail !== normalizedEmail) {
    const qRaw = query(usersRef, where("email", "==", rawEmail));
    querySnapshot = await getDocs(qRaw);
  }

  if (querySnapshot.empty) {
    throw new Error("auth/user-not-found");
  }

  const res = await sendPasswordResetEmail(auth, mail);
  return res;
};

export const ForgotPassword = async (password: string, newPassword: string) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user");
    }

    // Get the user's credentials and reauthenticate the user
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);

    // Change the user's password
    await updatePassword(currentUser, newPassword);
  } catch (error) {
    console.log(error);
  }
};
