import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useClubsQuery, useCreateClubMutation } from "../hooks/useClubsQuery";
import { useProgramsQuery } from "../hooks/useProgramsQuery";
import { clubSchema, type ClubFormData } from "../utils/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";

const formatCurrency = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ClubsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useClubsQuery();
  const { data: programsData } = useProgramsQuery();
  const createMutation = useCreateClubMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClubFormData>({ resolver: zodResolver(clubSchema) });

  const onSubmit = (formData: ClubFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => { reset(); setShowForm(false); },
    });
  };

  const clubs = (data ?? []) as Array<{
    id: string;
    plan: string;
    milesPerMonth: number;
    monthlyFee: string | number;
    startDate: string;
    endDate: string;
    chargeDay: number;
    paymentMethod: string;
    active: boolean;
    program: { name: string };
  }>;

  const programs = (programsData ?? []) as Array<{ id: string; name: string }>;

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar clubes.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clubes de Milhas</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Novo Clube"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Novo Clube</CardTitle></CardHeader>
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
                <Label>Plano</Label>
                <Input {...register("plan")} />
                {errors.plan && <p className="text-red-500 text-xs mt-1">{errors.plan.message}</p>}
              </div>
              <div>
                <Label>Milhas por Mês</Label>
                <Input type="number" {...register("milesPerMonth")} />
                {errors.milesPerMonth && <p className="text-red-500 text-xs mt-1">{errors.milesPerMonth.message}</p>}
              </div>
              <div>
                <Label>Valor Mensal</Label>
                <Input type="number" step="0.01" {...register("monthlyFee")} />
                {errors.monthlyFee && <p className="text-red-500 text-xs mt-1">{errors.monthlyFee.message}</p>}
              </div>
              <div>
                <Label>Data de Início</Label>
                <Input type="date" {...register("startDate")} />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
              </div>
              <div>
                <Label>Data de Fim</Label>
                <Input type="date" {...register("endDate")} />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
              </div>
              <div>
                <Label>Dia de Cobrança</Label>
                <Input type="number" {...register("chargeDay")} />
                {errors.chargeDay && <p className="text-red-500 text-xs mt-1">{errors.chargeDay.message}</p>}
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
        <CardHeader><CardTitle>Seus Clubes</CardTitle></CardHeader>
        <CardContent>
          {clubs.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Programa</th>
                  <th className="pb-2">Plano</th>
                  <th className="pb-2">Milhas/Mês</th>
                  <th className="pb-2">Valor Mensal</th>
                  <th className="pb-2">Período</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {clubs.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2">{c.program.name}</td>
                    <td className="py-2">{c.plan}</td>
                    <td className="py-2">{c.milesPerMonth.toLocaleString("pt-BR")}</td>
                    <td className="py-2">{formatCurrency(c.monthlyFee)}</td>
                    <td className="py-2">
                      {new Date(c.startDate).toLocaleDateString("pt-BR")} - {new Date(c.endDate).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2">{c.active ? "Ativo" : "Inativo"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhum clube cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubsPage;
