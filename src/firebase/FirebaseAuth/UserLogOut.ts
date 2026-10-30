// import { useNavigate } from "react-router-dom";

import { auth } from "../firebase";

// Logout users from the websit
export const UserLogOut =async () => {

// let navigator = useNavigate();
  await auth
    .signOut()
    .then(() => {
      // // window.location.reload();
      sessionStorage.clear();
      // navigator("/")
      return true

    })
    .catch((err) => console.log(err));
};
