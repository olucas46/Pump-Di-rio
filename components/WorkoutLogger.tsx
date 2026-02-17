
import React, { useState, useEffect } from 'react';
import { WorkoutPlan, WorkoutLog } from '../types';
import PostWorkoutModal from './PostWorkoutModal';
import { ChevronDownIcon, TrashIcon, PencilIcon, CheckCircleIcon, CircleIcon, ClockIcon, PlayIcon, PauseIcon, ArrowPathIcon, XCircleIcon } from './Icons';

interface WorkoutLoggerProps {
  workoutPlans: WorkoutPlan[];
  addWorkoutLog: (log: WorkoutLog) => void;
  updateWorkoutLog: (logId: string, updates: Partial<Pick<WorkoutLog, 'comments' | 'rating'>>) => void;
  deleteWorkoutPlan: (planId: string) => void;
  onEditPlan: (planId: string) => void;
}

const Timer: React.FC<{ initialSeconds: number; onDone: () => void; onTimerFinish: () => void; }> = ({ initialSeconds, onDone, onTimerFinish }) => {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(true);
    const onTimerFinishRef = React.useRef(onTimerFinish);

    React.useEffect(() => {
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

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const secs = (timeInSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${secs}`;
    };

    const handleReset = () => {
        setIsRunning(false);
        setSeconds(initialSeconds);
    }
    
    const progress = (seconds / initialSeconds) * 100;

    return (
        <div className="bg-slate-800 p-2 rounded-lg relative overflow-hidden">
             <div 
                className="absolute top-0 left-0 h-full bg-sky-500/20 transition-all duration-500"
                style={{ width: `${progress}%` }}
             ></div>
            <div className="flex items-center justify-between relative">
                <div className="text-2xl font-mono text-sky-300 w-24 text-center">
                    {formatTime(seconds)}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsRunning(!isRunning)} className="p-2 text-slate-300 hover:text-white transition-colors rounded-full hover:bg-slate-700">
                        {isRunning ? <PauseIcon className="h-5 w-5"/> : <PlayIcon className="h-5 w-5"/>}
                    </button>
                    <button onClick={handleReset} className="p-2 text-slate-300 hover:text-white transition-colors rounded-full hover:bg-slate-700">
                        <ArrowPathIcon className="h-5 w-5"/>
                    </button>
                    <button onClick={onDone} className="p-2 text-slate-300 hover:text-red-400 transition-colors rounded-full hover:bg-slate-700">
                        <XCircleIcon className="h-5 w-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};


const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ workoutPlans, addWorkoutLog, updateWorkoutLog, deleteWorkoutPlan, onEditPlan }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(workoutPlans.length > 0 ? workoutPlans[0].id : null);
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
    // Reset completion status when the selected plan changes
    resetLoggerState();
  }, [selectedPlanId]);
  
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
    return time; // assume seconds
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
    setActiveTimer(null); // Automatically close the timer
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

  if (workoutPlans.length === 0) {
    return (
        <div className="text-center bg-slate-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-2">Nenhum plano de treino encontrado.</h2>
            <p className="text-slate-400">Crie um plano de treino para começar a registrar seus treinos.</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-white">Registrar Treino do Dia</h2>
        <div className="mb-4">
            <label htmlFor="workout-plan" className="block text-sm font-medium text-slate-300 mb-1">Selecione o Plano de Treino</label>
            <div className="relative">
                <select
                    id="workout-plan"
                    value={selectedPlanId || ''}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full appearance-none bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                >
                    {workoutPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                </select>
                <ChevronDownIcon className="h-5 w-5 text-slate-400 absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none" />
            </div>
        </div>
      </div>

      {selectedPlan && (
        <>
            <div className="bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-sky-400">{selectedPlan.name}</h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onEditPlan(selectedPlan.id)}
                            className="text-slate-500 hover:text-sky-400 transition-colors p-1"
                            aria-label="Editar plano"
                        >
                            <PencilIcon className="h-5 w-5"/>
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm(`Tem certeza que deseja apagar o plano "${selectedPlan.name}"?`)) {
                                    deleteWorkoutPlan(selectedPlan.id);
                                    setSelectedPlanId(workoutPlans.length > 1 ? workoutPlans.filter(p => p.id !== selectedPlan.id)[0].id : null);
                                }
                            }}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                            aria-label="Apagar plano"
                        >
                            <TrashIcon className="h-5 w-5"/>
                        </button>
                    </div>
                </div>
                <div className="space-y-4">
                    {selectedPlan.exercises.map((ex, index) => {
                        const isCompleted = completedExercises.has(ex.id);
                        return (
                        <div key={ex.id} className={`bg-slate-700/50 p-3 rounded-lg flex flex-col gap-2 transition-opacity ${isCompleted ? 'opacity-70' : ''}`}>
                            <div className="flex gap-4 items-center">
                                <button onClick={() => handleToggleExercise(ex.id)} className="flex-shrink-0 p-1">
                                    {isCompleted ? <CheckCircleIcon className="h-6 w-6 text-emerald-400"/> : <CircleIcon className="h-6 w-6 text-slate-500"/>}
                                </button>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className={`font-semibold text-slate-100 transition-all ${isCompleted ? 'line-through' : ''}`}>{index + 1}. {ex.name}</p>
                                        {isCompleted && <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Realizado</span>}
                                        {ex.muscle && <span className="text-xs font-semibold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full">{ex.muscle}</span>}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm mt-2 text-slate-300 items-end">
                                        <div>
                                            <span className="font-medium text-slate-400 text-xs">Séries</span>
                                            <p className="text-base text-slate-100">{ex.sets}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-400 text-xs">Reps</span>
                                            <p className="text-base text-slate-100">{ex.reps}</p>
                                        </div>
                                        <div>
                                            <label htmlFor={`load-${ex.id}`} className="font-medium text-slate-400 text-xs">Carga (kg)</label>
                                            <div className="relative">
                                                <input
                                                    id={`load-${ex.id}`}
                                                    type="number"
                                                    inputMode="decimal"
                                                    value={sessionLoads[ex.id] || ''}
                                                    onChange={(e) => handleLoadChange(ex.id, e.target.value)}
                                                    disabled={isCompleted}
                                                    className="block w-full max-w-20 bg-slate-600 border border-slate-500 rounded-md shadow-sm py-1 pl-2 pr-7 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 text-sm pointer-events-none">kg</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-400 text-xs">Descanso</span>
                                            <p className="text-base text-slate-100">{ex.rest}</p>
                                        </div>
                                        {ex.method && <div className="col-span-full mt-2"><span className="font-medium text-slate-400">Método:</span> {ex.method}</div>}
                                    </div>
                                    {ex.notes && <p className="text-sm mt-2 text-slate-400 italic">"{ex.notes}"</p>}
                                </div>
                                <div className="flex-shrink-0">
                                    <button
                                        onClick={() => handleStartTimer(ex.id, ex.rest)}
                                        disabled={isCompleted}
                                        className={`p-2 rounded-full transition-colors ${activeTimer?.exerciseId === ex.id ? 'bg-sky-500/30 text-sky-400' : 'text-slate-400 hover:text-sky-400 hover:bg-slate-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        aria-label="Iniciar timer de descanso"
                                    >
                                        <ClockIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                            {activeTimer?.exerciseId === ex.id && (
                                <div className="pl-11 pr-11">
                                    <Timer 
                                        initialSeconds={activeTimer.initialSeconds} 
                                        onDone={() => setActiveTimer(null)}
                                        onTimerFinish={() => handleTimerFinish(activeTimer.exerciseId)}
                                    />
                                </div>
                            )}
                        </div>
                    )})}
                    {selectedPlan.cardio && (
                        <div className={`bg-slate-700/50 p-3 rounded-lg flex flex-col gap-4 transition-opacity ${isCardioCompleted ? 'opacity-70' : ''}`}>
                            <div className="flex gap-4 items-center">
                                <button onClick={() => setIsCardioCompleted(!isCardioCompleted)} className="flex-shrink-0 p-1">
                                    {isCardioCompleted ? <CheckCircleIcon className="h-6 w-6 text-emerald-400"/> : <CircleIcon className="h-6 w-6 text-slate-500"/>}
                                </button>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                        <p className={`font-semibold text-slate-100 transition-all ${isCardioCompleted ? 'line-through' : ''}`}>Cardio: {selectedPlan.cardio.type}</p>
                                        {isCardioCompleted && <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Realizado</span>}
                                    </div>
                                    <div className="text-sm mt-1 text-slate-300">
                                        {(() => {
                                            const plannedItems = [];
                                            if (selectedPlan.cardio.duration) {
                                                plannedItems.push(selectedPlan.cardio.duration);
                                            }
                                            if (selectedPlan.cardio.distance) {
                                                plannedItems.push(`${selectedPlan.cardio.distance} km`);
                                            }
                                            const plannedDetails = plannedItems.join(' / ');
                                            if (plannedDetails) {
                                                return <p><span className="font-medium text-slate-400">Planejado:</span> {plannedDetails}</p>;
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 pl-11">
                                <div>
                                    <label htmlFor="cardio-duration" className="font-medium text-slate-400 text-xs">Duração (min)</label>
                                    <input
                                        id="cardio-duration"
                                        type="number"
                                        inputMode="decimal"
                                        value={sessionCardioDetails.duration}
                                        onChange={(e) => handleCardioDetailsChange('duration', e.target.value)}
                                        disabled={isCardioCompleted}
                                        className="block w-full max-w-20 bg-slate-600 border border-slate-500 rounded-md shadow-sm py-1 px-2 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="cardio-distance" className="font-medium text-slate-400 text-xs">Distância (km)</label>
                                    <input
                                        id="cardio-distance"
                                        type="text"
                                        inputMode="decimal"
                                        value={sessionCardioDetails.distance}
                                        onChange={(e) => handleCardioDetailsChange('distance', e.target.value)}
                                        disabled={isCardioCompleted}
                                        className="block w-full max-w-20 bg-slate-600 border border-slate-500 rounded-md shadow-sm py-1 px-2 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="cardio-calories" className="font-medium text-slate-400 text-xs">Calorias (kcal)</label>
                                    <input
                                        id="cardio-calories"
                                        type="number"
                                        inputMode="decimal"
                                        value={sessionCardioDetails.calories}
                                        onChange={(e) => handleCardioDetailsChange('calories', e.target.value)}
                                        disabled={isCardioCompleted}
                                        className="block w-full max-w-20 bg-slate-600 border border-slate-500 rounded-md shadow-sm py-1 px-2 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-6">
                <button
                    onClick={handleLogWorkout}
                    disabled={!selectedPlanId}
                    className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-md hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                {showSuccess ? 'Treino Registrado com Sucesso!' : 'Registrar Treino'}
                </button>
            </div>
        </>
      )}
      <PostWorkoutModal 
        isOpen={isFeedbackModalOpen}
        onClose={finishLogging}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
};

export default WorkoutLogger;
