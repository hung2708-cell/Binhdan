
// js/pickleball-engine.js

export function createInitialMatchState(config = {}) {
  const isDoubles = (config.matchType || 'doubles') === 'doubles';
  const scoringMode = config.scoringMode || 'sideout'; // 'sideout' hoặc 'rally'

  return {
    id: config.id || `match_${Date.now()}`,
    category: config.category || 'Đôi Nam Bính Dần Open',
    courtId: config.courtId || '',
    matchType: isDoubles ? 'doubles' : 'singles',
    scoringMode: scoringMode,
    targetScore: Number(config.targetScore) || 11,
    winByTwo: config.winByTwo !== undefined ? config.winByTwo : true,

    teamA: {
      name: config.teamAName || 'Đội A',
      players: config.teamAPlayers || ['VĐV A1', 'VĐV A2'], // [0]: Ô Phải (Chẵn), [1]: Ô Trái (Lẻ)
      score: 0,
      sets: 0,
      timeouts: 2
    },
    teamB: {
      name: config.teamBName || 'Đội B',
      players: config.teamBPlayers || ['VĐV B1', 'VĐV B2'], // [0]: Ô Phải (Chẵn), [1]: Ô Trái (Lẻ)
      score: 0,
      sets: 0,
      timeouts: 2
    },

    servingTeam: 'A', // 'A' hoặc 'B'
    serverNumber: isDoubles && scoringMode === 'sideout' ? 2 : 1, // Bắt đầu 0-0-2 cho đánh đôi
    sidesSwitched: false,
    status: 'live', // 'waiting' | 'live' | 'finished'
    winner: null,
    history: [],
    updatedAt: Date.now()
  };
}

// Lưu bản sao trạng thái trước khi thay đổi để dùng cho nút Undo
function pushHistory(state) {
  const snapshot = JSON.parse(JSON.stringify(state));
  delete snapshot.history; // Không lồng history vào trong history
  const newHistory = [...(state.history || []), snapshot];
  // Giữ tối đa 30 bước hoàn tác để nhẹ dữ liệu Firebase
  if (newHistory.length > 30) newHistory.shift();
  return newHistory;
}

// Kiểm tra điều kiện thắng set
function checkWinner(state) {
  const { targetScore, winByTwo, teamA, teamB } = state;
  const diff = Math.abs(teamA.score - teamB.score);
  const minDiff = winByTwo ? 2 : 1;

  if (teamA.score >= targetScore && diff >= minDiff) return 'A';
  if (teamB.score >= targetScore && diff >= minDiff) return 'B';
  return null;
}

// Trọng tài bấm GHI ĐIỂM cho đội đang giao (hoặc bất kỳ đội nào ở chế độ Rally)
export function awardPoint(currentState, team) {
  if (currentState.status === 'finished') return currentState;

  const state = JSON.parse(JSON.stringify(currentState));
  state.history = pushHistory(currentState);

  if (state.scoringMode === 'rally') {
    // Luật Rally: Đội nào thắng pha đều được cộng điểm và giành quyền giao
    if (team === 'A') {
      state.teamA.score += 1;
      if (state.servingTeam === 'A' && state.matchType === 'doubles') {
        state.teamA.players.reverse();
      }
      state.servingTeam = 'A';
    } else {
      state.teamB.score += 1;
      if (state.servingTeam === 'B' && state.matchType === 'doubles') {
        state.teamB.players.reverse();
      }
      state.servingTeam = 'B';
    }
    state.serverNumber = 1;
  } else {
    // Luật Side-out chuẩn: Chỉ đội đang giao mới được cộng điểm
    if (team !== state.servingTeam) {
      return faultOrSideOut(currentState);
    }

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

// Trọng tài bấm LỖI GIAO / ĐỔI GIAO (Side-out)
export function faultOrSideOut(currentState) {
  if (currentState.status === 'finished') return currentState;

  const state = JSON.parse(JSON.stringify(currentState));
  state.history = pushHistory(currentState);

  if (state.scoringMode === 'rally') {
    // Trong Rally, lỗi của đội giao nghĩa là đội kia ghi 1 điểm
    const receivingTeam = state.servingTeam === 'A' ? 'B' : 'A';
    return awardPoint(currentState, receivingTeam);
  }

  if (state.matchType === 'doubles') {
    if (state.serverNumber === 1) {
      state.serverNumber = 2; // Chuyển sang người giao số 2 cùng đội
    } else {
      // Đổi giao sang đội đối phương, bắt đầu từ người giao số 1
      state.servingTeam = state.servingTeam === 'A' ? 'B' : 'A';
      state.serverNumber = 1;
    }
  } else {
    // Đánh đơn: Đổi giao ngay
    state.servingTeam = state.servingTeam === 'A' ? 'B' : 'A';
    state.serverNumber = 1;
  }

  state.updatedAt = Date.now();
  return state;
}

// Hoàn tác bước vừa bấm (Undo)
export function undoLastAction(currentState) {
  if (!currentState.history || currentState.history.length === 0) {
    return currentState;
  }
  const history = [...currentState.history];
  const previousState = history.pop();
  previousState.history = history;
  previousState.updatedAt = Date.now();
  return previousState;
}

// Lấy chuỗi đọc điểm chuẩn trọng tài (VD: "8 - 6 - 2")
export function getCallScore(state) {
  const srvScore = state.servingTeam === 'A' ? state.teamA.score : state.teamB.score;
  const rcvScore = state.servingTeam === 'A' ? state.teamB.score : state.teamA.score;

  if (state.matchType === 'doubles' && state.scoringMode === 'sideout') {
    return `${srvScore} - ${rcvScore} - ${state.serverNumber}`;
  }
  return `${srvScore} - ${rcvScore}`;
}

// Kiểm tra cảnh báo Đổi sân & Game Point
export function getMatchAlerts(state) {
  const { targetScore, winByTwo, teamA, teamB, sidesSwitched } = state;
  const switchPoint = Math.ceil(targetScore / 2); // 11->6, 15->8, 21->11
  const maxScore = Math.max(teamA.score, teamB.score);

  const isSwitchSides = !sidesSwitched && maxScore === switchPoint;

  const minDiff = winByTwo ? 1 : 0;
  const isGamePointA = teamA.score >= targetScore - 1 && (teamA.score - teamB.score) >= minDiff;
  const isGamePointB = teamB.score >= targetScore - 1 && (teamB.score - teamA.score) >= minDiff;

  return {
    isSwitchSides,
    isGamePoint: state.status !== 'finished' && (isGamePointA || isGamePointB),
    gamePointTeam: isGamePointA ? 'A' : (isGamePointB ? 'B' : null),
    winner: state.winner
  };
}
