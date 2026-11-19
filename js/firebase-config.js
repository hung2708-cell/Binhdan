// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://binhdan-ecca1-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

export const isFirebaseConfigured = true;

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, update, onValue, push, remove };
