import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, doc, getDoc, setDoc } from "firebase/firestore";
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

// Subscription helpers
export const getSubscription = async (userId) => {
  if (!db || !userId) return null;
  try {
    const docRef = doc(db, "subscriptions", userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return null;
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

