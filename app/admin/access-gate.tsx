import { LogIn, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatGPTSignInPath } from '@/app/chatgpt-auth';

type AdminAccessGateProps = {
  returnTo: '/admin' | '/admin/channels';
  signedInEmail?: string | null;
};

export function AdminAccessGate({
  returnTo,
  signedInEmail,
}: AdminAccessGateProps) {
  const signedIn = Boolean(signedInEmail);

  return (
    <main className="site-shell flex min-h-screen items-center justify-center px-5 text-foreground">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#111821]/92 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary/12 text-secondary">
          <ShieldCheck className="size-7" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-secondary">
          Адміністратар КОШа
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">
          {signedIn ? 'Няма доступу' : 'Патрабуецца ўваход'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          {signedIn
            ? `Уліковы запіс ${signedInEmail} не мае правоў адміністратара.`
            : 'Увайдзіце праз ChatGPT. Пасля ўваходу доступ атрымае толькі ўладальнік сайта.'}
        </p>
        {signedIn ? (
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              render={
                <a
                  href={`/signout-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`}
                  target="_top"
                />
              }
              variant="outline"
              className="rounded-full border-white/15 text-white"
            >
              Выйсці і ўвайсці іншым акаўнтам
            </Button>
            <Button
              render={<a href="/" />}
              variant="ghost"
              className="rounded-full text-white/60"
            >
              На галоўную
            </Button>
          </div>
        ) : (
          <Button
            render={
              <a href={chatGPTSignInPath(returnTo)} target="_top" />
            }
            className="mt-7 rounded-full bg-secondary px-6 text-white hover:bg-secondary/90"
          >
            <LogIn className="size-4" /> Увайсці праз ChatGPT
          </Button>
        )}
      </section>
    </main>
  );
}
