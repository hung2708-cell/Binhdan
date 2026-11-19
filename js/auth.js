// js/auth.js
import { db, ref, get } from './firebase-config.js';

const DEFAULT_PINS = {
  admin: '1986',
  referee: '1234'
};

export async function requirePin(role = 'referee') {
  const storageKey = `bd_pin_unlocked_${role}`;
  if (sessionStorage.getItem(storageKey) === 'true') return true;

  // Lấy mã PIN từ Firebase (nếu BTC có cài riêng), không thì dùng mặc định
  let correctPin = DEFAULT_PINS[role] || '1234';
  try {
    const snap = await get(ref(db, `settings/${role}Pin`));
    if (snap.exists() && snap.val()) {
      correctPin = String(snap.val());
    }
  } catch (e) {
    console.warn('Dùng mã PIN mặc định:', e);
  }

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.id = 'pinLockOverlay';
    overlay.className = 'fixed inset-0 z-[9999] bg-[#090b0f]/95 backdrop-blur-md flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="w-full max-w-xs bg-[#131720] border border-orange-500/40 rounded-2xl p-6 text-center shadow-2xl space-y-4">
        <div class="w-12 h-12 mx-auto rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-2xl">🔒</div>
        <div>
          <h2 class="font-black text-orange-400 uppercase text-sm tracking-wide">
            ${role === 'admin' ? 'Xác thực Ban Tổ Chức' : 'Xác thực Trọng Tài'}
          </h2>
          <p class="text-xs text-gray-400 mt-1">Nhập mã PIN để tiếp tục thao tác</p>
        </div>
        <input id="inpPinCode" type="password" inputmode="numeric" maxlength="6" placeholder="••••"
          class="w-full text-center text-2xl tracking-[0.5em] font-black bg-[#090b0f] border border-gray-700 focus:border-orange-500 rounded-xl py-3 text-white outline-none" />
        <p id="pinError" class="hidden text-xs text-red-400 font-bold">Mã PIN không đúng, thử lại!</p>
        <button id="btnUnlockPin" class="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-sm">
          MỞ KHÓA
        </button>
        <a href="index.html" class="block text-xs text-gray-500 underline pt-1">← Quay lại trang Khán giả</a>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#inpPinCode');
    const err = overlay.querySelector('#pinError');
    const btn = overlay.querySelector('#btnUnlockPin');

    const checkPin = () => {
      if (input.value.trim() === correctPin) {
        sessionStorage.setItem(storageKey, 'true');
        overlay.remove();
        resolve(true);
      } else {
        err.classList.remove('hidden');
        input.value = '';
        input.focus();
      }
    };

    btn.addEventListener('click', checkPin);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkPin(); });
    setTimeout(() => input.focus(), 100);
  });
}

