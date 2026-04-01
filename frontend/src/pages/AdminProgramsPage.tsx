import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProgramsQuery } from "../hooks/useProgramsQuery";
import { useCreateProgramMutation } from "../hooks/useCreateProgramMutation";
import { useAirlinesQuery } from "../hooks/useAirlinesQuery";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";

const programSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["BANK", "AIRLINE"]),
  airlineId: z.string().optional(),
  cpfLimit: z.coerce.number().min(0).optional(),
}).refine(
  (data) => data.type !== "AIRLINE" || (data.airlineId && data.airlineId.length > 0),
  { message: "Companhia aérea é obrigatória para programas aéreos", path: ["airlineId"] }
);

type ProgramFormData = z.infer<typeof programSchema>;

const AdminProgramsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useProgramsQuery();
  const { data: airlinesData } = useAirlinesQuery();
  const createMutation = useCreateProgramMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProgramFormData>({ resolver: zodResolver(programSchema), defaultValues: { type: "BANK" } });

  const selectedType = watch("type");

  const onSubmit = (formData: ProgramFormData) => {
    const payload: { name: string; type: "BANK" | "AIRLINE"; airlineId?: string; cpfLimit?: number } = {
      name: formData.name,
      type: formData.type,
    };
    if (formData.type === "AIRLINE" && formData.airlineId) {
      payload.airlineId = formData.airlineId;
    }
    if (formData.cpfLimit !== undefined) {
      payload.cpfLimit = formData.cpfLimit;
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        reset();
        setShowForm(false);
      },
    });
  };

  const programs = (data ?? []) as Array<{
    id: string;
    name: string;
    type: string;
    airline?: { name: string } | null;
    cpfLimit: number | null;
    active: boolean;
  }>;

  const airlines = (airlinesData ?? []) as Array<{ id: string; name: string; active: boolean }>;
  const activeAirlines = airlines.filter((a) => a.active);

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar programas.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Programas</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Novo Programa"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Novo Programa</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input {...register("name")} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label>Tipo</Label>
                <select {...register("type")} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option value="BANK">Banco</option>
                  <option value="AIRLINE">Companhia Aérea</option>
                </select>
              </div>
              {selectedType === "AIRLINE" && (
                <div>
                  <Label>Companhia Aérea</Label>
                  <select {...register("airlineId")} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="">Selecione...</option>
                    {activeAirlines.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {errors.airlineId && <p className="text-red-500 text-xs mt-1">{errors.airlineId.message}</p>}
                </div>
              )}
              <div>
                <Label>Limite de CPF</Label>
                <Input type="number" {...register("cpfLimit")} />
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
        <CardHeader><CardTitle>Programas Cadastrados</CardTitle></CardHeader>
        <CardContent>
          {programs.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Nome</th>
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Companhia</th>
                  <th className="pb-2">Limite CPF</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2">{p.type === "AIRLINE" ? "Aéreo" : "Banco"}</td>
                    <td className="py-2">{p.airline?.name ?? "—"}</td>
                    <td className="py-2">{p.cpfLimit ?? "—"}</td>
                    <td className="py-2">
                      <span className={p.active ? "text-green-600" : "text-red-500"}>
                        {p.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhum programa cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProgramsPage;
