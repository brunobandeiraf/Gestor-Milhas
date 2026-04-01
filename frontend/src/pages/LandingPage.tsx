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
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Gerencie suas milhas com inteligência
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Controle saldos, preço médio, transferências, emissões e muito mais.
            Tudo em um só lugar para você maximizar o valor das suas milhas.
          </p>
          <Link to="/login">
            <Button size="lg">Acessar o sistema</Button>
          </Link>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Por que usar o Gestor Milhas?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {highlights.map((item) => (
              <div key={item.title} className="flex gap-4">
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
