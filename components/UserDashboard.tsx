import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { WorkoutPlan, WorkoutLog } from '../types';
import { api } from '../services/api';
import WorkoutCreator from './WorkoutCreator';
import WorkoutLogger from './WorkoutLogger';
import WorkoutHistory from './WorkoutHistory';
import Evolution from './Evolution';
import { ClipboardListIcon, HistoryIcon, PlusIcon, ChartBarIcon, BoltIcon, LogoutIcon, UserIcon } from './Icons';
import { generateUUID } from '../utils/uuid';

type View = 'creator' | 'logger' | 'history' | 'evolution';

interface UserDashboardProps {
    currentUser: string;
    onLogout: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onLogout }) => {
  const [view, setView] = useState<View>('logger');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount or user change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [plans, logs] = await Promise.all([
          api.getPlans(currentUser),
          api.getLogs(currentUser)
        ]);
        setWorkoutPlans(plans);
        setWorkoutLogs(logs);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  // For Date and Time
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
      const timer = setInterval(() => {
          setCurrentDateTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
  });

  const formattedTime = currentDateTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
  });

  // For Motivational Phrase
  const motivationalQuotes = useMemo(() => [
      "A dor que você sente hoje é a força que você sentirá amanhã.",
      "O corpo alcança o que a mente acredita.",
      "A única má sessão de treino é aquela que não aconteceu.",
      "Seja mais forte que sua melhor desculpa.",
      "O suor é a gordura chorando.",
      "A disciplina é a ponte entre metas e realizações."
  ], []);

  const motivationalQuote = useMemo(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)], [motivationalQuotes]);

  const addWorkoutPlan = useCallback(async (plan: Omit<WorkoutPlan, 'id'>) => {
    const newPlan = { ...plan, id: generateUUID() };
    try {
      await api.createPlan(currentUser, newPlan);
      setWorkoutPlans(prevPlans => [newPlan, ...prevPlans]); // Prepend for immediate feedback, though fetch order is DESC
      setView('logger');
    } catch (error) {
      console.error("Failed to add plan", error);
      alert("Erro ao salvar o plano. Tente novamente.");
    }
  }, [currentUser]);

  const updateWorkoutPlan = useCallback(async (updatedPlan: WorkoutPlan) => {
    try {
      await api.updatePlan(updatedPlan);
      setWorkoutPlans(prevPlans =>
          prevPlans.map(p => (p.id === updatedPlan.id ? updatedPlan : p))
      );
      setEditingPlanId(null);
      setView('logger');
    } catch (error) {
      console.error("Failed to update plan", error);
      alert("Erro ao atualizar o plano. Tente novamente.");
    }
  }, []);

  const addWorkoutLog = useCallback(async (log: WorkoutLog) => {
    try {
      await api.createLog(currentUser, log);
      setWorkoutLogs(prevLogs => [log, ...prevLogs]);
    } catch (error) {
      console.error("Failed to add log", error);
      alert("Erro ao salvar o treino. Tente novamente.");
    }
  }, [currentUser]);
  
  const updateWorkoutLog = useCallback(async (logId: string, updates: Partial<Pick<WorkoutLog, 'comments' | 'rating'>>) => {
    try {
      await api.updateLog(logId, updates);
      setWorkoutLogs(prevLogs =>
        prevLogs.map(log =>
          log.id === logId ? { ...log, ...updates } : log
        )
      );
    } catch (error) {
      console.error("Failed to update log", error);
      alert("Erro ao atualizar o treino. Tente novamente.");
    }
  }, []);


  const deleteWorkoutPlan = useCallback(async (planId: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;
    try {
      await api.deletePlan(planId);
      setWorkoutPlans(prevPlans => prevPlans.filter(p => p.id !== planId));
    } catch (error) {
      console.error("Failed to delete plan", error);
      alert("Erro ao excluir o plano. Tente novamente.");
    }
  }, []);

  const handleEditPlan = (planId: string) => {
    setEditingPlanId(planId);
    setView('creator');
  };

  const changeView = (newView: View) => {
    if (newView !== 'creator') {
        setEditingPlanId(null);
    }
    setView(newView);
  };

  const handleNewPlanClick = () => {
    setEditingPlanId(null);
    setView('creator');
  };

  const renderView = () => {
    const planToEdit = editingPlanId ? workoutPlans.find(p => p.id === editingPlanId) : undefined;
    switch (view) {
      case 'creator':
        return <WorkoutCreator addWorkoutPlan={addWorkoutPlan} planToEdit={planToEdit} onPlanUpdated={updateWorkoutPlan} />;
      case 'logger':
        return <WorkoutLogger workoutPlans={workoutPlans} addWorkoutLog={addWorkoutLog} updateWorkoutLog={updateWorkoutLog} deleteWorkoutPlan={deleteWorkoutPlan} onEditPlan={handleEditPlan} />;
      case 'history':
        return <WorkoutHistory workoutLogs={workoutLogs} workoutPlans={workoutPlans} />;
      case 'evolution':
        return <Evolution workoutLogs={workoutLogs} />;
      default:
        return <WorkoutLogger workoutPlans={workoutPlans} addWorkoutLog={addWorkoutLog} updateWorkoutLog={updateWorkoutLog} deleteWorkoutPlan={deleteWorkoutPlan} onEditPlan={handleEditPlan} />;
    }
  };
  
  const NavButton: React.FC<{
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    label: string;
  }> = ({ active, onClick, children, label }) => (
    <button
      onClick={onClick}
      className={`relative flex-1 group flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 rounded-lg ${
        active
          ? 'text-white bg-slate-700 shadow-md shadow-slate-900/20'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
      }`}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110 text-sky-400' : 'group-hover:scale-110'}`}>
        {children}
      </div>
      <span className={`${active ? 'font-semibold' : 'font-normal'}`}>{label}</span>
      {active && (
        <span className="absolute bottom-1 w-1 h-1 bg-sky-400 rounded-full"></span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-sky-500/30 overflow-x-hidden relative">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2"></div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 relative z-10">
        {/* Hero Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-5">
                {/* Logo */}
                <div className="relative group cursor-default">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <div className="relative flex items-center justify-center w-14 h-14 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-emerald-500/20"></div>
                        <BoltIcon className="h-8 w-8 text-sky-400 relative z-10" />
                    </div>
                </div>

                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight leading-none">
                        Pump<span className="text-sky-500">Diário</span>
                    </h1>
                    <p className="text-sm text-slate-400 font-medium tracking-wide uppercase flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        {formattedDate}
                    </p>
                </div>
            </div>
             {/* Mobile Logout */}
             <div className="md:hidden">
                <button onClick={onLogout} className="p-2 bg-slate-800 rounded-lg text-red-400 border border-slate-700">
                    <LogoutIcon className="h-6 w-6" />
                </button>
             </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
             <div className="text-right hidden md:block">
                <p className="text-3xl font-mono font-bold text-slate-700">{formattedTime}</p>
             </div>
             
             <div className="hidden md:flex items-center gap-3 bg-slate-800/50 p-1.5 pr-4 pl-2 rounded-full border border-slate-700/50">
                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                    <UserIcon className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-white">{currentUser}</span>
                <button 
                    onClick={onLogout}
                    className="ml-2 text-slate-500 hover:text-red-400 transition-colors"
                    title="Sair"
                >
                    <LogoutIcon className="h-5 w-5" />
                </button>
             </div>
          </div>
        </header>

        {/* Motivational Quote Card */}
        <div className="mb-8">
            <div className="bg-slate-800/40 backdrop-blur-md border-l-4 border-sky-500 rounded-r-xl p-4 sm:p-5 shadow-lg border-y border-r border-slate-700/50">
                <p className="text-slate-300 italic font-light text-lg">"{motivationalQuote}"</p>
            </div>
        </div>

        {/* Main Navigation Area */}
        <div className="sticky top-4 z-50 mb-6">
            <div className="bg-slate-800/80 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-700/50 shadow-2xl flex flex-col sm:flex-row gap-2">
                <nav className="flex-1 flex bg-slate-900/50 rounded-xl p-1">
                    <NavButton active={view === 'logger'} onClick={() => changeView('logger')} label="Treinar">
                        <ClipboardListIcon className="h-5 w-5" />
                    </NavButton>
                    <NavButton active={view === 'history'} onClick={() => changeView('history')} label="Histórico">
                        <HistoryIcon className="h-5 w-5" />
                    </NavButton>
                    <NavButton active={view === 'evolution'} onClick={() => changeView('evolution')} label="Evolução">
                        <ChartBarIcon className="h-5 w-5" />
                    </NavButton>
                </nav>
                <button 
                    onClick={handleNewPlanClick}
                    className="sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold transition-all rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 active:scale-95 border border-emerald-400/20"
                >
                    <PlusIcon className="h-5 w-5"/>
                    <span className="whitespace-nowrap">Novo Plano</span>
                </button>
            </div>
        </div>

        {/* View Content */}
        <main className="animate-fade-in transition-all duration-300">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
              </div>
            ) : (
              renderView()
            )}
        </main>

        <footer className="text-center mt-16 pb-6 text-slate-500 text-sm font-medium">
            <p className="flex items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                Feito com <span className="text-yellow-500 animate-bounce">💪</span> e React
            </p>
        </footer>
      </div>
      
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default UserDashboard;