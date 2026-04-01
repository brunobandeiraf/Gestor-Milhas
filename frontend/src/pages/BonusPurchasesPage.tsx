import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBonusPurchasesQuery, useCreateBonusPurchaseMutation } from "../hooks/useBonusPurchasesQuery";
import { useProgramsQuery } from "../hooks/useProgramsQuery";
import { bonusPurchaseSchema, type BonusPurchaseFormData } from "../utils/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";

const formatCurrency = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const BonusPurchasesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useBonusPurchasesQuery();
  const { data: programsData } = useProgramsQuery();
  const createMutation = useCreateBonusPurchaseMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BonusPurchaseFormData>({ resolver: zodResolver(bonusPurchaseSchema) });

  const onSubmit = (formData: BonusPurchaseFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => { reset(); setShowForm(false); },
    });
  };

  const purchases = (data ?? []) as Array<{
    id: string;
    product: string;
    store: string;
    pointsPerReal: string | number;
    totalValue: string | number;
    calculatedPoints: number;
    purchaseDate: string;
    pointsReceiveDate: string;
    program: { name: string };
  }>;

  const programs = (programsData ?? []) as Array<{ id: string; name: string }>;

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar compras bonificadas.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Compras Bonificadas</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Nova Compra"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nova Compra Bonificada</CardTitle></CardHeader>
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
                <Label>Produto</Label>
                <Input {...register("product")} />
                {errors.product && <p className="text-red-500 text-xs mt-1">{errors.product.message}</p>}
              </div>
              <div>
                <Label>Loja</Label>
                <Input {...register("store")} />
                {errors.store && <p className="text-red-500 text-xs mt-1">{errors.store.message}</p>}
              </div>
              <div>
                <Label>Pontos por Real</Label>
                <Input type="number" step="0.01" {...register("pointsPerReal")} />
                {errors.pointsPerReal && <p className="text-red-500 text-xs mt-1">{errors.pointsPerReal.message}</p>}
              </div>
              <div>
                <Label>Valor Total</Label>
                <Input type="number" step="0.01" {...register("totalValue")} />
                {errors.totalValue && <p className="text-red-500 text-xs mt-1">{errors.totalValue.message}</p>}
              </div>
              <div>
                <Label>Data da Compra</Label>
                <Input type="date" {...register("purchaseDate")} />
                {errors.purchaseDate && <p className="text-red-500 text-xs mt-1">{errors.purchaseDate.message}</p>}
              </div>
              <div>
                <Label>Data Recebimento Produto</Label>
                <Input type="date" {...register("productReceiveDate")} />
                {errors.productReceiveDate && <p className="text-red-500 text-xs mt-1">{errors.productReceiveDate.message}</p>}
              </div>
              <div>
                <Label>Data Recebimento Pontos</Label>
                <Input type="date" {...register("pointsReceiveDate")} />
                {errors.pointsReceiveDate && <p className="text-red-500 text-xs mt-1">{errors.pointsReceiveDate.message}</p>}
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
          {purchases.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Programa</th>
                  <th className="pb-2">Produto</th>
                  <th className="pb-2">Loja</th>
                  <th className="pb-2">Valor</th>
                  <th className="pb-2">Pontos</th>
                  <th className="pb-2">Recebimento</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(p.purchaseDate).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2">{p.program.name}</td>
                    <td className="py-2">{p.product}</td>
                    <td className="py-2">{p.store}</td>
                    <td className="py-2">{formatCurrency(p.totalValue)}</td>
                    <td className="py-2">{p.calculatedPoints.toLocaleString("pt-BR")}</td>
                    <td className="py-2">{new Date(p.pointsReceiveDate).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhuma compra bonificada registrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BonusPurchasesPage;
