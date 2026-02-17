
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { WorkoutPlan, WorkoutLog } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import WorkoutCreator from './components/WorkoutCreator';
import WorkoutLogger from './components/WorkoutLogger';
import WorkoutHistory from './components/WorkoutHistory';
import Evolution from './components/Evolution';
import { BarbellIcon, ClipboardListIcon, HistoryIcon, PlusIcon, ChartBarIcon } from './components/Icons';

type View = 'creator' | 'logger' | 'history' | 'evolution';

const App: React.FC = () => {
  const [view, setView] = useState<View>('logger');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [workoutPlans, setWorkoutPlans] = useLocalStorage<WorkoutPlan[]>('workoutPlans', []);
  const [workoutLogs, setWorkoutLogs] = useLocalStorage<WorkoutLog[]>('workoutLogs', []);

  // For Date and Time
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
      const timer = setInterval(() => {
          setCurrentDateTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
  }, []);

  const formattedDateTime = currentDateTime.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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

  const addWorkoutPlan = useCallback((plan: Omit<WorkoutPlan, 'id'>) => {
    const newPlan = { ...plan, id: crypto.randomUUID() };
    setWorkoutPlans(prevPlans => [...prevPlans, newPlan]);
    setView('logger');
  }, [setWorkoutPlans]);

  const updateWorkoutPlan = useCallback((updatedPlan: WorkoutPlan) => {
    setWorkoutPlans(prevPlans =>
        prevPlans.map(p => (p.id === updatedPlan.id ? updatedPlan : p))
    );
    setEditingPlanId(null);
    setView('logger');
  }, [setWorkoutPlans]);

  const addWorkoutLog = useCallback((log: WorkoutLog) => {
    setWorkoutLogs(prevLogs => [log, ...prevLogs]);
  }, [setWorkoutLogs]);
  
  const updateWorkoutLog = useCallback((logId: string, updates: Partial<Pick<WorkoutLog, 'comments' | 'rating'>>) => {
    setWorkoutLogs(prevLogs =>
      prevLogs.map(log =>
        log.id === logId ? { ...log, ...updates } : log
      )
    );
  }, [setWorkoutLogs]);


  const deleteWorkoutPlan = useCallback((planId: string) => {
    setWorkoutPlans(prevPlans => prevPlans.filter(p => p.id !== planId));
  }, [setWorkoutPlans]);

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
  }> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`flex-1 sm:flex-none flex sm:flex-row flex-col items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-lg ${
        active
          ? 'bg-sky-500 text-white'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <header className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <BarbellIcon className="h-8 w-8 text-sky-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Pump Diário
            </h1>
          </div>
          <div className="text-right text-sm text-slate-400 flex-shrink-0">
            <p>{formattedDateTime}</p>
          </div>
        </header>

        <div className="text-center mb-6 py-2">
            <p className="text-slate-400 italic">"{motivationalQuote}"</p>
        </div>

        <main>
            <div className="bg-slate-800 p-2 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg">
                <div className="flex w-full sm:w-auto">
                    <NavButton active={view === 'logger'} onClick={() => changeView('logger')}>
                        <ClipboardListIcon className="h-5 w-5" />
                        <span>Registrar Treino</span>
                    </NavButton>
                    <NavButton active={view === 'history'} onClick={() => changeView('history')}>
                        <HistoryIcon className="h-5 w-5" />
                        <span>Histórico</span>
                    </NavButton>
                    <NavButton active={view === 'evolution'} onClick={() => changeView('evolution')}>
                        <ChartBarIcon className="h-5 w-5" />
                        <span>Evolução</span>
                    </NavButton>
                </div>
                 <button 
                    onClick={handleNewPlanClick}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-lg bg-emerald-600 text-white hover:bg-emerald-500">
                    <PlusIcon className="h-5 w-5"/>
                    <span>Novo Plano de Treino</span>
                </button>
            </div>
            {renderView()}
        </main>

        <footer className="text-center mt-10 text-slate-500 text-sm">
            <p>Feito com 💪 e React</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
