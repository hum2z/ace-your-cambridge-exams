import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";
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

// --- AI Tutor chat persistence ---

export const getChatSessions = async (userId) => {
  if (!db || !userId) return [];
  try {
    const q = query(collection(db, "chatSessions"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const sessions = [];
    querySnapshot.forEach((docSnap) => {
      sessions.push({ id: docSnap.id, ...docSnap.data() });
    });
    return sessions.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return [];
  }
};

export const createChatSession = async (userId, title, messages) => {
  if (!db || !userId) return null;
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, "chatSessions"), {
      userId,
      title,
      messages,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating chat session:", error);
    return null;
  }
};

export const updateChatSession = async (sessionId, data) => {
  if (!db || !sessionId) return false;
  try {
    await updateDoc(doc(db, "chatSessions", sessionId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error updating chat session:", error);
    return false;
  }
};

// --- Practice/quiz attempts (self-marked) ---

export const saveQuizAttempt = async (userId, attempt) => {
  if (!db || !userId) return null;
  try {
    const docRef = await addDoc(collection(db, "quizAttempts"), {
      userId,
      subjectCode: attempt.subjectCode,
      topic: attempt.topic,
      topicalId: attempt.topicalId || null,
      rating: attempt.rating, // 1 (struggled) - 3 (nailed it)
      attemptedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving quiz attempt:", error);
    return null;
  }
};

export const getQuizAttempts = async (userId) => {
  if (!db || !userId) return [];
  try {
    const q = query(collection(db, "quizAttempts"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const attempts = [];
    querySnapshot.forEach((docSnap) => {
      attempts.push({ id: docSnap.id, ...docSnap.data() });
    });
    return attempts.sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt));
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    return [];
  }
};

// --- Referrals ---

export const getReferralCount = async (userId) => {
  if (!db || !userId) return 0;
  try {
    const q = query(collection(db, "referrals"), where("referrerUid", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error fetching referral count:", error);
    return 0;
  }
};

// --- Teacher/school classrooms (per-seat bulk pricing) ---

const PRICE_PER_SEAT_FILS = 300; // $3 USD per seat / 30 days (bulk discount vs $5 individual)

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const createClassroom = async (teacherUid, name, seatCount) => {
  if (!db || !teacherUid) return null;
  try {
    const docRef = await addDoc(collection(db, "classrooms"), {
      teacherUid,
      name,
      seatCount,
      pricePerSeatFils: PRICE_PER_SEAT_FILS,
      inviteCode: generateInviteCode(),
      status: "pending",
      studentUids: [],
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating classroom:", error);
    return null;
  }
};

export const getClassroomForTeacher = async (teacherUid) => {
  if (!db || !teacherUid) return null;
  try {
    const q = query(collection(db, "classrooms"), where("teacherUid", "==", teacherUid));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Error fetching classroom:", error);
    return null;
  }
};

export const getClassroom = async (classId) => {
  if (!db || !classId) return null;
  try {
    const docSnap = await getDoc(doc(db, "classrooms", classId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error("Error fetching classroom:", error);
    return null;
  }
};

export const isClassroomActive = (classroom) => {
  if (!classroom || classroom.status !== "active") return false;
  if (!classroom.expiresAt) return false;
  return new Date(classroom.expiresAt) > new Date();
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


