// js/bracket-engine.js
import { createInitialMatchState } from './pickleball-engine.js';

// Sinh nhánh đấu Loại trực tiếp (Hỗ trợ 4 đội hoặc 8 đội)
export function generateKnockoutMatches(teamsList, settings = {}) {
  const count = teamsList.length;
  if (count < 2) return {};

  // Xác định quy mô nhánh: 4 đội (Bán kết) hoặc 8 đội (Tứ kết)
  const size = count <= 4 ? 4 : 8;
  const padded = [...teamsList];
  while (padded.length < size) {
    padded.push({ name: 'BYE (Miễn đấu)', players: ['-', '-'] });
  }

  const updates = {};
  const tourName = settings.name || 'Bính Dần Open';
  const baseCfg = {
    scoringMode: settings.scoringMode || 'sideout',
    targetScore: settings.targetScore || 11
  };

  // Hàm tạo 1 trận nhánh đấu
  const makeMatch = (id, round, label, tA, tB, nextMatchId = '', nextSlot = '') => {
    const m = createInitialMatchState({
      ...baseCfg,
      id,
      category: `${label} - ${tourName}`,
      teamAName: tA.name,
      teamAPlayers: tA.players || [tA.name, ''],
      teamBName: tB.name,
      teamBPlayers: tB.players || [tB.name, '']
    });
    m.status = 'waiting';
    m.bracketRound = round; // 'QF' | 'SF' | 'F'
    m.bracketLabel = label;
    m.nextMatchId = nextMatchId;
    m.nextSlot = nextSlot;
    updates[`matches/${id}`] = m;
  };

  // Trận Chung kết
  makeMatch('ko_F1', 'F', 'CHUNG KẾT', { name: 'Thắng BK 1' }, { name: 'Thắng BK 2' });

  if (size === 4) {
    makeMatch('ko_SF1', 'SF', 'Bán Kết 1', padded[0], padded[3], 'ko_F1', 'A');
    makeMatch('ko_SF2', 'SF', 'Bán Kết 2', padded[1], padded[2], 'ko_F1', 'B');
  } else {
    // 2 trận Bán kết chờ
    makeMatch('ko_SF1', 'SF', 'Bán Kết 1', { name: 'Thắng TK 1' }, { name: 'Thắng TK 2' }, 'ko_F1', 'A');
    makeMatch('ko_SF2', 'SF', 'Bán Kết 2', { name: 'Thắng TK 3' }, { name: 'Thắng TK 4' }, 'ko_F1', 'B');

    // 4 trận Tứ kết
    makeMatch('ko_QF1', 'QF', 'Tứ Kết 1', padded[0], padded[7], 'ko_SF1', 'A');
    makeMatch('ko_QF2', 'QF', 'Tứ Kết 2', padded[3], padded[4], 'ko_SF1', 'B');
    makeMatch('ko_QF3', 'QF', 'Tứ Kết 3', padded[1], padded[6], 'ko_SF2', 'A');
    makeMatch('ko_QF4', 'QF', 'Tứ Kết 4', padded[2], padded[5], 'ko_SF2', 'B');
  }

  return updates;
}

// Vẽ sơ đồ cây nhánh đấu (Cuộn ngang mượt trên điện thoại)
export function renderBracketHTML(matchesObj) {
  const all = Object.values(matchesObj || {}).filter(m => m.bracketRound);
  if (all.length === 0) {
    return '<p class="text-xs text-gray-500 text-center py-8">Chưa có sơ đồ nhánh đấu loại trực tiếp.</p>';
  }

  const qf = all.filter(m => m.bracketRound === 'QF').sort((a, b) => a.id.localeCompare(b.id));
  const sf = all.filter(m => m.bracketRound === 'SF').sort((a, b) => a.id.localeCompare(b.id));
  const f  = all.filter(m => m.bracketRound === 'F');

  const card = (m) => `
    <div class="w-52 shrink-0 bg-[#131720] border ${m.status === 'live' ? 'border-orange-500' : 'border-gray-800'} rounded-xl overflow-hidden shadow">
      <div class="px-2.5 py-1 bg-white/5 flex justify-between items-center text-[10px]">
        <span class="font-black text-orange-400 uppercase">${m.bracketLabel || m.id}</span>
        <span class="font-bold ${m.status === 'live' ? 'text-emerald-400' : 'text-gray-500'}">
          ${m.status === 'live' ? '● LIVE' : (m.status === 'finished' ? 'XONG' : 'CHỜ')}
        </span>
      </div>
      <div class="divide-y divide-gray-800 text-xs">
        <div class="px-2.5 py-2 flex justify-between items-center ${m.winner === 'A' ? 'bg-emerald-500/10 text-emerald-400 font-black' : 'text-gray-200 font-semibold'}">
          <span class="truncate pr-2">${m.teamA.name}</span>
          <span class="font-black">${m.teamA.score}</span>
        </div>
        <div class="px-2.5 py-2 flex justify-between items-center ${m.winner === 'B' ? 'bg-emerald-500/10 text-emerald-400 font-black' : 'text-gray-200 font-semibold'}">
          <span class="truncate pr-2">${m.teamB.name}</span>
          <span class="font-black">${m.teamB.score}</span>
        </div>
      </div>
    </div>
  `;

  return `
    <div class="flex gap-5 overflow-x-auto pb-4 items-center">
      ${qf.length ? `
        <div class="flex flex-col gap-3">
          <div class="text-[11px] font-black text-gray-400 uppercase text-center">Tứ Kết</div>
          ${qf.map(card).join('')}
        </div>` : ''}
      ${sf.length ? `
        <div class="flex flex-col gap-8">
          <div class="text-[11px] font-black text-orange-400 uppercase text-center">Bán Kết</div>
          ${sf.map(card).join('')}
        </div>` : ''}
      ${f.length ? `
        <div class="flex flex-col gap-4">
          <div class="text-[11px] font-black text-amber-400 uppercase text-center">🏆 Chung Kết</div>
          ${f.map(card).join('')}
        </div>` : ''}
    </div>
  `;
}

