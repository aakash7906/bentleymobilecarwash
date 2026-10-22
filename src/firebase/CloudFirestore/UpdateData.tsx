import { arrayUnion, arrayRemove, doc, increment, updateDoc, type DocumentData } from "firebase/firestore";
import { db } from "../firebase";

function cleanUndefined<T extends Record<string, any>>(data: T): Record<string, any> {
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

// Update a document in a Collection
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  try {
    const cleaned = cleanUndefined(data as Record<string, any>);
    await updateDoc(doc(db, collectionName, docId), {
      ...cleaned,
    });
  } catch (err) {
    console.error("Error updating document:", err);
    throw err;
  }
}

// Update arrays of a Collection
export async function updateArray(
  collectionName: string,
  docId: string,
  key: string,
  data: unknown
): Promise<void> {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      [key]: arrayUnion(data),
    });
  } catch (err) {
    console.error("Error updating array:", err);
    throw err;
  }
}

export const incrementDecrement = async (
  collectionName: string, 
  docId: string, 
  key: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      [key]: increment(1),
    });
  } catch (err) {
    console.error("Error incrementing value:", err);
    throw err;
  }
};

export async function pushValueToArrayInDoc<T>(
  collectionName: string,
  docId: string,
  fieldName: string,
  valueToPush: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      [fieldName]: arrayUnion(valueToPush),
    });
  } catch (err) {
    console.error("Error pushing value to array:", err);
    throw err;
  }
}

export async function removeValueFromArrayInDoc<T>(
  collectionName: string,
  docId: string,
  fieldName: string,
  valueToRemove: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      [fieldName]: arrayRemove(valueToRemove),
    });
  } catch (err) {
    console.error("Error removing value from array:", err);
    throw err;
  }
}

export const incrementNumber = async (
  collectionName: string,
  documentId: string, 
  key: string, 
  value: number
): Promise<void> => {
  try {
    await updateDoc(doc(db, collectionName, documentId), {
      [key]: increment(value),
    });
  } catch (err) {
    console.error("Error incrementing number:", err);
    throw err;
  }
};

export const decrementNumber = async (
  collectionName: string,
  documentId: string, 
  key: string, 
  value: number
): Promise<void> => {
  try {
    await updateDoc(doc(db, collectionName, documentId), {
      [key]: increment(-value),
    });
  } catch (err) {
    console.error("Error decrementing number:", err);
    throw err;
  }
};
