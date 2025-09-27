import { LoginForm } from '@/components/auth/login-form';
import { Clover } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-3 text-primary">
          <Clover className="w-12 h-12" />
          <h1 className="text-5xl font-headline font-bold text-foreground">
            Lotto Hub
          </h1>
        </div>
        <p className="text-muted-foreground max-w-sm">
          Sign in to manage lottery sales, draws, and winners all in one place.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
