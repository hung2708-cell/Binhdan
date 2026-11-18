// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Thay thế thông số bên dưới bằng cấu hình dự án Firebase của bạn
const firebaseConfig = {
  apiKey: "DAN_API_KEY_CUA_BAN_VAO_DAY",
  authDomain: "TEN_DU_AN.firebaseapp.com",
  databaseURL: "https://TEN_DU_AN-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "TEN_DU_AN",
  storageBucket: "TEN_DU_AN.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxx"
};

// Kiểm tra xem người dùng đã điền config thật chưa
export const isFirebaseConfigured = !firebaseConfig.apiKey.includes("DAN_API_KEY");

let app = null;
let db = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
}

export { db, ref, set, get, update, onValue, push, remove };
