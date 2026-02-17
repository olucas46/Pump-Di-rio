
import React, { useState } from 'react';
import { WorkoutLog, WorkoutPlan } from '../types';
import { ChevronDownIcon, CheckIcon } from './Icons';

interface WorkoutHistoryProps {
  workoutLogs: WorkoutLog[];
  workoutPlans: WorkoutPlan[];
}

const HistoryItem: React.FC<{ log: WorkoutLog; workoutPlans: WorkoutPlan[] }> = ({ log, workoutPlans }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Use snapshot from log if available, otherwise find plan for backward compatibility
    const planDetails = log.exercises 
      ? { name: log.planName, exercises: log.exercises, cardio: log.cardio }
      : workoutPlans.find(p => p.id === log.planId);

    const completedExercises = planDetails ? planDetails.exercises.filter(ex => log.completedExerciseIds?.includes(ex.id)) : [];
    const cardioWasCompleted = planDetails?.cardio && log.cardioCompleted;

    return (
        <div className="bg-slate-700/50 rounded-lg">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center p-4 text-left"
            >
                <div>
                    <div className="flex items-center gap-2">
                        {log.rating && <span className="text-2xl">{log.rating}</span>}
                        <p className="font-semibold text-white">{log.planName}</p>
                    </div>
                    <p className="text-sm text-slate-400">{formatDate(log.date)}</p>
                </div>
                <ChevronDownIcon className={`h-6 w-6 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-700 space-y-4">
                    {planDetails ? (
                        <>
                            {completedExercises.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-300">Exercícios Concluídos:</h4>
                                    {completedExercises.map((ex, index) => (
                                        <div key={ex.id} className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <CheckIcon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                                <p className="font-semibold text-slate-200">{index + 1}. {ex.name}</p>
                                                {ex.muscle && <span className="text-xs font-semibold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full">{ex.muscle}</span>}
                                            </div>
                                            <p className="text-slate-400 ml-6">
                                                {ex.sets} séries x {ex.reps} reps{ex.load ? ` com ${ex.load} kg` : ''} | {ex.rest} descanso
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                             {cardioWasCompleted && planDetails.cardio && (
                                <div className={`text-sm ${completedExercises.length > 0 ? 'pt-3 mt-3 border-t border-slate-600/50' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        <CheckIcon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                        <p className="font-semibold text-slate-200">Cardio: {planDetails.cardio.type}</p>
                                    </div>
                                    <p className="text-slate-400 ml-6">
                                        Duração: {log.cardio?.duration || planDetails.cardio.duration}
                                        {(log.cardio?.distance || planDetails.cardio.distance) && ` | Distância: ${log.cardio?.distance || planDetails.cardio.distance}`}
                                        {(log.cardio?.calories || planDetails.cardio.calories) && ` | Calorias: ${log.cardio?.calories || planDetails.cardio.calories}`}
                                    </p>
                                </div>
                            )}
                            {(log.comments || log.rating) && (
                                <div className="pt-3 mt-3 border-t border-slate-600/50 text-sm">
                                    {log.comments && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-300 mb-1">Observações:</h4>
                                        <blockquote className="border-l-2 border-slate-500 pl-3 text-slate-400 italic">
                                            {log.comments}
                                        </blockquote>
                                    </div>
                                    )}
                                </div>
                            )}
                            {completedExercises.length === 0 && !cardioWasCompleted && (
                                <p className="text-sm text-slate-400 italic">Nenhum exercício foi marcado como concluído neste treino.</p>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-red-400 italic">Detalhes do plano não encontrados. O plano pode ter sido apagado.</p>
                    )}
                </div>
            )}
        </div>
    );
};

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ workoutLogs, workoutPlans }) => {

  if (workoutLogs.length === 0) {
    return (
      <div className="text-center bg-slate-800 rounded-xl p-8 shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-2">Nenhum treino registrado.</h2>
        <p className="text-slate-400">Complete e registre um treino para vê-lo aqui.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Histórico de Treinos</h2>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {workoutLogs.map(log => {
          return <HistoryItem key={log.id} log={log} workoutPlans={workoutPlans} />;
        })}
      </div>
    </div>
  );
};

export default WorkoutHistory;
