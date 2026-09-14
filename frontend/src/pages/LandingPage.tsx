import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import {
  Plane,
  TrendingUp,
  CreditCard,
  ArrowRightLeft,
  BarChart3,
  Calendar,
} from "lucide-react";

const highlights = [
  {
    icon: TrendingUp,
    title: "Preço Médio",
    description: "Acompanhe o custo por milheiro de cada programa automaticamente.",
  },
  {
    icon: Plane,
    title: "Emissão de Passagens",
    description: "Registre emissões e veja a economia real obtida.",
  },
  {
    icon: ArrowRightLeft,
    title: "Transferências",
    description: "Gerencie transferências entre programas com bônus e bumerangue.",
  },
  {
    icon: CreditCard,
    title: "Cartões e Clubes",
    description: "Controle seus cartões de crédito e assinaturas de clubes de milhas.",
  },
  {
    icon: Calendar,
    title: "Agendamentos",
    description: "Créditos e cobranças processados automaticamente nas datas corretas.",
  },
  {
    icon: BarChart3,
    title: "Dashboard",
    description: "Visão completa de saldos, investimentos e economia.",
  },
];

const LandingPage = () => {
  return (
    <>
      <section className="relative py-24 px-4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
            <Plane className="h-4 w-4 text-blue-200" />
            <span className="text-sm text-blue-100 font-medium">Gestão inteligente de milhas</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Gerencie suas milhas com inteligência
          </h1>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Controle saldos, preço médio, transferências, emissões e muito mais.
            Tudo em um só lugar para você maximizar o valor das suas milhas.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg shadow-blue-900/30">
              Acessar o sistema
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Por que usar o Gestor Milhas?
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Ferramentas completas para quem leva milhas a sério.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default LandingPage;
