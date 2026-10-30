import { httpsCallable } from "firebase/functions";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { functions, db } from "../firebase";
import { deleteDocument } from "../CloudFirestore/DeleteData";
import { deleteImage } from "../CloudStorage/UploadImages";

/**
 * Deletes a user account from BOTH Firebase Auth and Firestore 'users' collection.
 * Also deletes all products and product images associated with the user.
 * 
 * @param id Target User UID to delete
 */
export const deleteUserData = async (id: string): Promise<boolean> => {
  try {
    // 1. Query and delete all products listed by this user
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("userId", "==", id));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      
      // Delete the product document from Firestore
      await deleteDoc(doc(db, "products", docSnap.id));
      
      // Delete main product image if it exists
      if (data.image) {
        try {
          await deleteImage(data.image);
        } catch (imgErr) {
          console.error("Failed to delete product main image:", imgErr);
        }
      }
      
      // Delete any gallery images if they exist
      if (data.galleryImages && Array.isArray(data.galleryImages)) {
        for (const imgUrl of data.galleryImages) {
          try {
            await deleteImage(imgUrl);
          } catch (imgErr) {
            console.error("Failed to delete product gallery image:", imgErr);
          }
        }
      }
    });
    
    await Promise.all(deletePromises);
    console.log(`Deleted ${querySnapshot.docs.length} products associated with user ${id}`);
  } catch (productErr) {
    console.error("Failed to delete user's products:", productErr);
  }

  try {
    const deleteAccountFn = httpsCallable<{ targetUid: string }, { success: boolean }>(
      functions,
      "deleteUserAccount"
    );
    await deleteAccountFn({ targetUid: id });
    return true;
  } catch (error) {
    console.error("Failed to delete user via Cloud Function, running client fallback:", error);
    try {
      // Fallback: Delete document directly from Firestore
      await deleteDocument("users", id);
      return true;
    } catch (fallbackErr) {
      console.error("Fallback user document deletion error:", fallbackErr);
      return false;
    }
  }
};
