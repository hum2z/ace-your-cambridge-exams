import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Only initialize Firebase if keys are present and not template placeholders
const isConfigValid = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY" &&
  !firebaseConfig.apiKey.startsWith("YOUR_");

let app = null;
let db = null;
let storage = null;
let auth = null;
let googleProvider = null;

if (isConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.warn("Firebase initialization failed, falling back to mock mode:", error);
  }
} else {
  if (typeof window !== "undefined") {
    console.warn("Firebase API key is not configured. Running client-side auth in Mock Mode.");
  }
}

export { app, db, storage, auth, googleProvider };

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

