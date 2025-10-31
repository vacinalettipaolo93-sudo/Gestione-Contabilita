import React, { useState } from 'react';
import { signInWithEmail } from '../firebase';

const Login: React.FC = () => {
    const [email, setEmail] = useState('vacinaletti93@hotmail.it');
    const [password, setPassword] = useState('123456');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await signInWithEmail(email, password);
            // L'onAuthStateChanged in index.tsx gestirà il reindirizzamento
        } catch (err: any) {
            switch (err.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError("Email o password non validi. Assicurati di aver creato l'utente nella console di Firebase.");
                    break;
                case 'auth/invalid-email':
                    setError("Il formato dell'email non è valido.");
                    break;
                default:
                    setError("Si è verificato un errore durante l'accesso. Riprova.");
                    console.error("Login error:", err);
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-200 dark:bg-gray-950 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-2xl p-8 space-y-6 border border-slate-200 dark:border-slate-800">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-sky-600 dark:text-sky-400">Gestione Contabilità</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Accedi per continuare</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                placeholder="tu@email.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-400 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Accesso in corso...' : 'Accedi'}
                            </button>
                        </div>
                    </form>
                </div>
                 <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    <strong>Nota:</strong> Assicurati di aver creato l'utente <br/>
                    <code className="font-mono bg-slate-300 dark:bg-slate-700 px-1 py-0.5 rounded">vacinaletti93@hotmail.it</code> / pw: <code className="font-mono bg-slate-300 dark:bg-slate-700 px-1 py-0.5 rounded">123456</code>
                    <br/>nella console di Firebase Authentication.
                </p>
            </div>
        </div>
    );
};

export default Login;