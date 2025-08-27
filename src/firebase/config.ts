// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAREKwPBP5uaHij7yhVFBd9ga7IcYXGSAM",
  authDomain: "arquers-club-castelldefels.firebaseapp.com",
  projectId: "arquers-club-castelldefels",
  storageBucket: "arquers-club-castelldefels.firebasestorage.app",
  messagingSenderId: "389388616126",
  appId: "1:389388616126:web:2b2c13e5a3c7b4bc4cb9ef"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Analytics (optional, for tracking visitors)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null)

export default app
