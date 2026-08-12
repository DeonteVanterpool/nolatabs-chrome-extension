// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import Result from "true-myth/result";
import { ok, err } from "true-myth/result";
import {firebaseError} from "src/libs/logic/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGu4f2p3FAkCvPjCRbpHUsKEhREHAm-TA",
  authDomain: "nolatabs.firebaseapp.com",
  projectId: "nolatabs",
  storageBucket: "nolatabs.firebasestorage.app",
  messagingSenderId: "165015137857",
  appId: "1:165015137857:web:5aa404d641da9cc0b9a0c0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export async function signupFirebase(email: string, password: string): Promise<Result<User, string>> {
    const auth = getAuth();
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        return ok(userCredential.user);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === "auth/email-already-in-use") {
            return signinFirebase(email, password);
        }
        return err(firebaseError(errorCode, errorMessage));
      });
}

export async function signinFirebase(email: string, password: string): Promise<Result<User, string>> {
    const auth = getAuth();
    return signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        return ok(userCredential.user);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        return err(firebaseError(errorCode, errorMessage));
      });
}
