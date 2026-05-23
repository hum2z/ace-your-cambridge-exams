import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const savePaperToFirebase = async (paper) => {
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
