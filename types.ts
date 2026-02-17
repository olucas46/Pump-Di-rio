
export interface Exercise {
  id: string;
  muscle: string;
  name: string;
  sets: string;
  reps: string;
  load?: string;
  rest: string;
  method: string;
  notes: string;
}

export interface Cardio {
  type: string;
  duration: string;
  distance?: string;
  calories?: string;
}

export interface WorkoutPlan {
  id: string;
  name:string;
  exercises: Exercise[];
  cardio?: Cardio;
}

export interface WorkoutLog {
  id: string;
  planId: string; // ID of the original plan for reference
  planName: string; // Snapshot of the plan name
  date: string; // ISO string format
  exercises: Exercise[]; // Snapshot of exercises
  cardio?: Cardio; // Snapshot of cardio
  completedExerciseIds: string[];
  cardioCompleted?: boolean;
  comments?: string;
  rating?: string;
}
