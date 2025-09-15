import { signOut } from "next-auth/react";

export function LogoutButton() {
  const handleLogout = () => {
    // Limpar dados do usuário tradicional
    if (typeof window !== 'undefined') {
      localStorage.removeItem('usuarioTradicional');
    }
    signOut({ callbackUrl: "/" });
  };

  return (
    <button onClick={handleLogout}>
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
        logout
      </span>
      Sair
    </button>
  );
}
