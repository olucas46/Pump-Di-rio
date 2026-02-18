
import React, { useState, useEffect, useRef } from 'react';
import { WorkoutPlan, WorkoutLog } from '../types';
import PostWorkoutModal from './PostWorkoutModal';
import { TrashIcon, PencilIcon, CheckCircleIcon, CircleIcon, ClockIcon, PlayIcon, PauseIcon, ArrowPathIcon, XCircleIcon, ArrowLeftIcon, DumbbellIcon, FireIcon } from './Icons';

interface WorkoutLoggerProps {
  workoutPlans: WorkoutPlan[];
  addWorkoutLog: (log: WorkoutLog) => void;
  updateWorkoutLog: (logId: string, updates: Partial<Pick<WorkoutLog, 'comments' | 'rating'>>) => void;
  deleteWorkoutPlan: (planId: string) => void;
  onEditPlan: (planId: string) => void;
}

// --- Modern Circular Timer Component ---
const CircularTimer: React.FC<{ initialSeconds: number; onDone: () => void; onTimerFinish: () => void; }> = ({ initialSeconds, onDone, onTimerFinish }) => {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(true);
    const onTimerFinishRef = useRef(onTimerFinish);

    useEffect(() => {
        onTimerFinishRef.current = onTimerFinish;
    }, [onTimerFinish]);

    const playBeep = () => {
        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            gain.gain.setValueAtTime(0, context.currentTime);
            gain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.01);
            oscillator.start(context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.5);
            oscillator.stop(context.currentTime + 0.5);
        } catch (error) {
            console.error("Could not play beep sound.", error);
        }
    };
    
    useEffect(() => {
        let interval: number | undefined;
        if (isRunning && seconds > 0) {
            interval = window.setInterval(() => {
                setSeconds(s => s - 1);
            }, 1000);
        } else if (seconds === 0 && isRunning) {
            setIsRunning(false);
            playBeep();
            onTimerFinishRef.current();
        }
        return () => {
            if (interval) window.clearInterval(interval);
        };
    }, [isRunning, seconds]);

    const handleReset = () => {
        setIsRunning(false);
        setSeconds(initialSeconds);
    }

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const secs = (timeInSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${secs}`;
    };

    // SVG Config
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (seconds / initialSeconds) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-900/90 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-sm relative animate-fade-in-up">
            <div className="relative mb-4">
                {/* Background Circle */}
                <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-slate-700"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={`text-sky-500 transition-all duration-1000 ease-linear`}
                    />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-mono font-bold text-white">
                    {formatTime(seconds)}
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                 <button onClick={() => setIsRunning(!isRunning)} className="p-3 bg-slate-800 text-white rounded-full hover:bg-sky-600 transition-colors shadow-lg border border-slate-700">
                    {isRunning ? <PauseIcon className="h-6 w-6"/> : <PlayIcon className="h-6 w-6"/>}
                </button>
                <button onClick={handleReset} className="p-3 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors shadow-lg border border-slate-700">
                    <ArrowPathIcon className="h-5 w-5"/>
                </button>
                <button onClick={onDone} className="p-3 bg-slate-800 text-red-400 rounded-full hover:bg-red-900/30 transition-colors shadow-lg border border-slate-700">
                    <XCircleIcon className="h-5 w-5"/>
                </button>
            </div>
        </div>
    );
};


const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ workoutPlans, addWorkoutLog, updateWorkoutLog, deleteWorkoutPlan, onEditPlan }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => {
      if (typeof window !== 'undefined') {
          const saved = window.localStorage.getItem('lastSelectedPlanId');
          if (saved && workoutPlans.some(p => p.id === saved)) {
              return saved;
          }
      }
      return null;
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [isCardioCompleted, setIsCardioCompleted] = useState(false);
  const [sessionLoads, setSessionLoads] = useState<Record<string, string>>({});
  const [sessionCardioDetails, setSessionCardioDetails] = useState({ distance: '', calories: '', duration: '' });
  const [activeTimer, setActiveTimer] = useState<{ exerciseId: string; initialSeconds: number } | null>(null);
  const [sessionSeriesCount, setSessionSeriesCount] = useState<Record<string, number>>({});
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);

  useEffect(() => {
      if (selectedPlanId) {
          window.localStorage.setItem('lastSelectedPlanId', selectedPlanId);
      } else {
          window.localStorage.removeItem('lastSelectedPlanId');
      }
  }, [selectedPlanId]);

  useEffect(() => {
      if (workoutPlans.length > 0) {
          if (selectedPlanId && !workoutPlans.find(p => p.id === selectedPlanId)) {
              setSelectedPlanId(null);
          }
      } else {
          setSelectedPlanId(null);
      }
  }, [workoutPlans, selectedPlanId]);

  // Only reset state when switching plans, but try to preserve if just re-rendering
  const handleSelectPlan = (id: string) => {
      if (id !== selectedPlanId) {
          setSelectedPlanId(id);
          resetLoggerState();
      }
  };

  const resetLoggerState = () => {
    setCompletedExercises(new Set());
    setIsCardioCompleted(false);
    setSessionLoads({});
    setSessionCardioDetails({ distance: '', calories: '', duration: '' });
    setActiveTimer(null);
    setSessionSeriesCount({});
    setCurrentLogId(null);
  };

  const handleToggleExercise = (exerciseId: string) => {
    setCompletedExercises(prev => {
        const newSet = new Set(prev);
        if (newSet.has(exerciseId)) {
            newSet.delete(exerciseId);
        } else {
            newSet.add(exerciseId);
        }
        return newSet;
    });
  };
  
  const handleLoadChange = (exerciseId: string, load: string) => {
    setSessionLoads(prev => ({ ...prev, [exerciseId]: load }));
  };
  
  const handleCardioDetailsChange = (field: 'distance' | 'calories' | 'duration', value: string) => {
    setSessionCardioDetails(prev => ({ ...prev, [field]: value }));
  };

  const parseRestTimeToSeconds = (restTime: string): number => {
    if (!restTime) return 0;
    const time = parseInt(restTime.replace(/[^0-9]/g, ''), 10);
    if (isNaN(time)) return 0;
    if (restTime.includes('min')) {
        return time * 60;
    }
    return time; 
  };

  const handleStartTimer = (exerciseId: string, restTime: string) => {
    if (activeTimer?.exerciseId === exerciseId) {
        setActiveTimer(null); 
    } else {
        const restSeconds = parseRestTimeToSeconds(restTime);
        if (restSeconds > 0) {
            setActiveTimer({ exerciseId, initialSeconds: restSeconds });
        }
    }
  };

  const handleTimerFinish = (exerciseId: string) => {
    setSessionSeriesCount(prev => ({
        ...prev,
        [exerciseId]: (prev[exerciseId] || 0) + 1
    }));
    setActiveTimer(null);
  };

  const handleLogWorkout = () => {
    if (selectedPlanId) {
      const plan = workoutPlans.find(p => p.id === selectedPlanId);
      if (plan) {
        const exercisesSnapshot = plan.exercises.map(ex => ({
            ...ex,
            load: sessionLoads[ex.id] || '',
        }));
        const cardioSnapshot = plan.cardio ? {
            ...plan.cardio,
            duration: sessionCardioDetails.duration || plan.cardio.duration,
            distance: sessionCardioDetails.distance || plan.cardio.distance,
            calories: sessionCardioDetails.calories
        } : undefined;

        const newLog: WorkoutLog = {
          id: crypto.randomUUID(),
          planId: plan.id,
          planName: plan.name,
          date: new Date().toISOString(),
          exercises: exercisesSnapshot,
          cardio: cardioSnapshot,
          completedExerciseIds: Array.from(completedExercises),
          cardioCompleted: plan.cardio ? isCardioCompleted : undefined,
        };
        
        addWorkoutLog(newLog);
        setCurrentLogId(newLog.id);
        setIsFeedbackModalOpen(true);
      }
    }
  };

  const handleFeedbackSubmit = (comments: string, rating: string) => {
    if (currentLogId) {
      updateWorkoutLog(currentLogId, { comments, rating });
    }
    finishLogging();
  };
  
  const finishLogging = () => {
    setIsFeedbackModalOpen(false);
    setShowSuccess(true);
    setTimeout(() => {
        setShowSuccess(false);
        resetLoggerState();
    }, 2000);
  };
  
  const selectedPlan = workoutPlans.find(p => p.id === selectedPlanId);

  // --- Render: No Plans ---
  if (workoutPlans.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-800 rounded-3xl shadow-xl border border-slate-700/50 text-center">
            <div className="bg-slate-700 p-4 rounded-full mb-4">
                <DumbbellIcon className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sem Planos de Treino</h2>
            <p className="text-slate-400 mb-6 max-w-sm">Crie seu primeiro plano personalizado para começar a registrar sua evolução.</p>
        </div>
    )
  }

  // --- Render: Plan Selection Grid (If no plan selected) ---
  if (!selectedPlanId) {
    return (
        <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                Escolha seu Treino <FireIcon className="h-6 w-6 text-orange-500"/>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {workoutPlans.map(plan => (
                    <button
                        key={plan.id}
                        onClick={() => handleSelectPlan(plan.id)}
                        className="group relative overflow-hidden bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DumbbellIcon className="w-24 h-24 transform rotate-12" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1 relative z-10 group-hover:text-sky-400 transition-colors">{plan.name}</h3>
                        <p className="text-sm text-slate-400 mb-4 relative z-10">
                            {plan.exercises.length} exercícios {plan.cardio ? '+ Cardio' : ''}
                        </p>
                        
                        {/* Mini pill preview of muscles */}
                        <div className="flex flex-wrap gap-2 relative z-10">
                            {Array.from(new Set(plan.exercises.map(e => e.muscle).filter(Boolean))).slice(0, 3).map((m, i) => (
                                <span key={i} className="text-xs font-medium bg-slate-700/50 text-slate-300 px-2 py-1 rounded-md border border-slate-600">
                                    {m}
                                </span>
                            ))}
                            {new Set(plan.exercises.map(e => e.muscle).filter(Boolean)).size > 3 && (
                                <span className="text-xs font-medium text-slate-500 py-1">+mais</span>
                            )}
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </button>
                ))}
            </div>
        </div>
    );
  }

  // --- Render: Active Logging Session ---
  return (
    <div className="space-y-6 animate-fade-in">
        {/* Header with Back Button */}
        <div className="flex flex-col gap-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setSelectedPlanId(null)}
                        className="p-2 rounded-xl bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                        title="Trocar Plano"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{selectedPlan.name}</h2>
                        <p className="text-sm text-slate-400">Registrando treino</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onEditPlan(selectedPlan.id)} className="p-2 text-slate-400 hover:text-sky-400 transition-colors" title="Editar">
                        <PencilIcon className="h-5 w-5"/>
                    </button>
                    <button onClick={() => { if (window.confirm('Apagar plano?')) deleteWorkoutPlan(selectedPlan.id); }} className="p-2 text-slate-400 hover:text-red-400 transition-colors" title="Apagar">
                        <TrashIcon className="h-5 w-5"/>
                    </button>
                </div>
            </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
            {selectedPlan.exercises.map((ex, index) => {
                const isCompleted = completedExercises.has(ex.id);
                return (
                <div key={ex.id} className={`group relative bg-slate-800 rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden transition-all duration-500 ${isCompleted ? 'opacity-60 grayscale-[0.5] border-emerald-900/30' : 'hover:border-slate-600'}`}>
                    {/* Progress Bar Background for Completed */}
                    <div className={`absolute inset-0 bg-emerald-500/5 transition-transform duration-500 origin-left ${isCompleted ? 'scale-x-100' : 'scale-x-0'}`}></div>

                    <div className="p-4 sm:p-6 relative z-10">
                        <div className="flex gap-4 items-start">
                             {/* Checkbox */}
                            <button onClick={() => handleToggleExercise(ex.id)} className="flex-shrink-0 mt-1 transition-transform active:scale-90">
                                {isCompleted ? (
                                    <CheckCircleIcon className="h-8 w-8 text-emerald-400 drop-shadow-lg"/> 
                                ) : (
                                    <CircleIcon className="h-8 w-8 text-slate-600 group-hover:text-slate-500 transition-colors"/>
                                )}
                            </button>

                            <div className="flex-grow space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className={`text-lg font-bold text-slate-100 leading-tight transition-all ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                                            {ex.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">#{index + 1}</span>
                                            {ex.muscle && <span className="text-xs font-semibold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md border border-slate-600">{ex.muscle}</span>}
                                        </div>
                                    </div>
                                    
                                    {/* Timer Toggle */}
                                    <button
                                        onClick={() => handleStartTimer(ex.id, ex.rest)}
                                        disabled={isCompleted}
                                        className={`p-2 rounded-full transition-all ${activeTimer?.exerciseId === ex.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-110' : 'bg-slate-700/50 text-slate-400 hover:text-sky-400 hover:bg-slate-700'}`}
                                        title="Descanso"
                                    >
                                        <ClockIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Timer Overlay */}
                                {activeTimer?.exerciseId === ex.id && (
                                    <div className="my-4">
                                        <CircularTimer 
                                            initialSeconds={activeTimer.initialSeconds} 
                                            onDone={() => setActiveTimer(null)}
                                            onTimerFinish={() => handleTimerFinish(activeTimer.exerciseId)}
                                        />
                                    </div>
                                )}

                                {/* Inputs Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                                        <span className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Séries</span>
                                        <span className="text-sm font-semibold text-slate-200">{ex.sets}</span>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                                        <span className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Reps</span>
                                        <span className="text-sm font-semibold text-slate-200">{ex.reps}</span>
                                    </div>
                                     <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                                        <span className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Descanso</span>
                                        <span className="text-sm font-semibold text-slate-200">{ex.rest}</span>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-600 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all">
                                        <label htmlFor={`load-${ex.id}`} className="block text-[10px] uppercase font-bold text-sky-500 mb-0.5">Carga (kg)</label>
                                        <input
                                            id={`load-${ex.id}`}
                                            type="number"
                                            inputMode="decimal"
                                            value={sessionLoads[ex.id] || ''}
                                            onChange={(e) => handleLoadChange(ex.id, e.target.value)}
                                            disabled={isCompleted}
                                            placeholder="0"
                                            className="w-full bg-transparent border-none p-0 text-white font-bold text-sm focus:ring-0 placeholder-slate-600"
                                        />
                                    </div>
                                </div>
                                {(ex.method || ex.notes) && (
                                    <div className="text-xs text-slate-400 pt-1 flex flex-col gap-1">
                                        {ex.method && <span><strong className="text-slate-500">Método:</strong> {ex.method}</span>}
                                        {ex.notes && <span className="italic">"{ex.notes}"</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )})}
            
            {/* Cardio Section */}
            {selectedPlan.cardio && (
                <div className={`bg-slate-800 rounded-2xl border border-slate-700/50 shadow-lg p-6 transition-all ${isCardioCompleted ? 'opacity-60 grayscale border-emerald-900/30' : ''}`}>
                    <div className="flex gap-4 items-center mb-4">
                        <button onClick={() => setIsCardioCompleted(!isCardioCompleted)} className="flex-shrink-0 transition-transform active:scale-90">
                            {isCardioCompleted ? <CheckCircleIcon className="h-8 w-8 text-emerald-400"/> : <CircleIcon className="h-8 w-8 text-slate-600"/>}
                        </button>
                        <div>
                            <h3 className="text-lg font-bold text-white">Cardio: {selectedPlan.cardio.type}</h3>
                            <p className="text-sm text-slate-400">
                                Meta: {selectedPlan.cardio.duration} {selectedPlan.cardio.distance ? `| ${selectedPlan.cardio.distance} km` : ''}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pl-12">
                        <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-600 focus-within:border-sky-500">
                             <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Tempo (min)</label>
                             <input
                                type="number"
                                value={sessionCardioDetails.duration}
                                onChange={(e) => handleCardioDetailsChange('duration', e.target.value)}
                                disabled={isCardioCompleted}
                                className="w-full bg-transparent border-none p-0 text-white font-bold text-sm focus:ring-0"
                            />
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-600 focus-within:border-sky-500">
                             <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Dist (km)</label>
                             <input
                                type="text"
                                inputMode="decimal"
                                value={sessionCardioDetails.distance}
                                onChange={(e) => handleCardioDetailsChange('distance', e.target.value)}
                                disabled={isCardioCompleted}
                                className="w-full bg-transparent border-none p-0 text-white font-bold text-sm focus:ring-0"
                            />
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-600 focus-within:border-sky-500">
                             <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Kcal</label>
                             <input
                                type="number"
                                value={sessionCardioDetails.calories}
                                onChange={(e) => handleCardioDetailsChange('calories', e.target.value)}
                                disabled={isCardioCompleted}
                                className="w-full bg-transparent border-none p-0 text-white font-bold text-sm focus:ring-0"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Action Button */}
        <div className="fixed bottom-6 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent pointer-events-none">
            <div className="max-w-5xl mx-auto pointer-events-auto">
                 <button
                    onClick={handleLogWorkout}
                    disabled={!selectedPlanId}
                    className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl hover:bg-sky-500 transition-all shadow-lg shadow-sky-900/40 transform active:scale-[0.98] disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <CheckCircleIcon className="h-6 w-6" />
                    {showSuccess ? 'Treino Registrado!' : 'Finalizar Treino'}
                </button>
            </div>
        </div>
        <div className="h-20"></div> {/* Spacer for fixed button */}

      <PostWorkoutModal 
        isOpen={isFeedbackModalOpen}
        onClose={finishLogging}
        onSubmit={handleFeedbackSubmit}
      />
      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default WorkoutLogger;
