import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard, Wallet, Building2 } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">F</div>
            Forcastr
          </div>
          <div className="flex items-center gap-4">
            {userId ? (
              <Link href="/dashboard">
                <Button variant="ghost">Gå till Appen</Button>
              </Link>
            ) : (
              <Link href="/sign-in">
                <Button>Logga in</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Ekonomisk Klarhet för <br className="hidden sm:block" />
            <span className="text-blue-600">Egna Konsulter</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            Sluta gissa vad som blir kvar i plånboken. Planera dina uppdrag, optimera din lön 
            och prognostisera företagets resultat med precision.
          </p>
          
          <div className="flex items-center justify-center gap-4 pt-4">
             <Link href={userId ? "/dashboard" : "/sign-up"}>
              <Button size="lg" className="h-12 px-8 text-base">
                Kom igång <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <LayoutDashboard className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Uppdragsplanering</h3>
            <p className="text-slate-600">
              Visualisera dina konsultkontrakt, hantera beläggningsgrad och spåra fakturerbara timmar enkelt.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-6">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Löneoptimering</h3>
            <p className="text-slate-600">
              Hitta den perfekta balansen för din lön. Se exakt hur lön kontra utdelning påverkar din skatt och företagets resultat.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Företagets Hälsa</h3>
            <p className="text-slate-600">
              Håll koll på arbetsgivaravgifter, omkostnader och bygg en hållbar buffert för din verksamhet.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-12 mt-20">
        <div className="container mx-auto px-6 text-center text-slate-500">
          <p>© 2024 Forcastr. Byggt för konsulter.</p>
        </div>
      </footer>
    </div>
  );
}
