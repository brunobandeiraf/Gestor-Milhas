import { useLoyaltyAccountsQuery } from "../hooks/useLoyaltyAccountsQuery";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

const formatCurrency = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const LoyaltyAccountsPage = () => {
  const { data, isLoading, error } = useLoyaltyAccountsQuery();

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar contas.</p>;

  const accounts = (data ?? []) as Array<{
    id: string;
    miles: number;
    averagePrice: string | number;
    cpfAvailable: number;
    program: { name: string };
  }>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Contas de Fidelidade</h1>
      <Card>
        <CardHeader>
          <CardTitle>Suas Contas</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Programa</th>
                  <th className="pb-2">Milhas</th>
                  <th className="pb-2">Preço Médio</th>
                  <th className="pb-2">CPFs Disponíveis</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} className="border-b last:border-0">
                    <td className="py-2">{acc.program.name}</td>
                    <td className="py-2">{acc.miles.toLocaleString("pt-BR")}</td>
                    <td className="py-2">{formatCurrency(acc.averagePrice)}</td>
                    <td className="py-2">{acc.cpfAvailable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhuma conta de fidelidade encontrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyAccountsPage;
