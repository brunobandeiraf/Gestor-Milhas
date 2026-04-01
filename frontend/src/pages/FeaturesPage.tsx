import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/Card";
import {
  TrendingUp,
  Plane,
  ArrowRightLeft,
  CreditCard,
  Calendar,
  BarChart3,
  Users,
  ShoppingCart,
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Controle de Milhas",
    description: "Acompanhe o saldo de milhas em cada programa de fidelidade.",
    details:
      "Visualize saldo atual, preço médio por milheiro e CPFs disponíveis para cada programa. Contas criadas automaticamente na primeira operação.",
  },
  {
    icon: TrendingUp,
    title: "Preço Médio Automático",
    description: "Cálculo automático do custo por milheiro.",
    details:
      "O preço médio é recalculado a cada compra, transferência, clube ou bonificação, usando a fórmula: valor total / (milhas / 1000).",
  },
  {
    icon: Plane,
    title: "Emissão de Passagens",
    description: "Registre emissões e veja a economia obtida.",
    details:
      "Calcule automaticamente o custo total e a economia comparando com o valor real da passagem. Controle de CPFs por programa de companhia aérea.",
  },
  {
    icon: CreditCard,
    title: "Clubes de Milhas",
    description: "Gerencie assinaturas de clubes com créditos automáticos.",
    details:
      "Cadastre clubes com milhas mensais, valor e período. O sistema agenda e processa os créditos automaticamente a cada mês.",
  },
  {
    icon: ArrowRightLeft,
    title: "Transferências",
    description: "Transfira milhas entre programas com suporte a bônus.",
    details:
      "Registre transferências com percentual de bônus, compra no carrinho e bumerangue. Débito imediato na origem e crédito agendado no destino.",
  },
  {
    icon: ShoppingCart,
    title: "Compras Bonificadas",
    description: "Registre compras que geram pontos proporcionais.",
    details:
      "Informe pontos por real e valor total. Os pontos são calculados e agendados para crédito na data de recebimento.",
  },
  {
    icon: Calendar,
    title: "Agendamentos Automáticos",
    description: "Operações processadas nas datas corretas.",
    details:
      "Créditos de clubes, transferências, bonificações e bumerangues são agendados e executados automaticamente pelo sistema.",
  },
  {
    icon: BarChart3,
    title: "Dashboard e Métricas",
    description: "Visão completa de investimentos e economia.",
    details:
      "Total de milhas por programa, total investido, total economizado e próximos recebimentos em um painel centralizado.",
  },
  {
    icon: Users,
    title: "Gestão Multi-Usuário",
    description: "Admin gerencia múltiplos usuários.",
    details:
      "O administrador cria contas, gerencia catálogos e acompanha KPIs globais e por usuário.",
  },
];

const FeaturesPage = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Funcionalidades
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Conheça tudo o que o Gestor Milhas oferece para você maximizar o
            valor das suas milhas e pontos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{feature.details}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesPage;
