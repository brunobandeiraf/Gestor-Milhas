import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCardsQuery, useCreateCardMutation } from "../hooks/useCardsQuery";
import { useBanksQuery } from "../hooks/useBanksQuery";
import { cardSchema, type CardFormData } from "../utils/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";

const formatCurrency = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CardsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useCardsQuery();
  const { data: banksData } = useBanksQuery();
  const createMutation = useCreateCardMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CardFormData>({ resolver: zodResolver(cardSchema) });

  const onSubmit = (formData: CardFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        reset();
        setShowForm(false);
      },
    });
  };

  const cards = (data ?? []) as Array<{
    id: string;
    name: string;
    bank: { name: string };
    closingDay: number;
    dueDay: number;
    creditLimit: string | number;
    annualFee: string | number;
    active: boolean;
  }>;

  const banks = (banksData ?? []) as Array<{ id: string; name: string }>;

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar cartões.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cartões</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Novo Cartão"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Novo Cartão</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Banco</Label>
                <select {...register("bankId")} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option value="">Selecione...</option>
                  {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.bankId && <p className="text-red-500 text-xs mt-1">{errors.bankId.message}</p>}
              </div>
              <div>
                <Label>Nome do Cartão</Label>
                <Input {...register("name")} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label>Dia de Fechamento</Label>
                <Input type="number" {...register("closingDay")} />
                {errors.closingDay && <p className="text-red-500 text-xs mt-1">{errors.closingDay.message}</p>}
              </div>
              <div>
                <Label>Dia de Vencimento</Label>
                <Input type="number" {...register("dueDay")} />
                {errors.dueDay && <p className="text-red-500 text-xs mt-1">{errors.dueDay.message}</p>}
              </div>
              <div>
                <Label>Limite</Label>
                <Input type="number" step="0.01" {...register("creditLimit")} />
                {errors.creditLimit && <p className="text-red-500 text-xs mt-1">{errors.creditLimit.message}</p>}
              </div>
              <div>
                <Label>Anuidade</Label>
                <Input type="number" step="0.01" {...register("annualFee")} />
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
        <CardHeader><CardTitle>Seus Cartões</CardTitle></CardHeader>
        <CardContent>
          {cards.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Cartão</th>
                  <th className="pb-2">Banco</th>
                  <th className="pb-2">Fechamento</th>
                  <th className="pb-2">Vencimento</th>
                  <th className="pb-2">Limite</th>
                  <th className="pb-2">Anuidade</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2">{c.name}</td>
                    <td className="py-2">{c.bank.name}</td>
                    <td className="py-2">Dia {c.closingDay}</td>
                    <td className="py-2">Dia {c.dueDay}</td>
                    <td className="py-2">{formatCurrency(c.creditLimit)}</td>
                    <td className="py-2">{formatCurrency(c.annualFee)}</td>
                    <td className="py-2">{c.active ? "Ativo" : "Inativo"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhum cartão cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CardsPage;
