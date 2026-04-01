import { useState } from "react";
import { useAirlinesQuery, useCreateAirlineMutation, useDeactivateAirlineMutation } from "../hooks/useAirlinesQuery";
import { useBanksQuery, useCreateBankMutation, useDeactivateBankMutation } from "../hooks/useBanksQuery";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";

const AdminCatalogsPage = () => {
  const [airlineName, setAirlineName] = useState("");
  const [bankName, setBankName] = useState("");

  const { data: airlinesData, isLoading: airlinesLoading } = useAirlinesQuery();
  const createAirline = useCreateAirlineMutation();
  const deactivateAirline = useDeactivateAirlineMutation();

  const { data: banksData, isLoading: banksLoading } = useBanksQuery();
  const createBank = useCreateBankMutation();
  const deactivateBank = useDeactivateBankMutation();

  const airlines = (airlinesData ?? []) as Array<{ id: string; name: string; active: boolean }>;
  const banks = (banksData ?? []) as Array<{ id: string; name: string; active: boolean }>;

  const handleCreateAirline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!airlineName.trim()) return;
    createAirline.mutate({ name: airlineName.trim() }, {
      onSuccess: () => setAirlineName(""),
    });
  };

  const handleCreateBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) return;
    createBank.mutate({ name: bankName.trim() }, {
      onSuccess: () => setBankName(""),
    });
  };

  if (airlinesLoading || banksLoading) return <p className="text-gray-500">Carregando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Catálogos</h1>

      {/* Airlines */}
      <Card>
        <CardHeader><CardTitle>Companhias Aéreas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCreateAirline} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>Nome</Label>
              <Input value={airlineName} onChange={(e) => setAirlineName(e.target.value)} placeholder="Nome da companhia" />
            </div>
            <Button type="submit" disabled={createAirline.isPending}>
              {createAirline.isPending ? "Criando..." : "Criar"}
            </Button>
          </form>
          {airlines.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Nome</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {airlines.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2">{a.name}</td>
                    <td className="py-2">
                      <span className={a.active ? "text-green-600" : "text-red-500"}>
                        {a.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-2">
                      {a.active && (
                        <Button variant="ghost" size="sm" onClick={() => deactivateAirline.mutate(a.id)}>
                          Desativar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhuma companhia aérea cadastrada.</p>
          )}
        </CardContent>
      </Card>

      {/* Banks */}
      <Card>
        <CardHeader><CardTitle>Bancos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCreateBank} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>Nome</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Nome do banco" />
            </div>
            <Button type="submit" disabled={createBank.isPending}>
              {createBank.isPending ? "Criando..." : "Criar"}
            </Button>
          </form>
          {banks.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Nome</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {banks.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-2">{b.name}</td>
                    <td className="py-2">
                      <span className={b.active ? "text-green-600" : "text-red-500"}>
                        {b.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-2">
                      {b.active && (
                        <Button variant="ghost" size="sm" onClick={() => deactivateBank.mutate(b.id)}>
                          Desativar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhum banco cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCatalogsPage;
