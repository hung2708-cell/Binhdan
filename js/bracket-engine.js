// js/pickleball-engine.js

export function createInitialMatchState(config = {}) {
  const isDoubles = (config.matchType || 'doubles') === 'doubles';
  const scoringMode = config.scoringMode || 'sideout'; // 'sideout' | 'rally'
  const isDreambreaker = Boolean(config.isDreambreaker);

  return {
    id: config.id || `match_${Date.now()}`,
    tieId: config.tieId || '',             // Mã lượt đấu đồng đội (nếu có)
    subMatchIndex: config.subMatchIndex || 0, // 1: Đôi nữ, 2: Đôi nam, 3-4: Đôi nam nữ, 5: Đơn 21đ
    category: config.category || 'Giải Đồng Đội Bính Dần 1986',
    courtId: config.courtId || '',
    stage: config.stage || 'group',        // 'group' (Vòng bảng) | 'knockout' (Loại trực tiếp)

    matchType: isDreambreaker ? 'singles' : (isDoubles ? 'doubles' : 'singles'),
    scoringMode: isDreambreaker ? 'rally' : scoringMode,
    isDreambreaker: isDreambreaker,

    targetScore: Number(config.targetScore) || (isDreambreaker ? 21 : 15),
    winByTwo: config.winByTwo !== undefined ? config.winByTwo : (config.stage === 'knockout' && !isDreambreaker),
    maxScore: config.maxScore ? Number(config.maxScore) : (config.stage === 'knockout' && !isDreambreaker ? 18 : 0),
    switchPoint: Number(config.switchPoint) || (isDreambreaker ? 11 : 8),
    rotateEvery: isDreambreaker ? 4 : 0,   // Đổi cặp VĐV sau mỗi 4 điểm ở trận Đơn 21đ

    teamA: {
      name: config.teamAName || 'Đội A',
      players: config.teamAPlayers || ['VĐV A1', 'VĐV A2'],
      score: 0,
      sets: 0,
      timeouts: 2
    },
    teamB: {
      name: config.teamBName || 'Đội B',
      players: config.teamBPlayers || ['VĐV B1', 'VĐV B2'],
      score: 0,
      sets: 0,
      timeouts: 2
    },

    servingTeam: 'A',
    serverNumber: (!isDreambreaker && isDoubles && scoringMode === 'sideout') ? 2 : 1,
    sidesSwitched: false,
    status: 'live', // 'waiting' | 'live' | 'finished' | 'walkover'
    winner: null,
    history: [],
    updatedAt: Date.now()
  };
}

function pushHistory(state) {
  const snapshot = JSON.parse(JSON.stringify(state));
  delete snapshot.history;
  const newHistory = [...(state.history || []), snapshot];
  if (newHistory.length > 30) newHistory.shift();
  return newHistory;
}

// Kiểm tra điều kiện thắng theo đúng điều lệ:
// - Vòng bảng: chạm 15 điểm (winByTwo = false)
// - Loại trực tiếp: 15 điểm, 14-14 cách biệt 2 điểm, tối đa 18 điểm (maxScore = 18)
// - Đơn quyết định: chạm 21 điểm (Rally)
function checkWinner(state) {
  const { targetScore, winByTwo, maxScore, teamA, teamB } = state;
  const sA = teamA.score;
  const sB = teamB.score;

  // Chạm trần điểm tối đa (VD: 18 điểm) -> thắng ngay
  if (maxScore > 0) {
    if (sA >= maxScore) return 'A';
    if (sB >= maxScore) return 'B';
  }

  const diff = Math.abs(sA - sB);
  const minDiff = winByTwo ? 2 : 1;

  if (sA >= targetScore && diff >= minDiff) return 'A';
  if (sB >= targetScore && diff >= minDiff) return 'B';
  return null;
}

