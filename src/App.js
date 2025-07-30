import React, { useState, useEffect } from 'react';
import { Users, Shuffle, Plus, Trash2, Star, Target, X } from 'lucide-react';

const LoLTeamBalancer = () => {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTier, setNewPlayerTier] = useState('실버');
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState({ team1: [], team2: [], team3: [], team4: [] });
  const [balanceAttempts, setBalanceAttempts] = useState(0);

  // 실제 한국 서버 티어 분포를 기반으로 한 점수 시스템
  const tiers = {
    '아이언': 1,
    '브론즈': 2.5,  // 15% (아이언과 실버 사이)
    '실버': 4,     // 33% (가장 많은 구간)
    '골드': 6,     // 21% (실버 다음으로 많음)
    '플래티넘': 8.5, // 12.2% (중간 구간)
    '에메랄드': 11,  // 7.3% (플래과 다이아 사이)
    '다이아': 15,   // 1.4% (상당한 실력 차이)
    '마스터': 25,   // 0.47% (엄청난 실력 차이)
    '그마': 35,     // 0.05% (최상위권)
    '챌린저': 50    // 0.02% (최고 수준)
  };

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
    '마스터': 'bg-purple-600',
    '그마': 'bg-red-600',
    '챌린저': 'bg-gradient-to-r from-yellow-400 to-red-500'
  };

  const teamColors = {
    team1: { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-400/30', text: 'text-blue-300', name: '블루팀' },
    team2: { bg: 'from-red-500/20 to-red-600/20', border: 'border-red-400/30', text: 'text-red-300', name: '레드팀' },
    team3: { bg: 'from-green-500/20 to-green-600/20', border: 'border-green-400/30', text: 'text-green-300', name: '그린팀' },
    team4: { bg: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-400/30', text: 'text-purple-300', name: '퍼플팀' }
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
      const newPlayer = {
        id: Date.now(),
        name: newPlayerName.trim(),
        tier: newPlayerTier,
        positions: [...selectedPositions],
        score: tiers[newPlayerTier]
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

  const getPositionFlexibility = (player) => {
    if (player.positions.includes('ALL')) return 5; // ALL은 모든 포지션 가능
    return player.positions.length;
  };

  const canPlayPosition = (player, position) => {
    return player.positions.includes('ALL') || player.positions.includes(position);
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

  const balanceTeams = () => {
    if (players.length < teamCount) return;

    let bestBalance = null;
    let bestScore = Infinity;
    const maxAttempts = 5000; // 더 많은 시도로 정교한 밸런싱
    const playersPerTeam = Math.ceil(players.length / teamCount);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      const teamsArray = [];
      
      // 팀 나누기
      for (let i = 0; i < teamCount; i++) {
        const start = i * playersPerTeam;
        const end = Math.min(start + playersPerTeam, shuffled.length);
        teamsArray.push(shuffled.slice(start, end));
      }
      
      // 마지막 팀이 비어있다면 재분배
      if (teamsArray[teamCount - 1].length === 0) {
        continue;
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
        for (let i = teamCount; i < 4; i++) {
          newTeams[`team${i + 1}`] = [];
        }
        bestBalance = newTeams;
      }
      
      if (totalScore <= 1) break; // 매우 좋은 밸런스면 조기 종료
    }

    setTeams(bestBalance);
    setBalanceAttempts(prev => prev + 1);
  };

  const resetTeams = () => {
    setTeams({ team1: [], team2: [], team3: [], team4: [] });
  };

  const getActiveTeams = () => {
    const activeTeamKeys = [`team1`, `team2`, `team3`, `team4`].slice(0, teamCount);
    return activeTeamKeys.filter(key => teams[key].length > 0);
  };

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

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 min-h-screen">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
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
            </select>
            <span className="text-white/60 text-sm">
              (최대 20명, 팀당 {Math.ceil(20 / teamCount)}명)
            </span>
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
            플레이어 목록 ({players.length}/20명)
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
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{player.score}점</p>
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

        {/* 팀 밸런싱 버튼 */}
        {players.length >= teamCount && (
          <div className="text-center mb-8">
            <div className="flex justify-center gap-4">
              <button
                onClick={balanceTeams}
                disabled={players.length > 20}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center gap-3 shadow-lg"
              >
                <Shuffle size={24} />
                {teamCount}팀 밸런싱 ({balanceAttempts}회)
              </button>
              {getActiveTeams().length > 0 && (
                <button
                  onClick={resetTeams}
                  className="px-6 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                >
                  초기화
                </button>
              )}
            </div>
            {players.length > 20 && (
              <p className="text-red-400 text-sm mt-2">최대 20명까지만 지원됩니다</p>
            )}
          </div>
        )}

        {/* 팀 결과 */}
        {getActiveTeams().length > 0 && (
          <div className={`grid gap-6 mb-8 ${
            teamCount === 2 ? 'lg:grid-cols-2' : 
            teamCount === 3 ? 'lg:grid-cols-3' : 
            'lg:grid-cols-2 xl:grid-cols-4'
          }`}>
            {getActiveTeams().map(teamKey => {
              const team = teams[teamKey];
              const teamColor = teamColors[teamKey];
              const teamScore = calculateTeamScore(team);
              
              // 포지션 커버리지 계산
              const corePositions = ['탑', '정글', '미드', '원딜', '서폿'];
              const positionCoverage = {};
              corePositions.forEach(pos => {
                positionCoverage[pos] = team.filter(player => canPlayPosition(player, pos)).length;
              });

              return (
                <div key={teamKey} className={`bg-gradient-to-br ${teamColor.bg} rounded-xl p-6 border ${teamColor.border}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-2xl font-bold ${teamColor.text} flex items-center gap-2`}>
                      <Star className="text-yellow-400" />
                      {teamColor.name}
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

                  <div className="space-y-3">
                    {team.map(player => (
                      <div key={player.id} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${tierColors[player.tier]}`}></div>
                          <span className="text-white font-medium">{player.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white/80 text-sm">{player.tier}</p>
                          <p className="text-white/60 text-xs">{player.positions.join('/')}</p>
                          <p className="text-white/60 text-xs">{player.score}점</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 밸런스 정보 */}
        {balanceAnalysis && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
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