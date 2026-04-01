import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransactionsQuery, useCreateTransactionMutation } from "../hooks/useTransactionsQuery";
import { useProgramsQuery } from "../hooks/useProgramsQuery";
import { transactionSchema, type TransactionFormData } from "../utils/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";

const formatCurrency = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const typeLabels: Record<string, string> = {
  PURCHASE: "Compra",
  BONUS: "Bônus",
  CARD_POINTS: "Pontos do Cartão",
  MANUAL_ADJUST: "Ajuste Manual",
};

const TransactionsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useTransactionsQuery();
  const { data: programsData } = useProgramsQuery();
  const createMutation = useCreateTransactionMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { costMode: "VM" },
  });

  const costMode = watch("costMode");

  const onSubmit = (formData: TransactionFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => { reset(); setShowForm(false); },
    });
  };

  const transactions = (data ?? []) as Array<{
    id: string;
    type: string;
    miles: number;
    totalCost: string | number;
    costPerK: string | number;
    date: string;
    program: { name: string };
  }>;

  const programs = (programsData ?? []) as Array<{ id: string; name: string }>;

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar movimentações.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Movimentações</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Nova Movimentação"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nova Movimentação</CardTitle></CardHeader>
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
                <Label>Tipo</Label>
                <select {...register("type")} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option value="">Selecione...</option>
                  <option value="PURCHASE">Compra</option>
                  <option value="BONUS">Bônus</option>
                  <option value="CARD_POINTS">Pontos do Cartão</option>
                  <option value="MANUAL_ADJUST">Ajuste Manual</option>
                </select>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
              </div>
              <div>
                <Label>Milhas</Label>
                <Input type="number" {...register("miles")} />
                {errors.miles && <p className="text-red-500 text-xs mt-1">{errors.miles.message}</p>}
              </div>
              <div>
                <Label>Modo de Valor</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-1 text-sm">
                    <input type="radio" value="VM" {...register("costMode")} />
                    Valor por Milheiro (VM)
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input type="radio" value="VT" {...register("costMode")} />
                    Valor Total (VT)
                  </label>
                </div>
              </div>
              <div>
                <Label>{costMode === "VM" ? "Valor por Milheiro (R$)" : "Valor Total (R$)"}</Label>
                <Input type="number" step="0.01" {...register("costValue")} />
                {errors.costValue && <p className="text-red-500 text-xs mt-1">{errors.costValue.message}</p>}
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" {...register("date")} />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
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
                {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod.message}</p>}
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
          {transactions.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Programa</th>
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Milhas</th>
                  <th className="pb-2">Valor Total</th>
                  <th className="pb-2">R$/Milheiro</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2">{t.program.name}</td>
                    <td className="py-2">{typeLabels[t.type] ?? t.type}</td>
                    <td className="py-2">{t.miles.toLocaleString("pt-BR")}</td>
                    <td className="py-2">{formatCurrency(t.totalCost)}</td>
                    <td className="py-2">{formatCurrency(t.costPerK)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhuma movimentação registrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;