export function awardPoint(currentState, team) {
  if (currentState.status === 'finished') return currentState;

  const state = JSON.parse(JSON.stringify(currentState));
  state.history = pushHistory(currentState);

  if (state.scoringMode === 'rally') {
    if (team === 'A') {
      state.teamA.score += 1;
      if (state.servingTeam === 'A' && state.matchType === 'doubles') state.teamA.players.reverse();
      state.servingTeam = 'A';
    } else {
      state.teamB.score += 1;
      if (state.servingTeam === 'B' && state.matchType === 'doubles') state.teamB.players.reverse();
      state.servingTeam = 'B';
    }
    state.serverNumber = 1;
  } else {
    if (team !== state.servingTeam) return faultOrSideOut(currentState);
    if (team === 'A') {
      state.teamA.score += 1;
      if (state.matchType === 'doubles') state.teamA.players.reverse();
    } else {
      state.teamB.score += 1;
      if (state.matchType === 'doubles') state.teamB.players.reverse();
    }
  }

  const winner = checkWinner(state);
  if (winner) {
    state.status = 'finished';
    state.winner = winner;
    if (winner === 'A') state.teamA.sets += 1;
    else state.teamB.sets += 1;
  }

  state.updatedAt = Date.now();
  return state;
}

export function faultOrSideOut(currentState) {
  if (currentState.status === 'finished') return currentState;

  const state = JSON.parse(JSON.stringify(currentState));
  state.history = pushHistory(currentState);

  if (state.scoringMode === 'rally') {
    const receivingTeam = state.servingTeam === 'A' ? 'B' : 'A';
    return awardPoint(currentState, receivingTeam);
  }

  if (state.matchType === 'doubles') {
    if (state.serverNumber === 1) {
      state.serverNumber = 2;
    } else {
      state.servingTeam = state.servingTeam === 'A' ? 'B' : 'A';
      state.serverNumber = 1;
    }
  } else {
    state.servingTeam = state.servingTeam === 'A' ? 'B' : 'A';
    state.serverNumber = 1;
  }

  state.updatedAt = Date.now();
  return state;
}

export function undoLastAction(currentState) {
  if (!currentState.history || currentState.history.length === 0) return currentState;
  const history = [...currentState.history];
  const previousState = history.pop();
  previousState.history = history;
  previousState.updatedAt = Date.now();
  return previousState;
}

export function getCallScore(state) {
  const srvScore = state.servingTeam === 'A' ? state.teamA.score : state.teamB.score;
  const rcvScore = state.servingTeam === 'A' ? state.teamB.score : state.teamA.score;
  if (state.matchType === 'doubles' && state.scoringMode === 'sideout') {
    return `${srvScore} - ${rcvScore} - ${state.serverNumber}`;
  }
  return `${srvScore} - ${rcvScore}`;
}

export function getMatchAlerts(state) {
  const { targetScore, winByTwo, maxScore, switchPoint, rotateEvery, teamA, teamB, sidesSwitched } = state;
  const sA = teamA.score;
  const sB = teamB.score;
  const maxS = Math.max(sA, sB);
  const totalPoints = sA + sB;

  const sp = switchPoint || Math.ceil(targetScore / 2);
  const isSwitchSides = !sidesSwitched && maxS === sp;

  // Nhắc đổi cặp VĐV sau mỗi 4 điểm ở trận Đơn 21đ (tổng điểm 4, 8, 12, 16...)
  const isRotatePair = Boolean(rotateEvery > 0 && totalPoints > 0 && totalPoints % rotateEvery === 0 && state.status !== 'finished');
  const currentPairSlot = rotateEvery > 0 ? Math.floor(totalPoints / rotateEvery) + 1 : 0;

  const minDiff = winByTwo ? 1 : 0;
  const isCapNextA = maxScore > 0 && sA === maxScore - 1;
  const isCapNextB = maxScore > 0 && sB === maxScore - 1;

  const isGamePointA = isCapNextA || (sA >= targetScore - 1 && (sA - sB) >= minDiff);
  const isGamePointB = isCapNextB || (sB >= targetScore - 1 && (sB - sA) >= minDiff);

  return {
    isSwitchSides,
    isRotatePair,
    currentPairSlot,
    isGamePoint: state.status !== 'finished' && (isGamePointA || isGamePointB),
    gamePointTeam: isGamePointA ? 'A' : (isGamePointB ? 'B' : null),
    winner: state.winner
  };
}
