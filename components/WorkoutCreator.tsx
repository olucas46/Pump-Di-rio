
import React, { useState, useEffect } from 'react';
import { WorkoutPlan, Exercise, Cardio } from '../types';
import { PlusIcon, TrashIcon } from './Icons';
import { generateUUID } from '../utils/uuid';

type EditableExercise = Omit<Exercise, 'id'> & { tempId: string; id?: string };

interface WorkoutCreatorProps {
  addWorkoutPlan: (plan: Omit<WorkoutPlan, 'id'>) => void;
  planToEdit?: WorkoutPlan;
  onPlanUpdated: (plan: WorkoutPlan) => void;
}

const createEmptyExercise = (): EditableExercise => ({
    tempId: generateUUID(),
    muscle: '',
    name: '',
    sets: '3',
    reps: '10',
    rest: '60s',
    method: '',
    notes: '',
});

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'numeric' | 'decimal' | 'text';
  small?: boolean;
  as?: 'input' | 'textarea';
  suffix?: string;
}> = ({ label, as = 'input', small = false, suffix, ...props }) => {
  const commonClasses = "block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const withSuffixClasses = suffix ? `${commonClasses} pr-8` : commonClasses;

  const inputElement = as === 'input' 
    ? <input {...props} className={withSuffixClasses} /> 
    : <textarea {...props} rows={2} className={commonClasses} />;

  return (
    <div className={small ? 'w-1/2 sm:w-auto sm:flex-1' : 'w-full'}>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      {suffix ? (
        <div className="relative">
          {inputElement}
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 text-sm pointer-events-none">{suffix}</span>
        </div>
      ) : inputElement}
    </div>
  );
};

const WorkoutCreator: React.FC<WorkoutCreatorProps> = ({ addWorkoutPlan, planToEdit, onPlanUpdated }) => {
  const [planName, setPlanName] = useState('');
  const [exercises, setExercises] = useState<EditableExercise[]>([createEmptyExercise()]);
  const [cardio, setCardio] = useState<Cardio>({ type: '', duration: '', distance: '' });
  const isEditing = !!planToEdit;

  useEffect(() => {
    if (planToEdit) {
      setPlanName(planToEdit.name);
      setExercises(planToEdit.exercises.map(ex => ({ ...ex, tempId: ex.id })));
      setCardio(planToEdit.cardio || { type: '', duration: '', distance: '' });
    } else {
      setPlanName('');
      setExercises([createEmptyExercise()]);
      setCardio({ type: '', duration: '', distance: '' });
    }
  }, [planToEdit]);

  const handleExerciseChange = (tempId: string, field: keyof Omit<Exercise, 'id' | 'load'>, value: string) => {
    setExercises(currentExercises =>
      currentExercises.map(ex =>
        ex.tempId === tempId ? { ...ex, [field]: value } : ex
      )
    );
  };

  const handleCardioChange = (field: keyof Cardio, value: string) => {
    setCardio(currentCardio => ({ ...currentCardio, [field]: value }));
  };

  const addExercise = () => {
    setExercises([...exercises, createEmptyExercise()]);
  };

  const removeExercise = (tempId: string) => {
    if (exercises.length > 1) {
        const newExercises = exercises.filter((ex) => ex.tempId !== tempId);
        setExercises(newExercises);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planName.trim() && exercises.every(ex => ex.name.trim())) {
      const finalExercises: Exercise[] = exercises.map(({ tempId, ...rest }) => ({
        ...rest,
        id: rest.id || generateUUID(),
      }));

      const planPayload: Omit<WorkoutPlan, 'id'> = {
        name: planName,
        exercises: finalExercises,
        ...(cardio.type.trim() && { cardio })
      };

      if (isEditing) {
        onPlanUpdated({ ...planToEdit!, ...planPayload });
      } else {
        addWorkoutPlan(planPayload);
      }
    } else {
      alert("Por favor, preencha o nome do treino e o nome de todos os exercícios.");
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-white">{isEditing ? 'Editar Plano de Treino' : 'Criar Novo Plano de Treino'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="planName" className="block text-sm font-medium text-slate-300 mb-1">
            Nome do Plano de Treino
          </label>
          <input
            type="text"
            id="planName"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Ex: Treino A - Peito e Tríceps"
            className="block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            required
          />
        </div>

        <div className="space-y-4">
          {exercises.map((exercise, index) => (
            <div key={exercise.tempId} className="bg-slate-700/50 p-4 rounded-lg space-y-4 border border-slate-700">
               <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-200">Exercício {index + 1}</h3>
                    {exercises.length > 1 && (
                         <button
                            type="button"
                            onClick={() => removeExercise(exercise.tempId)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    )}
               </div>

                <InputField label="Músculo" placeholder="Ex: Peito" value={exercise.muscle} onChange={e => handleExerciseChange(exercise.tempId, 'muscle', e.target.value)} />
                <InputField label="Nome do Exercício" placeholder="Ex: Supino Reto" value={exercise.name} onChange={e => handleExerciseChange(exercise.tempId, 'name', e.target.value)} />

                <div className="flex flex-col sm:flex-row gap-4">
                    <InputField small type="text" inputMode="numeric" label="Séries" value={exercise.sets} onChange={e => handleExerciseChange(exercise.tempId, 'sets', e.target.value)} />
                    <InputField small type="text" inputMode="numeric" label="Repetições" value={exercise.reps} onChange={e => handleExerciseChange(exercise.tempId, 'reps', e.target.value)} />
                    <InputField small label="Descanso" value={exercise.rest} onChange={e => handleExerciseChange(exercise.tempId, 'rest', e.target.value)} />
                </div>
                 <InputField label="Método" placeholder="Ex: Drop-set, Bi-set..." value={exercise.method} onChange={e => handleExerciseChange(exercise.tempId, 'method', e.target.value)} />
                 <InputField as="textarea" label="Observações" placeholder="Ex: Aumentar carga na última série" value={exercise.notes} onChange={e => handleExerciseChange(exercise.tempId, 'notes', e.target.value)} />
            </div>
          ))}
        </div>

        <div className="bg-slate-700/50 p-4 rounded-lg space-y-4 border border-slate-700">
            <h3 className="font-semibold text-slate-200">Cardio</h3>
            <div className="flex flex-col sm:flex-row gap-4">
                <InputField label="Tipo de Cardio" placeholder="Ex: Corrida na esteira" value={cardio.type} onChange={e => handleCardioChange('type', e.target.value)} />
                <InputField label="Duração Planejada" placeholder="Ex: 00:30" value={cardio.duration} onChange={e => handleCardioChange('duration', e.target.value)} />
                <InputField 
                    label="Distância Planejada (km)" 
                    placeholder="Ex: 5,5" 
                    type="text" 
                    inputMode="decimal"
                    value={cardio.distance || ''} 
                    onChange={e => handleCardioChange('distance', e.target.value)}
                    suffix="km"
                />
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <button
                type="button"
                onClick={addExercise}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-md bg-slate-600 text-slate-200 hover:bg-slate-500"
            >
                <PlusIcon className="h-5 w-5" />
                Adicionar Exercício
            </button>
            <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold transition-colors rounded-md bg-emerald-600 text-white hover:bg-emerald-500"
            >
                {isEditing ? 'Atualizar Plano' : 'Salvar Plano de Treino'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default WorkoutCreator;
