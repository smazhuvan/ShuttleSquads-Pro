"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Activity, Flame, RefreshCw, Zap, Swords, BarChart3, Cpu, ChevronRight, Target, Binary, GitMerge, Share2 } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

export default function ShuttleSquadsPro() {
  const [tournamentId, setTournamentId] = useState("c2008278-4b9d-48ac-8675-cdbab429daa2");
  const [data, setData] = useState(null);
  const [futures, setFutures] = useState(null); 
  const [bracket, setBracket] = useState(null); // Bracket State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('bracket'); // Default to Bracket
  const [isShareOpen, setIsShareOpen] = useState(false); // Share Modal State

  // H2H State
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");

  // Deep Link Handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sharedTid = urlParams.get('tid');
      if (sharedTid) {
        setTournamentId(sharedTid);
        window.history.replaceState({}, document.title, "/");
      }
    }
  }, []);

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
        let color = "#ef4444";
        if (r.power_rating >= 1550) { tier = "🏆 S-Tier"; color = "#8b5cf6"; }
        else if (r.power_rating >= 1515) { tier = "🥇 A-Tier"; color = "#3b82f6"; }
        else if (r.power_rating >= 1485) { tier = "🥈 B-Tier"; color = "#10b981"; }
        return { ...r, rank: i + 1, tier, color };
      });
      setData(processed);

      // 2. Fetch Monte Carlo Futures
      try {
        const futRes = await fetch(`https://shuttlesquadspro.onrender.com/api/futures/${tournamentId}`);
        const futJson = await futRes.json();
        if (!futJson.error) setFutures(futJson.forecast);
        else setFutures(null);
      } catch (futErr) { console.warn("Futures pending..."); }

      // 3. Fetch Bracket Data
      try {
        const bracketRes = await fetch(`https://shuttlesquadspro.onrender.com/api/bracket/${tournamentId}`);
        const bracketJson = await bracketRes.json();
        if (!bracketJson.error && bracketJson.rounds) setBracket(bracketJson.rounds);
      } catch (err) { console.warn("Bracket pending..."); }

      if (processed.length > 1) {
        setTeamA(processed[0].team);
        setTeamB(processed[processed.length - 1].team);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleNativeShare = async () => {
    const shareUrl = `${window.location.origin}?tid=${tournamentId}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'ShuttleSquads Oracle', text: `View live Glicko-2 ratings and bracket for tournament ${tournamentId.substring(0,6)}`, url: shareUrl }); } 
      catch (err) { console.log('Share cancelled'); }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  const expectedWinProb = (ratingA, ratingB) => 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const predictScoreline = (probA) => probA > 0.5 ? { sa: 21, sb: Math.min(Math.max(Math.floor(21 * (1 - probA) * 1.8), 0), 19) } : { sa: Math.min(Math.max(Math.floor(21 * probA * 1.8), 0), 19), sb: 21 };
  
  const formatShortName = (name) => {
    if (!name || name === "TBD") return "TBD";
    if (name.includes('-')) return `${name.split('-')[0].trim().substring(0, 3)}/${name.split('-')[1].trim().substring(0, 3)}`.toUpperCase();
    return name.substring(0, 6).toUpperCase();
  };

  const matrix = useMemo(() => {
    if (!data) return [];
    return data.map(rt => {
      const row = { name: rt.team };
      data.forEach(ct => row[ct.team] = rt.team === ct.team ? 0.5 : expectedWinProb(rt.power_rating, ct.power_rating));
      return row;
    });
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
      const d = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-xl p-4 border border-slate-100 rounded-2xl shadow-xl">
          <p className="font-black text-slate-800 text-sm mb-1">{d.team}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Power:</span>
            <span className="text-lg font-black text-indigo-600">{d.power_rating} ⚡</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{d.tier}</p>
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
        <div className="flex items-center gap-3">
            {data && <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-pulse shadow-sm">Live Sync Active</div>}
            <button onClick={() => setIsShareOpen(true)} className="bg-white border border-slate-200 text-slate-600 p-3 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              <Share2 size={20} />
            </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* SIDEBAR */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-4 text-indigo-600 font-black">
              <Zap size={20} className="fill-indigo-100" />
              <h2 className="text-lg">Oracle Link</h2>
            </div>
            <input type="text" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} className="w-full bg-slate-100/50 border border-slate-200 p-3 rounded-xl mb-4 font-mono text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" />
            <button onClick={fetchData} disabled={loading} className="w-full bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2">
              {loading ? <RefreshCw className="animate-spin" size={16}/> : 'Fetch Telemetry'}
            </button>
          </div>
          
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="font-black text-sm uppercase tracking-widest text-indigo-400 flex items-center gap-2"><Binary size={16}/> Compute Engine</h3>
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
              <p className="text-slate-400 text-sm mt-3">Connect to a tournament ID to begin.</p>
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
                <TabButton active={activeTab === 'bracket'} onClick={() => setActiveTab('bracket')} icon={<GitMerge size={16}/>} label="Knockout Bracket" />
                <TabButton active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} icon={<Trophy size={16}/>} label="Leaderboard" />
                <TabButton active={activeTab === 'futures'} onClick={() => setActiveTab('futures')} icon={<Target size={16}/>} label="Monte Carlo Futures" />
                <TabButton active={activeTab === 'h2h'} onClick={() => setActiveTab('h2h')} icon={<Swords size={16}/>} label="H2H Predictor" />
                <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={<BarChart3 size={16}/>} label="Visual Insights" />
              </div>

              {/* TAB CONTENT */}
              <div className="bg-white/90 backdrop-blur-2xl border border-white rounded-[2.5rem] p-6 md:p-10 shadow-2xl shadow-slate-200/50">
                
                {/* 1. TOURNAMENT BRACKET */}
                {activeTab === 'bracket' && (
                    <div className="overflow-x-auto pb-8 scroll-smooth no-scrollbar">
                        <div className="flex justify-between min-w-[1000px] gap-12 px-4">
                            {!bracket ? <p className="text-slate-400 font-bold p-12 text-center w-full">Waiting for Bracket Generation...</p> : bracket.map((round, rIdx) => (
                                <div key={round.name} className="flex-1 space-y-8">
                                    <h4 className="text-center font-black text-slate-400 uppercase tracking-widest text-[10px] mb-8">{round.name}</h4>
                                    <div className="flex flex-col justify-around h-full gap-8">
                                        {round.matches.map((m, mIdx) => (
                                            <div key={mIdx} className="relative">
                                                <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-200 transition-all w-full">
                                                    <div className={`p-4 flex justify-between items-center border-b border-slate-50 ${m.winner === m.t1 ? 'bg-indigo-50/30' : ''}`}>
                                                        <span className={`text-xs font-bold truncate pr-4 ${m.winner === m.t1 ? 'text-indigo-600' : 'text-slate-600'}`}>{m.t1}</span>
                                                        <span className="font-mono font-black text-[10px] text-slate-400">{m.s1 ?? '-'}</span>
                                                    </div>
                                                    <div className={`p-4 flex justify-between items-center ${m.winner === m.t2 ? 'bg-indigo-50/30' : ''}`}>
                                                        <span className={`text-xs font-bold truncate pr-4 ${m.winner === m.t2 ? 'text-indigo-600' : 'text-slate-600'}`}>{m.t2}</span>
                                                        <span className="font-mono font-black text-[10px] text-slate-400">{m.s2 ?? '-'}</span>
                                                    </div>
                                                </div>
                                                {rIdx < bracket.length - 1 && <div className="absolute -right-12 top-1/2 w-12 h-px bg-slate-200"></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. LEADERBOARD */}
                {activeTab === 'leaderboard' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-100 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                          <th className="p-4">Rank</th><th className="p-4">Franchise</th><th className="p-4 w-1/3">Power Rating</th><th className="p-4">AI Tier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((team) => (
                          <tr key={team.team} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 font-black text-slate-400">#{team.rank}</td>
                            <td className="p-4 font-bold text-slate-700">{team.team}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-4">
                                <span className="font-mono font-black text-slate-600 w-12">{team.power_rating}</span>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(team.power_rating / 1950) * 100}%`, backgroundColor: team.color }}></div>
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

                {/* 3. MONTE CARLO FUTURES */}
                {activeTab === 'futures' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-8">
                      <div><h4 className="font-black text-2xl text-slate-800">Tournament Forecast</h4><p className="text-slate-500 text-sm">Monte Carlo Results (10,000 Iterations)</p></div>
                    </div>
                    {!futures ? <div className="text-center p-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200"><p className="font-bold text-slate-400">Not enough data. (Need 8 qualified teams)</p></div> : (
                        <div className="grid grid-cols-1 gap-4">
                        {futures.map((f, i) => (
                            <div key={f.team} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all group">
                                <div className="flex justify-between items-center mb-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-slate-400 border border-slate-100">{i+1}</div>
                                        <div><h5 className="font-black text-slate-800">{f.team}</h5><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.power_rating} PWR</p></div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-center hidden sm:block"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Make Final</p><p className="font-black text-slate-700">{f.make_finals}%</p></div>
                                        <div className="text-center bg-indigo-600 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-100"><p className="text-[9px] font-black text-white/70 uppercase mb-0.5">Win Trophy</p><p className="text-xl font-black">{f.win_championship}%</p></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 h-2 rounded-full overflow-hidden bg-slate-200/40 shadow-inner">
                                    <div className="h-full bg-indigo-300" style={{ width: `${f.make_semis}%` }}></div>
                                    <div className="h-full bg-indigo-500" style={{ width: `${f.make_finals}%` }}></div>
                                    <div className="h-full bg-amber-400" style={{ width: `${f.win_championship}%` }}></div>
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                  </div>
                )}

                {/* 4. H2H PREDICTOR */}
                {activeTab === 'h2h' && (
                  <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                      <div className="md:col-span-3 bg-white border border-slate-200 p-8 rounded-3xl shadow-sm"><label className="text-[10px] font-black uppercase text-blue-500 mb-3 block">Blue Corner</label><select className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none" value={teamA} onChange={(e) => setTeamA(e.target.value)}>{data.map(t => <option key={t.team} value={t.team}>{t.team}</option>)}</select></div>
                      <div className="md:col-span-1 flex justify-center"><Swords size={24} className="text-slate-300" /></div>
                      <div className="md:col-span-3 bg-white border border-slate-200 p-8 rounded-3xl shadow-sm"><label className="text-[10px] font-black uppercase text-red-500 mb-3 block">Red Corner</label><select className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none" value={teamB} onChange={(e) => setTeamB(e.target.value)}>{data.map(t => <option key={t.team} value={t.team}>{t.team}</option>)}</select></div>
                    </div>
                    {teamA !== teamB ? (() => {
                        const pA = expectedWinProb(data.find(t=>t.team===teamA)?.power_rating || 1500, data.find(t=>t.team===teamB)?.power_rating || 1500);
                        const { sa, sb } = predictScoreline(pA);
                        return (
                            <div className="bg-slate-800 text-white p-10 rounded-[2rem] text-center shadow-2xl">
                                <p className="uppercase tracking-[0.3em] text-[10px] font-black text-indigo-400 mb-6">AI Projection Result</p>
                                <div className="flex justify-center items-center gap-12">
                                    <div className="text-blue-400 font-black text-4xl">{(pA*100).toFixed(0)}%</div>
                                    <div className="text-5xl font-black">{sa} - {sb}</div>
                                    <div className="text-red-400 font-black text-4xl">{((1-pA)*100).toFixed(0)}%</div>
                                </div>
                            </div>
                        )
                    })() : null}
                  </div>
                )}

                {/* 5. VISUAL INSIGHTS */}
                {activeTab === 'insights' && (
                  <div className="space-y-16">
                    <div className="h-[450px]">
                      <h4 className="font-black text-lg mb-8 flex items-center gap-2"><Activity className="text-indigo-500"/> Power Map</h4>
                      <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 120 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis type="number" dataKey="power_rating" domain={['dataMin - 50', 'dataMax + 50']} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="team" width={120} tick={{fill: '#475569', fontSize: 11, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{stroke: '#e2e8f0', strokeWidth: 2}} />
                            <Scatter data={data} shape="circle">{data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <hr className="border-slate-100" />
                    <div>
                      <h4 className="font-black text-lg mb-8 flex items-center gap-2"><BarChart3 className="text-indigo-500"/> Win Matrix (%)</h4>
                      <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-white">
                        <div className="overflow-x-auto custom-scrollbar">
                          <div className="min-w-max grid" style={{ gridTemplateColumns: `160px repeat(${data.length}, 56px)` }}>
                            <div className="h-16 sticky left-0 top-0 z-30 bg-slate-50 border-b border-r border-slate-200"></div>
                            {data.map(t => (
                              <div key={t.team} className="h-16 flex items-end justify-center pb-3 border-b border-slate-200 bg-slate-50 relative group">
                                <span className="text-[10px] font-black text-slate-500 -rotate-45 whitespace-nowrap origin-bottom-left">{formatShortName(t.team)}</span>
                              </div>
                            ))}
                            {matrix.map((row, rIdx) => (
                              <React.Fragment key={row.name}>
                                <div className={`h-12 sticky left-0 z-20 flex items-center justify-end pr-4 text-[11px] font-black text-slate-700 border-r border-slate-200 ${rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}><span className="truncate max-w-[130px]">{row.name}</span></div>
                                {data.map(col => {
                                  const prob = row[col.team];
                                  if (row.name === col.team) return <div key={`${row.name}-${col.team}`} className="h-12 border-b border-r border-slate-100 bg-slate-100/50 flex items-center justify-center text-slate-200">➖</div>;
                                  return (<div key={`${row.name}-${col.team}`} className={`h-12 border-b border-r border-white/20 flex items-center justify-center text-[11px] m-[1px] ${getHeatmapColor(prob)}`}>{(prob*100).toFixed(0)}</div>)
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

      {/* SHARE MODAL */}
      {isShareOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl space-y-6 text-center">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-black text-xl text-slate-800">Share Oracle</h3>
              <button onClick={() => setIsShareOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">✕</button>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl inline-block border border-slate-100 shadow-inner">
              <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}?tid=${tournamentId}`} size={200} fgColor="#4f46e5" includeMargin={true} />
            </div>
            <div className="space-y-3">
              <button onClick={handleNativeShare} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                <Share2 size={18}/> Open Native Share
              </button>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TID: {tournamentId.substring(0,8)}...</p>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { height: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }`}} />
    </div>
  );
}

function MetricCard({ icon, title, value, sub }) { return (<div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-lg flex flex-col items-center text-center"><div className="p-4 bg-slate-50 rounded-full mb-4">{icon}</div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p><p className="text-xl font-black text-slate-800">{value}</p><p className="text-xs font-bold text-indigo-500 mt-1">{sub}</p></div>); }
function TabButton({ active, onClick, icon, label }) { return (<button onClick={onClick} className={`flex-1 py-3.5 px-4 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${active ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>{icon} {label}</button>); }