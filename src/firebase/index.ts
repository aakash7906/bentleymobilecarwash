// Cloud Firestore Functions
export {
  compoundQuery,
  numOfDocuments,
  getDocumentData,
  getMatchingData,
  getCollectionData,
} from "./CloudFirestore/GetData";
export { updateDocument, updateArray } from "./CloudFirestore/UpdateData";
export { addDocument, createDocument } from "./CloudFirestore/SetData";
export { deleteDocument } from "./CloudFirestore/DeleteData";
// Authentication Functions
export { emailPasswordSignUp } from "./FirebaseAuth/UserSignUp";
export { emailPasswordLogin } from "./FirebaseAuth/UserLogin";
export { UserLogOut } from "./FirebaseAuth/UserLogOut";
export { UserForgotPassword } from "./FirebaseAuth/UserForgotPassword";

// Cloud Storage Functions
export { UploadImage, deleteImage } from "./CloudStorage/UploadImages";

// Core Firebase Instances & Configuration
export * from "./firebase";
export { default } from "./firebase";
