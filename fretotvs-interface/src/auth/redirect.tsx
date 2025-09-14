'use client';
import { useEffect } from "react";
import { auth } from "../lib/firebase";
import { getRedirectResult, OAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleRedirect() {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const credential = OAuthProvider.credentialFromResult(result);
          const idToken = credential?.idToken;

          console.log("ID Token capturado:", idToken);

          await fetch("http://localhost:8000/login/firebase", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${idToken}`,
            },
          });

          router.push("/home");
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error(err);
        router.push("/login");
      }
    }

    handleRedirect();
  }, [router]);

  return <p>Processando login...</p>;
}
