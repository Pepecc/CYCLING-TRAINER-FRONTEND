import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// const firebaseConfig = {
//   apiKey:            process.env.VITE_FIREBASE_API_KEY,
//   authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId:             process.env.VITE_FIREBASE_APP_ID,
// }

const serviceAccount = JSON.parse(process.env.VITE_FIREBASE_SERVICE_ACCOUNT as string);

export const app  = initializeApp(serviceAccount)
export const auth = getAuth(app)
