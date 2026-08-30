'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();

    setErro('');
    setLoading(true);

    const emailLimpo = email.trim().toLowerCase();

    if (emailLimpo !== 'ricardo@gmail.com') {
      setErro('Você não possui permissão para acessar o painel.');
      setLoading(false);
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, emailLimpo, senha);

      if (cred.user.email?.toLowerCase() !== 'ricardo@gmail.com') {
        await signOut(auth);

        setErro('Você não possui permissão para acessar o painel.');
        setLoading(false);
        return;
      }

      router.push('/admin/dashboards');
    } catch (error: any) {
      console.error('Erro no login:', error);

      if (error?.code === 'auth/invalid-credential') {
        setErro('Email ou senha inválidos.');
      } else if (error?.code === 'auth/invalid-email') {
        setErro('Email inválido.');
      } else if (error?.code === 'auth/user-disabled') {
        setErro('Este usuário está desativado.');
      } else if (error?.code === 'auth/too-many-requests') {
        setErro('Muitas tentativas. Aguarde alguns minutos.');
      } else {
        setErro('Não foi possível entrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <form onSubmit={entrar} className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-8 text-center text-4xl font-bold">Área Administrativa</h1>

        <div className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-lg border p-3 outline-none focus:border-green-600"
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-lg border p-3 outline-none focus:border-green-600"
          />

          {erro && <p className="rounded-lg bg-red-100 p-3 text-center text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-600 py-3 text-lg font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </main>
  );
}
