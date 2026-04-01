import { useAdminDashboardQuery } from "../hooks/useAdminDashboardQuery";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

const formatCurrency = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminDashboardPage = () => {
  const { data, isLoading, error } = useAdminDashboardQuery();

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar dashboard.</p>;

  const dashboard = data as {
    managedSavings: string | number;
    globalSavings: string | number;
    users: Array<{
      id: string;
      email: string;
      fullName: string | null;
      totalMiles: number;
      totalInvested: string | number;
      totalSaved: string | number;
    }>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Economia dos Gerenciados</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(dashboard.managedSavings)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Economia Global</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboard.globalSavings)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Usuários</CardTitle></CardHeader>
        <CardContent>
          {dashboard.users?.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Nome</th>
                  <th className="pb-2">Total Milhas</th>
                  <th className="pb-2">Total Investido</th>
                  <th className="pb-2">Total Economizado</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">{u.fullName ?? "—"}</td>
                    <td className="py-2">{u.totalMiles.toLocaleString("pt-BR")}</td>
                    <td className="py-2">{formatCurrency(u.totalInvested)}</td>
                    <td className="py-2">{formatCurrency(u.totalSaved)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhum usuário encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
