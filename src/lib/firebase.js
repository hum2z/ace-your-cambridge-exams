import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, doc, getDoc, setDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBGFw-QVH-ySNF07BH0tPr_yAmh_trlagQ",
  authDomain: "studio-8021146580-c5c2b.firebaseapp.com",
  projectId: "studio-8021146580-c5c2b",
  storageBucket: "studio-8021146580-c5c2b.firebasestorage.app",
  messagingSenderId: "878583748075",
  appId: "1:878583748075:web:608dd745af82434409f5ae"
};

let app = null;
let db = null;
let storage = null;
let auth = null;
let googleProvider = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { app, db, storage, auth, googleProvider };

export const getSubscription = async (userId) => {
  if (!userId) return null;
  
  // 1. Try to read directly from Firestore client SDK first
  try {
    if (db) {
      const docRef = doc(db, "subscriptions", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log("Subscription loaded directly from Firestore:", docSnap.data());
        return docSnap.data();
      }
    }
  } catch (dbError) {
    console.warn("Direct Firestore read failed, falling back to API:", dbError);
  }

  // 2. Fallback to server API (may fail if Admin SDK credentials are not configured)
  try {
    const response = await fetch(`/api/get-subscription?uid=${userId}`);
    if (response.ok) {
      const data = await response.json();
      return data.subscription || null;
    }
  } catch (error) {
    // Silently ignore - direct Firestore read above is the primary path
  }
  return null;
};

export const saveSubscription = async (userId, data) => {
  if (!userId || !db) return false;
  try {
    const docRef = doc(db, "subscriptions", userId);
    await setDoc(docRef, data, { merge: true });
    console.log("Subscription saved to Firestore successfully from client.");
    return true;
  } catch (error) {
    console.error("Error saving subscription to Firestore from client:", error);
    return false;
  }
};

export const isSubscriptionActive = (subscription) => {
  if (!subscription || subscription.status !== "active") return false;
  if (!subscription.expiresAt) return false;
  return new Date(subscription.expiresAt) > new Date();
};

export const savePaperToFirebase = async (paper) => {
  if (!db || !storage) {
    console.warn("Firebase is not initialized. Mocking savePaperToFirebase call.");
    return paper.url; // Fallback to original URL
  }
  
  try {
    // 1. Fetch paper from source via server proxy to bypass CORS
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(paper.url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file via proxy: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // 2. Upload to Storage
    const storageRef = ref(storage, `papers/${paper.fileName}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    // 3. Save metadata to Firestore
    await addDoc(collection(db, "papers"), {
      ...paper,
      firebaseUrl: downloadURL,
      savedAt: new Date()
    });
    
    return downloadURL;
  } catch (error) {
    console.error("Firebase Save Error:", error);
    throw error;
  }
};

export const saveTopicalToFirebase = async (userId, topical) => {
  if (!db || !userId) return null;
  try {
    const docRef = await addDoc(collection(db, "papers"), {
      userId,
      type: "topical",
      topic: topical.topic,
      subjectCode: topical.subjectCode,
      years: topical.years,
      qpUrl: topical.qpUrl,
      msUrl: topical.msUrl || null,
      sgUrl: topical.sgUrl || null,
      qpPagesFound: topical.qpPagesFound || 0,
      msPagesFound: topical.msPagesFound || 0,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving topical to Firestore:", error);
    return null;
  }
};

export const deleteTopicalFromFirebase = async (topicalId) => {
  if (!db || !topicalId) return false;
  try {
    await deleteDoc(doc(db, "papers", topicalId));
    return true;
  } catch (error) {
    console.error("Error deleting topical from Firestore:", error);
    return false;
  }
};

export const getSavedTopicals = async (userId) => {
  if (!db || !userId) return [];
  try {
    // Simple query first to avoid requiring composite indexes immediately
    const q = query(
      collection(db, "papers"),
      where("userId", "==", userId),
      where("type", "==", "topical")
    );
    const querySnapshot = await getDocs(q);
    const topicals = [];
    querySnapshot.forEach((doc) => {
      topicals.push({ id: doc.id, ...doc.data() });
    });
    // Sort in memory from newest to oldest
    return topicals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error("Error fetching saved topicals:", error);
    return [];
  }
};


