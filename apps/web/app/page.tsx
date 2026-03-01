import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Link className="text-primary underline" href="/dashboard">
        Ir para o painel
      </Link>
    </main>
  );
}
