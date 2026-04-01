import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIssuancesQuery, useCreateIssuanceMutation } from "../hooks/useIssuancesQuery";
import { useProgramsQuery } from "../hooks/useProgramsQuery";
import { issuanceSchema, type IssuanceFormData } from "../utils/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";

const formatCurrency = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const IssuancesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useIssuancesQuery();
  const { data: programsData } = useProgramsQuery();
  const createMutation = useCreateIssuanceMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IssuanceFormData>({ resolver: zodResolver(issuanceSchema) });

  const onSubmit = (formData: IssuanceFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => { reset(); setShowForm(false); },
    });
  };

  const issuances = (data ?? []) as Array<{
    id: string;
    date: string;
    cpfUsed: string;
    milesUsed: number;
    cashPaid: string | number;
    passenger: string;
    realTicketValue: string | number;
    totalCost: string | number;
    savings: string | number;
    programId: string;
  }>;

  const programs = (programsData ?? []) as Array<{ id: string; name: string }>;
  const programMap = Object.fromEntries(programs.map((p) => [p.id, p.name]));

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar emissões.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Emissões</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Nova Emissão"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nova Emissão</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Programa</Label>
                <select {...register("programId")} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option value="">Selecione...</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.programId && <p className="text-red-500 text-xs mt-1">{errors.programId.message}</p>}
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" {...register("date")} />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <Label>CPF Utilizado</Label>
                <Input {...register("cpfUsed")} />
                {errors.cpfUsed && <p className="text-red-500 text-xs mt-1">{errors.cpfUsed.message}</p>}
              </div>
              <div>
                <Label>Milhas Usadas</Label>
                <Input type="number" {...register("milesUsed")} />
                {errors.milesUsed && <p className="text-red-500 text-xs mt-1">{errors.milesUsed.message}</p>}
              </div>
              <div>
                <Label>Valor Pago em Dinheiro</Label>
                <Input type="number" step="0.01" {...register("cashPaid")} />
                {errors.cashPaid && <p className="text-red-500 text-xs mt-1">{errors.cashPaid.message}</p>}
              </div>
              <div>
                <Label>Passageiro</Label>
                <Input {...register("passenger")} />
                {errors.passenger && <p className="text-red-500 text-xs mt-1">{errors.passenger.message}</p>}
              </div>
              <div>
                <Label>Valor Real da Passagem</Label>
                <Input type="number" step="0.01" {...register("realTicketValue")} />
                {errors.realTicketValue && <p className="text-red-500 text-xs mt-1">{errors.realTicketValue.message}</p>}
              </div>
              <div>
                <Label>Localizador</Label>
                <Input {...register("locator")} />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <select {...register("paymentMethod")} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option value="">Selecione...</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="PIX">PIX</option>
                  <option value="BANK_TRANSFER">Transferência Bancária</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Observações</Label>
                <Input {...register("notes")} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent>
          {issuances.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Programa</th>
                  <th className="pb-2">Passageiro</th>
                  <th className="pb-2">Milhas</th>
                  <th className="pb-2">Custo Total</th>
                  <th className="pb-2">Valor Real</th>
                  <th className="pb-2">Economia</th>
                </tr>
              </thead>
              <tbody>
                {issuances.map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(i.date).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2">{programMap[i.programId] ?? i.programId}</td>
                    <td className="py-2">{i.passenger}</td>
                    <td className="py-2">{i.milesUsed.toLocaleString("pt-BR")}</td>
                    <td className="py-2">{formatCurrency(i.totalCost)}</td>
                    <td className="py-2">{formatCurrency(i.realTicketValue)}</td>
                    <td className="py-2 text-green-600 font-medium">{formatCurrency(i.savings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhuma emissão registrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IssuancesPage;
