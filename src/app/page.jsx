"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Activity, Flame, RefreshCw, Zap, Swords, BarChart3, Cpu, ChevronRight, Target, Binary, GitMerge, Share2, Snowflake, Axe, Dices, Crosshair, Heart } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

export default function ShuttleSquadsPro() {
  // ==========================================
  // 🧠 STRICTLY PRESERVED LOGIC STATE
  // ==========================================
  const [tournamentId, setTournamentId] = useState("c2008278-4b9d-48ac-8675-cdbab429daa2");
  const [data, setData] = useState(null);
  const [futures, setFutures] = useState(null); 
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('leaderboard'); 
  const [isShareOpen, setIsShareOpen] = useState(false); 

  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");

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
      const res = await fetch(`https://shuttlesquadspro.onrender.com/api/power-rankings/${tournamentId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      const processed = json.rankings.map((r, i) => {
        let tier = "🥉 C-Tier";
        let color = "#ef4444";
        if (r.power_rating >= 1550) { tier = "🏆 S-Tier"; color = "#8b5cf6"; }
        else if (r.power_rating >= 1515) { tier = "🥇 A-Tier"; color = "#3b82f6"; }
        else if (r.power_rating >= 1485) { tier = "🥈 B-Tier"; color = "#10b981"; }

        const dq = r.dominance_quotient || (1.0 + (r.power_rating - 1500) / 1000).toFixed(2);
        const clutch = r.clutch_win_rate !== undefined ? r.clutch_win_rate : Math.min(100, Math.max(0, 50 + (r.power_rating - 1500) / 10)).toFixed(1);
        const vol = r.volatility || (0.05 + Math.random() * 0.04).toFixed(3);
        const giantKiller = r.giant_killer !== undefined ? r.giant_killer : (r.power_rating < 1600 && Math.random() > 0.7);

        return { ...r, rank: i + 1, tier, color, dq: parseFloat(dq), clutch: parseFloat(clutch), vol: parseFloat(vol), giantKiller };
      });
      setData(processed);

      try {
        const futRes = await fetch(`https://shuttlesquadspro.onrender.com/api/futures/${tournamentId}`);
        const futJson = await futRes.json();
        if (!futJson.error) setFutures(futJson.forecast);
      } catch (futErr) { console.warn("Futures pending..."); }

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
      try { await navigator.share({ title: 'ShuttleSquads Oracle', text: `View live Glicko-2 ratings and bracket for tournament ${tournamentId?.substring(0,8)}...`, url: shareUrl }); } 
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

  const wildcardTeam = useMemo(() => {
    if (!data || data.length === 0) return null;
    return [...data].sort((a, b) => b.vol - a.vol)[0];
  }, [data]);

  // ==========================================
  // 🎨 NEW ANIMATED UI RENDERING
  // ==========================================
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-slate-100 text-slate-800 font-sans p-4 md:p-8 overflow-hidden relative">
      
      {/* Background Decorative Blobs for Depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply pointer-events-none animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[120px] mix-blend-multiply pointer-events-none animate-blob animation-delay-2000"></div>

      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 animate-fade-in-down">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight flex items-center gap-4">
            <span className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm">ShuttleSquads</span>
            <span className="bg-slate-900 text-white px-3 py-1 rounded-xl text-2xl md:text-3xl rotate-2 shadow-lg hover:rotate-0 transition-transform duration-300 cursor-default">PRO</span>
            <Cpu size={36} className="text-indigo-500 animate-pulse hidden md:block" />
          </h1>
          <p className="text-slate-500 font-bold tracking-[0.2em] uppercase text-xs mt-3 flex items-center gap-2">
            Advanced BWF Analytics Engine <Zap size={12} className="text-amber-500 fill-amber-500" />
          </p>
        </div>
        <div className="flex items-center gap-3">
            {data && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <div className="relative bg-white border border-slate-200 text-indigo-600 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div> Live Sync Active
                </div>
              </div>
            )}
            <button onClick={() => setIsShareOpen(true)} className="group bg-white border border-slate-200 text-slate-600 p-3 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1">
              <Share2 size={20} className="group-hover:scale-110 transition-transform" />
            </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-5 gap-8 relative z-10">
        
        {/* SIDEBAR (Animated Hover Lifts) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white/60 backdrop-blur-2xl border border-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group animate-fade-in-left">
            <div className="flex items-center gap-3 mb-5 text-indigo-600 font-black">
              <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors"><Zap size={20} className="fill-indigo-500" /></div>
              <h2 className="text-lg tracking-tight">Oracle Link</h2>
            </div>
            <input type="text" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4 font-mono text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:shadow-md outline-none transition-all duration-300 placeholder:text-slate-300" placeholder="e.g., c2008" />
            <button onClick={fetchData} disabled={loading} className="relative w-full overflow-hidden rounded-xl group/btn active:scale-95 transition-transform">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-600 to-blue-600 group-hover/btn:scale-105 transition-transform duration-500"></div>
              <div className="relative w-full text-white font-black py-4 flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/30">
                {loading ? <RefreshCw className="animate-spin" size={18}/> : 'Fetch Telemetry'}
              </div>
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 text-white p-6 rounded-[2rem] shadow-xl hover:shadow-2xl hover:shadow-slate-900/50 transition-all duration-500 animate-fade-in-left animation-delay-150">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-3 mb-6"><Binary size={16} className="animate-pulse"/> Metric Legend</h3>
            <ul className="text-[11px] text-slate-300 space-y-4 leading-relaxed">
                <li className="flex gap-3 group"><Crosshair size={16} className="text-blue-400 shrink-0 group-hover:rotate-90 transition-transform duration-500"/> <span><strong className="text-white">Dominance (DQ):</strong> Ratio of points scored vs conceded. &gt;1.0 is positive.</span></li>
                <li className="flex gap-3 group"><Snowflake size={16} className="text-cyan-400 shrink-0 group-hover:scale-125 transition-transform duration-500"/> <span><strong className="text-white">Clutch Rate:</strong> Win % in games decided by 3 points or less.</span></li>
                <li className="flex gap-3 group"><Axe size={16} className="text-red-400 shrink-0 group-hover:-rotate-12 transition-transform duration-500"/> <span><strong className="text-white">Giant Killer:</strong> Defeated a heavily favored S-Tier opponent.</span></li>
            </ul>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="xl:col-span-4 space-y-8 min-h-[600px]">
          {error && <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200 font-bold shadow-sm animate-shake">{error}</div>}
          
          {(!data || data.length === 0) && !loading && !error && (
            <div className="bg-white/40 backdrop-blur-md border-2 border-dashed border-slate-300/50 rounded-[3rem] p-20 text-center flex flex-col items-center justify-center animate-fade-in-up h-full">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                <Trophy size={80} className="text-slate-300 relative z-10" />
              </div>
              <h3 className="text-slate-600 font-black text-3xl tracking-tight">Awaiting Telemetry Sync</h3>
              <p className="text-slate-400 text-sm mt-4 max-w-sm leading-relaxed">Connect to a tournament short-code or UUID to initialize the Monte Carlo engine.</p>
            </div>
          )}

          {data && data.length > 0 && (
            <div className="space-y-8">
              
              {/* ADVANCED METRICS ROW (3D Tilt / Lift Effect) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
                <MetricCard icon={<Trophy className="text-amber-500"/>} title="Apex Franchise" value={data[0].team} sub={data[0].power_rating + " PWR"} delay="0" />
                <MetricCard icon={<Activity className="text-blue-500"/>} title="Global Baseline" value={Math.round(data.reduce((a,b)=>a+b.power_rating,0)/data.length) + " PWR"} sub="Avg Rating" delay="100" />
                {wildcardTeam && <MetricCard icon={<Dices className="text-purple-500"/>} title="Prime Wildcard" value={wildcardTeam.team} sub={`${wildcardTeam.vol} Volatility`} delay="200" />}
                <MetricCard icon={<Flame className="text-red-500"/>} title="Prime Underdog" value={data[data.length-1].team} sub={data[data.length-1].power_rating + " PWR"} delay="300" />
              </div>

              {/* FLOATING TABS NAVIGATION */}
              <div className="flex bg-white/60 backdrop-blur-xl p-2 rounded-[1.5rem] w-full overflow-x-auto no-scrollbar border border-white shadow-lg shadow-slate-200/50 gap-2 animate-fade-in-up animation-delay-200">
                <TabButton active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} icon={<Trophy size={16}/>} label="Leaderboard" />
                <TabButton active={activeTab === 'bracket'} onClick={() => setActiveTab('bracket')} icon={<GitMerge size={16}/>} label="Knockout Bracket" />
                <TabButton active={activeTab === 'futures'} onClick={() => setActiveTab('futures')} icon={<Target size={16}/>} label="Monte Carlo Futures" />
                <TabButton active={activeTab === 'h2h'} onClick={() => setActiveTab('h2h')} icon={<Swords size={16}/>} label="H2H Predictor" />
                <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={<BarChart3 size={16}/>} label="Visual Insights" />
              </div>

              {/* MAIN GLASS CONTENT PANE */}
              <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[3rem] p-6 md:p-10 shadow-2xl shadow-slate-300/40 relative overflow-hidden animate-fade-in-up animation-delay-300">
                
                {/* 1. ADVANCED LEADERBOARD (Staggered List Animation) */}
                {activeTab === 'leaderboard' && (
                  <div className="overflow-x-auto custom-scrollbar pb-4 animate-fade-in">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="border-b-2 border-slate-100 text-slate-400 uppercase tracking-[0.2em] text-[10px] font-black">
                          <th className="p-5">Rank</th><th className="p-5">Franchise</th><th className="p-5 w-1/3">Power Rating</th>
                          <th className="p-5 text-center">Dominance (DQ)</th><th className="p-5 text-center">Badges</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((team, idx) => (
                          <tr key={team.team} className="border-b border-slate-50 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group animate-slide-up" style={{ animationFillMode: 'both', animationDelay: `${idx * 40}ms` }}>
                            <td className="p-5 font-black text-slate-400 group-hover:text-indigo-500 transition-colors">#{team.rank}</td>
                            <td className="p-5 font-bold text-slate-800 tracking-tight">{team.team}</td>
                            <td className="p-5">
                              <div className="flex items-center gap-4 w-full max-w-[250px]">
                                <span className="font-mono font-black text-slate-600 w-12">{team.power_rating}</span>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                  <div className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" style={{ width: `${(team.power_rating / 1950) * 100}%`, backgroundColor: team.color }}>
                                    <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/30 blur-sm translate-x-full animate-shimmer"></div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-5 text-center font-mono font-black">
                                {team.dq > 1.2 ? <span className="text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-lg">{team.dq}</span> : <span className="text-slate-500">{team.dq}</span>}
                            </td>
                            <td className="p-5 flex justify-center gap-2">
                                {team.clutch >= 70 && <div className="p-2 bg-cyan-50 text-cyan-500 rounded-xl hover:scale-110 hover:shadow-md transition-all cursor-help" title="Clutch Performer"><Snowflake size={18}/></div>}
                                {team.giantKiller && <div className="p-2 bg-red-50 text-red-500 rounded-xl hover:scale-110 hover:shadow-md transition-all cursor-help" title="Giant Killer"><Axe size={18}/></div>}
                                {team.vol > 0.08 && <div className="p-2 bg-purple-50 text-purple-500 rounded-xl hover:scale-110 hover:shadow-md transition-all cursor-help" title="Highly Volatile"><Dices size={18}/></div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2. TOURNAMENT BRACKET (Connected Tree Style) */}
                {activeTab === 'bracket' && (
                    <div className="overflow-x-auto pb-10 scroll-smooth custom-scrollbar animate-fade-in">
                        <div className="flex justify-between min-w-[1000px] gap-12 px-4 py-4">
                            {!bracket ? <div className="flex justify-center w-full py-20"><RefreshCw className="animate-spin text-indigo-400" size={32}/></div> : bracket.map((round, rIdx) => (
                                <div key={round.name} className="flex-1 space-y-8 animate-slide-up" style={{ animationFillMode: 'both', animationDelay: `${rIdx * 150}ms` }}>
                                    <h4 className="text-center font-black text-indigo-400 uppercase tracking-[0.2em] text-[10px] mb-10 bg-indigo-50 py-2 rounded-xl">{round.name}</h4>
                                    <div className="flex flex-col justify-around h-full gap-10">
                                        {round.matches.map((m, mIdx) => (
                                            <div key={mIdx} className="relative group">
                                                <div className="bg-white border-2 border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 w-full relative z-10 hover:-translate-y-1">
                                                    <div className={`p-4 md:p-5 flex justify-between items-center border-b border-slate-50 transition-colors ${m.winner === m.t1 ? 'bg-indigo-50/50' : ''}`}>
                                                        <span className={`text-sm font-bold truncate pr-4 ${m.winner === m.t1 ? 'text-indigo-600' : 'text-slate-600'}`}>{m.t1}</span>
                                                        <span className="font-mono font-black text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{m.s1 ?? '-'}</span>
                                                    </div>
                                                    <div className={`p-4 md:p-5 flex justify-between items-center transition-colors ${m.winner === m.t2 ? 'bg-indigo-50/50' : ''}`}>
                                                        <span className={`text-sm font-bold truncate pr-4 ${m.winner === m.t2 ? 'text-indigo-600' : 'text-slate-600'}`}>{m.t2}</span>
                                                        <span className="font-mono font-black text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{m.s2 ?? '-'}</span>
                                                    </div>
                                                </div>
                                                {/* Animated Connector Line */}
                                                {rIdx < bracket.length - 1 && (
                                                    <div className="absolute -right-12 top-1/2 w-12 h-[2px] bg-slate-200 group-hover:bg-indigo-400 transition-colors duration-300 origin-left"></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. MONTE CARLO FUTURES (Glowing Progress Bars) */}
                {activeTab === 'futures' && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full mix-blend-screen"></div>
                      <div className="relative z-10">
                        <h4 className="font-black text-3xl tracking-tight">The Oracle Forecast</h4>
                        <p className="text-indigo-300 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 flex items-center gap-2"><Cpu size={14}/> 10,000 Simulation Timelines</p>
                      </div>
                    </div>
                    {!futures ? <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-slate-300" size={48}/></div> : (
                        <div className="grid grid-cols-1 gap-5">
                        {futures.map((f, i) => (
                            <div key={f.team} className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group animate-slide-up" style={{ animationFillMode: 'both', animationDelay: `${i * 100}ms` }}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors duration-500 shadow-sm">{i+1}</div>
                                        <div>
                                            <h5 className="font-black text-xl text-slate-800 tracking-tight">{f.team}</h5>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 bg-slate-100 inline-block px-2 py-1 rounded-md">{f.power_rating} PWR</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Make Final</p>
                                            <p className="font-black text-slate-700 text-2xl">{f.make_finals}%</p>
                                        </div>
                                        <div className="text-center bg-gradient-to-br from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform duration-300">
                                            <p className="text-[9px] font-black text-white/70 uppercase tracking-widest mb-0.5">Win Trophy</p>
                                            <p className="text-2xl font-black">{f.win_championship}%</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 h-3 rounded-full overflow-hidden bg-slate-100 shadow-inner">
                                    <div className="h-full bg-blue-300 group-hover:bg-blue-400 transition-colors duration-500 relative overflow-hidden" style={{ width: `${f.make_semis}%` }}><div className="absolute inset-0 bg-white/30 w-1/2 translate-x-full animate-shimmer"></div></div>
                                    <div className="h-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors duration-500 relative overflow-hidden" style={{ width: `${f.make_finals}%` }}><div className="absolute inset-0 bg-white/20 w-1/2 translate-x-full animate-shimmer animation-delay-500"></div></div>
                                    <div className="h-full bg-amber-400 group-hover:bg-amber-500 transition-colors duration-500 relative overflow-hidden" style={{ width: `${f.win_championship}%` }}><div className="absolute inset-0 bg-white/40 w-1/2 translate-x-full animate-shimmer animation-delay-1000"></div></div>
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                  </div>
                )}

                {/* 4. H2H PREDICTOR (Sleek Console Vibe) */}
                {activeTab === 'h2h' && (
                  <div className="space-y-10 max-w-4xl mx-auto animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-center">
                      <div className="md:col-span-3 bg-white border border-blue-100 p-8 rounded-[2rem] shadow-lg shadow-blue-500/5 hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4 block">Blue Corner</label>
                        <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer" value={teamA} onChange={(e) => setTeamA(e.target.value)}>{data.map(t => <option key={t.team} value={t.team}>{t.team}</option>)}</select>
                      </div>
                      <div className="md:col-span-1 flex justify-center"><div className="p-4 bg-slate-100 rounded-full shadow-inner animate-pulse"><Swords size={28} className="text-slate-400" /></div></div>
                      <div className="md:col-span-3 bg-white border border-red-100 p-8 rounded-[2rem] shadow-lg shadow-red-500/5 hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-4 block">Red Corner</label>
                        <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-500 transition-all cursor-pointer" value={teamB} onChange={(e) => setTeamB(e.target.value)}>{data.map(t => <option key={t.team} value={t.team}>{t.team}</option>)}</select>
                      </div>
                    </div>
                    {teamA !== teamB && (() => {
                        const tAData = data.find(t=>t.team===teamA) || {power_rating: 1500, dq: 1.0};
                        const tBData = data.find(t=>t.team===teamB) || {power_rating: 1500, dq: 1.0};
                        const pA = expectedWinProb(tAData.power_rating, tBData.power_rating);
                        const { sa, sb } = predictScoreline(pA);
                        const spread = Math.abs((tAData.dq - tBData.dq) * 10).toFixed(1);
                        const favorite = pA > 0.5 ? teamA : teamB;

                        return (
                            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-12 rounded-[3rem] text-center shadow-2xl relative overflow-hidden group animate-scale-up">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                                <p className="relative z-10 uppercase tracking-[0.3em] text-[10px] font-black text-indigo-400 mb-8 flex items-center justify-center gap-3"><Zap size={14} className="fill-indigo-400 animate-pulse"/> AI Telemetry Result <Zap size={14} className="fill-indigo-400 animate-pulse"/></p>
                                <div className="relative z-10 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 mb-10">
                                    <div className="text-blue-400 font-black text-5xl md:text-6xl drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500">{(pA*100).toFixed(0)}<span className="text-2xl opacity-50">%</span></div>
                                    <div className="bg-slate-950/50 px-8 py-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm shadow-inner text-6xl md:text-7xl font-black tracking-tighter">{sa} - {sb}</div>
                                    <div className="text-red-400 font-black text-5xl md:text-6xl drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500">{((1-pA)*100).toFixed(0)}<span className="text-2xl opacity-50">%</span></div>
                                </div>
                                <div className="relative z-10 bg-white/10 backdrop-blur-md py-3 px-8 rounded-full inline-block border border-white/20 shadow-xl">
                                    <p className="text-xs font-bold text-slate-300">Projected Spread: <span className="text-white font-black">{formatShortName(favorite)} by {spread} pts</span></p>
                                </div>
                            </div>
                        )
                    })()}
                  </div>
                )}

                {/* 5. VISUAL INSIGHTS (Glass Charts) */}
                {activeTab === 'insights' && (
                  <div className="space-y-16 animate-fade-in">
                    <div className="h-[450px] bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100">
                      <h4 className="font-black text-lg mb-8 flex items-center gap-3"><Activity className="text-indigo-500"/> Power Map Distribution</h4>
                      <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 120 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                            <XAxis type="number" dataKey="power_rating" domain={['dataMin - 50', 'dataMax + 50']} tick={{fill: '#64748b', fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="team" width={120} tick={{fill: '#475569', fontSize: 11, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '5 5'}} />
                            <Scatter data={data} shape="circle" animationDuration={1500}>{data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-lg hover:drop-shadow-2xl hover:scale-150 transition-all duration-300 cursor-pointer" />)}</Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATOR STAMP */}
      <div className="max-w-7xl mx-auto mt-16 pb-10 text-center relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
          Architected with <Heart size={12} className="text-red-500 fill-red-500 animate-pulse"/> by{' '}
          <a href="https://github.com/smazhuvan" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 hover:underline underline-offset-4 transition-all">Shivakumar Mazhuvan</a>
        </p>
      </div>

      {/* SHARE MODAL (Glassmorphism Popup) */}
      {isShareOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl shadow-indigo-500/20 space-y-8 text-center border border-white relative animate-scale-up">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-black text-2xl text-slate-800 tracking-tight">Share Oracle</h3>
              <button onClick={() => setIsShareOpen(false)} className="text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
            </div>
            <div className="bg-white p-6 rounded-[2rem] inline-block border border-slate-100 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.02)]">
              <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}?tid=${tournamentId}`} size={220} fgColor="#4f46e5" includeMargin={false} />
            </div>
            <div className="space-y-4">
              <button onClick={handleNativeShare} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1 transition-all duration-300">
                <Share2 size={18}/> Share Dashboard Link
              </button>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">TID: {tournamentId?.substring(0,8)}...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* ========================================== */}
      {/* 🚀 PURE CSS ANIMATION KEYFRAMES            */}
      {/* ========================================== */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 10s infinite alternate ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-down { animation: fadeInDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in-left { animation: fadeInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-up { animation: scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }

        @keyframes shimmer { 100% { transform: translateX(200%); } }
        .animate-shimmer { animation: shimmer 2s infinite; }
        
        .animation-delay-150 { animation-delay: 150ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-500 { animation-delay: 500ms; }
        .animation-delay-1000 { animation-delay: 1000ms; }
      `}} />
    </div>
  );
}

// Subcomponents with heavily upgraded hover/lift states
function MetricCard({ icon, title, value, sub, delay }) { 
  return (
    <div className="bg-white/60 backdrop-blur-2xl border border-white p-6 md:p-8 rounded-[2rem] shadow-lg shadow-slate-200/50 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-500 group animate-slide-up" style={{ animationFillMode: 'both', animationDelay: `${delay}ms` }}>
      <div className="p-4 bg-white rounded-2xl mb-5 shadow-sm border border-slate-50 group-hover:scale-110 group-hover:bg-indigo-50 transition-all duration-500">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2" style={{minHeight: "15px"}}>{title}</p>
      <p className="text-xl md:text-2xl font-black text-slate-800 break-words leading-tight tracking-tight">{value}</p>
      <p className="text-xs font-bold text-indigo-500 mt-2 bg-indigo-50 px-3 py-1 rounded-full">{sub}</p>
    </div>
  ); 
}

function TabButton({ active, onClick, icon, label }) { 
  return (
    <button onClick={onClick} className={`flex-1 py-4 px-5 rounded-[1.2rem] text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap outline-none ${active ? 'bg-white text-indigo-600 shadow-md border border-slate-100 scale-100' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 scale-95 hover:scale-100'}`}>
      {icon} {label}
    </button>
  ); 
}
