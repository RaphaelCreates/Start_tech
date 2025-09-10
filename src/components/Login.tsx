'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './Login.module.css';

export default function Login() {
  const [formData, setFormData] = useState({
    usuario: '',
    senha: '',
    lembrar: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new URLSearchParams();
    data.append('username', formData.usuario);
    data.append('password', formData.senha);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: data
      });

      const result = await response.json();

      if (response.ok) {
        router.push('/home');
      } else {
        let msg = result.detail;
        if (msg && msg.toLowerCase().includes('id not found')) {
          msg = 'Verifique seu ID ou senha.';
        } else if (msg && (msg.toLowerCase().includes('incorrect password') || msg.toLowerCase().includes('senha incorreta'))) {
          msg = 'Senha incorreta.';
        }
        setError(msg || 'Verifique seu ID ou senha.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.logo}>
        <Image src="/logo_meu_rh.png" alt="Logo da Fretado" width={250} height={100} />
      </header>

      <main className={styles.container}>
        <form onSubmit={handleSubmit}>
          <h1>Login</h1>

          <div className={styles.inputBox}>
            <label htmlFor="usuario" className={styles.srOnly}>Totvs ID</label>
            <input
              id="usuario"
              name="usuario"
              placeholder="TOTVS ID"
              type="text"
              required
              value={formData.usuario}
              onChange={handleInputChange}
            />
            <i className="bx bxs-user"></i>
          </div>

          <div className={styles.inputBox}>
            <label htmlFor="senha" className={styles.srOnly}>Senha</label>
            <input
              id="senha"
              name="senha"
              placeholder="Senha"
              type="password"
              required
              value={formData.senha}
              onChange={handleInputChange}
            />
            <i className="bx bxs-lock-alt"></i>
          </div>

          <div className={styles.lembrarEsqueci}>
            <label htmlFor="lembrar">
              <input
                type="checkbox"
                id="lembrar"
                name="lembrar"
                checked={formData.lembrar}
                onChange={handleInputChange}
              />
              Lembrar senha
            </label>
            <a href="#">Esqueci a senha</a>
          </div>

          <button type="submit" className={styles.loginButton} disabled={loading}>
            {loading ? 'Entrando...' : 'Login'}
          </button>
          
          {error && (
            <div className={styles.loginError}>
              {error}
            </div>
          )}

          <div className={styles.registrar}>
            <p><a href="#">Problemas para se cadastrar?</a></p>
          </div>
        </form>
      </main>
    </div>
  );
}
