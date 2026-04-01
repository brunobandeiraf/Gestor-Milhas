import { useUserDashboardQuery } from "../hooks/useUserDashboardQuery";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

const formatCurrency = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DashboardPage = () => {
  const { data, isLoading, error } = useUserDashboardQuery();

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar dashboard.</p>;

  const dashboard = data as {
    accounts: Array<{
      programName: string;
      miles: number;
      averagePrice: string | number;
      totalCost: string | number;
    }>;
    totalInvested: string | number;
    totalSavings: string | number;
    upcomingSchedules: Array<{
      id: string;
      type: string;
      executionDate: string;
      milesAmount: number;
    }>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Investido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(dashboard.totalInvested)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Economizado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboard.totalSavings)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts table */}
      <Card>
        <CardHeader>
          <CardTitle>Milhas por Programa</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.accounts?.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Programa</th>
                  <th className="pb-2">Milhas</th>
                  <th className="pb-2">Preço Médio</th>
                  <th className="pb-2">Total Investido</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.accounts.map((acc, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{acc.programName}</td>
                    <td className="py-2">{acc.miles.toLocaleString("pt-BR")}</td>
                    <td className="py-2">{formatCurrency(acc.averagePrice)}</td>
                    <td className="py-2">{formatCurrency(acc.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhuma conta de fidelidade encontrada.</p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming schedules */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Recebimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.upcomingSchedules?.length > 0 ? (
            <ul className="space-y-2">
              {dashboard.upcomingSchedules.map((s) => (
                <li key={s.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
                  <span>{s.type}</span>
                  <span>{s.milesAmount.toLocaleString("pt-BR")} milhas</span>
                  <span>{new Date(s.executionDate).toLocaleDateString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Nenhum recebimento pendente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
