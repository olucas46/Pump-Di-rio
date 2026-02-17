
import React, { useState, useEffect } from 'react';
import { SparklesIcon, XCircleIcon } from './Icons';

interface PostWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comments: string, rating: string) => void;
}

const RATINGS = ['😞', '😐', '😊', '😄', '💪'];

const PostWorkoutModal: React.FC<PostWorkoutModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [comments, setComments] = useState('');
  const [selectedRating, setSelectedRating] = useState<string>('😊');

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setComments('');
      setSelectedRating('😊');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(comments, selectedRating);
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-700 transform transition-all animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <SparklesIcon className="h-6 w-6 text-sky-400" />
                <h2 className="text-xl font-bold text-white">Como foi o seu treino?</h2>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <XCircleIcon className="h-6 w-6" />
            </button>
        </div>

        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Felicitômetro</label>
                <div className="flex justify-around bg-slate-700/50 p-2 rounded-lg">
                    {RATINGS.map(rating => (
                        <button
                            key={rating}
                            onClick={() => setSelectedRating(rating)}
                            className={`text-3xl p-2 rounded-full transition-transform duration-200 ${selectedRating === rating ? 'bg-sky-500/30 scale-125' : 'hover:bg-slate-600 scale-100'}`}
                            aria-label={`Rating: ${rating}`}
                        >
                            {rating}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label htmlFor="comments" className="block text-sm font-medium text-slate-300 mb-2">
                    Observações sobre o treino
                </label>
                <textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Ex: Me senti forte hoje, consegui aumentar a carga no supino!"
                    rows={4}
                    className="block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium transition-colors rounded-md bg-slate-600 text-slate-200 hover:bg-slate-500"
                >
                    Pular
                </button>
                <button
                    onClick={handleSubmit}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 text-base font-semibold transition-colors rounded-md bg-emerald-600 text-white hover:bg-emerald-500"
                >
                    Salvar e Finalizar
                </button>
            </div>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PostWorkoutModal;
