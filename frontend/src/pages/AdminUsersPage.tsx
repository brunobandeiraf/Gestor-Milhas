import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUsersQuery, useCreateUserMutation } from "../hooks/useUsersQuery";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";

const createUserSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

const AdminUsersPage = () => {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useUsersQuery();
  const createMutation = useCreateUserMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({ resolver: zodResolver(createUserSchema) });

  const onSubmit = (formData: CreateUserFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        reset();
        setShowForm(false);
      },
    });
  };

  const users = (data ?? []) as Array<{
    id: string;
    email: string;
    fullName: string | null;
    registrationStatus: string;
  }>;

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar usuários.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Novo Usuário"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Criar Usuário</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" {...register("email")} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label>Senha</Label>
                <Input type="password" {...register("password")} />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Usuários Gerenciados</CardTitle></CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Nome</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">{u.fullName ?? "—"}</td>
                    <td className="py-2">
                      <span className={u.registrationStatus === "COMPLETE" ? "text-green-600" : "text-yellow-600"}>
                        {u.registrationStatus === "COMPLETE" ? "Completo" : "Pendente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhum usuário cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersPage;
