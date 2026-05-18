import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PieChart as PieChartIcon, 
  BookOpen, 
  Globe, 
  Settings, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Plus, 
  Pencil,
  Trash2,
  Download,
  Search,
  MessageSquare,
  Trophy,
  Target,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Cell,
  Pie
} from 'recharts';
import type { Asset, UserProfile, LearningSnippet, MarketNews, MarketData, SocialSentiment } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const StatCard = ({ title, value, change, icon: Icon }: { title: string; value: string; change?: string; icon: any }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <div className="p-1.5 bg-slate-50 rounded-lg">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      {change && (
        <span className={cn(
          "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1",
          change.startsWith('+') ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
        )}>
          {change.startsWith('+') ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
          {change}
        </span>
      )}
    </div>
    <p className="label-xs">{title}</p>
    <p className="text-xl font-bold mt-0.5 text-slate-900">{value}</p>
  </div>
);

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-4">
    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
      {title}
      {subtitle && <span className="text-[10px] font-normal text-slate-400">{subtitle}</span>}
    </h2>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('robo_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [portfolio, setPortfolio] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('robo_portfolio');
    return saved ? JSON.parse(saved) : [];
  });
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [snippet, setSnippet] = useState<LearningSnippet | null>(null);
  const [news, setNews] = useState<MarketNews[]>([]);
  const [socialData, setSocialData] = useState<SocialSentiment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [fetchingInsights, setFetchingInsights] = useState(false);
  const [showSetup, setShowSetup] = useState(!user);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const fetchInsights = async () => {
    setFetchingInsights(true);
    try {
      const res = await fetch('/api/portfolio-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio, goals: user?.goal })
      });
      const data = await res.json();
      setInsights(data.analysis);
    } catch (e) {
      setInsights("Unable to reach advisor. Check your internet connection.");
    }
    setFetchingInsights(false);
  };

  useEffect(() => {
    if (portfolio.length > 0 && activeTab === 'Insights' && !insights) {
      fetchInsights();
    }
  }, [activeTab, portfolio]);
  useEffect(() => {
    fetchMarketData();
    fetchLearningSnippet();
    fetchNews();
    fetchSocialData();
    const interval = setInterval(() => {
      fetchMarketData();
      fetchSocialData();
    }, 30000); // 30s updates
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    const res = await fetch('/api/market-data');
    const data = await res.json();
    setMarketData(data);
  };

  const fetchLearningSnippet = async () => {
    const res = await fetch('/api/learning-snippet');
    const data = await res.json();
    setSnippet(data);
  };

  const fetchNews = async () => {
    const res = await fetch('/api/market-news');
    const data = await res.json();
    setNews(data);
  };

  const fetchSocialData = async () => {
    const res = await fetch('/api/social-sentiment');
    const data = await res.json();
    setSocialData(data);
  };

  const saveUser = (u: UserProfile) => {
    setUser(u);
    localStorage.setItem('robo_user', JSON.stringify(u));
    setShowSetup(false);
  };

  const addAsset = (a: Asset) => {
    const newPort = [...portfolio, a];
    setPortfolio(newPort);
    localStorage.setItem('robo_portfolio', JSON.stringify(newPort));
  };

  const updateAsset = (a: Asset) => {
    const newPort = portfolio.map(p => p.id === a.id ? a : p);
    setPortfolio(newPort);
    localStorage.setItem('robo_portfolio', JSON.stringify(newPort));
  };

  const deleteAsset = (id: string) => {
    const newPort = portfolio.filter(p => p.id !== id);
    setPortfolio(newPort);
    localStorage.setItem('robo_portfolio', JSON.stringify(newPort));
  };

  const totalValue = portfolio.reduce((acc, curr) => acc + (curr.quantity * curr.currentPrice), 0);
  const totalCost = portfolio.reduce((acc, curr) => acc + (curr.quantity * curr.averagePrice), 0);
  const profitLoss = totalValue - totalCost;
  const plPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

  if (showSetup) {
    return <SetupWizard onComplete={saveUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 lg:pb-0 lg:pl-56">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-slate-900 text-slate-400 border-r border-slate-800 p-4 z-40">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
            <TrendingUp strokeWidth={3} className="w-5 h-5" />
          </div>
          <span className="text-white font-bold tracking-tight">AlgoWealth v2</span>
        </div>

        <nav className="space-y-1">
          <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Portfolio</div>
          {[
            { name: 'Overview', icon: LayoutDashboard },
            { name: 'Portfolio', icon: Wallet },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-all duration-200",
                activeTab === item.name 
                  ? "bg-slate-800 text-white font-semibold" 
                  : "hover:bg-slate-800/50 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
          
          <div className="px-4 py-2 mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Intelligence</div>
          {[
            { name: 'Education', icon: BookOpen },
            { name: 'Markets', icon: Globe },
            { name: 'Sentiment', icon: MessageSquare },
            { name: 'Insights', icon: Target },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-all duration-200",
                activeTab === item.name 
                  ? "bg-slate-800 text-white font-semibold" 
                  : "hover:bg-slate-800/50 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 flex flex-col gap-2">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="text-[10px] text-emerald-400 font-mono mb-1 tracking-tighter">SECURE SYSTEM</div>
            <div className="text-[10px] text-slate-400 leading-tight">MFA Active • E2E Encrypted Session</div>
          </div>
          <div className="p-4">
             <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] font-bold text-slate-500 uppercase">Emergency Fund</span>
               <span className="text-[10px] font-mono text-indigo-400">82%</span>
             </div>
             <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full" style={{ width: '82%' }}></div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-4 lg:p-6 max-w-full lg:max-w-screen-2xl mx-auto flex flex-col gap-4">
        <header className="h-14 flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 shadow-sm shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="label-xs">Total Wealth</span>
              <span className="text-xl font-bold leading-tight tracking-tight">${totalValue.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="label-xs">Global Status</span>
              <span className={cn(
                "text-xs font-semibold font-mono",
                plPercentage >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {plPercentage >= 0 ? '+' : ''}{plPercentage.toFixed(2)}% Performance
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex gap-2 text-[10px] font-mono">
               <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">BTC: $64,210</span>
               <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">USD/JPY: 148.20</span>
             </div>
             <button onClick={() => exportToCSV(portfolio)} className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium text-xs hover:bg-indigo-700 transition-colors shadow-sm">
               Export CSV
             </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'Overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Net Worth" value={`$${totalValue.toLocaleString()}`} change={`+${plPercentage.toFixed(2)}%`} icon={Wallet} />
                  <StatCard title="Invested" value={`$${totalCost.toLocaleString()}`} icon={Target} />
                  <StatCard title="Total Gains" value={`$${profitLoss.toLocaleString()}`} change={profitLoss >= 0 ? `+${profitLoss}` : `${profitLoss}`} icon={TrendingUp} />
                  <StatCard title="Risk Meter" value={user?.riskTolerance || 'Medium'} icon={ShieldCheck} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold flex items-center gap-2">Consolidated Performance <span className="text-[10px] font-normal text-slate-400 font-sans">Interactive 7-Day View</span></h3>
                      <div className="flex gap-1 overflow-x-auto">
                        {['1H', '1D', '1M', '1Y'].map(t => (
                          <button key={t} className="w-10 h-5 flex items-center justify-center text-[10px] border border-slate-200 rounded hover:bg-slate-50 transition-colors uppercase font-bold tracking-tighter">{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={marketData[0]?.history || []}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="time" hide />
                          <YAxis hide />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontSize: '10px' }} />
                          <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold mb-4">Asset Allocation</h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={portfolio.length > 0 ? portfolio : [{ name: 'Empty', value: 1 }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="type"
                          >
                            <Cell fill="#4f46e5" />
                            <Cell fill="#3b82f6" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1 mt-2">
                       {['Stock', 'Crypto', 'Commodity', 'Forex'].map((label, idx) => (
                        <div key={label} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-50 last:border-none">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: ['#4f46e5', '#3b82f6', '#f59e0b', '#ef4444'][idx] }}></div>
                            <span className="text-slate-500 font-bold uppercase tracking-tighter">{label}</span>
                          </div>
                          <span className="font-mono text-slate-700">{portfolio.filter(p => p.type === label).length > 0 ? 'Active' : 'Empty'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Portfolio' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
                  <div className="flex flex-col">
                    <span className="label-xs mb-0.5">Asset Summary</span>
                    <span className="text-xs text-slate-500">Wealth spread across <span className="font-bold text-slate-900">{Array.from(new Set(portfolio.map(p => p.brokerage))).length}</span> institutions.</span>
                  </div>
                  <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium text-xs hover:bg-indigo-700 transition-colors shadow-sm">
                    Connect New Institution
                  </button>
                </div>
                
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="p-3 label-xs">Asset</th>
                          <th className="p-3 label-xs">Type</th>
                          <th className="p-3 label-xs">Balance</th>
                          <th className="p-3 label-xs text-right">Value</th>
                          <th className="p-3 label-xs">Institution</th>
                          <th className="p-3 label-xs text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {portfolio.map((asset) => (
                          <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-6 h-6 rounded flex items-center justify-center text-[10px] text-white font-bold",
                                  asset.type === "Stock" ? "bg-indigo-500" : asset.type === "Crypto" ? "bg-blue-500" : asset.type === "Commodity" ? "bg-amber-500" : "bg-emerald-500"
                                )}>
                                  {asset.symbol[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold leading-tight">{asset.symbol}</span>
                                  <span className="text-[10px] text-slate-400">{asset.name}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                               <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{asset.type}</span>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-mono font-bold">{asset.quantity} units</span>
                                <span className="text-[10px] text-slate-400">@ ${asset.averagePrice}</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex flex-col">
                                <span className="text-xs font-mono font-bold">${(asset.quantity * asset.currentPrice).toLocaleString()}</span>
                                <span className={cn(
                                  "text-[10px] font-bold",
                                  asset.currentPrice >= asset.averagePrice ? "text-emerald-500" : "text-rose-500"
                                )}>
                                  {asset.currentPrice >= asset.averagePrice ? "▲" : "▼"} {Math.abs((asset.currentPrice - asset.averagePrice) / asset.averagePrice * 100).toFixed(2)}%
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                {asset.brokerage}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex justify-end gap-1">
                                <button 
                                  onClick={() => { setEditingAsset(asset); setShowAddModal(true); }}
                                  className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => { if(confirm("Remove this asset?")) deleteAsset(asset.id); }}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {portfolio.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-10 text-center text-slate-400 text-xs italic">
                              No institutions connected. Add your first brokerage account to begin.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Education' && snippet && (
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <BookOpen className="w-16 h-16 text-indigo-600" />
                  </div>
                  <span className="label-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 italic">Learning Lab • Day 12</span>
                  <h2 className="text-xl font-bold mt-3 mb-6 leading-tight">{snippet.title}</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4">
                        <h4 className="label-xs text-indigo-500 mb-2">The Analogy</h4>
                        <p className="text-sm text-indigo-900 leading-relaxed font-serif italic">
                          "{snippet.analogy}"
                        </p>
                      </div>

                      <div className="bg-slate-900 rounded-lg p-4 font-mono shadow-inner border border-slate-800">
                        <h4 className="text-[10px] text-slate-500 font-bold uppercase mb-2">Mental Exercise</h4>
                        <pre className="text-xs text-white whitespace-pre-wrap leading-relaxed">{snippet.example}</pre>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="label-xs text-slate-500">Quick Concept Checks</h4>
                      <div className="space-y-3">
                        {snippet.checks.map((check, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs font-bold mb-2">{i+1}. {check.question}</p>
                            <div className="grid grid-cols-1 gap-1.5">
                              {check.options.map((opt, oi) => (
                                <button key={oi} className="text-left px-3 py-1.5 text-[10px] rounded border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-all font-medium">
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Markets' && (
              <div className="space-y-4">
                <SectionTitle title="Market Intelligence" subtitle="Real-time global feeds & sentiment" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {marketData.map((asset) => (
                    <div key={asset.symbol} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-black tracking-tighter">{asset.symbol}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Global Equity</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold">${asset.price}</p>
                          <p className={cn("text-[10px] font-bold font-mono", parseFloat(asset.change) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {parseFloat(asset.change) >= 0 ? '▲' : '▼'}{Math.abs(parseFloat(asset.change))}%
                          </p>
                        </div>
                      </div>
                      <div className="h-16 mb-3 opacity-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={asset.history}>
                            <Area type="monotone" dataKey="value" stroke={parseFloat(asset.change) >= 0 ? "#10b981" : "#ef4444"} fill="transparent" strokeWidth={1.5} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <button className="w-full py-2 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-bold text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all">Setup Alert</button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold mb-4 flex items-center justify-between">
                      Breaking Headlines
                      <span className="text-[10px] font-normal text-slate-400">Powered by Gemini AI</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {news.map((n, i) => (
                        <div key={i} className="flex gap-3 items-start group cursor-pointer border-l-2 border-slate-100 pl-3 hover:border-indigo-500 transition-all">
                          <div className="flex-1">
                            <h4 className="text-[11px] font-bold leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{n.title}</h4>
                            <div className="flex gap-2 text-[9px] font-bold text-slate-400 mt-1">
                              <span>{n.source}</span>
                              <span className={cn(
                                "font-mono",
                                n.sentiment === 'Bullish' ? "text-emerald-500" : n.sentiment === 'Bearish' ? "text-rose-500" : "text-slate-400"
                              )}>{n.sentiment}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="lg:col-span-4 bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Sentiment Engine</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                          <span>Market Fear</span>
                          <span className="text-emerald-400">Extreme Greed (74)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full w-[74%] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        </div>
                      </div>
                    </div>
                    <button className="mt-6 w-full py-2 bg-indigo-600 text-white rounded font-bold text-[10px] hover:bg-indigo-700 transition-all">Full Analysis</button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'Insights' && (
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                      <TrendingUp strokeWidth={3} className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold tracking-tight">AI Portfolio Intelligence</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-12">
                      {fetchingInsights ? (
                        <div className="animate-pulse space-y-3">
                          <div className="h-2 bg-slate-800 rounded w-3/4"></div>
                          <div className="h-2 bg-slate-800 rounded w-full"></div>
                        </div>
                      ) : (
                        <div className="bg-slate-800/50 p-5 rounded-lg border border-slate-700">
                          <h4 className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-2 italic">Strategic Outlook</h4>
                          <p className="text-xs leading-relaxed text-slate-300 font-serif whitespace-pre-wrap italic">"{insights || "Analyze your portfolio for personalized insights."}"</p>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-4 space-y-2">
                       {[{ label: 'Risk Rating', val: 'MODERATE', color: 'text-amber-400' },
                         { label: 'Rebalance', val: 'DUE', color: 'text-rose-400' },
                         { label: 'Cost Basis', val: 'OPTIMAL', color: 'text-emerald-400' }
                       ].map(stat => (
                         <div key={stat.label} className="bg-slate-800/30 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                           <span className="text-[9px] font-bold text-slate-500 uppercase">{stat.label}</span>
                           <span className={cn("text-xs font-black font-mono", stat.color)}>{stat.val}</span>
                         </div>
                       ))}
                    </div>

                    <div className="lg:col-span-8 flex flex-col gap-3">
                      <h4 className="text-[10px] text-slate-500 font-bold uppercase p-1">Active Micro-Goals</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {["Allocate $200 Int'l", "Set Stop-Loss BTC", "Sync External Schwab", "Diversify Tech Weight"].map((goal, i) => (
                           <div key={i} className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center gap-3 group cursor-pointer hover:bg-indigo-500/20 transition-all">
                             <div className="w-5 h-5 rounded-full border border-indigo-500/30 flex items-center justify-center text-[9px] font-bold text-indigo-400">{i+1}</div>
                             <p className="text-[11px] font-bold text-indigo-100">{goal}</p>
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Sentiment' && socialData && (
              <div className="space-y-4">
                <SectionTitle title="Social Intelligence" subtitle="Tracking global buzz & asset sentiment" />
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Main Sentiment Meter */}
                  <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="label-xs mb-6">Global Buzz Score</h3>
                      <div className="relative h-48 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="text-4xl font-black tracking-tighter">{socialData.globalScore}</div>
                           <div className="absolute bottom-10 text-[10px] uppercase font-bold text-slate-400">Heat Level</div>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[{ value: socialData.globalScore }, { value: 100 - socialData.globalScore }]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={75}
                              startAngle={180}
                              endAngle={0}
                              dataKey="value"
                            >
                              <Cell fill="#4f46e5" />
                              <Cell fill="#f1f5f9" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-bold">
                         <span className="text-slate-400">SIGNAL</span>
                         <span className="text-indigo-500">ACCUMULATING</span>
                       </div>
                       <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full w-[65%]"></div>
                       </div>
                    </div>
                  </div>

                  {/* Sentiment History */}
                  <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="label-xs mb-4">Historical Momentum</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={socialData.historicalSentiment}>
                          <defs>
                            <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={[0, 100]} hide />
                          <Tooltip contentStyle={{ fontSize: '10px' }} />
                          <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSentiment)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Trending Assets */}
                  <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {socialData.trendingAssets.map((asset) => (
                      <div key={asset.symbol} className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-black">{asset.symbol}</span>
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                            asset.sentiment === 'Bullish' ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          )}>{asset.sentiment}</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <div className="flex flex-col">
                             <span className="text-[10px] text-slate-500 font-bold uppercase">Mentions</span>
                             <span className="text-xs font-mono">{(asset.mentions / 1000).toFixed(1)}K</span>
                           </div>
                           <TrendingUp className={cn("w-4 h-4", asset.sentiment === 'Bullish' ? "text-emerald-500" : "text-rose-500")} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Key Narratives */}
                  <div className="lg:col-span-12 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="label-xs mb-3">Trending Narratives</h3>
                    <div className="flex flex-wrap gap-2">
                      {socialData.topKeywords.map(word => (
                        <span key={word} className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full border border-slate-200 hover:bg-slate-200 transition-colors uppercase tracking-tight">#{word}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center p-3 lg:hidden z-50">
        {[
          { name: 'Overview', icon: LayoutDashboard },
          { name: 'Portfolio', icon: Wallet },
          { name: 'Education', icon: BookOpen },
          { name: 'Markets', icon: Globe },
          { name: 'Sentiment', icon: MessageSquare },
          { name: 'Insights', icon: Target },
        ].map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveTab(item.name)}
            className={cn(
              "flex flex-col items-center justify-center gap-1",
              activeTab === item.name ? "text-indigo-400" : "text-slate-500"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-[9px] font-bold uppercase tracking-tight">{item.name}</span>
          </button>
        ))}
      </nav>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                {editingAsset ? <Pencil className="w-4 h-4 text-indigo-600" /> : <Plus className="w-4 h-4 text-indigo-600" />}
                {editingAsset ? "Edit Asset" : "Connect Institution"}
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const asset = {
                  id: editingAsset ? editingAsset.id : Math.random().toString(36).substr(2, 9),
                  symbol: formData.get('symbol') as string,
                  name: formData.get('name') as string,
                  type: formData.get('type') as any,
                  quantity: parseFloat(formData.get('quantity') as string),
                  averagePrice: parseFloat(formData.get('price') as string),
                  currentPrice: editingAsset ? editingAsset.currentPrice : parseFloat(formData.get('price') as string),
                  brokerage: formData.get('brokerage') as string,
                };
                if (editingAsset) {
                  updateAsset(asset);
                } else {
                  addAsset(asset);
                }
                setEditingAsset(null);
                setShowAddModal(false);
              }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="label-xs">Ticker Symbol</label>
                    <input name="symbol" required defaultValue={editingAsset?.symbol} placeholder="AAPL" className="w-full p-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="label-xs">Asset Class</label>
                    <select name="type" defaultValue={editingAsset?.type || "Stock"} className="w-full p-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none">
                      <option>Stock</option>
                      <option>Crypto</option>
                      <option>Commodity</option>
                      <option>Forex</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="label-xs">Full Name</label>
                  <input name="name" required defaultValue={editingAsset?.name} placeholder="Apple Inc." className="w-full p-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="label-xs">Units Held</label>
                    <input name="quantity" type="number" step="any" required defaultValue={editingAsset?.quantity} placeholder="10.00" className="w-full p-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="label-xs">Entry Price</label>
                    <input name="price" type="number" step="any" required defaultValue={editingAsset?.averagePrice} placeholder="150.00" className="w-full p-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="label-xs">Platform (Brokerage)</label>
                  <input name="brokerage" required defaultValue={editingAsset?.brokerage} placeholder="Fidelity, Binance, etc." className="w-full p-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => { setEditingAsset(null); setShowAddModal(false); }} className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700 shadow-sm transition-colors">
                    {editingAsset ? "Save Changes" : "Sync Asset"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Setup Wizard ---

function SetupWizard({ onComplete }: { onComplete: (u: UserProfile) => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<UserProfile>>({
    currency: 'USD',
    riskTolerance: 'Medium',
    targetAmount: 100000,
    knowledgeLevel: 'Beginner'
  });

  const getSuggestedAllocation = () => {
    switch (data.riskTolerance) {
      case 'Low':
        return [
          { type: 'Stock', value: 70, color: '#4f46e5' },
          { type: 'Commodity', value: 20, color: '#f59e0b' },
          { type: 'Forex', value: 10, color: '#10b981' },
        ];
      case 'High':
        return [
          { type: 'Stock', value: 30, color: '#4f46e5' },
          { type: 'Crypto', value: 60, color: '#3b82f6' },
          { type: 'Commodity', value: 10, color: '#f59e0b' },
        ];
      default:
        return [
          { type: 'Stock', value: 60, color: '#4f46e5' },
          { type: 'Crypto', value: 20, color: '#3b82f6' },
          { type: 'Commodity', value: 15, color: '#f59e0b' },
          { type: 'Forex', value: 5, color: '#10b981' },
        ];
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-md w-full space-y-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-500/20">
               <TrendingUp className="w-6 h-6" strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Deploying Intelligent Capital.</h1>
              <p className="text-slate-400 mt-2 text-sm">RoboWealth v2 specialized interface. Authenticated session active.</p>
            </div>
            <button onClick={() => setStep(2)} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/50">Initialize Setup <ChevronRight className="inline w-4 h-4 ml-1" /></button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="max-w-sm w-full space-y-6">
            <h2 className="text-xl font-bold italic font-serif">"Identify yourself."</h2>
            <input 
              autoFocus
              type="text" 
              placeholder="Display Name" 
              className="w-full p-3 text-lg font-bold bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-center"
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
            <button onClick={() => setStep(3)} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm">PROCEED</button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="max-w-sm w-full space-y-6">
            <h2 className="text-xl font-bold">Select Growth Objective</h2>
            <div className="grid grid-cols-1 gap-2">
              {['Retirement', 'Home Purchase', 'Education', 'Wealth Building'].map(goal => (
                <button 
                  key={goal}
                  onClick={() => { setData({ ...data, goal }); setStep(4); }}
                  className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-left hover:border-indigo-500 hover:bg-slate-700 transition-all flex justify-between items-center"
                >
                  {goal}
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="max-w-sm w-full space-y-6">
            <h2 className="text-xl font-bold">Experience Level</h2>
            <div className="grid grid-cols-1 gap-2">
              {[
                { l: 'Beginner', d: 'New to investing' },
                { l: 'Intermediate', d: 'Know the basics' },
                { l: 'Advanced', d: 'Active trader' }
              ].map(item => (
                <button 
                  key={item.l}
                  onClick={() => { setData({ ...data, knowledgeLevel: item.l as any }); setStep(5); }}
                  className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-left hover:border-indigo-500 hover:bg-slate-700 transition-all"
                >
                  <p className="text-sm font-bold">{item.l}</p>
                  <p className="text-[10px] text-slate-500">{item.d}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="s5" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="max-w-md w-full space-y-6 text-left">
            <div className="bg-indigo-900/50 p-6 rounded-xl border border-indigo-500/30">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" /> Risk Psychology
              </h2>
              <div className="space-y-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">The Carousel Analogy</p>
                  <p className="text-xs italic text-slate-300 font-serif leading-relaxed">
                    "Investing is like an amusement park. Low risk is the carousel—smooth but slow. High risk is the 100ft drop coaster—thrilling but stomach-turning."
                  </p>
                </div>
                
                <div className="bg-slate-950 p-4 rounded-lg font-mono">
                  <p className="text-[10px] text-slate-500 mb-2">// Sample Logic</p>
                  <pre className="text-[10px] text-indigo-300">
{`function assess(volatility) {
  if (volatility < 0.1) return 'Low';
  if (volatility < 0.3) return 'Med';
  return 'High';
}`}
                  </pre>
                </div>

                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-slate-500 uppercase">Knowledge Check</p>
                   {["Market crash impact?", "Crypto vs Bonds?", "Night sleep test?"].map((q, i) => (
                     <div key={i} className="flex items-center gap-2 text-[10px] text-slate-400">
                       <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[8px]">{i+1}</div>
                       <span>{q}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
            
            <h2 className="text-lg font-bold text-center">Set Your Risk Strategy</h2>
            <div className="flex justify-between gap-3">
              {['Low', 'Medium', 'High'].map(r => (
                <button 
                  key={r}
                  onClick={() => { setData({ ...data, riskTolerance: r as any }); setStep(6); }}
                  className="flex-1 p-3 rounded-lg border border-slate-700 bg-slate-800 font-bold text-center hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all flex flex-col items-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5 mb-1" />
                  <span className="text-[10px] uppercase tracking-widest">{r}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div key="s6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-md w-full space-y-6">
            <h2 className="text-xl font-bold">Suggested Initial Allocation</h2>
            <p className="text-xs text-slate-400">Based on your {data.riskTolerance} risk profile and {data.goal} goal.</p>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <div className="h-48 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getSuggestedAllocation()}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getSuggestedAllocation().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: 'white', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {getSuggestedAllocation().map(item => (
                  <div key={item.type} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-[10px] uppercase font-bold">{item.type}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-400">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => onComplete(data as UserProfile)} 
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-900/50"
            >
              FINALIZE & DEPLOY
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Utils ---

function exportToCSV(data: Asset[]) {
  const headers = "Symbol,Name,Type,Quantity,Avg Price,Current Price,Brokerage\n";
  const rows = data.map(a => `${a.symbol},${a.name},${a.type},${a.quantity},${a.averagePrice},${a.currentPrice},${a.brokerage}`).join('\n');
  const blob = new Blob([headers + rows], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'portfolio.csv');
  a.click();
}
