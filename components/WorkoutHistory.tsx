
import React, { useState } from 'react';
import { WorkoutLog, WorkoutPlan } from '../types';
import { ChevronDownIcon, CheckIcon, CheckCircleIcon, ClockIcon, DumbbellIcon, CalendarIcon, FireIcon, HistoryIcon, SparklesIcon } from './Icons';

interface WorkoutHistoryProps {
  workoutLogs: WorkoutLog[];
  workoutPlans: WorkoutPlan[];
}

const HistoryItem: React.FC<{ log: WorkoutLog; workoutPlans: WorkoutPlan[] }> = ({ log, workoutPlans }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const dateObj = new Date(log.date);
    const day = dateObj.toLocaleDateString('pt-BR', { day: '2-digit' });
    const month = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
    const time = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Use snapshot from log if available, otherwise find plan for backward compatibility
    const planDetails = log.exercises 
      ? { name: log.planName, exercises: log.exercises, cardio: log.cardio }
      : workoutPlans.find(p => p.id === log.planId);

    const completedExercises = planDetails ? planDetails.exercises.filter(ex => log.completedExerciseIds?.includes(ex.id)) : [];
    const cardioWasCompleted = planDetails?.cardio && log.cardioCompleted;

    return (
        <div className="bg-slate-800 rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden transition-all duration-300 hover:border-slate-600 group">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-stretch text-left transition-colors hover:bg-slate-750"
            >
                {/* Date Block */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-700/30 border-r border-slate-700/50 w-20 flex-shrink-0 group-hover:bg-slate-700/50 transition-colors">
                    <span className="text-xs font-bold text-slate-400 tracking-wider mb-0.5">{month}</span>
                    <span className="text-2xl font-bold text-white leading-none">{day}</span>
                </div>

                {/* Main Content */}
                <div className="flex-grow p-4 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                             <h3 className="font-bold text-lg text-white group-hover:text-sky-400 transition-colors line-clamp-1">{log.planName}</h3>
                             {log.rating && <span className="text-xl animate-bounce-short" title="Avaliação">{log.rating}</span>}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                         <div className="flex items-center gap-1.5">
                            <ClockIcon className="h-3.5 w-3.5" />
                            <span>{time}</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <DumbbellIcon className="h-3.5 w-3.5" />
                            <span>{completedExercises.length} Exercícios</span>
                         </div>
                         {cardioWasCompleted && (
                             <div className="flex items-center gap-1.5 text-emerald-400">
                                <FireIcon className="h-3.5 w-3.5" />
                                <span>Cardio</span>
                             </div>
                         )}
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center pr-4 pl-2 text-slate-500">
                    <div className={`p-1.5 rounded-full transition-all duration-300 ${isExpanded ? 'bg-sky-500/10 text-sky-400 rotate-180' : 'group-hover:bg-slate-700'}`}>
                        <ChevronDownIcon className="h-5 w-5" />
                    </div>
                </div>
            </button>

            {/* Expanded Details */}
            <div 
                className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="p-4 pt-0 border-t border-slate-700/50 bg-slate-900/20">
                         <div className="mt-4 space-y-5">
                            {planDetails ? (
                                <>
                                    {/* Exercises List */}
                                    {completedExercises.length > 0 && (
                                        <div className="animate-fade-in">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <DumbbellIcon className="h-3 w-3" /> Exercícios Realizados
                                            </h4>
                                            <div className="grid gap-2">
                                                {completedExercises.map((ex, index) => (
                                                    <div key={ex.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700/50 relative overflow-hidden">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                                        <div className="flex-shrink-0">
                                                             <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-semibold text-slate-200 text-sm truncate">{ex.name}</p>
                                                                {ex.muscle && <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wide">{ex.muscle}</span>}
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                                                                <span className="bg-slate-700/50 px-2 py-0.5 rounded">{ex.sets} séries</span>
                                                                <span className="bg-slate-700/50 px-2 py-0.5 rounded">{ex.reps} reps</span>
                                                                {ex.load && <span className="bg-sky-900/30 text-sky-300 px-2 py-0.5 rounded border border-sky-500/20 font-medium">{ex.load} kg</span>}
                                                                <span className="bg-slate-700/50 px-2 py-0.5 rounded">{ex.rest}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Cardio Detail */}
                                    {cardioWasCompleted && planDetails.cardio && (
                                        <div className="animate-fade-in delay-75">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <FireIcon className="h-3 w-3" /> Cardio
                                            </h4>
                                            <div className="p-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-800/50 border border-slate-700/50 flex items-center gap-3 relative overflow-hidden">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                                                <CheckCircleIcon className="h-5 w-5 text-orange-500 flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-slate-200 text-sm">{planDetails.cardio.type}</p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {log.cardio?.duration || planDetails.cardio.duration}
                                                        {(log.cardio?.distance || planDetails.cardio.distance) && ` • ${log.cardio?.distance || planDetails.cardio.distance} km`}
                                                        {(log.cardio?.calories || planDetails.cardio.calories) && ` • ${log.cardio?.calories || planDetails.cardio.calories} kcal`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Comments & Rating */}
                                    {(log.comments || log.rating) && (
                                        <div className="animate-fade-in delay-100 pt-2 border-t border-slate-700/50">
                                            <div className="bg-slate-700/30 p-4 rounded-xl relative">
                                                <SparklesIcon className="h-5 w-5 text-yellow-500 absolute top-3 right-3 opacity-20" />
                                                {log.comments && (
                                                    <p className="text-sm text-slate-300 italic mb-2">"{log.comments}"</p>
                                                )}
                                                {log.rating && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-500 uppercase">Feeling</span>
                                                        <span className="text-lg">{log.rating}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {completedExercises.length === 0 && !cardioWasCompleted && (
                                        <div className="text-center py-4">
                                            <p className="text-sm text-slate-500 italic">Nenhum exercício registrado neste treino.</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-4 bg-red-900/10 rounded-lg border border-red-900/30">
                                    <p className="text-sm text-red-400">Detalhes do plano original não encontrados.</p>
                                </div>
                            )}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ workoutLogs, workoutPlans }) => {

  if (workoutLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-800 rounded-3xl shadow-xl border border-slate-700/50 text-center animate-fade-in-up">
        <div className="bg-slate-700/50 p-6 rounded-full mb-6 relative">
            <div className="absolute inset-0 bg-sky-500/20 rounded-full blur-xl"></div>
            <HistoryIcon className="h-12 w-12 text-slate-400 relative z-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Histórico Vazio</h2>
        <p className="text-slate-400 max-w-xs mb-6">Seus treinos concluídos aparecerão aqui. Vá treinar e construa seu legado! 💪</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-end px-2">
            <div>
                 <h2 className="text-2xl font-bold text-white">Histórico</h2>
                 <p className="text-sm text-slate-400">Seus últimos treinos realizados</p>
            </div>
            <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total: <span className="text-white">{workoutLogs.length}</span></span>
            </div>
        </div>
      
        <div className="space-y-4 pb-20">
            {workoutLogs.map(log => {
            return <HistoryItem key={log.id} log={log} workoutPlans={workoutPlans} />;
            })}
        </div>
        
        <style>{`
            @keyframes bounce-short {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20%); }
            }
            .animate-bounce-short {
                animation: bounce-short 0.5s ease-in-out 1;
            }
        `}</style>
    </div>
  );
};

export default WorkoutHistory;
