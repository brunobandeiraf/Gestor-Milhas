import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransfersQuery, useCreateTransferMutation } from "../hooks/useTransfersQuery";
import { useProgramsQuery } from "../hooks/useProgramsQuery";
import { transferSchema, type TransferFormData } from "../utils/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";

const formatCurrency = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TransfersPage = () => {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useTransfersQuery();
  const { data: programsData } = useProgramsQuery();
  const createMutation = useCreateTransferMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: { cartPurchase: false, boomerang: false, bonusPercentage: 0 },
  });

  const cartPurchase = watch("cartPurchase");
  const boomerang = watch("boomerang");
  const bonusPercentage = watch("bonusPercentage");

  const onSubmit = (formData: TransferFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => { reset(); setShowForm(false); },
    });
  };

  const transfers = (data ?? []) as Array<{
    id: string;
    miles: number;
    bonusPercentage: string | number;
    bonusMiles: number;
    transferDate: string;
    receiveDate: string;
    cartPurchase: boolean;
    cartPurchaseCost: string | number;
    boomerang: boolean;
    boomerangMiles: number | null;
    originProgramId: string;
    destinationProgramId: string;
  }>;

  const programs = (programsData ?? []) as Array<{ id: string; name: string }>;
  const programMap = Object.fromEntries(programs.map((p) => [p.id, p.name]));

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar transferências.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transferências</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Nova Transferência"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nova Transferência</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Programa de Origem</Label>
                <select {...register("originProgramId")} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option value="">Selecione...</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.originProgramId && <p className="text-red-500 text-xs mt-1">{errors.originProgramId.message}</p>}
              </div>
              <div>
                <Label>Programa de Destino</Label>
                <select {...register("destinationProgramId")} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option value="">Selecione...</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.destinationProgramId && <p className="text-red-500 text-xs mt-1">{errors.destinationProgramId.message}</p>}
              </div>
              <div>
                <Label>Milhas</Label>
                <Input type="number" {...register("miles")} />
                {errors.miles && <p className="text-red-500 text-xs mt-1">{errors.miles.message}</p>}
              </div>
              <div>
                <Label>% Bônus</Label>
                <Input type="number" step="0.01" {...register("bonusPercentage")} />
              </div>
              <div>
                <Label>Data da Transferência</Label>
                <Input type="date" {...register("transferDate")} />
                {errors.transferDate && <p className="text-red-500 text-xs mt-1">{errors.transferDate.message}</p>}
              </div>
              <div>
                <Label>Data de Recebimento</Label>
                <Input type="date" {...register("receiveDate")} />
                {errors.receiveDate && <p className="text-red-500 text-xs mt-1">{errors.receiveDate.message}</p>}
              </div>
              {Number(bonusPercentage) > 0 && (
                <div>
                  <Label>Data Recebimento Bônus</Label>
                  <Input type="date" {...register("bonusReceiveDate")} />
                </div>
              )}
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

              {/* Conditional: Cart Purchase */}
              <div className="md:col-span-2 flex items-center gap-2">
                <input type="checkbox" {...register("cartPurchase")} id="cartPurchase" />
                <Label htmlFor="cartPurchase">Compra no Carrinho</Label>
              </div>
              {cartPurchase && (
                <div>
                  <Label>Custo do Carrinho</Label>
                  <Input type="number" step="0.01" {...register("cartPurchaseCost")} />
                </div>
              )}

              {/* Conditional: Boomerang */}
              <div className="md:col-span-2 flex items-center gap-2">
                <input type="checkbox" {...register("boomerang")} id="boomerang" />
                <Label htmlFor="boomerang">Bumerangue</Label>
              </div>
              {boomerang && (
                <>
                  <div>
                    <Label>Milhas Bumerangue</Label>
                    <Input type="number" {...register("boomerangMiles")} />
                  </div>
                  <div>
                    <Label>Data Retorno Bumerangue</Label>
                    <Input type="date" {...register("boomerangReturnDate")} />
                  </div>
                </>
              )}

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
          {transfers.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Origem</th>
                  <th className="pb-2">Destino</th>
                  <th className="pb-2">Milhas</th>
                  <th className="pb-2">Bônus</th>
                  <th className="pb-2">Recebimento</th>
                  <th className="pb-2">Carrinho</th>
                  <th className="pb-2">Bumerangue</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(t.transferDate).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2">{programMap[t.originProgramId] ?? t.originProgramId}</td>
                    <td className="py-2">{programMap[t.destinationProgramId] ?? t.destinationProgramId}</td>
                    <td className="py-2">{t.miles.toLocaleString("pt-BR")}</td>
                    <td className="py-2">{t.bonusMiles > 0 ? `${t.bonusMiles.toLocaleString("pt-BR")} (${t.bonusPercentage}%)` : "-"}</td>
                    <td className="py-2">{new Date(t.receiveDate).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2">{t.cartPurchase ? formatCurrency(t.cartPurchaseCost) : "-"}</td>
                    <td className="py-2">{t.boomerang ? `${t.boomerangMiles?.toLocaleString("pt-BR")} milhas` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhuma transferência registrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransfersPage;
