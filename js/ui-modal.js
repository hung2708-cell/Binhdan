// js/ui-modal.js
// Popup dùng chung (Xác nhận & Nhập liệu) đồng bộ giao diện khung nhập PIN Bính Dần 1986

export function uiConfirm({
  title = 'Xác nhận thao tác',
  message = 'Bạn có chắc chắn muốn thực hiện?',
  icon = '⚠️',
  confirmText = 'XÁC NHẬN',
  danger = false
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[9999] bg-[#0c0908]/90 backdrop-blur-md flex items-center justify-center p-4';
    const btnClass = danger
      ? 'bg-gradient-to-r from-red-600 to-rose-700'
      : 'bg-gradient-to-r from-orange-500 to-red-600';

    overlay.innerHTML = `
      <div class="w-full max-w-xs bg-[#17110e] border border-orange-500/40 rounded-2xl p-6 text-center shadow-2xl space-y-4">
        <div class="w-12 h-12 mx-auto rounded-xl ${danger ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'} flex items-center justify-center text-2xl">${icon}</div>
        <div>
          <h2 class="font-black ${danger ? 'text-red-400' : 'text-orange-400'} uppercase text-sm tracking-wide">${title}</h2>
          <p class="text-xs text-amber-200/70 mt-1.5 leading-relaxed">${message}</p>
        </div>
        <button id="uiModalOk" class="w-full py-3 rounded-xl ${btnClass} text-white font-black text-sm shadow-lg active:scale-95 transition">
          ${confirmText}
        </button>
        <button id="uiModalCancel" class="block w-full text-xs text-gray-400 hover:text-white pt-1 font-semibold">
          Hủy bỏ
        </button>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = (result) => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector('#uiModalOk').addEventListener('click', () => close(true));
    overlay.querySelector('#uiModalCancel').addEventListener('click', () => close(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
  });
}

export function uiPrompt({
  title = 'Nhập thông tin',
  subtitle = '',
  placeholder = 'Nhập nội dung...',
  icon = '🏆',
  confirmText = 'XÁC NHẬN'
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[9999] bg-[#0c0908]/90 backdrop-blur-md flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="w-full max-w-xs bg-[#17110e] border border-orange-500/40 rounded-2xl p-6 text-center shadow-2xl space-y-4">
        <div class="w-12 h-12 mx-auto rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-2xl">${icon}</div>
        <div>
          <h2 class="font-black text-orange-400 uppercase text-sm tracking-wide">${title}</h2>
          ${subtitle ? `<p class="text-xs text-amber-200/60 mt-1">${subtitle}</p>` : ''}
        </div>
        <input id="uiPromptInp" type="text" placeholder="${placeholder}"
          class="w-full text-center text-sm font-bold bg-[#0c0908] border border-gray-700 focus:border-orange-500 rounded-xl py-3 px-3 text-white outline-none" />
        <p id="uiPromptErr" class="hidden text-xs text-red-400 font-bold">Vui lòng không để trống!</p>
        <button id="uiModalOk" class="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-sm shadow-lg active:scale-95 transition">
          ${confirmText}
        </button>
        <button id="uiModalCancel" class="block w-full text-xs text-gray-400 hover:text-white pt-1 font-semibold">
          Hủy bỏ
        </button>
      </div>
    `;
    document.body.appendChild(overlay);

    const inp = overlay.querySelector('#uiPromptInp');
    const err = overlay.querySelector('#uiPromptErr');
    const submit = () => {
      const val = inp.value.trim();
      if (!val) { err.classList.remove('hidden'); inp.focus(); return; }
      overlay.remove();
      resolve(val);
    };

    overlay.querySelector('#uiModalOk').addEventListener('click', submit);
    overlay.querySelector('#uiModalCancel').addEventListener('click', () => { overlay.remove(); resolve(null); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(null); } });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    setTimeout(() => inp.focus(), 100);
  });
}
