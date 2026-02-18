
import React, { useState } from 'react';
import { BoltIcon, UserIcon } from './Icons';

interface AuthScreenProps {
  onLogin: (username: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
        setError('Preencha todos os campos.');
        return;
    }

    const users = JSON.parse(localStorage.getItem('pump_users') || '[]');
    
    if (isRegistering) {
        if (users.find((u: any) => u.username === username)) {
            setError('Usuário já existe.');
            return;
        }
        const newUser = { username, password }; // In a real app, hash this!
        localStorage.setItem('pump_users', JSON.stringify([...users, newUser]));
        onLogin(username);
    } else {
        const user = users.find((u: any) => u.username === username && u.password === password);
        if (user) {
            onLogin(username);
        } else {
            setError('Usuário ou senha inválidos.');
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
             <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-sky-600/20 rounded-full blur-[100px]"></div>
             <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50 w-full max-w-md relative z-10 animate-fade-in-up">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl mb-4 relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-emerald-500/20 rounded-2xl"></div>
                    <BoltIcon className="h-8 w-8 text-sky-400 relative z-10" />
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    Pump<span className="text-sky-500">Diário</span>
                </h1>
                <p className="text-slate-400 text-sm mt-2">
                    {isRegistering ? 'Crie sua conta e comece a evoluir' : 'Bem-vindo de volta, monstro!'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Usuário</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="block w-full pl-10 bg-slate-900/50 border border-slate-600 rounded-xl py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                            placeholder="Seu nome de usuário"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Senha</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full px-4 bg-slate-900/50 border border-slate-600 rounded-xl py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sky-900/30 transform transition-all active:scale-[0.98] mt-2"
                >
                    {isRegistering ? 'Criar Conta' : 'Entrar'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                    {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                    <button
                        onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                        className="ml-2 text-sky-400 hover:text-sky-300 font-semibold transition-colors"
                    >
                        {isRegistering ? 'Entrar' : 'Cadastre-se'}
                    </button>
                </p>
            </div>
        </div>
    </div>
  );
};

export default AuthScreen;
