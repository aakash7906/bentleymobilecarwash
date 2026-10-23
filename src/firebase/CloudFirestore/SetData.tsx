import { addDoc, collection, doc, setDoc, type DocumentData, type DocumentReference, type CollectionReference } from "firebase/firestore";
import { db } from "../firebase";

export function cleanUndefined<T extends Record<string, any>>(data: T): Record<string, any> {
  if (!data || typeof data !== "object") return data;
  if (data instanceof Date) return data;
  if (typeof (data as any)?.toDate === "function" || typeof (data as any)?.toMillis === "function") return data;
  if (typeof (data as any)?._methodName === "string") return data;
  if (data.constructor && data.constructor.name !== "Object") return data;

  const clean: Record<string, any> = {};
  Object.entries(data).forEach(([key, val]) => {
    if (val !== undefined) {
      if (
        val &&
        typeof val === "object" &&
        !Array.isArray(val) &&
        !(val instanceof Date) &&
        typeof (val as any)?.toDate !== "function" &&
        typeof (val as any)?.toMillis !== "function" &&
        typeof (val as any)?._methodName !== "string" &&
        (!val.constructor || val.constructor.name === "Object")
      ) {
        clean[key] = cleanUndefined(val);
      } else {
        clean[key] = val;
      }
    }
  });
  return clean;
}

// Add Document to a Collection
export const addDocument = async <T extends DocumentData>(
  collectionName: string, 
  data: T
): Promise<DocumentReference<T> | void> => {
  try {
    const cleaned = cleanUndefined(data as Record<string, any>);
    return await addDoc(collection(db, collectionName) as CollectionReference<T>, {
      ...cleaned,
    } as T);
  } catch (err) {
    console.error("Error adding document:", err);
    throw err;
  }
};

// Create a Document with DocId
export const createDocument = async <T extends DocumentData>(
  collectionName: string, 
  docId: string, 
  data: T
): Promise<void> => {
  try {
    const cleaned = cleanUndefined(data as Record<string, any>);
    await setDoc(doc(db, collectionName, docId), {
      ...cleaned,
    });
    console.log(`Document created successfully with ID: ${docId}`);
  } catch (err) {
    console.error("Error creating document:", err);
    throw err;
  }
};
