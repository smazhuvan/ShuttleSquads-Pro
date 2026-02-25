"use client";
import React, { useState, useMemo } from 'react';
import { Trophy, Activity, Flame, RefreshCw, Zap, Swords, BarChart3, Cpu, ChevronRight, Target, Binary } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function ShuttleSquadsPro() {
  const [tournamentId, setTournamentId] = useState("c2008278-4b9d-48ac-8675-cdbab429daa2");
  const [data, setData] = useState(null);
  const [futures, setFutures] = useState(null); // New State for Monte Carlo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('leaderboard'); 

  // H2H State
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Power Rankings
      const res = await fetch(`https://shuttlesquadspro.onrender.com/api/power-rankings/${tournamentId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      const processed = json.rankings.map((r, i) => {
        let tier = "🥉 C-Tier";
        let color = "#ef4444"; // Red
        if (r.power_rating >= 1550) { tier = "🏆 S-Tier"; color = "#8b5cf6"; } // Purple
        else if (r.power_rating >= 1515) { tier = "🥇 A-Tier"; color = "#3b82f6"; } // Blue
        else if (r.power_rating >= 1485) { tier = "🥈 B-Tier"; color = "#10b981"; } // Green

        return { ...r, rank: i + 1, tier, color };
      });
      
      setData(processed);

      // 2. Fetch Monte Carlo Futures (New Logic)
      try {
        const futRes = await fetch(`https://shuttlesquadspro.onrender.com/api/futures/${tournamentId}`);
        const futJson = await futRes.json();
        if (!futJson.error) {
          setFutures(futJson.forecast);
        } else {
          setFutures(null); // Clear if not enough teams for simulation
        }
      } catch (futErr) {
        console.warn("Futures engine still warming up...", futErr);
      }

      if (processed.length > 1) {
        setTeamA(processed[0].team);
        setTeamB(processed[processed.length - 1].team);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const expectedWinProb = (ratingA, ratingB) => {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  };

  const predictScoreline = (probA) => {
    if (probA > 0.5) {
      return { sa: 21, sb: Math.min(Math.max(Math.floor(21 * (1 - probA) * 1.8), 0), 19) };
    } else {
      return { sa: Math.min(Math.max(Math.floor(21 * probA * 1.8), 0), 19), sb: 21 };
    }
  };

  const formatShortName = (name) => {
    if (!name) return "";
    if (name.includes('-')) {
      const parts = name.split('-');
      return `${parts[0].trim().substring(0, 3)}/${parts[1].trim().substring(0, 3)}`.toUpperCase();
    }
    return name.substring(0, 6).toUpperCase();
  };

  const matrix = useMemo(() => {
    if (!data) return [];
    const grid = [];
    data.forEach(rowTeam => {
      const row = { name: rowTeam.team };
      data.forEach(colTeam => {
        if (rowTeam.team === colTeam.team) {
          row[colTeam.team] = 0.5;
        } else {
          row[colTeam.team] = expectedWinProb(rowTeam.power_rating, colTeam.power_rating);
        }
      });
      grid.push(row);
    });
    return grid;
  }, [data]);

  const getHeatmapColor = (prob) => {
    if (prob > 0.8) return 'bg-emerald-500 text-white font-black shadow-inner';
    if (prob > 0.6) return 'bg-emerald-300 text-emerald-900 font-bold';
    if (prob > 0.4) return 'bg-yellow-200 text-yellow-900 font-bold';
    if (prob > 0.2) return 'bg-orange-400 text-white font-bold';
    return 'bg-red-500 text-white font-black shadow-inner';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-xl p-4 border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50">
          <p className="font-black text-slate-800 text-sm mb-1">{data.team}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Power:</span>
            <span className="text-lg font-black text-indigo-600">{data.power_rating} ⚡</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{data.tier}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent tracking-tight flex items-center gap-3">
            ShuttleSquads Pro <Cpu size={36} className="text-blue-500" />
          </h1>
          <p className="text-slate-500 font-bold tracking-widest uppercase text-sm mt-1">AI-Powered Tournament Oracle</p>
        </div>
        {data && <div className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">Live Glicko-2 Sync Active</div>}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-5 gap-8">
        
        {/* SIDEBAR */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-4 text-indigo-600 font-black">
              <Zap size={20} className="fill-indigo-100" />
              <h2 className="text-lg">Oracle Link</h2>
            </div>
            <input 
              type="text" 
              value={tournamentId} 
              onChange={(e) => setTournamentId(e.target.value)}
              className="w-full bg-slate-100/50 border border-slate-200 p-3 rounded-xl mb-4 font-mono text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
            <button onClick={fetchData} disabled={loading} className="w-full bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 flex justify-center items-center gap-2">
              {loading ? <RefreshCw className="animate-spin" size={16}/> : 'Fetch Telemetry'}
            </button>
          </div>
          
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="font-black text-sm uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Binary size={16}/> Compute Engine
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">We run 10,000 simulations per second using live Glicko-2 ratings to forecast tournament progression probabilities.</p>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="xl:col-span-4 space-y-8">
          
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-200 font-bold shadow-sm">{error}</div>}
          
          {(!data || data.length === 0) && !loading && !error && (
            <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
              <Trophy size={64} className="text-slate-200 mb-4" />
              <h3 className="text-slate-600 font-black text-2xl">Awaiting Telemetry Sync</h3>
              <p className="text-slate-400 text-sm mt-3 max-w-md leading-relaxed">
                Connect to a tournament ID to begin the Glicko-2 telemetry sync.
              </p>
            </div>
          )}

          {data && data.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
              
              {/* METRICS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard icon={<Trophy className="text-amber-500"/>} title="Apex Franchise" value={data[0].team} sub={data[0].power_rating + " PWR"} />
                <MetricCard icon={<Activity className="text-blue-500"/>} title="Global Baseline" value={Math.round(data.reduce((a,b)=>a+b.power_rating,0)/data.length) + " PWR"} sub="Tournament Average" />
                <MetricCard icon={<Flame className="text-red-500"/>} title="Prime Underdog" value={data[data.length-1].team} sub={data[data.length-1].power_rating + " PWR"} />
              </div>

              {/* TABS NAVIGATION */}
              <div className="flex bg-white/50 backdrop-blur-md p-2 rounded-2xl w-full overflow-x-auto no-scrollbar border border-slate-200 shadow-sm gap-2">
                <TabButton active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} icon={<Trophy size={16}/>} label="Leaderboard" />
                <TabButton active={activeTab === 'futures'} onClick={() => setActiveTab('futures')} icon={<Target size={16}/>} label="Monte Carlo Futures" />
                <TabButton active={activeTab === 'h2h'} onClick={() => setActiveTab('h2h')} icon={<Swords size={16}/>} label="H2H Predictor" />
                <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={<BarChart3 size={16}/>} label="Visual Insights" />
              </div>

              {/* TAB CONTENT */}
              <div className="bg-white/90 backdrop-blur-2xl border border-white rounded-[2.5rem] p-6 md:p-10 shadow-2xl shadow-slate-200/50">
                
                {/* 1. LEADERBOARD */}
                {activeTab === 'leaderboard' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-100 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                          <th className="p-4">Rank</th>
                          <th className="p-4">Franchise</th>
                          <th className="p-4 w-1/3">Power Rating</th>
                          <th className="p-4">AI Projection</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((team) => (
                          <tr key={team.team} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                            <td className="p-4 font-black text-slate-400 group-hover:text-indigo-500 transition-colors">#{team.rank}</td>
                            <td className="p-4 font-bold text-slate-700">{team.team}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-4">
                                <span className="font-mono font-black text-slate-600 w-12">{team.power_rating}</span>
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                  <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(team.power_rating / 1950) * 100}%`, backgroundColor: team.color }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-xs font-bold text-slate-500">{team.tier}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2. MONTE CARLO FUTURES (New UI) */}
                {activeTab === 'futures' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h4 className="font-black text-2xl text-slate-800">Tournament Forecast</h4>
                        <p className="text-slate-500 text-sm">Monte Carlo Results (10,000 Iterations)</p>
                      </div>
                      <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Quarter-Final Seeding</div>
                    </div>
                    
                    {!futures ? (
                        <div className="text-center p-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <p className="font-bold text-slate-400">Not enough data to run simulation. (Need 8 qualified teams)</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                        {futures.map((f, i) => (
                            <div key={f.team} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 transition-all hover:bg-white hover:shadow-lg group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                                <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-slate-400 shadow-sm border border-slate-100 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                    {i+1}
                                </div>
                                <div>
                                    <h5 className="font-black text-slate-800">{f.team}</h5>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.power_rating} PWR</p>
                                </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Make Final</p>
                                        <p className="font-black text-slate-700">{f.make_finals}%</p>
                                    </div>
                                    <div className="text-center bg-indigo-600 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-100">
                                        <p className="text-[9px] font-black text-white/70 uppercase mb-0.5">Win Trophy</p>
                                        <p className="text-xl font-black">{f.win_championship}%</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 h-2 rounded-full overflow-hidden bg-slate-200/40 border border-slate-100 shadow-inner">
                                <div className="h-full bg-indigo-300 transition-all duration-1000" style={{ width: `${f.make_semis}%` }}></div>
                                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${f.make_finals}%` }}></div>
                                <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${f.win_championship}%` }}></div>
                            </div>
                            </div>
                        ))}
                        </div>
                    )}
                  </div>
                )}

                {/* 3. H2H PREDICTOR */}
                {activeTab === 'h2h' && (
                  <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                      <div className="md:col-span-3 bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-8 rounded-3xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-3 block">Blue Corner</label>
                        <select className="w-full bg-white border border-blue-200 p-4 rounded-xl font-bold text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer" value={teamA} onChange={(e) => setTeamA(e.target.value)}>
                          {data.map(t => <option key={t.team} value={t.team}>{t.team}</option>)}
                        </select>
                        <p className="mt-4 font-mono text-sm text-slate-500 flex items-center justify-between">
                          <span>Current Power:</span>
                          <span className="font-black text-lg text-slate-800">{data.find(t=>t.team===teamA)?.power_rating} ⚡</span>
                        </p>
                      </div>
                      
                      <div className="md:col-span-1 flex justify-center">
                        <div className="bg-slate-100 p-4 rounded-full shadow-inner">
                          <Swords size={24} className="text-slate-400" />
                        </div>
                      </div>
                      
                      <div className="md:col-span-3 bg-gradient-to-br from-red-50 to-white border border-red-100 p-8 rounded-3xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                        <label className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-3 block">Red Corner</label>
                        <select className="w-full bg-white border border-red-200 p-4 rounded-xl font-bold text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-red-500 cursor-pointer" value={teamB} onChange={(e) => setTeamB(e.target.value)}>
                          {data.map(t => <option key={t.team} value={t.team}>{t.team}</option>)}
                        </select>
                        <p className="mt-4 font-mono text-sm text-slate-500 flex items-center justify-between">
                          <span>Current Power:</span>
                          <span className="font-black text-lg text-slate-800">{data.find(t=>t.team===teamB)?.power_rating} ⚡</span>
                        </p>
                      </div>
                    </div>

                    {teamA !== teamB ? (() => {
                      const eloA = data.find(t=>t.team===teamA)?.power_rating || 1500;
                      const eloB = data.find(t=>t.team===teamB)?.power_rating || 1500;
                      const probA = expectedWinProb(eloA, eloB);
                      const { sa, sb } = predictScoreline(probA);

                      return (
                        <div className="border border-slate-200 rounded-3xl p-8 bg-slate-50/50 shadow-inner mt-8">
                          <h4 className="font-black text-slate-800 tracking-widest uppercase mb-8 flex items-center justify-center gap-3">
                            <Zap size={20} className="text-amber-400 fill-amber-400"/> AI Telemetry Report <Zap size={20} className="text-amber-400 fill-amber-400"/>
                          </h4>
                          
                          <div className="grid grid-cols-3 gap-6 mb-10 text-center">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Win Prob ({formatShortName(teamA)})</p>
                              <p className="text-3xl font-black text-blue-600">{(probA * 100).toFixed(1)}%</p>
                              <p className="text-xs font-bold text-emerald-500 mt-2 bg-emerald-50 py-1 px-2 rounded-full inline-block">{(1/probA).toFixed(2)}x Payout</p>
                            </div>
                            <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-6 rounded-3xl shadow-lg border border-slate-700 text-white flex flex-col justify-center">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Expected Score</p>
                              <p className="text-4xl font-black tracking-tighter">{sa} - {sb}</p>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Win Prob ({formatShortName(teamB)})</p>
                              <p className="text-3xl font-black text-red-600">{((1-probA) * 100).toFixed(1)}%</p>
                              <p className="text-xs font-bold text-orange-500 mt-2 bg-orange-50 py-1 px-2 rounded-full inline-block">{(1/(1-probA)).toFixed(2)}x Payout</p>
                            </div>
                          </div>

                          <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-3 px-2">
                            <span className="text-blue-600 truncate max-w-[45%]">🔵 {teamA}</span>
                            <span className="text-red-600 truncate max-w-[45%] text-right">🔴 {teamB}</span>
                          </div>
                          <div className="w-full h-10 rounded-full overflow-hidden flex border-4 border-white shadow-lg bg-red-500 relative">
                            <div className="h-full bg-blue-500 transition-all duration-1000 ease-out flex items-center justify-end pr-2" style={{ width: `${probA * 100}%` }}>
                              {probA > 0.1 && <span className="text-[10px] font-black text-white/80">{(probA * 100).toFixed(0)}%</span>}
                            </div>
                            <div className="h-full bg-red-500 flex-1 flex items-center justify-start pl-2">
                              {(1-probA) > 0.1 && <span className="text-[10px] font-black text-white/80">{((1-probA) * 100).toFixed(0)}%</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })() : <div className="text-center p-8 bg-amber-50 border border-amber-100 text-amber-600 rounded-3xl font-bold flex flex-col items-center gap-3"><Activity size={32}/> Please select two different franchises.</div>}
                  </div>
                )}

                {/* 4. VISUAL INSIGHTS */}
                {activeTab === 'insights' && (
                  <div className="space-y-16">
                    <div>
                      <div className="mb-8">
                        <h4 className="font-black text-xl text-slate-800 flex items-center gap-3"><Activity className="text-indigo-500"/> Power Distribution Tracker</h4>
                        <p className="text-slate-500 text-sm mt-1">Glicko-2 ratings mapped across the entire field.</p>
                      </div>
                      <div className="w-full" style={{ height: `${Math.max(400, data.length * 45)}px` }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 120 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                            <XAxis type="number" dataKey="power_rating" domain={['dataMin - 50', 'dataMax + 50']} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="team" width={120} tick={{fill: '#475569', fontSize: 11, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4'}} />
                            <Scatter data={data} shape="circle">
                              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-md hover:drop-shadow-xl transition-all" />)}
                            </Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <hr className="border-slate-100" />

                    <div>
                      <div className="mb-8">
                        <h4 className="font-black text-xl text-slate-800 flex items-center gap-3"><BarChart3 className="text-indigo-500"/> All-vs-All Probability Matrix</h4>
                        <p className="text-slate-500 text-sm mt-1">Winning probability for Row team against Column team.</p>
                      </div>
                      <div className="relative rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                        <div className="overflow-x-auto pb-2 custom-scrollbar">
                          <div className="min-w-max grid" style={{ gridTemplateColumns: `160px repeat(${data.length}, 56px)` }}>
                            <div className="h-16 sticky left-0 top-0 z-30 bg-slate-50 border-b border-r border-slate-200"></div>
                            {data.map(t => (
                              <div key={`header-${t.team}`} className="h-16 flex items-end justify-center pb-3 border-b border-slate-200 bg-slate-50 relative group">
                                <span className="text-[10px] font-black text-slate-500 -rotate-45 whitespace-nowrap origin-bottom-left cursor-help">{formatShortName(t.team)}</span>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-50">{t.team}</div>
                              </div>
                            ))}
                            {matrix.map((row, rIdx) => (
                              <React.Fragment key={`row-${row.name}`}>
                                <div className={`h-12 sticky left-0 z-20 flex items-center justify-end pr-4 text-[11px] font-black text-slate-700 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                  <span className="truncate max-w-[130px]">{row.name}</span>
                                </div>
                                {data.map(col => {
                                  const prob = row[col.team];
                                  if (row.name === col.team) return <div key={`${row.name}-${col.team}`} className="h-12 border-b border-r border-slate-100 bg-slate-100/50 flex items-center justify-center text-slate-300">➖</div>;
                                  return (
                                    <div key={`${row.name}-${col.team}`} className={`h-12 border-b border-r border-white/20 flex items-center justify-center text-[11px] cursor-help transition-all hover:scale-110 hover:z-10 hover:shadow-lg rounded-[4px] m-[1px] ${getHeatmapColor(prob)}`} title={`${row.name} vs ${col.team}`}>
                                      {(prob*100).toFixed(0)}
                                    </div>
                                  )
                                })}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}

function MetricCard({ icon, title, value, sub }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
      <div className="p-4 bg-slate-50 rounded-full shadow-inner mb-4">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
      <p className="text-xs font-bold text-indigo-500 mt-1">{sub}</p>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 py-3.5 px-4 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap
        ${active ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
    >
      {icon} {label}
    </button>
  );
}