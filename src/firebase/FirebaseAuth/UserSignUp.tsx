import { updateProfile, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

// SignUp users using their Email and Password
export const emailPasswordSignUp = async (name: string, mail: string, pass: string) => {
  const res = await createUserWithEmailAndPassword(auth, mail, pass)
    .then(async (res) => {
      const data = {
        uid: res.user.uid,
        email: res.user.email,
      };

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      return data;
    })
    .catch((err) => {
      return err.message;
    });

  return res;
};

export const updateName = async (nameOne: string, nameTwo?: string) => {
  if (!auth.currentUser) throw new Error("No authenticated user");
  const res = await updateProfile(auth.currentUser, {
    displayName: nameOne || nameTwo,
  });

  return res;
};
