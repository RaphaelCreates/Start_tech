'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './home.module.css';

export default function HomePage() {
  const [nomeUsuario] = useState('João Silva'); // Aqui viria do contexto/API

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image src="/logo_meu_rh.png" alt="Logo Meu RH" width={120} height={50} />
        </div>
        <div className={styles.perfilUsuario}>
          <span className="material-symbols-outlined">account_circle</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.saudacao}>
          <h1>Olá, {nomeUsuario}</h1>
        </div>

        <section className={styles.acessados}>
          <h3>Mais acessados</h3>
          <div className={styles.botoesAcessados}>
            <Link href="#">
              <span className="material-symbols-outlined">schedule</span>
              <span>Bater ponto</span>
            </Link>
            <Link href="/fretado">
              <span className="material-symbols-outlined">directions_bus</span>
              <span>Fretado</span>
            </Link>
            <Link href="#">
              <span className="material-symbols-outlined">person</span>
              <span>Perfil</span>
            </Link>
          </div>
        </section>

        <section className={styles.painelSaldo}>
          <p>Meu Saldo de Horas</p>
          <div className={styles.saldoHoras}>+07:23</div>
          <span>Horas positivas</span>
        </section>
      </main>

      <footer className={styles.footer}>
        <nav>
          <Link href="/home" className={styles.active}>
            <span className="material-symbols-outlined">home</span>
            <span className={styles.navegacao}>Início</span>
          </Link>
          <Link href="#">
            <span className="material-symbols-outlined">payments</span>
            <span className={styles.navegacao}>Pagamento</span>
          </Link>
          <Link href="#">
            <span className="material-symbols-outlined">schedule</span>
            <span className={styles.navegacao}>Ponto</span>
          </Link>
          <Link href="/fretado">
            <span className="material-symbols-outlined">directions_bus</span>
            <span className={styles.navegacao}>Fretado</span>
          </Link>
          <Link href="#">
            <span className="material-symbols-outlined">box</span>
            <span className={styles.navegacao}>Requisições</span>
          </Link>
          <Link href="#">
            <span className="material-symbols-outlined">menu</span>
            <span className={styles.navegacao}>Menu</span>
          </Link>
        </nav>
      </footer>
    </div>
  );
}
