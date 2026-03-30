/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Leaf, 
  TrendingDown, 
  Wallet, 
  Award, 
  Zap, 
  Car, 
  Utensils, 
  Trash2, 
  ShoppingBag,
  ChevronRight,
  Plus,
  CheckCircle2,
  Info,
  BarChart3,
  Trophy,
  Share2,
  LineChart as LineChartIcon,
  Camera,
  MessageSquare,
  Sparkles,
  ArrowRight,
  History,
  X,
  Loader2,
  Send,
  Globe,
  Calculator,
  Users,
  Building2,
  Mic,
  MicOff,
  Link2,
  Settings,
  Languages,
  Activity,
  Heart,
  Home
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { useEcoProfile } from './hooks/useEcoProfile';
import { getEcoRecommendations, getEcoFact, scanReceipt, chatWithEcoAI, getEcoVoiceResponse } from './services/geminiService';
import { DEFAULT_ACTIONS, EcoAction, CommunityStats, CorporateStats } from './types';
import { cn } from './lib/utils';

export default function App() {
  const { profile, updateFootprint, completeAction } = useEcoProfile();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assessment' | 'actions' | 'education' | 'chat' | 'simulator' | 'community' | 'corporate'>('dashboard');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [dailyFact, setDailyFact] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Voice Coach State
  const [isListening, setIsListening] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // IoT State
  const [connectedApps, setConnectedApps] = useState<string[]>([]);

  // Community & Corporate Mock Data
  const communityStats: CommunityStats = {
    globalCO2Saved: 842500,
    activeUsers: 12450,
    currentChallenge: {
      title: "Global Meat-Free Week",
      target: 1000000,
      current: 742000,
      deadline: "2026-04-05"
    }
  };

  const corporateStats: CorporateStats = {
    companyName: "EcoCorp International",
    teamCO2Saved: 12450,
    rank: 3,
    topPerformers: [
      { name: "Sarah J.", points: 2450 },
      { name: "Mike R.", points: 2100 },
      { name: "Elena W.", points: 1950 }
    ]
  };

  // Simulator State
  const [simEV, setSimEV] = useState(false);
  const [simDiet, setSimDiet] = useState(false);
  const [simSolar, setSimSolar] = useState(false);

  useEffect(() => {
    const fetchAIContent = async () => {
      setLoadingAI(true);
      const [recs, fact] = await Promise.all([
        getEcoRecommendations(profile.footprint),
        getEcoFact()
      ]);
      setRecommendations(recs);
      setDailyFact(fact);
      setLoadingAI(false);
    };

    if (profile.footprint.transportation > 0 || activeTab === 'dashboard') {
      fetchAIContent();
    }
  }, [activeTab === 'dashboard']);

  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const [actionOfTheDay, setActionOfTheDay] = useState<EcoAction | null>(null);

  useEffect(() => {
    const handleLevelUp = (e: any) => {
      setShowLevelUp(e.detail.level);
    };
    window.addEventListener('eco-level-up', handleLevelUp);
    
    // Set a random action of the day
    const randomAction = DEFAULT_ACTIONS[Math.floor(Math.random() * DEFAULT_ACTIONS.length)];
    setActionOfTheDay(randomAction);

    return () => window.removeEventListener('eco-level-up', handleLevelUp);
  }, []);

  const handleShare = async (title: string, text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${title}: ${text} ${window.location.href}`);
      alert('Link copied to clipboard!');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const result = await scanReceipt(base64, file.type);
        setScanResult(result);
        setScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setScanning(false);
    }
  };

  const applyScan = () => {
    if (scanResult) {
      updateFootprint({
        transportation: profile.footprint.transportation + (scanResult.categories.transportation || 0),
        energy: profile.footprint.energy + (scanResult.categories.energy || 0),
        diet: profile.footprint.diet + (scanResult.categories.diet || 0),
        waste: profile.footprint.waste + (scanResult.categories.waste || 0),
        shopping: profile.footprint.shopping + (scanResult.categories.shopping || 0),
      });
      setScanResult(null);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setSendingChat(true);

    const history = chatMessages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await chatWithEcoAI(userMsg, history);
    setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    setSendingChat(false);
  };

  const handleVoiceCoach = async () => {
    setIsListening(true);
    // Simulate voice capture for demo
    setTimeout(async () => {
      setIsListening(false);
      setIsSpeaking(true);
      const audioData = await getEcoVoiceResponse("I just started using a reusable water bottle!");
      if (audioData) {
        const audio = new Audio(`data:audio/wav;base64,${audioData}`);
        audio.onended = () => setIsSpeaking(false);
        audio.play();
      } else {
        setIsSpeaking(false);
      }
    }, 2000);
  };

  const toggleIoT = (app: string) => {
    setConnectedApps(prev => prev.includes(app) ? prev.filter(a => a !== app) : [...prev, app]);
  };

  const chartData = [
    { name: 'Transport', value: profile.footprint.transportation, color: '#22c55e' },
    { name: 'Energy', value: profile.footprint.energy, color: '#3b82f6' },
    { name: 'Diet', value: profile.footprint.diet, color: '#f59e0b' },
    { name: 'Waste', value: profile.footprint.waste, color: '#ef4444' },
    { name: 'Shopping', value: profile.footprint.shopping, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const totalFootprint = Object.values(profile.footprint).reduce((a, b) => a + b, 0);
  const isProfileEmpty = totalFootprint === 0;

  return (
    <div className="min-h-screen bg-stone-50 pb-24 lg:pb-0 lg:pl-64">
      {/* Level Up Celebration */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-eco-900/80 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-10 text-center max-w-sm shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-eco-500" />
              <Trophy size={80} className="mx-auto text-amber-500 mb-6" />
              <h2 className="text-4xl font-serif font-bold text-stone-900 mb-2">Level Up!</h2>
              <p className="text-stone-500 mb-8">Congratulations! You've reached <span className="font-bold text-eco-600">Level {showLevelUp}</span>. Your commitment to the planet is inspiring.</p>
              <button 
                onClick={() => handleShare('EcoQuest Level Up!', `I just reached Level ${showLevelUp} on EcoQuest! Join me in saving the planet.`)}
                className="w-full mb-3 border-2 border-eco-100 text-eco-700 py-3 rounded-2xl font-bold hover:bg-eco-50 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 size={18} /> Share Achievement
              </button>
              <button 
                onClick={() => setShowLevelUp(null)}
                className="w-full bg-eco-600 text-white py-4 rounded-2xl font-bold hover:bg-eco-700 transition-colors"
              >
                Keep Exploring
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-white border-r border-stone-200 lg:flex flex-col">
        <div className="p-6 flex items-center gap-2">
          <div className="w-10 h-10 bg-eco-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-eco-200">
            <Leaf size={24} />
          </div>
          <h1 className="text-2xl font-serif font-bold text-eco-900">EcoQuest</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BarChart3 size={20} />} label="Dashboard" />
          <NavItem active={activeTab === 'assessment'} onClick={() => setActiveTab('assessment')} icon={<TrendingDown size={20} />} label="Assessment" />
          <NavItem active={activeTab === 'community'} onClick={() => setActiveTab('community')} icon={<Globe size={20} />} label="Global Goals" />
          <NavItem active={activeTab === 'corporate'} onClick={() => setActiveTab('corporate')} icon={<Building2 size={20} />} label="Workplace" />
          <NavItem active={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')} icon={<Sparkles size={20} />} label="Simulator" />
          <NavItem active={activeTab === 'actions'} onClick={() => setActiveTab('actions')} icon={<Award size={20} />} label="Eco Actions" />
          <NavItem active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare size={20} />} label="Eco Chat" />
          <NavItem active={activeTab === 'education'} onClick={() => setActiveTab('education')} icon={<Info size={20} />} label="Learn" />
        </nav>

        <div className="p-4 border-t border-stone-100">
          <button 
            onClick={handleVoiceCoach}
            disabled={isSpeaking}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold",
              isListening ? "bg-red-50 text-red-600 animate-pulse" : 
              isSpeaking ? "bg-eco-50 text-eco-600" : "bg-stone-50 text-stone-600 hover:bg-stone-100"
            )}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Voice Coach"}
          </button>
        </div>

        <div className="p-6 border-t border-stone-100 space-y-4">
          <div className="bg-eco-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-eco-700 uppercase tracking-wider">Level {profile.level}</span>
              <Trophy size={16} className="text-eco-600" />
            </div>
            <div className="h-2 bg-eco-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-eco-600" 
                initial={{ width: 0 }}
                animate={{ width: `${(profile.points % 500) / 5}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-eco-800 font-medium">{profile.points} Points Earned</p>
          </div>

          <div className="flex items-center justify-between px-2">
            <button className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
              <Settings size={20} />
            </button>
            <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
              <Languages size={16} />
              <span className="uppercase">{profile.language}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 lg:p-10">
        <AnimatePresence mode="wait">
          {activeTab === 'community' && (
            <motion.div
              key="community"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
                  <Users className="text-eco-600" /> Global Community
                </h2>
                <p className="text-stone-500 mt-1">Join thousands of others in the fight against climate change.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-eco-900 text-white p-10 rounded-[3rem] space-y-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-eco-400">Global Impact</span>
                  <div className="text-6xl font-serif font-bold">
                    {communityStats.globalCO2Saved.toLocaleString()} kg
                  </div>
                  <p className="text-eco-200">Total CO2 saved by the EcoQuest community this month.</p>
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex -space-x-3">
                      {[1,2,3,4].map(i => (
                        <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-10 h-10 rounded-full border-2 border-eco-900" referrerPolicy="no-referrer" />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-eco-400">+{communityStats.activeUsers.toLocaleString()} active today</span>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-stone-200 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Active Challenge</h3>
                    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">4 Days Left</span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-serif font-bold text-stone-900">{communityStats.currentChallenge.title}</h4>
                    <div className="flex justify-between text-sm font-bold text-stone-500">
                      <span>{((communityStats.currentChallenge.current / communityStats.currentChallenge.target) * 100).toFixed(0)}% Complete</span>
                      <span>{communityStats.currentChallenge.target.toLocaleString()} kg Goal</span>
                    </div>
                    <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(communityStats.currentChallenge.current / communityStats.currentChallenge.target) * 100}%` }}
                        className="h-full bg-eco-600"
                      />
                    </div>
                  </div>
                  <button className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-eco-600 transition-colors">
                    Contribute Now
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'corporate' && (
            <motion.div
              key="corporate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
                    <Building2 className="text-blue-600" /> Workplace Dashboard
                  </h2>
                  <p className="text-stone-500 mt-1">Tracking collective impact for {corporateStats.companyName}.</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm">
                  Global Rank: #{corporateStats.rank}
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[3rem] border border-stone-200">
                    <h3 className="text-xl font-bold mb-6">Team CO2 Savings</h3>
                    <div className="h-64 flex items-end gap-4">
                      {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            className="w-full bg-blue-500 rounded-t-xl"
                          />
                          <span className="text-[10px] font-bold text-stone-400">Day {i+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-stone-200 space-y-6">
                  <h3 className="text-xl font-bold">Top Contributors</h3>
                  <div className="space-y-4">
                    {corporateStats.topPerformers.map((p, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                        <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-stone-900">{p.name}</div>
                          <div className="text-xs text-stone-500">{p.points} Points</div>
                        </div>
                        <Trophy size={20} className={i === 0 ? "text-amber-500" : "text-stone-300"} />
                      </div>
                    ))}
                  </div>
                  <button className="w-full border-2 border-blue-600 text-blue-600 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-colors">
                    View Full Leaderboard
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-stone-900">Welcome back, {profile.name}</h2>
                  <p className="text-stone-500 mt-1">Your sustainability journey at a glance.</p>
                </div>
                {isProfileEmpty && (
                  <div className="flex gap-2">
                    <label className="bg-white text-stone-900 border border-stone-200 px-6 py-2.5 rounded-full font-semibold shadow-sm flex items-center gap-2 cursor-pointer hover:bg-stone-50 transition-colors">
                      <Camera size={18} /> AI Scanner
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('assessment')}
                      className="bg-eco-600 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-eco-200 flex items-center gap-2"
                    >
                      <TrendingDown size={18} /> Quick Start Assessment
                    </motion.button>
                  </div>
                )}
              </header>

              {scanning && (
                <div className="fixed inset-0 z-[110] bg-eco-900/40 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-white p-8 rounded-3xl text-center space-y-4 shadow-2xl">
                    <Loader2 className="animate-spin mx-auto text-eco-600" size={48} />
                    <h3 className="text-xl font-bold">AI Scanner Working...</h3>
                    <p className="text-stone-500">Analyzing your receipt for carbon impact.</p>
                  </div>
                </div>
              )}

              {scanResult && (
                <div className="fixed inset-0 z-[110] bg-eco-900/40 backdrop-blur-sm flex items-center justify-center p-6">
                  <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-serif font-bold">Scan Results</h3>
                      <button onClick={() => setScanResult(null)} className="p-2 hover:bg-stone-100 rounded-full"><X size={20} /></button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between p-4 bg-eco-50 rounded-2xl">
                        <span className="font-medium">Total CO2 Impact</span>
                        <span className="font-bold text-eco-700">{scanResult.totalImpact} kg</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {scanResult.items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm border-b border-stone-100 pb-2">
                            <span>{item.name}</span>
                            <span className="font-mono text-stone-500">{item.impact}kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={applyScan}
                      className="w-full bg-eco-600 text-white py-4 rounded-2xl font-bold hover:bg-eco-700 transition-colors"
                    >
                      Add to My Footprint
                    </button>
                  </div>
                </div>
              )}

              {isProfileEmpty ? (
                <div className="bg-white border-2 border-dashed border-stone-200 rounded-[2.5rem] p-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-eco-50 text-eco-600 rounded-full flex items-center justify-center mx-auto">
                    <Leaf size={40} />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="text-2xl font-serif font-bold text-stone-900">Start Your Eco Journey</h3>
                    <p className="text-stone-500">Complete your first assessment to see your impact breakdown and get personalized AI recommendations.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('assessment')}
                    className="bg-stone-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-eco-600 transition-all"
                  >
                    Begin Assessment
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard 
                    icon={<TrendingDown className="text-eco-600" />} 
                    label="Total Footprint" 
                    value={`${totalFootprint.toFixed(1)} kg`} 
                    subtext="CO2 per month"
                    color="bg-eco-50"
                  />
                  <StatCard 
                    icon={<Wallet className="text-blue-600" />} 
                    label="Potential Savings" 
                    value={`$${(totalFootprint * 0.15).toFixed(2)}`} 
                    subtext="Monthly estimate"
                    color="bg-blue-50"
                  />
                  <StatCard 
                    icon={<Zap className="text-amber-600" />} 
                    label="Eco Streak" 
                    value={`${profile.streak} Days`} 
                    subtext="Keep it up!"
                    color="bg-amber-50"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CO2 Trend Chart */}
                {!isProfileEmpty && (
                  <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm col-span-1 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <LineChartIcon size={20} className="text-eco-600" />
                      CO2 Reduction Trend
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={profile.history}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            tickFormatter={(str) => {
                              const date = new Date(str);
                              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                          />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="co2Saved" 
                            stroke="#22c55e" 
                            strokeWidth={3} 
                            dot={{ fill: '#22c55e', strokeWidth: 2, r: 4, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Action of the Day - New Section */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-900">
                        <Award size={20} className="text-eco-600" />
                        Action of the Day
                      </h3>
                      <span className="text-[10px] font-bold bg-eco-100 text-eco-700 px-2 py-1 rounded-full uppercase tracking-wider">Featured</span>
                    </div>
                    {actionOfTheDay && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-600">
                            {actionOfTheDay.category === 'transport' && <Car size={24} />}
                            {actionOfTheDay.category === 'diet' && <Utensils size={24} />}
                            {actionOfTheDay.category === 'energy' && <Zap size={24} />}
                            {actionOfTheDay.category === 'waste' && <Trash2 size={24} />}
                            {actionOfTheDay.category === 'shopping' && <ShoppingBag size={24} />}
                          </div>
                          <div>
                            <h4 className="font-bold text-stone-900">{actionOfTheDay.title}</h4>
                            <p className="text-xs text-stone-500">{actionOfTheDay.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1 bg-stone-50 p-3 rounded-2xl text-center">
                            <span className="block text-[10px] text-stone-400 font-bold uppercase">Impact</span>
                            <span className="text-sm font-bold text-eco-600">-{actionOfTheDay.impact}kg</span>
                          </div>
                          <div className="flex-1 bg-stone-50 p-3 rounded-2xl text-center">
                            <span className="block text-[10px] text-stone-400 font-bold uppercase">Points</span>
                            <span className="text-sm font-bold text-amber-600">+{actionOfTheDay.points}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleShare('EcoQuest Challenge', `I'm taking the "${actionOfTheDay.title}" challenge on EcoQuest! Join me.`)}
                      className="p-2 text-stone-400 hover:text-eco-600 transition-colors"
                    >
                      <Share2 size={18} />
                    </button>
                    <button 
                      onClick={() => setActiveTab('actions')}
                      className="mt-6 w-full py-3 border-2 border-stone-100 rounded-2xl text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                    >
                      Explore More Challenges <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Zap size={20} className="text-amber-500" />
                    AI Recommendations
                  </h3>
                  <div className="space-y-4">
                    {loadingAI ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse flex gap-4 p-4 bg-stone-50 rounded-2xl">
                          <div className="w-10 h-10 bg-stone-200 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-stone-200 rounded w-3/4" />
                            <div className="h-3 bg-stone-200 rounded w-full" />
                          </div>
                        </div>
                      ))
                    ) : recommendations.length > 0 ? (
                      recommendations.map((rec, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="group p-4 bg-stone-50 rounded-2xl hover:bg-eco-50 transition-colors cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold text-stone-900 group-hover:text-eco-700">{rec.title}</h4>
                            <span className="text-xs font-bold text-eco-600">-{rec.co2Reduction}kg</span>
                          </div>
                          <p className="text-sm text-stone-500 line-clamp-2">{rec.explanation}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-blue-600">
                            <Wallet size={12} />
                            Save ${rec.financialSavings}/mo
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-stone-400 text-center py-10">Complete your assessment to get AI tips!</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Daily Fact */}
              {dailyFact && (
                <div className="bg-eco-900 text-white p-8 rounded-[2rem] relative overflow-hidden">
                  <div className="relative z-10 max-w-lg">
                    <span className="text-eco-400 text-xs font-bold uppercase tracking-widest">Did you know?</span>
                    <p className="text-xl font-serif mt-2 leading-relaxed italic">"{dailyFact}"</p>
                  </div>
                  <Leaf className="absolute -right-8 -bottom-8 text-eco-800 opacity-50 rotate-12" size={160} />
                </div>
              )}

              {/* IoT & Voice Coach Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-stone-200 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Link2 className="text-eco-600" /> Real-World Bridge
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-eco-600 bg-eco-50 px-3 py-1 rounded-full">
                      <Activity size={14} /> {connectedApps.length} Apps Connected
                    </div>
                  </div>
                  <p className="text-stone-500 text-sm">Connect your fitness and home apps to automatically log eco-actions.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <IoTCard icon={<Activity className="text-orange-500" />} label="Strava" connected={connectedApps.includes('strava')} onClick={() => toggleIoT('strava')} />
                    <IoTCard icon={<Heart className="text-red-500" />} label="Google Fit" connected={connectedApps.includes('fit')} onClick={() => toggleIoT('fit')} />
                    <IoTCard icon={<Home className="text-blue-500" />} label="Nest" connected={connectedApps.includes('nest')} onClick={() => toggleIoT('nest')} />
                    <IoTCard icon={<Zap className="text-amber-500" />} label="Ecobee" connected={connectedApps.includes('ecobee')} onClick={() => toggleIoT('ecobee')} />
                  </div>
                </div>

                <div className="bg-eco-600 text-white p-8 rounded-[3rem] flex flex-col justify-between relative overflow-hidden group">
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Mic size={24} /> Eco-Voice Coach
                    </h3>
                    <p className="text-eco-100 text-sm mt-2">Talk to EcoQuest about your day and get instant feedback.</p>
                  </div>
                  
                  <div className="relative z-10 flex flex-col items-center gap-4 py-6">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleVoiceCoach}
                      disabled={isListening || isSpeaking}
                      className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all",
                        isListening ? "bg-red-500 animate-pulse" : isSpeaking ? "bg-blue-500" : "bg-white text-eco-600"
                      )}
                    >
                      {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                    </motion.button>
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Tap to Talk"}
                    </span>
                  </div>

                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Mic size={120} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'assessment' && (
            <motion.div
              key="assessment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-serif font-bold text-stone-900">Impact Assessment</h2>
                <p className="text-stone-500 mt-1">Estimate your monthly environmental footprint.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup 
                  icon={<Car className="text-eco-600" />} 
                  label="Transportation" 
                  description="Monthly km driven or flown"
                  value={profile.footprint.transportation}
                  onChange={(v) => updateFootprint({ transportation: v })}
                />
                <InputGroup 
                  icon={<Zap className="text-blue-600" />} 
                  label="Energy" 
                  description="Monthly kWh or heating usage"
                  value={profile.footprint.energy}
                  onChange={(v) => updateFootprint({ energy: v })}
                />
                <InputGroup 
                  icon={<Utensils className="text-amber-600" />} 
                  label="Diet" 
                  description="Meat/Dairy consumption frequency"
                  value={profile.footprint.diet}
                  onChange={(v) => updateFootprint({ diet: v })}
                />
                <InputGroup 
                  icon={<Trash2 className="text-red-600" />} 
                  label="Waste" 
                  description="Estimated weekly trash bags"
                  value={profile.footprint.waste}
                  onChange={(v) => updateFootprint({ waste: v })}
                />
                <InputGroup 
                  icon={<ShoppingBag className="text-purple-600" />} 
                  label="Shopping" 
                  description="New items purchased monthly"
                  value={profile.footprint.shopping}
                  onChange={(v) => updateFootprint({ shopping: v })}
                />
              </div>

              <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center space-y-4">
                <div className="w-16 h-16 bg-eco-100 text-eco-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold">Assessment Complete?</h3>
                <p className="text-stone-500 max-w-md mx-auto">
                  We've updated your dashboard with these estimates. Head back to see your personalized breakdown and AI tips.
                </p>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="bg-eco-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-eco-700 transition-colors shadow-lg shadow-eco-200"
                >
                  View Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'actions' && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-serif font-bold text-stone-900">Eco Challenges</h2>
                <p className="text-stone-500 mt-1">Take action and earn rewards for your planet.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEFAULT_ACTIONS.map((action) => {
                  const isCompleted = profile.completedActions.includes(action.id);
                  return (
                    <div 
                      key={action.id}
                      className={cn(
                        "p-6 rounded-3xl border transition-all flex items-start gap-4",
                        isCompleted 
                          ? "bg-eco-50 border-eco-200" 
                          : "bg-white border-stone-200 hover:border-eco-300"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                        isCompleted ? "bg-eco-200 text-eco-700" : "bg-stone-100 text-stone-400"
                      )}>
                        {action.category === 'transport' && <Car size={24} />}
                        {action.category === 'diet' && <Utensils size={24} />}
                        {action.category === 'energy' && <Zap size={24} />}
                        {action.category === 'waste' && <Trash2 size={24} />}
                        {action.category === 'shopping' && <ShoppingBag size={24} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-stone-900">{action.title}</h4>
                          <span className="text-xs font-bold text-eco-600">+{action.points} pts</span>
                        </div>
                        <p className="text-sm text-stone-500 mt-1">{action.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                              <TrendingDown size={10} /> {action.impact}kg CO2
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                              <Wallet size={10} /> ${action.savings}
                            </span>
                          </div>
                          <button
                            disabled={isCompleted}
                            onClick={() => completeAction(action.id, action.points, action.impact)}
                            className={cn(
                              "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                              isCompleted 
                                ? "bg-eco-200 text-eco-700 cursor-default" 
                                : "bg-stone-900 text-white hover:bg-eco-600"
                            )}
                          >
                            {isCompleted ? 'Completed' : 'I did this!'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'simulator' && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-serif font-bold text-stone-900">Predictive Impact Simulator</h2>
                <p className="text-stone-500 mt-1">Visualize your 5-year environmental and financial future.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                  <h3 className="text-lg font-bold">Lifestyle Changes</h3>
                  <SimToggle active={simEV} onClick={() => setSimEV(!simEV)} label="Switch to Electric Vehicle" icon={<Car size={20} />} />
                  <SimToggle active={simDiet} onClick={() => setSimDiet(!simDiet)} label="Go Plant-Based" icon={<Utensils size={20} />} />
                  <SimToggle active={simSolar} onClick={() => setSimSolar(!simSolar)} label="Install Solar Panels" icon={<Zap size={20} />} />
                </div>

                <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-stone-200 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-stone-400 uppercase">5-Year CO2 Saved</span>
                      <div className="text-4xl font-serif font-bold text-eco-600">
                        {((simEV ? 15000 : 0) + (simDiet ? 8000 : 0) + (simSolar ? 12000 : 0)).toLocaleString()} kg
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-stone-400 uppercase">5-Year Money Saved</span>
                      <div className="text-4xl font-serif font-bold text-blue-600">
                        ${((simEV ? 6000 : 0) + (simDiet ? 2500 : 0) + (simSolar ? 4500 : 0)).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { year: 'Year 1', co2: (simEV ? 3000 : 0) + (simDiet ? 1600 : 0) + (simSolar ? 2400 : 0) },
                        { year: 'Year 2', co2: (simEV ? 6000 : 0) + (simDiet ? 3200 : 0) + (simSolar ? 4800 : 0) },
                        { year: 'Year 3', co2: (simEV ? 9000 : 0) + (simDiet ? 4800 : 0) + (simSolar ? 7200 : 0) },
                        { year: 'Year 4', co2: (simEV ? 12000 : 0) + (simDiet ? 6400 : 0) + (simSolar ? 9600 : 0) },
                        { year: 'Year 5', co2: (simEV ? 15000 : 0) + (simDiet ? 8000 : 0) + (simSolar ? 12000 : 0) },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <RechartsTooltip />
                        <Bar dataKey="co2" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-[calc(100vh-12rem)] flex flex-col"
            >
              <header className="mb-6">
                <h2 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
                  <Globe className="text-blue-500" /> Eco Chat
                </h2>
                <p className="text-stone-500 mt-1">Ask anything about localized recycling, eco-products, or climate facts.</p>
              </header>

              <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-white rounded-[2rem] border border-stone-200 mb-4">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                    <MessageSquare size={48} strokeWidth={1} />
                    <p className="text-center max-w-xs">Ask me something like "How do I recycle batteries in New York?"</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn(
                    "max-w-[80%] p-4 rounded-2xl",
                    msg.role === 'user' ? "bg-eco-600 text-white ml-auto" : "bg-stone-100 text-stone-900"
                  )}>
                    {msg.text}
                  </div>
                ))}
                {sendingChat && (
                  <div className="bg-stone-100 text-stone-900 max-w-[80%] p-4 rounded-2xl animate-pulse">
                    Thinking...
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask EcoQuest..."
                  className="flex-1 bg-white border border-stone-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-eco-500"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={sendingChat}
                  className="bg-eco-600 text-white p-4 rounded-2xl hover:bg-eco-700 transition-colors disabled:opacity-50"
                >
                  <Send size={24} />
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'simulator' && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
                  <Calculator className="text-purple-500" /> Predictive Impact
                </h2>
                <p className="text-stone-500 mt-1">Simulate your future "Green Path" with major lifestyle changes.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SimToggle active={simEV} onClick={() => setSimEV(!simEV)} label="Switch to EV" icon={<Car size={20} />} />
                <SimToggle active={simDiet} onClick={() => setSimDiet(!simDiet)} label="Plant-Based Diet" icon={<Utensils size={20} />} />
                <SimToggle active={simSolar} onClick={() => setSimSolar(!simSolar)} label="Solar Panels" icon={<Zap size={20} />} />
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="text-2xl font-serif font-bold">5-Year Projection</h3>
                  <div className="space-y-4">
                    <div className="p-6 bg-eco-50 rounded-3xl">
                      <span className="text-xs font-bold text-eco-600 uppercase tracking-widest">CO2 Saved</span>
                      <div className="text-4xl font-bold text-eco-900 mt-1">
                        {((simEV ? 15000 : 0) + (simDiet ? 8000 : 0) + (simSolar ? 12000 : 0)).toLocaleString()} kg
                      </div>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-3xl">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Money Saved</span>
                      <div className="text-4xl font-bold text-blue-900 mt-1">
                        ${((simEV ? 4500 : 0) + (simDiet ? 2000 : 0) + (simSolar ? 6000 : 0)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center items-center text-center space-y-4 p-8 bg-stone-50 rounded-[2.5rem]">
                  <div className="w-20 h-20 bg-eco-600 rounded-full flex items-center justify-center text-white shadow-xl">
                    <Sparkles size={40} />
                  </div>
                  <h4 className="text-xl font-bold">Equivalent to planting</h4>
                  <div className="text-5xl font-serif font-bold text-eco-700">
                    {Math.floor(((simEV ? 15000 : 0) + (simDiet ? 8000 : 0) + (simSolar ? 12000 : 0)) / 20)}
                  </div>
                  <p className="text-stone-500">mature trees over 5 years</p>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'education' && (
            <motion.div
              key="education"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-serif font-bold text-stone-900">Eco Library</h2>
                <p className="text-stone-500 mt-1">Bite-sized guides for sustainable living.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <EduCard 
                  title="Climate Change 101" 
                  excerpt="Understanding the greenhouse effect and global warming."
                  image="https://picsum.photos/seed/climate/400/300"
                />
                <EduCard 
                  title="Zero Waste Living" 
                  excerpt="Simple steps to reduce your daily waste to near zero."
                  image="https://picsum.photos/seed/waste/400/300"
                />
                <EduCard 
                  title="Renewable Energy" 
                  excerpt="How solar, wind, and hydro are changing the world."
                  image="https://picsum.photos/seed/energy/400/300"
                />
                <EduCard 
                  title="Circular Economy" 
                  excerpt="Moving away from the 'take-make-dispose' model."
                  image="https://picsum.photos/seed/circular/400/300"
                />
                <EduCard 
                  title="Sustainable Diet" 
                  excerpt="How your food choices impact the planet's health."
                  image="https://picsum.photos/seed/food/400/300"
                />
                <EduCard 
                  title="Eco-Friendly Travel" 
                  excerpt="Reducing your carbon footprint while exploring the world."
                  image="https://picsum.photos/seed/travel/400/300"
                />
              </div>

              <div className="bg-blue-900 text-white p-10 rounded-[3rem] space-y-6">
                <div className="max-w-2xl">
                  <h3 className="text-2xl font-serif font-bold">Localized Sustainability Guide</h3>
                  <p className="text-blue-200 mt-2">Sustainability looks different everywhere. Here's how to adapt your actions based on your region's infrastructure and climate.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-800/50 p-6 rounded-2xl border border-blue-700">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <Trash2 size={18} /> Recycling Rules
                    </h4>
                    <p className="text-sm text-blue-100">Check your local municipality's specific guidelines. Many regions now accept soft plastics or have dedicated composting programs.</p>
                  </div>
                  <div className="bg-blue-800/50 p-6 rounded-2xl border border-blue-700">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <Zap size={18} /> Energy Grid
                    </h4>
                    <p className="text-sm text-blue-100">Depending on your local grid's mix, using appliances during off-peak hours can significantly reduce your indirect carbon impact.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 flex justify-around p-4 lg:hidden z-50">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BarChart3 size={24} />} />
        <MobileNavItem active={activeTab === 'community'} onClick={() => setActiveTab('community')} icon={<Globe size={24} />} />
        <MobileNavItem active={activeTab === 'corporate'} onClick={() => setActiveTab('corporate')} icon={<Building2 size={24} />} />
        <MobileNavItem active={activeTab === 'actions'} onClick={() => setActiveTab('actions')} icon={<Award size={24} />} />
        <MobileNavItem active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare size={24} />} />
        <MobileNavItem active={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')} icon={<Sparkles size={24} />} />
      </nav>
    </div>
  );
}

function IoTCard({ icon, label, connected, onClick }: { icon: React.ReactNode, label: string, connected: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-6 rounded-3xl border transition-all flex flex-col items-center gap-3",
        connected ? "bg-eco-50 border-eco-200" : "bg-white border-stone-100 hover:border-eco-200"
      )}
    >
      <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center">{icon}</div>
      <span className="font-bold text-stone-900">{label}</span>
      <span className={cn("text-[10px] font-bold uppercase", connected ? "text-eco-600" : "text-stone-400")}>
        {connected ? "Connected" : "Connect"}
      </span>
    </button>
  );
}

function SimToggle({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-6 rounded-3xl border transition-all flex items-center gap-4",
        active ? "bg-eco-600 text-white border-eco-600 shadow-lg shadow-eco-200" : "bg-white text-stone-600 border-stone-200 hover:border-eco-300"
      )}
    >
      <div className={cn("p-2 rounded-xl", active ? "bg-white/20" : "bg-stone-50")}>{icon}</div>
      <span className="font-bold">{label}</span>
    </button>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
        active 
          ? "bg-eco-50 text-eco-700 shadow-sm shadow-eco-100" 
          : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
      )}
    >
      {icon}
      <span>{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-eco-600" />}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-2 rounded-2xl transition-all",
        active ? "text-eco-600 bg-eco-50" : "text-stone-400"
      )}
    >
      {icon}
    </button>
  );
}

function StatCard({ icon, label, value, subtext, color }: { icon: React.ReactNode, label: string, value: string, subtext: string, color: string }) {
  return (
    <div className={cn("p-6 rounded-3xl border border-stone-200 shadow-sm", color)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white rounded-xl shadow-sm">{icon}</div>
        <span className="text-sm font-semibold text-stone-600">{label}</span>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-stone-900">{value}</div>
        <div className="text-xs text-stone-500">{subtext}</div>
      </div>
    </div>
  );
}

function InputGroup({ icon, label, description, value, onChange }: { icon: React.ReactNode, label: string, description: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-stone-50 rounded-xl">{icon}</div>
        <div>
          <h4 className="font-bold text-stone-900">{label}</h4>
          <p className="text-xs text-stone-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <input 
          type="range" 
          min="0" 
          max="1000" 
          step="10"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-eco-600"
        />
        <span className="w-16 text-right font-mono font-bold text-eco-700">{value}</span>
      </div>
    </div>
  );
}

function EduCard({ title, excerpt, image }: { title: string, excerpt: string, image: string }) {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden group cursor-pointer hover:shadow-md transition-all">
      <div className="h-40 overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
      </div>
      <div className="p-6">
        <h4 className="font-bold text-lg mb-2 group-hover:text-eco-600 transition-colors">{title}</h4>
        <p className="text-sm text-stone-500 line-clamp-2">{excerpt}</p>
        <div className="mt-4 flex items-center text-eco-600 text-xs font-bold uppercase tracking-wider">
          Read More <ChevronRight size={14} className="ml-1" />
        </div>
      </div>
    </div>
  );
}
