"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Activity, Flame, RefreshCw, Zap, Swords, BarChart3 } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function ShuttleSquadsPro() {
  const [tournamentId, setTournamentId] = useState("f9fe49db-5ba4-466f-ad1f-a833e1618b09");
  const [data, setData] = useState(null);
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
      // Point this to your Render URL in production!
      const res = await fetch(`https://shuttlesquadspro.onrender.com/api/power-rankings/${tournamentId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      const processed = json.rankings.map((r, i) => {
        let tier = "🥉 C-Tier";
        let color = "#ef4444";
        if (r.power_rating >= 1550) { tier = "🏆 S-Tier"; color = "#8b5cf6"; }
        else if (r.power_rating >= 1515) { tier = "🥇 A-Tier"; color = "#3b82f6"; }
        else if (r.power_rating >= 1485) { tier = "🥈 B-Tier"; color = "#10b981"; }

        return { ...r, rank: i + 1, tier, color };
      });
      
      setData(processed);
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

  // Matrix Generation for Heatmap
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
    if (prob > 0.8) return 'bg-green-500 text-white';
    if (prob > 0.6) return 'bg-emerald-300 text-emerald-900';
    if (prob > 0.4) return 'bg-yellow-200 text-yellow-900';
    if (prob > 0.2) return 'bg-orange-300 text-orange-900';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent tracking-tight">
          ShuttleSquads Pro
        </h1>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-sm mt-1">Next-Gen Predictive Analytics</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* SIDEBAR */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-4 text-indigo-600">
              <Zap size={24} className="fill-indigo-100" />
              <h2 className="font-black text-lg">Oracle Link</h2>
            </div>
            <input 
              type="text" 
              value={tournamentId} 
              onChange={(e) => setTournamentId(e.target.value)}
              className="w-full bg-slate-100 border-none p-3 rounded-xl mb-4 font-mono text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Tournament ID"
            />
            <div className="flex gap-2">
              <button onClick={fetchData} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 flex justify-center items-center gap-2">
                {loading ? <RefreshCw className="animate-spin" size={16}/> : 'Initialize'}
              </button>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-xl shadow-slate-200/50">
            <h3 className="font-bold text-slate-700 mb-2 text-sm">How it Works</h3>
            <ul className="text-xs text-slate-500 space-y-2">
              <li>• Reads live scores securely.</li>
              <li>• Applies <strong>Fight-Hard MoV</strong> multiplier.</li>
              <li>• Baseline Elo begins at 1500.</li>
            </ul>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="lg:col-span-3 space-y-6">
          
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-bold">{error}</div>}
          
          {!data && !loading && !error && (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
              <Activity size={48} className="text-slate-300 mb-4" />
              <h3 className="text-slate-500 font-bold text-lg">Awaiting Engine Initialization</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-sm">Enter a tournament ID and click initialize to crunch the live Elo mathematics.</p>
            </div>
          )}

          {data && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              
              {/* METRICS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard icon={<Trophy className="text-amber-500"/>} title="Apex Franchise" value={data[0].team} sub={data[0].power_rating + " ELO"} />
                <MetricCard icon={<Activity className="text-blue-500"/>} title="Global Baseline" value={Math.round(data.reduce((a,b)=>a+b.power_rating,0)/data.length) + " ELO"} sub="Tournament Average" />
                <MetricCard icon={<Flame className="text-red-500"/>} title="Prime Underdog" value={data[data.length-1].team} sub={data[data.length-1].power_rating + " ELO"} />
              </div>

              {/* TABS NAVIGATION */}
              <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-full overflow-x-auto no-scrollbar border border-white shadow-inner">
                <TabButton active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} icon={<Trophy size={16}/>} label="Leaderboard" />
                <TabButton active={activeTab === 'h2h'} onClick={() => setActiveTab('h2h')} icon={<Swords size={16}/>} label="H2H Predictor" />
                <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={<BarChart3 size={16}/>} label="Visual Insights" />
              </div>

              {/* TAB CONTENT */}
              <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-xl shadow-slate-200/50">
                
                {/* 1. LEADERBOARD */}
                {activeTab === 'leaderboard' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-100 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                          <th className="p-4">Rank</th>
                          <th className="p-4">Franchise</th>
                          <th className="p-4 w-1/3">Live Elo Rating</th>
                          <th className="p-4">AI Projection</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((team, idx) => (
                          <tr key={team.team} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-black text-slate-400">#{team.rank}</td>
                            <td className="p-4 font-bold text-slate-700">{team.team}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-sm">{team.power_rating}</span>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(team.power_rating / 1700) * 100}%`, backgroundColor: team.color }}></div>
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

                {/* 2. H2H PREDICTOR */}
                {activeTab === 'h2h' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                      <div className="md:col-span-3 bg-blue-50/50 border-t-4 border-blue-500 p-6 rounded-2xl shadow-sm">
                        <label className="text-xs font-black uppercase text-blue-500 tracking-wider mb-2 block">Blue Corner</label>
                        <select className="w-full bg-white border border-blue-100 p-3 rounded-xl font-bold text-slate-700 outline-none" value={teamA} onChange={(e) => setTeamA(e.target.value)}>
                          {data.map(t => <option key={t.team} value={t.team}>{t.team}</option>)}
                        </select>
                        <p className="mt-3 font-mono text-sm text-slate-500">Elo: <span className="font-bold text-slate-800">{data.find(t=>t.team===teamA)?.power_rating} ⚡</span></p>
                      </div>
                      
                      <div className="md:col-span-1 text-center font-black text-2xl bg-gradient-to-br from-blue-500 to-red-500 bg-clip-text text-transparent">VS</div>
                      
                      <div className="md:col-span-3 bg-red-50/50 border-t-4 border-red-500 p-6 rounded-2xl shadow-sm">
                        <label className="text-xs font-black uppercase text-red-500 tracking-wider mb-2 block">Red Corner</label>
                        <select className="w-full bg-white border border-red-100 p-3 rounded-xl font-bold text-slate-700 outline-none" value={teamB} onChange={(e) => setTeamB(e.target.value)}>
                          {data.map(t => <option key={t.team} value={t.team}>{t.team}</option>)}
                        </select>
                        <p className="mt-3 font-mono text-sm text-slate-500">Elo: <span className="font-bold text-slate-800">{data.find(t=>t.team===teamB)?.power_rating} ⚡</span></p>
                      </div>
                    </div>

                    {teamA !== teamB ? (() => {
                      const eloA = data.find(t=>t.team===teamA).power_rating;
                      const eloB = data.find(t=>t.team===teamB).power_rating;
                      const probA = expectedWinProb(eloA, eloB);
                      const { sa, sb } = predictScoreline(probA);

                      return (
                        <div className="border border-slate-100 rounded-3xl p-6 bg-slate-50/50 shadow-inner">
                          <h4 className="font-black text-slate-800 tracking-widest uppercase mb-6 flex items-center gap-2">
                            <Zap size={18} className="text-amber-400"/> AI Telemetry Report
                          </h4>
                          
                          <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Win Prob ({teamA})</p>
                              <p className="text-2xl font-black text-blue-600">{(probA * 100).toFixed(1)}%</p>
                              <p className="text-xs font-bold text-emerald-500 mt-1">{(1/probA).toFixed(2)}x Payout</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Expected Scoreline</p>
                              <p className="text-2xl font-black text-slate-700">{sa} - {sb}</p>
                              <p className="text-xs font-bold text-slate-400 mt-1">BWF 21-Pt Format</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Win Prob ({teamB})</p>
                              <p className="text-2xl font-black text-red-600">{((1-probA) * 100).toFixed(1)}%</p>
                              <p className="text-xs font-bold text-orange-500 mt-1">{(1/(1-probA)).toFixed(2)}x Payout</p>
                            </div>
                          </div>

                          <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-2">
                            <span className="text-blue-600">🔵 {teamA}</span>
                            <span className="text-red-600">🔴 {teamB}</span>
                          </div>
                          <div className="w-full h-8 rounded-full overflow-hidden flex border-2 border-white shadow-md bg-red-500">
                            <div className="h-full bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${probA * 100}%` }}></div>
                          </div>
                        </div>
                      )
                    })() : <div className="text-center p-4 bg-amber-50 text-amber-600 rounded-xl font-bold">Please select two different teams.</div>}
                  </div>
                )}

                {/* 3. VISUAL INSIGHTS */}
                {activeTab === 'insights' && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-slate-700 mb-6 flex items-center gap-2">Elo Distribution Tracker</h4>
                      <div className="h-96 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis type="number" dataKey="power_rating" name="Elo" domain={['dataMin - 50', 'dataMax + 50']} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <YAxis type="category" dataKey="team" name="Team" width={80} tick={{fill: '#64748b', fontSize: 12, fontWeight: 'bold'}} />
                            <RechartsTooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                            <Scatter data={data} shape="circle">
                              {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-700 mb-6 flex items-center gap-2">All-vs-All Probability Matrix</h4>
                      <div className="overflow-x-auto pb-4">
                        <div className="min-w-max grid" style={{ gridTemplateColumns: `100px repeat(${data.length}, 40px)` }}>
                          {/* Top Header Row */}
                          <div className="h-10"></div>
                          {data.map(t => (
                            <div key={t.team} className="h-10 flex items-end justify-center pb-2">
                              <span className="text-[9px] font-black text-slate-400 -rotate-45 whitespace-nowrap origin-bottom-left">{t.team}</span>
                            </div>
                          ))}
                          
                          {/* Matrix Rows */}
                          {matrix.map((row) => (
                            <React.Fragment key={row.name}>
                              <div className="h-10 flex items-center justify-end pr-4 text-[10px] font-black text-slate-600">{row.name}</div>
                              {data.map(col => {
                                const prob = row[col.team];
                                return (
                                  <div key={`${row.name}-${col.team}`} 
                                       className={`h-10 border border-white flex items-center justify-center text-[9px] font-bold cursor-help transition-transform hover:scale-110 hover:z-10 rounded ${getHeatmapColor(prob)}`}
                                       title={`${row.name} has a ${(prob*100).toFixed(0)}% chance to beat ${col.team}`}>
                                    {(prob*100).toFixed(0)}
                                  </div>
                                )
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 text-center mt-2">Row = Simulated Winner, Column = Simulated Loser</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function MetricCard({ icon, title, value, sub }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 flex flex-col items-center text-center">
      <div className="p-3 bg-slate-50 rounded-full shadow-inner mb-3">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
      <p className="text-xs font-bold text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap
        ${active ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
    >
      {icon} {label}
    </button>
  );
}