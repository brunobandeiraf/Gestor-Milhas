import { useSchedulesQuery } from "../hooks/useSchedulesQuery";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

const typeLabels: Record<string, string> = {
  CLUB_CHARGE: "Cobrança de Clube",
  BONUS_PURCHASE_CREDIT: "Crédito Compra Bonificada",
  TRANSFER_CREDIT: "Crédito Transferência",
  TRANSFER_BONUS_CREDIT: "Crédito Bônus Transferência",
  BOOMERANG_RETURN: "Retorno Bumerangue",
};

const SchedulesPage = () => {
  const { data, isLoading, error } = useSchedulesQuery();

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar agendamentos.</p>;

  const schedules = (data ?? []) as Array<{
    id: string;
    type: string;
    executionDate: string;
    milesAmount: number;
    status: string;
    loyaltyAccount?: { program?: { name: string } };
  }>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
      <Card>
        <CardHeader><CardTitle>Agendamentos Pendentes</CardTitle></CardHeader>
        <CardContent>
          {schedules.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Programa</th>
                  <th className="pb-2">Milhas</th>
                  <th className="pb-2">Data Prevista</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2">{typeLabels[s.type] ?? s.type}</td>
                    <td className="py-2">{s.loyaltyAccount?.program?.name ?? "-"}</td>
                    <td className="py-2">{s.milesAmount.toLocaleString("pt-BR")}</td>
                    <td className="py-2">{new Date(s.executionDate).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2">{s.status === "PENDING" ? "Pendente" : s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhum agendamento pendente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulesPage;
