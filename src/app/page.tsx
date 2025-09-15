"use client";

import { useSession, signIn } from "next-auth/react";
import Login from "@/components/Login"; // seu login tradicional + botão Azure

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Carregando...</p>;

  // Se tiver sessão do Azure AD, redireciona para /home
  if (session) {
    window.location.href = "/home";
    return <p>Redirecionando...</p>;
  }

  // Senão, mostra o login tradicional + botão Azure
  return <Login />;
}
