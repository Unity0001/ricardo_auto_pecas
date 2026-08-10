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

  async function entrar() {
    alert('clicou');

    try {
      setErro('');

      const resultado = await signInWithEmailAndPassword(auth, email, senha);

      alert('Login OK');

      router.push('/admin/dashboard');
    } catch (error) {
      alert('Erro no login');
      console.log(error);
      setErro('Email ou senha inválidos.');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-8 text-center text-4xl font-bold">Login Administrador</h1>

        <div className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          {erro && <p className="text-center text-red-600">{erro}</p>}

          <button
            onClick={() => {
              console.log('BOTÃO CLICADO');
              entrar();
            }}
            className="w-full rounded-lg bg-green-600 py-3 text-lg font-semibold text-white hover:bg-green-700"
          >
            Entrar
          </button>
        </div>
      </div>
    </main>
  );
}
