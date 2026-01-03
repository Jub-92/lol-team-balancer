import React, { useState } from 'react';
import { Users, Shuffle, Plus, Trash2, Star, Target, X, Download } from 'lucide-react';

const LoLTeamBalancer = () => {
  // === [수정됨] 구글 시트 연동 설정 ===
  const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-tpnQCEhphQPIMWxXyuzsVoEVYjDoizByjRCn8_ET7WmOnlR4wAW8RDPh-Sx3Ak3ZiJ6NRYIcePx6/pub?output=csv";
  // =====================================

  const [tiers, setTiers] = useState({
    '아이언': 1, '브론즈': 2.5, '실버': 4, '골드': 6, '플래티넘': 8.5,
    '에메랄드': 11, '다이아': 15, '마스터 0-199': 25, '마스터 200-399': 30,
    '마스터 400-599': 35, '마스터 600-799': 42, '마스터 800-1000': 50
  });
  
  // 요청하신대로 서폿 가중치 1.0으로 수정된 상태 유지
  const [positionWeights, setPositionWeights] = useState({
    '탑': 1.0, '정글': 1.15, '미드': 1.15, '원딜': 1.05, '서폿': 1.0
  });

  // eslint-disable-next-line no-unused-vars
  const [isLoaded, setIsLoaded] = useState(false);

  // 구글 시트 데이터 가져오기
  React.useEffect(() => {
    const defaultTiers = {
        '아이언': 1, '브론즈': 2.5, '실버': 4, '골드': 6, '플래티넘': 8.5,
        '에메랄드': 11, '다이아': 15, '마스터 0-199': 25, '마스터 200-399': 30,
        '마스터 400-599': 35, '마스터 600-799': 42, '마스터 800-1000': 50
    };
    const defaultPosWeights = {
        '탑': 1.0, '정글': 1.15, '미드': 1.15, '원딜': 1.05, '서폿': 1.0
    };

    // [추가됨] 텍스트 기본값 복사본
    const defaultTextConfig = {
        'META_TITLE': '⚡ 현재 메타 (2025 시즌1)',
        'META_TOP': '📉 탑: 지속적인 아이템 상향으로 후반 캐리력 증가',
        'META_JUNGLE': '🔥 정글: 강력한 오브젝트 컨트롤 능력',
        'META_MID': '⚔️ 미드: 맵 영향력 및 교전 주도권 최상위',
        'META_ADC': '📉 원딜: 후반 캐리력 중요도 증가',
        'META_SUP': '🛡️ 서폿: 로밍/시야 중요하나 팀 밸런스 붕괴 방지용 조정 (1.0)'
    };

    if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL.includes("여기에_구글시트")) {
       console.warn("구글 시트 URL이 설정되지 않았습니다. 기본값을 사용합니다.");
       setIsLoaded(true);
       return;
    }

    fetch(`${GOOGLE_SHEET_URL}&t=${Date.now()}`)
      .then(response => response.text())
      .then(csvText => {
        const newTiers = { ...defaultTiers };
        const newPosWeights = { ...defaultPosWeights };
        const newTextConfig = { ...defaultTextConfig }; // [추가됨]

        csvText.split('\n').forEach(line => {
          const parts = line.split(',').map(part => part ? part.trim().replace(/^"|"$/g, '') : '');
          if (parts.length >= 3) {
             const type = parts[0]; // A열: 타입 (TIER, POS, TEXT)
             const name = parts[1]; // B열: 이름/Key
             const rawValue = parts[2]; // C열: 값 (문자열 상태)

             // [수정됨] 타입에 따라 다르게 파싱
             if (type && name) {
                if (type === 'TEXT') {
                    // TEXT 타입은 숫자 변환 없이 그대로 저장
                    newTextConfig[name] = rawValue;
                } else {
                    // 나머지는 숫자로 변환
                    const value = parseFloat(rawValue);
                    if (!isNaN(value)) {
                        if (type === 'TIER') newTiers[name] = value;
                        if (type === 'POS') newPosWeights[name] = value;
                    }
                }
             }
          }
        });

        setTiers(newTiers);
        setPositionWeights(newPosWeights);
        setTextConfig(newTextConfig); // [추가됨] 적용
        setIsLoaded(true);
        console.log("구글 시트 데이터 로드 완료!");
      })
      .catch(error => {
        console.error("구글 시트 로드 실패:", error);
        setIsLoaded(true);
      });
  }, [GOOGLE_SHEET_URL]);
  // 상태 관리
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTier, setNewPlayerTier] = useState('실버');
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [teamCount, setTeamCount] = useState(2);
  
  // [수정됨] 8팀까지 확장
  const [teams, setTeams] = useState({ 
    team1: [], team2: [], team3: [], team4: [], 
    team5: [], team6: [], team7: [], team8: [] 
  });
  
  const [balanceAttempts, setBalanceAttempts] = useState(0);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [tournamentBracket, setTournamentBracket] = useState(null);
  const [showBracket, setShowBracket] = useState(false);
  const [textConfig, setTextConfig] = useState({
    'META_TITLE': '⚡ 현재 메타 (2025 시즌1)',
    'META_TOP': '📉 탑: 지속적인 아이템 상향으로 후반 캐리력 증가',
    'META_JUNGLE': '🔥 정글: 강력한 오브젝트 컨트롤 능력',
    'META_MID': '⚔️ 미드: 맵 영향력 및 교전 주도권 최상위',
    'META_ADC': '📉 원딜: 후반 캐리력 중요도 증가',
    'META_SUP': '🛡️ 서폿: 로밍/시야 중요하나 팀 밸런스 붕괴 방지용 조정 (1.0)',
  });

  const positions = ['탑', '정글', '미드', '원딜', '서폿'];

  const positionIcons = {
    '탑': '⚔️', '정글': '🌲', '미드': '⭐', '원딜': '🏹', '서폿': '🛡️'
  };

  const tierColors = {
    '아이언': 'bg-gray-600', '브론즈': 'bg-amber-600', '실버': 'bg-gray-400',
    '골드': 'bg-yellow-500', '플래티넘': 'bg-emerald-500', '에메랄드': 'bg-teal-500',
    '다이아': 'bg-blue-500', '마스터 0-199': 'bg-purple-600', '마스터 200-399': 'bg-purple-600',
    '마스터 400-599': 'bg-purple-600', '마스터 600-799': 'bg-purple-600', '마스터 800-1000': 'bg-purple-600'
  };

  // [수정됨] 7, 8팀 색상 추가
  const teamColors = {
    team1: { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-400/30', text: 'text-blue-300', name: '1팀', color: 'blue' },
    team2: { bg: 'from-red-500/20 to-red-600/20', border: 'border-red-400/30', text: 'text-red-300', name: '2팀', color: 'red' },
    team3: { bg: 'from-green-500/20 to-green-600/20', border: 'border-green-400/30', text: 'text-green-300', name: '3팀', color: 'green' },
    team4: { bg: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-400/30', text: 'text-purple-300', name: '4팀', color: 'purple' },
    team5: { bg: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-400/30', text: 'text-orange-300', name: '5팀', color: 'orange' },
    team6: { bg: 'from-pink-500/20 to-pink-600/20', border: 'border-pink-400/30', text: 'text-pink-300', name: '6팀', color: 'pink' },
    team7: { bg: 'from-cyan-500/20 to-cyan-600/20', border: 'border-cyan-400/30', text: 'text-cyan-300', name: '7팀', color: 'cyan' },
    team8: { bg: 'from-slate-500/20 to-slate-600/20', border: 'border-slate-400/30', text: 'text-slate-300', name: '8팀', color: 'slate' }
  };

  // 활성 팀 가져오기 (7,8팀 포함)
  const getActiveTeams = () => {
    const activeTeamKeys = [`team1`, `team2`, `team3`, `team4`, `team5`, `team6`, `team7`, `team8`].slice(0, teamCount);
    return activeTeamKeys.filter(key => teams[key].length > 0);
  };

  // CSV 내보내기 함수
  const exportToCSV = () => {
    const activeTeams = getActiveTeams();
    if (activeTeams.length === 0) {
      alert('내보낼 팀이 없습니다.');
      return;
    }

    let csvContent = '팀,플레이어명,티어,포지션,기본점수,가중치,최종점수\n';
    
    activeTeams.forEach(teamKey => {
      const teamName = teamColors[teamKey].name;
      teams[teamKey].forEach(player => {
        csvContent += `${teamName},${player.name},${player.tier},"${player.positions.join('/')}",${player.baseScore},${player.positionMultiplier},${player.score.toFixed(1)}\n`;
      });
    });

    csvContent += '\n팀별 요약\n';
    csvContent += '팀,총점수,인원수\n';
    activeTeams.forEach(teamKey => {
      const teamName = teamColors[teamKey].name;
      const teamScore = calculateTeamScore(teams[teamKey]);
      const memberCount = teams[teamKey].length;
      csvContent += `${teamName},${teamScore.toFixed(1)},${memberCount}\n`;
    });

    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `롤_내전_팀구성_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const togglePosition = (position) => {
    if (selectedPositions.includes(position)) {
      setSelectedPositions(selectedPositions.filter(p => p !== position));
    } else {
      if (selectedPositions.length < 2) {
        setSelectedPositions([...selectedPositions, position]);
      }
    }
  };

  const addPlayer = () => {
    if (newPlayerName.trim() && selectedPositions.length > 0) {
      const baseScore = tiers[newPlayerTier];
      const positionMultiplier = selectedPositions.reduce((max, pos) => 
        Math.max(max, positionWeights[pos] || 1.0), 1.0
      );
      const finalScore = baseScore * positionMultiplier;

      const newPlayer = {
        id: Date.now(),
        name: newPlayerName.trim(),
        tier: newPlayerTier,
        positions: [...selectedPositions],
        baseScore: baseScore,
        positionMultiplier: positionMultiplier,
        score: finalScore
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName('');
      setSelectedPositions([]);
    }
  };

  const removePlayer = (id) => {
    setPlayers(players.filter(player => player.id !== id));
    const newTeams = { ...teams };
    Object.keys(newTeams).forEach(teamKey => {
      newTeams[teamKey] = newTeams[teamKey].filter(player => player.id !== id);
    });
    setTeams(newTeams);
  };

  const calculateTeamScore = (team) => {
    return team.reduce((sum, player) => sum + player.score, 0);
  };

  const canPlayPosition = (player, position) => {
  return player.positions.includes(position);
  };

  const evaluateTeamPositionBalance = (teamsArray) => {
    let totalPenalty = 0;
    const corePositions = ['탑', '정글', '미드', '원딜', '서폿'];
    
    teamsArray.forEach(team => {
      const positionCoverage = {};
      corePositions.forEach(pos => positionCoverage[pos] = 0);
      
      team.forEach(player => {
        corePositions.forEach(pos => {
          if (canPlayPosition(player, pos)) {
            positionCoverage[pos]++;
          }
        });
      });
      
      corePositions.forEach(pos => {
        if (positionCoverage[pos] === 0) {
          totalPenalty += 100;
        } else if (positionCoverage[pos] > 3) {
          totalPenalty += 15;
        }
      });
      
      const coveredPositions = corePositions.filter(pos => positionCoverage[pos] > 0).length;
      if (coveredPositions === 5) {
        totalPenalty -= 10;
      }
    });
    
    return totalPenalty;
  };

  // 팀 밸런싱 메인 함수
  const balanceTeams = () => {
    if (players.length < teamCount) return;

    let bestBalance = null;
    let bestScore = Infinity;
    const maxAttempts = 5000;
    const playersPerTeam = 5;

    if (players.length > teamCount * 5) {
      alert(`최대 ${teamCount * 5}명까지만 지원됩니다. (팀당 5명)`);
      return;
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      const teamsArray = [];
      
      for (let i = 0; i < teamCount; i++) {
        const start = i * playersPerTeam;
        const end = Math.min(start + playersPerTeam, shuffled.length);
        teamsArray.push(shuffled.slice(start, end));
      }
      
      let remaining = shuffled.slice(teamCount * playersPerTeam);
      let teamIndex = 0;
      while (remaining.length > 0 && teamIndex < teamCount) {
        if (teamsArray[teamIndex].length < 5) {
          teamsArray[teamIndex].push(remaining.shift());
        }
        teamIndex = (teamIndex + 1) % teamCount;
      }
      
      const teamScores = teamsArray.map(team => calculateTeamScore(team));
      const maxScore = Math.max(...teamScores);
      const minScore = Math.min(...teamScores);
      const scoreDifference = maxScore - minScore;
      
      const positionPenalty = evaluateTeamPositionBalance(teamsArray);
      const weightedScoreDifference = scoreDifference * (1 + (maxScore / 100));
      const totalScore = weightedScoreDifference + positionPenalty;
      
      if (totalScore < bestScore) {
        bestScore = totalScore;
        const newTeams = {};
        for (let i = 0; i < teamCount; i++) {
          newTeams[`team${i + 1}`] = teamsArray[i] || [];
        }
        // [수정됨] 사용하지 않는 나머지 팀 빈 배열 처리 (최대 8팀까지)
        for (let i = teamCount; i < 8; i++) {
          newTeams[`team${i + 1}`] = [];
        }
        bestBalance = newTeams;
      }
      
      if (totalScore <= 1) break;
    }

    setTeams(bestBalance);
    setBalanceAttempts(prev => prev + 1);
    
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    const teamScores = Object.keys(bestBalance)
      .filter(key => bestBalance[key].length > 0)
      .map(key => calculateTeamScore(bestBalance[key]));
    const maxScore = Math.max(...teamScores);
    const minScore = Math.min(...teamScores);
    const scoreDifference = Math.round((maxScore - minScore) * 10) / 10;
    
    const newRecord = {
      id: Date.now(),
      timestamp,
      attempt: balanceAttempts + 1,
      teams: JSON.parse(JSON.stringify(bestBalance)),
      teamCount,
      scoreDifference,
      teamScores: teamScores.map(score => Math.round(score * 10) / 10)
    };
    
    setBalanceHistory(prev => [newRecord, ...prev.slice(0, 9)]);
  };

  // [수정됨] 팀 초기화도 8팀 기준으로
  const resetTeams = () => {
    setTeams({ 
      team1: [], team2: [], team3: [], team4: [], 
      team5: [], team6: [], team7: [], team8: [] 
    });
    setTournamentBracket(null);
    setShowBracket(false);
  };

  const loadBalanceResult = (record) => {
    setTeams(record.teams);
    setTeamCount(record.teamCount);
  };

  const clearHistory = () => {
    setBalanceHistory([]);
  };

  const toggleManualMode = () => {
    setIsManualMode(!isManualMode);
    setSelectedPlayer(null);
  };

  const selectPlayerForSwap = (player, currentTeam) => {
    if (!isManualMode) return;
    
    if (selectedPlayer && selectedPlayer.id === player.id) {
      setSelectedPlayer(null);
    } else if (selectedPlayer && selectedPlayer.currentTeam !== currentTeam) {
      swapPlayers(selectedPlayer, { ...player, currentTeam });
      setSelectedPlayer(null);
    } else {
      setSelectedPlayer({ ...player, currentTeam });
    }
  };

  const swapPlayers = (player1, player2) => {
    const newTeams = { ...teams };
    newTeams[player1.currentTeam] = newTeams[player1.currentTeam].filter(p => p.id !== player1.id);
    newTeams[player2.currentTeam].push(player1);
    newTeams[player2.currentTeam] = newTeams[player2.currentTeam].filter(p => p.id !== player2.id);
    newTeams[player1.currentTeam].push(player2);
    setTeams(newTeams);
  };

  const movePlayerToTeam = (player, fromTeam, toTeam) => {
    if (!isManualMode || fromTeam === toTeam) return;
    if (teams[toTeam].length >= 5) {
      alert('각 팀은 최대 5명까지만 가능합니다.');
      return;
    }
    const newTeams = { ...teams };
    newTeams[fromTeam] = newTeams[fromTeam].filter(p => p.id !== player.id);
    newTeams[toTeam].push(player);
    setTeams(newTeams);
    setSelectedPlayer(null);
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 토너먼트 대진표 생성
  const generateTournamentBracket = () => {
    const activeTeams = getActiveTeams();
    if (activeTeams.length < 2) return;

    const shuffledTeamKeys = shuffleArray(activeTeams);
    const teamsList = shuffledTeamKeys.map(teamKey => ({
      id: teamKey,
      name: teamColors[teamKey].name,
      color: teamColors[teamKey].color,
      players: teams[teamKey]
    }));

    let bracket = {};
    
    if (teamsList.length === 2) {
      bracket = {
        type: 'single',
        final: { team1: teamsList[0], team2: teamsList[1], winner: null }
      };
    } else if (teamsList.length === 3) {
      bracket = {
        type: 'round_robin_3',
        matches: [
          { id: 1, team1: teamsList[0], team2: teamsList[1], winner: null },
          { id: 2, team1: teamsList[1], team2: teamsList[2], winner: null },
          { id: 3, team1: teamsList[0], team2: teamsList[2], winner: null }
        ]
      };
    } else if (teamsList.length === 4) {
      bracket = {
        type: 'tournament_4',
        semifinals: [
          { id: 'sf1', team1: teamsList[0], team2: teamsList[1], winner: null },
          { id: 'sf2', team1: teamsList[2], team2: teamsList[3], winner: null }
        ],
        final: { id: 'final', team1: null, team2: null, winner: null }
      };
    } else {
      // 5팀 이상일 경우 모두 리그전 형식으로 처리 (7,8팀 포함)
      const matches = [];
      let matchId = 1;
      const allMatches = [];
      for (let i = 0; i < teamsList.length; i++) {
        for (let j = i + 1; j < teamsList.length; j++) {
          allMatches.push([teamsList[i], teamsList[j]]);
        }
      }
      const shuffledMatches = shuffleArray(allMatches);
      shuffledMatches.forEach(([team1, team2]) => {
        matches.push({ id: matchId++, team1: team1, team2: team2, winner: null });
      });
      bracket = { type: 'round_robin', matches: matches };
    }

    setTournamentBracket(bracket);
    setShowBracket(true);
  };

  const updateMatchResult = (matchId, winnerId) => {
    if (!tournamentBracket) return;

    const newBracket = { ...tournamentBracket };
    
    if (newBracket.type === 'single') {
      newBracket.final.winner = winnerId;
    } else if (newBracket.type === 'round_robin' || newBracket.type === 'round_robin_3') {
      const match = newBracket.matches.find(m => m.id === matchId);
      if (match) match.winner = winnerId;
    } else if (newBracket.type === 'tournament_4') {
      if (matchId === 'sf1' || matchId === 'sf2') {
        const match = newBracket.semifinals.find(m => m.id === matchId);
        if (match) {
          match.winner = winnerId;
          if (matchId === 'sf1') {
            newBracket.final.team1 = winnerId === match.team1.id ? match.team1 : match.team2;
          } else {
            newBracket.final.team2 = winnerId === match.team1.id ? match.team1 : match.team2;
          }
        }
      } else if (matchId === 'final') {
        newBracket.final.winner = winnerId;
      }
    }

    setTournamentBracket(newBracket);
  };

  const getBalanceAnalysis = () => {
    const activeTeamKeys = getActiveTeams();
    if (activeTeamKeys.length === 0) return null;
    
    const teamScores = activeTeamKeys.map(key => calculateTeamScore(teams[key]));
    const maxScore = Math.max(...teamScores);
    const minScore = Math.min(...teamScores);
    const scoreDifference = Math.round((maxScore - minScore) * 10) / 10;
    
    return { scoreDifference, teamScores };
  };

  const balanceAnalysis = getBalanceAnalysis();

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 min-h-screen">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Users className="text-yellow-400" />
            롤 내전 팀 밸런싱 (Max 8팀)
          </h1>
          <p className="text-blue-200">한국 서버 실제 티어 분포를 반영한 정교한 팀 밸런싱</p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">팀 설정</h2>
          <div className="flex items-center gap-4">
            <label className="text-white">팀 개수:</label>
            <select
              value={teamCount}
              onChange={(e) => setTeamCount(Number(e.target.value))}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value={2} className="bg-gray-800">2팀</option>
              <option value={3} className="bg-gray-800">3팀</option>
              <option value={4} className="bg-gray-800">4팀</option>
              <option value={5} className="bg-gray-800">5팀</option>
              <option value={6} className="bg-gray-800">6팀</option>
              {/* [수정됨] 7, 8팀 옵션 추가 */}
              <option value={7} className="bg-gray-800">7팀</option>
              <option value={8} className="bg-gray-800">8팀</option>
            </select>
            <span className="text-white/60 text-sm">
              (최대 {teamCount * 5}명, 팀당 5명)
            </span>
          </div>
        </div>

        {/* 현재 메타 정보 표시 (수정됨: 서폿 가중치 1.0 반영 UI) */}
        <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            {/* [수정됨] 엑셀에서 제목 가져오기 */}
            {textConfig.META_TITLE}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-blue-200 text-sm mb-2">포지션별 영향력</p>
              <div className="space-y-2">
                {/* [수정됨] positionWeights에 'ALL'이 섞여 있어도, positions 배열 순서대로 5개만 보여줌 */}
                {positions.map((pos) => {
                  const weight = positionWeights[pos] || 1.0; // 값이 없으면 기본 1.0
                  return (
                    <div key={pos} className="flex justify-between items-center">
                      <span className="text-white/80 flex items-center gap-2">
                        <span>{positionIcons[pos]}</span>
                        {pos}
                      </span>
                      <span className={`font-medium ${
                        weight > 1.1 ? 'text-green-400' : 
                        weight < 0.98 ? 'text-red-400' : 'text-white/80'
                      }`}>
                        x{weight}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-2">메타 특징</p>
              <div className="text-white/70 text-sm space-y-1">
                <p>{textConfig.META_TOP}</p>
                <p>{textConfig.META_JUNGLE}</p>
                <p>{textConfig.META_MID}</p>
                <p>{textConfig.META_ADC}</p>
                <p>{textConfig.META_SUP}</p>          
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="text-green-400" />
            플레이어 추가
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="플레이어 이름"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <select
                value={newPlayerTier}
                onChange={(e) => setNewPlayerTier(e.target.value)}
                className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {Object.keys(tiers).map(tier => (
                  <option key={tier} value={tier} className="bg-gray-800">{tier}</option>
                ))}
              </select>
            </div>
            
            <div>
              <p className="text-white mb-2">포지션 선택 (최대 2개):</p>
              <div className="flex flex-wrap gap-2">
                {positions.map(position => (
                  <button
                    key={position}
                    onClick={() => togglePosition(position)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      selectedPositions.includes(position)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    <span>{positionIcons[position]}</span>
                    {position}
                    {selectedPositions.includes(position) && (
                      <X size={16} />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={addPlayer}
              disabled={!newPlayerName.trim() || selectedPositions.length === 0}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              플레이어 추가
            </button>
          </div>
        </div>

        {players.length > 0 && (
          <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">현재 플레이어 티어 분포</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.keys(tiers).map(tier => {
                const count = players.filter(p => p.tier === tier).length;
                const totalScore = players.filter(p => p.tier === tier).reduce((sum, p) => sum + p.score, 0);
                return count > 0 ? (
                  <div key={tier} className="bg-white/10 rounded-lg p-3 text-center border border-white/10">
                    <div className={`w-4 h-4 rounded-full ${tierColors[tier]} mx-auto mb-2`}></div>
                    <div className="text-white font-medium text-sm">{tier}</div>
                    <div className="text-white/80 text-xs">{count}명</div>
                    <div className="text-white/60 text-xs">{totalScore.toFixed(1)}점</div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {players.length > 0 && (
          <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="text-purple-400" />
              포지션별 현황
            </h2>
            <div className="grid grid-cols-6 gap-4">
              {positions.map(position => {
                const count = players.filter(p => canPlayPosition(p, position)).length;
                return (
                  <div key={position} className="bg-white/10 rounded-lg p-4 text-center border border-white/10">
                    <div className="text-2xl mb-2">{positionIcons[position]}</div>
                    <div className="text-white font-medium">{position}</div>
                    <div className="text-white/60 text-sm">{count}명</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
          <h2 className="text-2xl font-semibold text-white mb-4">
            플레이어 목록 ({players.length}/{teamCount * 5}명)
          </h2>
          {players.length === 0 ? (
            <p className="text-white/60 text-center py-8">플레이어를 추가해주세요</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map(player => (
                <div key={player.id} className="bg-white/10 rounded-lg p-4 flex items-center justify-between border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${tierColors[player.tier]}`}></div>
                    <div className="flex gap-1">
                      {player.positions.map(pos => (
                        <span key={pos} className="text-lg">{positionIcons[pos]}</span>
                      ))}
                    </div>
                    <div>
                      <p className="text-white font-medium">{player.name}</p>
                      <p className="text-white/60 text-sm">{player.tier} • {player.positions.join(', ')}</p>
                      <p className="text-white/50 text-xs">
                        {player.baseScore} × {player.positionMultiplier} = {player.score.toFixed(1)}점
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{player.score.toFixed(1)}점</p>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="text-red-400 hover:text-red-300 transition-colors mt-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {players.length >= teamCount && (
          <div className="text-center mb-8">
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={balanceTeams}
                disabled={players.length > teamCount * 5}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center gap-3 shadow-lg"
              >
                <Shuffle size={24} />
                {teamCount}팀 밸런싱 ({balanceAttempts}회)
              </button>
              {getActiveTeams().length > 0 && (
                <>
                  <button
                    onClick={resetTeams}
                    className="px-6 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                  >
                    초기화
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    <Download size={20} />
                    CSV 내보내기
                  </button>
                </>
              )}
              {getActiveTeams().length > 0 && (
                <button
                  onClick={toggleManualMode}
                  className={`px-6 py-4 rounded-xl font-medium transition-colors ${
                    isManualMode 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isManualMode ? '수동 조정 완료' : '수동 조정 모드'}
                </button>
              )}
              {getActiveTeams().length >= 2 && !isManualMode && (
                <button
                  onClick={generateTournamentBracket}
                  className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  🏆 대진표 생성 (랜덤)
                </button>
              )}
              {showBracket && (
                <button
                  onClick={() => setShowBracket(!showBracket)}
                  className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                >
                  {showBracket ? '대진표 숨기기' : '대진표 보기'}
                </button>
              )}
            </div>
            {players.length > teamCount * 5 && (
              <p className="text-red-400 text-sm mt-2">최대 {teamCount * 5}명까지만 지원됩니다 (팀당 5명)</p>
            )}
          </div>
        )}

        {isManualMode && (
          <div className="bg-orange-500/20 border border-orange-400/30 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🔧</span>
              <h3 className="text-lg font-semibold text-orange-200">수동 조정 모드</h3>
            </div>
            <div className="text-orange-100 text-sm space-y-1">
              <p>• <strong>플레이어 교환:</strong> 서로 다른 팀의 플레이어를 차례로 클릭하여 교환</p>
              <p>• <strong>팀 이동:</strong> 플레이어를 다른 팀 영역으로 드래그하여 이동</p>
              <p>• <strong>선택 해제:</strong> 선택된 플레이어를 다시 클릭하면 선택 해제</p>
              {selectedPlayer && (
                <p className="text-yellow-200 font-medium">
                  ⚡ 선택됨: {selectedPlayer.name} ({teamColors[selectedPlayer.currentTeam].name})
                </p>
              )}
            </div>
          </div>
        )}

        {isManualMode && getActiveTeams().length > 0 && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              🔄 빠른 이동 도구
            </h3>
            <div className={`grid gap-4 ${
              teamCount <= 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-4 md:grid-cols-8'
            }`}>
              {getActiveTeams().map(teamKey => {
                const teamColor = teamColors[teamKey];
                return (
                  <div key={teamKey} className="text-center">
                    <p className={`${teamColor.text} font-medium mb-2`}>{teamColor.name}</p>
                    <div className="space-y-2">
                      {teams[teamKey].map(player => (
                        <button
                          key={player.id}
                          onClick={() => selectPlayerForSwap(player, teamKey)}
                          className={`w-full p-2 rounded text-sm transition-colors ${
                            selectedPlayer && selectedPlayer.id === player.id
                              ? 'bg-yellow-400 text-black font-medium'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {player.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {selectedPlayer && (
              <div className="mt-6 p-4 bg-yellow-400/20 border border-yellow-400/30 rounded-lg">
                <p className="text-yellow-200 text-center">
                  <strong>{selectedPlayer.name}</strong>을(를) 다른 팀 플레이어와 교환하거나, 
                  다른 팀의 빈 슬롯을 클릭하여 이동하세요.
                </p>
                <div className="flex justify-center gap-4 mt-3 flex-wrap">
                  {getActiveTeams()
                    .filter(teamKey => teamKey !== selectedPlayer.currentTeam)
                    .map(teamKey => {
                      const teamColor = teamColors[teamKey];
                      return (
                        <button
                          key={teamKey}
                          onClick={() => movePlayerToTeam(selectedPlayer, selectedPlayer.currentTeam, teamKey)}
                          disabled={teams[teamKey].length >= 5}
                          className={`px-4 py-2 rounded font-medium transition-colors ${
                            teams[teamKey].length >= 5
                              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {teamColor.name}로 이동 ({teams[teamKey].length}/5)
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* [수정됨] 팀 결과 그리드 반응형 (8팀 고려) */}
        {getActiveTeams().length > 0 && !showBracket && (
          <div className={`grid gap-6 mb-8 ${
            teamCount === 2 ? 'lg:grid-cols-2' : 
            teamCount === 3 ? 'lg:grid-cols-3' : 
            teamCount === 4 ? 'lg:grid-cols-2 xl:grid-cols-4' :
            teamCount === 5 || teamCount === 6 ? 'lg:grid-cols-2 xl:grid-cols-3' :
            'lg:grid-cols-2 xl:grid-cols-4' // 7, 8팀일 때 4열 배치
          }`}>
            {getActiveTeams().map(teamKey => {
              const team = teams[teamKey];
              const teamColor = teamColors[teamKey];
              const teamScore = calculateTeamScore(team);
              const sortedTeam = [...team].sort((a, b) => b.score - a.score);
              const corePositions = ['탑', '정글', '미드', '원딜', '서폿'];
              const positionCoverage = {};
              corePositions.forEach(pos => {
                positionCoverage[pos] = team.filter(player => canPlayPosition(player, pos)).length;
              });

              return (
                <div key={teamKey} className={`bg-gradient-to-br ${teamColor.bg} rounded-xl p-6 border ${teamColor.border} ${
                  isManualMode ? 'ring-2 ring-white/20 hover:ring-white/40 transition-all cursor-pointer' : ''
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-2xl font-bold ${teamColor.text} flex items-center gap-2`}>
                      <Star className="text-yellow-400" />
                      {teamColor.name}
                      {isManualMode && (
                        <span className="text-sm font-normal text-white/60">
                          ({team.length}/5명)
                        </span>
                      )}
                    </h3>
                    <div className="text-right">
                      <p className={`${teamColor.text} text-sm`}>총 점수</p>
                      <p className={`text-2xl font-bold ${teamColor.text}`}>{teamScore.toFixed(1)}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4 p-3 bg-white/10 rounded-lg">
                    <p className={`${teamColor.text} text-sm mb-2`}>포지션 커버리지</p>
                    <div className="flex gap-2 text-sm flex-wrap">
                      {corePositions.map(pos => (
                        <span key={pos} className={`${positionCoverage[pos] === 0 ? 'text-red-300' : 'text-white/80'}`}>
                          {positionIcons[pos]} {positionCoverage[pos]}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {sortedTeam.map((player, index) => (
                      <div 
                        key={player.id} 
                        className={`bg-white/10 rounded-lg p-3 flex items-center justify-between border transition-all ${
                          isManualMode 
                            ? `cursor-pointer hover:bg-white/20 ${
                                selectedPlayer && selectedPlayer.id === player.id 
                                  ? 'ring-2 ring-yellow-400 border-yellow-400/50 bg-yellow-400/20' 
                                  : 'border-white/20 hover:border-white/40'
                              }`
                            : 'border-white/10'
                        } ${index === 0 ? 'ring-1 ring-yellow-400/30' : ''}`}
                        onClick={() => selectPlayerForSwap(player, teamKey)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${tierColors[player.tier]}`}></div>
                            {index === 0 && <span className="text-yellow-400 text-xs">👑</span>}
                          </div>
                          <span className="text-white font-medium">{player.name}</span>
                          {isManualMode && selectedPlayer && selectedPlayer.id === player.id && (
                            <span className="text-yellow-400 text-sm">✨ 선택됨</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-white/80 text-sm">{player.tier}</p>
                          <p className="text-white/60 text-xs">{player.positions.join('/')}</p>
                          <p className="text-white/60 text-xs">{player.score.toFixed(1)}점</p>
                        </div>
                      </div>
                    ))}
                    
                    {isManualMode && team.length < 5 && (
                      <div className="bg-white/5 border-2 border-dashed border-white/30 rounded-lg p-3 text-center text-white/50 hover:border-white/50 transition-colors">
                        <span className="text-sm">플레이어를 여기로 이동 ({5 - team.length}자리 남음)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {balanceAnalysis && !showBracket && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">밸런스 분석</h3>
            <div className="grid md:grid-cols-2 gap-6 text-center">
              <div>
                <p className="text-white/60 text-sm">최대 점수 차이</p>
                <p className="text-2xl font-bold text-white">{balanceAnalysis.scoreDifference}</p>
                <p className={`text-sm font-medium ${
                  balanceAnalysis.scoreDifference === 0 ? 'text-green-400' :
                  balanceAnalysis.scoreDifference <= 2 ? 'text-blue-400' :
                  balanceAnalysis.scoreDifference <= 5 ? 'text-yellow-400' :
                  balanceAnalysis.scoreDifference <= 10 ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {balanceAnalysis.scoreDifference === 0 ? '완벽' :
                   balanceAnalysis.scoreDifference <= 2 ? '우수' :
                   balanceAnalysis.scoreDifference <= 5 ? '양호' :
                   balanceAnalysis.scoreDifference <= 10 ? '보통' : '차이큼'}
                </p>
              </div>
              
              <div>
                <p className="text-white/60 text-sm">각 팀 점수</p>
                <div className="flex justify-center gap-4 mt-2 flex-wrap">
                  {balanceAnalysis.teamScores.map((score, index) => (
                    <div key={index} className="text-center">
                      <p className="text-lg font-bold text-white">{score.toFixed(1)}</p>
                      <p className="text-xs text-white/60">{teamColors[`team${index + 1}`].name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-white/70 text-sm">
                💡 한국 서버 실제 티어 분포 반영: 상위 티어일수록 점수 격차가 더 큽니다
              </p>
            </div>
          </div>
        )}

        {/* 토너먼트 대진표 */}
        {showBracket && tournamentBracket && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
                🏆 대진표 ({tournamentBracket.type.includes('round_robin') ? '리그전' : '토너먼트'})
              </h3>
              <button
                onClick={() => setShowBracket(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 단일 경기 (2팀) */}
            {tournamentBracket.type === 'single' && (
              <div className="text-center">
                <div className="bg-white/10 rounded-lg p-6 max-w-md mx-auto">
                  <h4 className="text-lg font-semibold text-white mb-4">결승전</h4>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => updateMatchResult('final', tournamentBracket.final.team1.id)}
                      className={`px-4 py-2 rounded font-medium transition-colors ${
                        tournamentBracket.final.winner === tournamentBracket.final.team1.id
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {tournamentBracket.final.team1.name}
                    </button>
                    <span className="text-white mx-4">VS</span>
                    <button
                      onClick={() => updateMatchResult('final', tournamentBracket.final.team2.id)}
                      className={`px-4 py-2 rounded font-medium transition-colors ${
                        tournamentBracket.final.winner === tournamentBracket.final.team2.id
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {tournamentBracket.final.team2.name}
                    </button>
                  </div>
                  {tournamentBracket.final.winner && (
                    <p className="text-green-400 font-bold mt-4">
                      🏆 우승: {teamColors[tournamentBracket.final.winner].name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 리그전 (3팀, 5-8팀) */}
            {(tournamentBracket.type === 'round_robin' || tournamentBracket.type === 'round_robin_3') && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 text-center">
                   풀리그 ({tournamentBracket.matches.length}경기)
                </h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tournamentBracket.matches.map(match => (
                    <div key={match.id} className="bg-white/10 rounded-lg p-4">
                      <p className="text-white/60 text-sm text-center mb-3">경기 {match.id}</p>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => updateMatchResult(match.id, match.team1.id)}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            match.winner === match.team1.id
                              ? 'bg-green-500 text-white'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {match.team1.name}
                        </button>
                        <span className="text-white mx-2">VS</span>
                        <button
                          onClick={() => updateMatchResult(match.id, match.team2.id)}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            match.winner === match.team2.id
                              ? 'bg-green-500 text-white'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {match.team2.name}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 bg-white/10 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-3">현재 순위</h5>
                  <div className="space-y-2">
                    {(() => {
                      const standings = {};
                      getActiveTeams().forEach(teamKey => {
                        standings[teamKey] = { wins: 0, losses: 0, name: teamColors[teamKey].name };
                      });
                      
                      tournamentBracket.matches.forEach(match => {
                        if (match.winner) {
                          standings[match.winner].wins++;
                          const loser = match.winner === match.team1.id ? match.team2.id : match.team1.id;
                          standings[loser].losses++;
                        }
                      });
                      
                      return Object.entries(standings)
                        .sort(([,a], [,b]) => b.wins - a.wins || a.losses - b.losses)
                        .map(([teamId, stats], index) => (
                          <div key={teamId} className="flex justify-between items-center text-white/80">
                            <span>{index + 1}. {stats.name}</span>
                            <span>{stats.wins}승 {stats.losses}패</span>
                          </div>
                        ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* 4팀 토너먼트 */}
            {tournamentBracket.type === 'tournament_4' && (
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4 text-center">준결승</h4>
                    <div className="space-y-4">
                      {tournamentBracket.semifinals.map(match => (
                        <div key={match.id} className="bg-white/10 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => updateMatchResult(match.id, match.team1.id)}
                              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                                match.winner === match.team1.id
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white/10 text-white hover:bg-white/20'
                              }`}
                            >
                              {match.team1.name}
                            </button>
                            <span className="text-white mx-2">VS</span>
                            <button
                              onClick={() => updateMatchResult(match.id, match.team2.id)}
                              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                                match.winner === match.team2.id
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white/10 text-white hover:bg-white/20'
                              }`}
                            >
                              {match.team2.name}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4 text-center">결승</h4>
                    <div className="bg-white/10 rounded-lg p-6">
                      {tournamentBracket.final.team1 && tournamentBracket.final.team2 ? (
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => updateMatchResult('final', tournamentBracket.final.team1.id)}
                            className={`px-4 py-2 rounded font-medium transition-colors ${
                              tournamentBracket.final.winner === tournamentBracket.final.team1.id
                                ? 'bg-green-500 text-white'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            {tournamentBracket.final.team1.name}
                          </button>
                          <span className="text-white mx-4">VS</span>
                          <button
                            onClick={() => updateMatchResult('final', tournamentBracket.final.team2.id)}
                            className={`px-4 py-2 rounded font-medium transition-colors ${
                              tournamentBracket.final.winner === tournamentBracket.final.team2.id
                                ? 'bg-green-500 text-white'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            {tournamentBracket.final.team2.name}
                          </button>
                        </div>
                      ) : (
                        <p className="text-white/60 text-center">준결승 결과를 기다리는 중...</p>
                      )}
                      {tournamentBracket.final.winner && (
                        <p className="text-green-400 font-bold mt-4 text-center">
                          🏆 우승: {teamColors[tournamentBracket.final.winner].name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {balanceHistory.length > 0 && !showBracket && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">밸런싱 기록</h3>
              <div className="flex gap-2">
                <span className="text-white/60 text-sm">{balanceHistory.length}개 기록</span>
                <button
                  onClick={clearHistory}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  전체 삭제
                </button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {balanceHistory.map((record) => (
                <div key={record.id} className="bg-white/10 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <span className="text-white font-medium">#{record.attempt}회</span>
                      <span className="text-white/60 text-sm">{record.timestamp}</span>
                      <span className="text-white/60 text-sm">{record.teamCount}팀</span>
                    </div>
                    <button
                      onClick={() => loadBalanceResult(record)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                    >
                      불러오기
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-white/60 text-sm">점수 차이: </span>
                      <span className={`font-medium ${
                        record.scoreDifference <= 2 ? 'text-green-400' :
                        record.scoreDifference <= 5 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {record.scoreDifference}
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="text-white/60 text-sm">팀 점수: </span>
                      {record.teamScores.map((score, index) => (
                        <span key={index} className="text-white/80 text-sm">
                          {score}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <LoLTeamBalancer />
    </div>
  );
}

export default App;