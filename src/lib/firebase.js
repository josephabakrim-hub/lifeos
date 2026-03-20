import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCMLRpRx1SG-WUrjwC3A9m0aSa88NlhKHc",
  authDomain: "trading-journal-9e805.firebaseapp.com",
  projectId: "trading-journal-9e805",
  storageBucket: "trading-journal-9e805.firebasestorage.app",
  messagingSenderId: "70786197774",
  appId: "1:70786197774:web:3e1f756cda8f4722fa4f5f"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
