import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { firebaseConfig } from "../firebase";

/**
 * Creates a user account directly in Firebase Authentication without signing out or
 * disrupting the currently logged-in Admin session, by utilizing an isolated secondary App instance.
 *
 * @param name User's display name
 * @param email User's email
 * @param password User's password (must be >= 6 characters)
 * @returns { uid: string, email: string }
 */
export const createAuthUserByAdmin = async (
  name: string,
  email: string,
  password: string
): Promise<{ uid: string; email: string }> => {
  const secondaryAppName = `admin-create-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
    const newUid = userCredential.user.uid;

    if (name && name.trim()) {
      try {
        await updateProfile(userCredential.user, { displayName: name.trim() });
      } catch (profileErr) {
        console.warn("Failed to set displayName on new Auth user:", profileErr);
      }
    }

    // Sign out from the temporary secondary instance
    try {
      await signOut(secondaryAuth);
    } catch (signOutErr) {
      console.warn("Failed to sign out temporary auth:", signOutErr);
    }

    return {
      uid: newUid,
      email: userCredential.user.email || email.trim(),
    };
  } catch (error: any) {
    console.error("Firebase Auth user creation error:", error);
    let friendlyMessage = error.message || "Failed to create user in Firebase Authentication.";
    if (error.code === "auth/email-already-in-use") {
      friendlyMessage = "This email address is already registered in Firebase Authentication.";
    } else if (error.code === "auth/weak-password") {
      friendlyMessage = "The password is too weak. Please provide at least 6 characters.";
    } else if (error.code === "auth/invalid-email") {
      friendlyMessage = "The email address is improperly formatted.";
    }
    throw new Error(friendlyMessage);
  } finally {
    // Destroy the secondary app instance to prevent memory leaks
    try {
      await deleteApp(secondaryApp);
    } catch (appErr) {
      // ignore
    }
  }
};
