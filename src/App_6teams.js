// PART1
import React, { useState } from 'react'; // useEffect 삭제됨
import { Users, Shuffle, Plus, Trash2, Star, Target, X, Download } from 'lucide-react';

const LoLTeamBalancer = () => {
  // === [수정됨] 구글 시트 연동 설정 ===
  // 여기에 복사한 구글 시트 CSV 링크를 정확히 넣어주세요!
  const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-tpnQCEhphQPIMWxXyuzsVoEVYjDoizByjRCn8_ET7WmOnlR4wAW8RDPh-Sx3Ak3ZiJ6NRYIcePx6/pub?output=csv";
  // =====================================

  const [tiers, setTiers] = useState({
    '아이언': 1, '브론즈': 2.5, '실버': 4, '골드': 6, '플래티넘': 8.5,
    '에메랄드': 11, '다이아': 15, '마스터 0-199': 25, '마스터 200-399': 30,
    '마스터 400-599': 35, '마스터 600-799': 42, '마스터 800-1000': 50
  });
  const [positionWeights, setPositionWeights] = useState({
    '탑': 1.0, '정글': 1.15, '미드': 1.15, '원딜': 1.05, '서폿': 1.0, 'ALL': 1.05
  });
  // eslint-disable-next-line no-unused-vars
  const [isLoaded, setIsLoaded] = useState(false);

  // 구글 시트 데이터 가져오기
  React.useEffect(() => {
    // useEffect 안에서 사용할 기본값 정의 (의존성 경고 해결)
    const defaultTiers = {
        '아이언': 1, '브론즈': 2.5, '실버': 4, '골드': 6, '플래티넘': 8.5,
        '에메랄드': 11, '다이아': 15, '마스터 0-199': 25, '마스터 200-399': 30,
        '마스터 400-599': 35, '마스터 600-799': 42, '마스터 800-1000': 50
    };
    const defaultPosWeights = {
        '탑': 1.0, '정글': 1.15, '미드': 1.15, '원딜': 1.05, '서폿': 1.0, 'ALL': 1.05
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

        csvText.split('\n').forEach(line => {
          const parts = line.split(',').map(part => part ? part.trim().replace(/^"|"$/g, '') : '');
          if (parts.length >= 3) {
             const type = parts[0];
             const name = parts[1];
             const value = parseFloat(parts[2]);

             if (type && name && !isNaN(value)) {
                if (type === 'TIER') newTiers[name] = value;
                if (type === 'POS') newPosWeights[name] = value;
             }
          }
        });

        setTiers(newTiers);
        setPositionWeights(newPosWeights);
        setIsLoaded(true);
        console.log("구글 시트 데이터 로드 완료!");
      })
      .catch(error => {
        console.error("구글 시트 로드 실패:", error);
        setIsLoaded(true);
      });
  }, [GOOGLE_SHEET_URL]); // GOOGLE_SHEET_URL이 변경될 때만 실행

  // 상태 관리
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTier, setNewPlayerTier] = useState('실버');
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState({ team1: [], team2: [], team3: [], team4: [], team5: [], team6: [] });
  const [balanceAttempts, setBalanceAttempts] = useState(0);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [tournamentBracket, setTournamentBracket] = useState(null);
  const [showBracket, setShowBracket] = useState(false);



  const positions = ['탑', '정글', '미드', '원딜', '서폿', 'ALL'];

  const positionIcons = {
    '탑': '⚔️',
    '정글': '🌲',
    '미드': '⭐',
    '원딜': '🏹',
    '서폿': '🛡️',
    'ALL': '🎯'
  };

  const tierColors = {
    '아이언': 'bg-gray-600',
    '브론즈': 'bg-amber-600',
    '실버': 'bg-gray-400',
    '골드': 'bg-yellow-500',
    '플래티넘': 'bg-emerald-500',
    '에메랄드': 'bg-teal-500',
    '다이아': 'bg-blue-500',
    '마스터 0-199': 'bg-purple-600',
    '마스터 200-399': 'bg-purple-600',
    '마스터 400-599': 'bg-purple-600',
    '마스터 600-799': 'bg-purple-600',
    '마스터 800-1000': 'bg-purple-600'
  };

  const teamColors = {
    team1: { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-400/30', text: 'text-blue-300', name: '1팀', color: 'blue' },
    team2: { bg: 'from-red-500/20 to-red-600/20', border: 'border-red-400/30', text: 'text-red-300', name: '2팀', color: 'red' },
    team3: { bg: 'from-green-500/20 to-green-600/20', border: 'border-green-400/30', text: 'text-green-300', name: '3팀', color: 'green' },
    team4: { bg: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-400/30', text: 'text-purple-300', name: '4팀', color: 'purple' },
    team5: { bg: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-400/30', text: 'text-orange-300', name: '5팀', color: 'orange' },
    team6: { bg: 'from-pink-500/20 to-pink-600/20', border: 'border-pink-400/30', text: 'text-pink-300', name: '6팀', color: 'pink' }
  };

  // PART2
  // CSV 내보내기 함수 (한글 인코딩 문제 해결)
  const exportToCSV = () => {
    const activeTeams = getActiveTeams();
    if (activeTeams.length === 0) {
      alert('내보낼 팀이 없습니다.');
      return;
    }

    // CSV 헤더
    let csvContent = '팀,플레이어명,티어,포지션,기본점수,가중치,최종점수\n';
    
    // 각 팀별 데이터 추가
    activeTeams.forEach(teamKey => {
      const teamName = teamColors[teamKey].name;
      teams[teamKey].forEach(player => {
        csvContent += `${teamName},${player.name},${player.tier},"${player.positions.join('/')}",${player.baseScore},${player.positionMultiplier},${player.score.toFixed(1)}\n`;
      });
    });

    // 팀 요약 정보 추가
    csvContent += '\n팀별 요약\n';
    csvContent += '팀,총점수,인원수\n';
    activeTeams.forEach(teamKey => {
      const teamName = teamColors[teamKey].name;
      const teamScore = calculateTeamScore(teams[teamKey]);
      const memberCount = teams[teamKey].length;
      csvContent += `${teamName},${teamScore.toFixed(1)},${memberCount}\n`;
    });

    // UTF-8 BOM 추가하여 한글 인코딩 문제 해결
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    
    // 파일 다운로드
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

  // 포지션 토글
  const togglePosition = (position) => {
    if (selectedPositions.includes(position)) {
      setSelectedPositions(selectedPositions.filter(p => p !== position));
    } else {
      if (selectedPositions.length < 2) {
        setSelectedPositions([...selectedPositions, position]);
      }
    }
  };

  // 플레이어 추가
  const addPlayer = () => {
    if (newPlayerName.trim() && selectedPositions.length > 0) {
      // 메타 가중치를 고려한 점수 계산
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

  // 플레이어 삭제
  const removePlayer = (id) => {
    setPlayers(players.filter(player => player.id !== id));
    const newTeams = { ...teams };
    Object.keys(newTeams).forEach(teamKey => {
      newTeams[teamKey] = newTeams[teamKey].filter(player => player.id !== id);
    });
    setTeams(newTeams);
  };

  // 팀 점수 계산
  const calculateTeamScore = (team) => {
    return team.reduce((sum, player) => sum + player.score, 0);
  };

  // 포지션 플레이 가능 여부
  const canPlayPosition = (player, position) => {
    return player.positions.includes('ALL') || player.positions.includes(position);
  };

  // 팀 포지션 밸런스 평가
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
      
      // 각 포지션이 최소 1명은 갈 수 있는지 확인
      corePositions.forEach(pos => {
        if (positionCoverage[pos] === 0) {
          totalPenalty += 100; // 커버 못하는 포지션이 있으면 매우 큰 패널티
        } else if (positionCoverage[pos] > 3) {
          totalPenalty += 15; // 한 포지션에 너무 많은 사람이 몰려도 패널티
        }
      });
      
      // 팀 내 포지션 다양성 보너스
      const coveredPositions = corePositions.filter(pos => positionCoverage[pos] > 0).length;
      if (coveredPositions === 5) {
        totalPenalty -= 10; // 모든 포지션 커버 시 보너스
      }
    });
    
    return totalPenalty;
  };

  // PART3
  // 팀 밸런싱 메인 함수
  const balanceTeams = () => {
    if (players.length < teamCount) return;

    let bestBalance = null;
    let bestScore = Infinity;
    const maxAttempts = 5000; // 더 많은 시도로 정교한 밸런싱
    const playersPerTeam = 5; // 롤은 팀당 5명 고정

    // 플레이어 수가 팀당 5명 * 팀 수를 초과하면 경고
    if (players.length > teamCount * 5) {
      alert(`최대 ${teamCount * 5}명까지만 지원됩니다. (팀당 5명)`);
      return;
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      const teamsArray = [];
      
      // 팀 나누기 (각 팀당 최대 5명)
      for (let i = 0; i < teamCount; i++) {
        const start = i * playersPerTeam;
        const end = Math.min(start + playersPerTeam, shuffled.length);
        teamsArray.push(shuffled.slice(start, end));
      }
      
      // 남은 플레이어들을 순서대로 분배
      let remaining = shuffled.slice(teamCount * playersPerTeam);
      let teamIndex = 0;
      while (remaining.length > 0 && teamIndex < teamCount) {
        if (teamsArray[teamIndex].length < 5) {
          teamsArray[teamIndex].push(remaining.shift());
        }
        teamIndex = (teamIndex + 1) % teamCount;
      }
      
      // 팀 점수 계산 (소수점 고려)
      const teamScores = teamsArray.map(team => calculateTeamScore(team));
      const maxScore = Math.max(...teamScores);
      const minScore = Math.min(...teamScores);
      const scoreDifference = maxScore - minScore;
      
      // 포지션 밸런스 평가
      const positionPenalty = evaluateTeamPositionBalance(teamsArray);
      
      // 점수 격차에 따른 가중치 적용 (고티어 격차는 더 큰 영향)
      const weightedScoreDifference = scoreDifference * (1 + (maxScore / 100));
      
      // 총점 계산 (점수 차이 + 포지션 패널티)
      const totalScore = weightedScoreDifference + positionPenalty;
      
      if (totalScore < bestScore) {
        bestScore = totalScore;
        const newTeams = {};
        for (let i = 0; i < teamCount; i++) {
          newTeams[`team${i + 1}`] = teamsArray[i] || [];
        }
        // 사용하지 않는 팀은 빈 배열로 설정
        for (let i = teamCount; i < 6; i++) {
          newTeams[`team${i + 1}`] = [];
        }
        bestBalance = newTeams;
      }
      
      if (totalScore <= 1) break; // 매우 좋은 밸런스면 조기 종료
    }

    setTeams(bestBalance);
    setBalanceAttempts(prev => prev + 1);
    
    // 밸런싱 결과를 기록에 저장
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
      teams: JSON.parse(JSON.stringify(bestBalance)), // 깊은 복사
      teamCount,
      scoreDifference,
      teamScores: teamScores.map(score => Math.round(score * 10) / 10)
    };
    
    setBalanceHistory(prev => [newRecord, ...prev.slice(0, 9)]); // 최대 10개까지 저장
  };

// PART4
  // 팀 초기화
  const resetTeams = () => {
    setTeams({ team1: [], team2: [], team3: [], team4: [], team5: [], team6: [] });
    setTournamentBracket(null);
    setShowBracket(false);
  };

  // 밸런싱 결과 불러오기
  const loadBalanceResult = (record) => {
    setTeams(record.teams);
    setTeamCount(record.teamCount);
  };

  // 기록 전체 삭제
  const clearHistory = () => {
    setBalanceHistory([]);
  };

  // 수동 모드 토글
  const toggleManualMode = () => {
    setIsManualMode(!isManualMode);
    setSelectedPlayer(null);
  };

  // 플레이어 교환을 위한 선택
  const selectPlayerForSwap = (player, currentTeam) => {
    if (!isManualMode) return;
    
    if (selectedPlayer && selectedPlayer.id === player.id) {
      // 같은 플레이어를 다시 클릭하면 선택 해제
      setSelectedPlayer(null);
    } else if (selectedPlayer && selectedPlayer.currentTeam !== currentTeam) {
      // 다른 팀의 플레이어와 교환
      swapPlayers(selectedPlayer, { ...player, currentTeam });
      setSelectedPlayer(null);
    } else {
      // 플레이어 선택
      setSelectedPlayer({ ...player, currentTeam });
    }
  };

  // 플레이어 교환
  const swapPlayers = (player1, player2) => {
    const newTeams = { ...teams };
    
    // player1을 team2로 이동
    newTeams[player1.currentTeam] = newTeams[player1.currentTeam].filter(p => p.id !== player1.id);
    newTeams[player2.currentTeam].push(player1);
    
    // player2를 team1로 이동
    newTeams[player2.currentTeam] = newTeams[player2.currentTeam].filter(p => p.id !== player2.id);
    newTeams[player1.currentTeam].push(player2);
    
    setTeams(newTeams);
  };

  // 플레이어를 다른 팀으로 이동
  const movePlayerToTeam = (player, fromTeam, toTeam) => {
    if (!isManualMode || fromTeam === toTeam) return;
    
    // 목적지 팀이 5명이면 이동 불가
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

  // 활성 팀 가져오기
  const getActiveTeams = () => {
    const activeTeamKeys = [`team1`, `team2`, `team3`, `team4`, `team5`, `team6`].slice(0, teamCount);
    return activeTeamKeys.filter(key => teams[key].length > 0);
  };

// PART5
  
// PART5 - 토너먼트 대진표 생성 (토너먼트는 첫 라운드만 랜덤, 리그전은 매 라운드 랜덤)
  // 배열 셔플 함수
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

    // 팀 목록을 랜덤으로 섞기 (모든 형식에서 공통)
    const shuffledTeamKeys = shuffleArray(activeTeams);
    const teamsList = shuffledTeamKeys.map(teamKey => ({
      id: teamKey,
      name: teamColors[teamKey].name,
      color: teamColors[teamKey].color,
      players: teams[teamKey]
    }));

    // 토너먼트 형식 결정
    let bracket = {};
    
    if (teamsList.length === 2) {
      // 단일 경기
      bracket = {
        type: 'single',
        final: { team1: teamsList[0], team2: teamsList[1], winner: null }
      };
    } else if (teamsList.length === 3) {
      // 3팀 리그전 (랜덤 순서)
      bracket = {
        type: 'round_robin_3',
        matches: [
          { id: 1, team1: teamsList[0], team2: teamsList[1], winner: null },
          { id: 2, team1: teamsList[1], team2: teamsList[2], winner: null },
          { id: 3, team1: teamsList[0], team2: teamsList[2], winner: null }
        ]
      };
    } else if (teamsList.length === 4) {
      // 4팀 토너먼트 (준결승만 랜덤, 결승은 승자끼리)
      bracket = {
        type: 'tournament_4',
        semifinals: [
          { id: 'sf1', team1: teamsList[0], team2: teamsList[1], winner: null },
          { id: 'sf2', team1: teamsList[2], team2: teamsList[3], winner: null }
        ],
        final: { id: 'final', team1: null, team2: null, winner: null }
      };
    } else if (teamsList.length === 5 || teamsList.length === 6) {
      // 5-6팀 리그전 (모든 조합 랜덤 순서)
      const matches = [];
      let matchId = 1;
      
      // 모든 가능한 매치업 생성
      const allMatches = [];
      for (let i = 0; i < teamsList.length; i++) {
        for (let j = i + 1; j < teamsList.length; j++) {
          allMatches.push([teamsList[i], teamsList[j]]);
        }
      }
      
      // 매치업 순서를 랜덤으로 섞기
      const shuffledMatches = shuffleArray(allMatches);
      
      shuffledMatches.forEach(([team1, team2]) => {
        matches.push({
          id: matchId++,
          team1: team1,
          team2: team2,
          winner: null
        });
      });
      
      bracket = {
        type: 'round_robin',
        matches: matches
      };
    }

    setTournamentBracket(bracket);
    setShowBracket(true);
  };

  // 경기 결과 업데이트
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
          // 결승 진출자 업데이트
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

  // 밸런스 분석
  const getBalanceAnalysis = () => {
    const activeTeamKeys = getActiveTeams();
    if (activeTeamKeys.length === 0) return null;
    
    const teamScores = activeTeamKeys.map(key => calculateTeamScore(teams[key]));
    const maxScore = Math.max(...teamScores);
    const minScore = Math.min(...teamScores);
    const scoreDifference = Math.round((maxScore - minScore) * 10) / 10; // 소수점 1자리
    
    return { scoreDifference, teamScores };
  };

  const balanceAnalysis = getBalanceAnalysis();

// PART6
  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 min-h-screen">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        
        {/* 메인 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Users className="text-yellow-400" />
            롤 내전 팀 밸런싱
          </h1>
          <p className="text-blue-200">한국 서버 실제 티어 분포를 반영한 정교한 팀 밸런싱</p>
        </div>

        {/* 팀 수 설정 */}
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
            </select>
            <span className="text-white/60 text-sm">
              (최대 {teamCount * 5}명, 팀당 5명)
            </span>
          </div>
        </div>

        {/* 현재 메타 정보 */}
        <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            ⚡ 현재 메타 (2025 시즌1)
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-blue-200 text-sm mb-2">포지션별 영향력</p>
              <div className="space-y-2">
                {Object.entries(positionWeights).map(([pos, weight]) => (
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
                ))}
              </div>
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-2">메타 특징</p>
              <div className="text-white/70 text-sm space-y-1">
                <p>📉 <span className="text-red-400">탑</span>: 지속적인 아이템 상향으로 후반 캐리력 및 중요도 대폭 증가</p>
                <p>🔥 <span className="text-green-400">정글</span>: 여전히 강력한 오브젝트 컨트롤 능력, 하지만 초반 영향력 소폭 감소</p>
                <p>⚔️ <span className="text-blue-400">미드</span>: 맵 전반에 대한 영향력과 초중반 교전 주도권으로 여전히 최상위 티어</p>
                <p>📉 <span className="text-red-400">원딜</span>: 지속적인 아이템 상향으로 후반 캐리력 및 중요도 대폭 증가</p>
                <p>🛡️ <span className="text-yellow-400">서폿</span>: 시야 장악과 로밍은 중요하지만, 원딜의 중요도가 오르며 상대적 가중치 조정</p>
                <p>📉 <span className="text-red-400">ALL</span>: 멀티 포지션 유연성 보너스</p>              
                <p className="text-xs text-white/50 mt-2">* 최종 점수 = 티어 점수 × 포지션 가중치</p>
              </div>
            </div>
          </div>
        </div>

        {/* 플레이어 추가 섹션 */}
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
            
            {/* 포지션 선택 */}
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
              {selectedPositions.length > 0 ? (
                <p className="text-blue-300 text-sm mt-2">
                  선택된 포지션: {selectedPositions.map(pos => `${positionIcons[pos]} ${pos}`).join(', ')}
                </p>
              ) : (
                <p className="text-yellow-300 text-sm mt-2">
                  ⚠️ 최소 1개 포지션을 선택해주세요
                </p>
              )}
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

  {/* // PART7 */}
        {/* 티어 분포 정보 */}
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

        {/* 포지션별 현황 */}
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

        {/* 플레이어 목록 */}
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

        {/* 팀 밸런싱 버튼들 */}
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

{/* // PART8 */}
        {/* 수동 조정 안내 */}
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

        {/* 수동 조정 도구 */}
        {isManualMode && getActiveTeams().length > 0 && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              🔄 빠른 이동 도구
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

{/* // PART9 */}
        {/* 팀 결과 - 가장 중요한 UI */}
        {getActiveTeams().length > 0 && !showBracket && (
          <div className={`grid gap-6 mb-8 ${
            teamCount === 2 ? 'lg:grid-cols-2' : 
            teamCount === 3 ? 'lg:grid-cols-3' : 
            teamCount === 4 ? 'lg:grid-cols-2 xl:grid-cols-4' :
            teamCount === 5 ? 'lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5' :
            'lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6'
          }`}>
            {getActiveTeams().map(teamKey => {
              const team = teams[teamKey];
              const teamColor = teamColors[teamKey];
              const teamScore = calculateTeamScore(team);
              
              // 팀원을 티어 점수 기준으로 내림차순 정렬 (높은 티어부터)
              const sortedTeam = [...team].sort((a, b) => b.score - a.score);
              
              // 포지션 커버리지 계산
              const corePositions = ['탑', '정글', '미드', '원딜', '서폿'];
              const positionCoverage = {};
              corePositions.forEach(pos => {
                positionCoverage[pos] = team.filter(player => canPlayPosition(player, pos)).length;
              });

              return (
                <div key={teamKey} className={`bg-gradient-to-br ${teamColor.bg} rounded-xl p-6 border ${teamColor.border} ${
                  isManualMode ? 'ring-2 ring-white/20 hover:ring-white/40 transition-all cursor-pointer' : ''
                }`}>
                  {/* 팀 헤더 */}
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
                  
                  {/* 포지션 커버리지 */}
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

                  {/* 플레이어 목록 (티어별 정렬) */}
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
                    
                    {/* 수동 모드에서 빈 슬롯 표시 */}
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

        {/* 밸런스 분석 - 핵심 정보 */}
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
              {balanceAnalysis.scoreDifference > 10 && (
                <p className="text-yellow-300 text-sm mt-2">
                  ⚠️ 티어 차이가 큽니다. 더 나은 밸런스를 위해 다시 시도해보세요
                </p>
              )}
            </div>
          </div>
        )}

{/* // PART10 */}
        {/* 토너먼트 대진표 */}
        {showBracket && tournamentBracket && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
                🏆 토너먼트 대진표
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

            {/* 리그전 (3팀, 5-6팀) */}
            {(tournamentBracket.type === 'round_robin' || tournamentBracket.type === 'round_robin_3') && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 text-center">
                  {tournamentBracket.type === 'round_robin_3' ? '3팀 리그전' : '리그전'}
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
                
                {/* 리그전 순위표 */}
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
                  {/* 준결승 */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4 text-center">준결승</h4>
                    <div className="space-y-4">
                      {tournamentBracket.semifinals.map(match => (
                        <div key={match.id} className="bg-white/10 rounded-lg p-4">
                          <p className="text-white/60 text-sm text-center mb-3">
                            {match.id === 'sf1' ? '준결승 1' : '준결승 2'}
                          </p>
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

                  {/* 결승 */}
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

{/* // PART11 */}
        {/* 밸런싱 기록 */}
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