'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginAdmin() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro('');

    const emailDigitado = email.trim().toLowerCase();

    if (emailDigitado !== 'ricardo@gmail.com') {
      setErro('Acesso não autorizado.');
      return;
    }

    if (!senha) {
      setErro('Digite sua senha.');
      return;
    }

    try {
      setCarregando(true);

      const resultado = await signInWithEmailAndPassword(auth, emailDigitado, senha);

      if (resultado.user.email?.toLowerCase() !== 'ricardo@gmail.com') {
        setErro('Acesso não autorizado.');

        await auth.signOut();

        return;
      }

      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error('Erro no login:', error);

      if (
        error?.code === 'auth/invalid-credential' ||
        error?.code === 'auth/wrong-password' ||
        error?.code === 'auth/user-not-found'
      ) {
        setErro('Email ou senha inválidos.');
      } else if (error?.code === 'auth/too-many-requests') {
        setErro('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else if (error?.code === 'auth/invalid-email') {
        setErro('Digite um email válido.');
      } else {
        setErro('Não foi possível fazer login. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-8 text-center text-4xl font-bold">Login Administrador</h1>

        <div className="space-y-5">
          {/* EMAIL */}
          <div>
            <label className="mb-2 block font-semibold">Email</label>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  entrar();
                }
              }}
              autoComplete="email"
              className="w-full rounded-lg border p-3 outline-none focus:border-green-600"
            />
          </div>

          {/* SENHA */}
          <div>
            <label className="mb-2 block font-semibold">Senha</label>

            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  entrar();
                }
              }}
              autoComplete="current-password"
              className="w-full rounded-lg border p-3 outline-none focus:border-green-600"
            />
          </div>

          {/* ERRO */}
          {erro && (
            <div className="rounded-lg bg-red-100 p-3 text-center font-semibold text-red-700">
              {erro}
            </div>
          )}

          {/* BOTÃO */}
          <button
            type="button"
            onClick={entrar}
            disabled={carregando}
            className="w-full rounded-lg bg-green-600 py-3 text-lg font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </main>
  );
}
