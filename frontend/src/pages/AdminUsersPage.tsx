import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import {
  useUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useAdminValidateUserMutation,
  useDeleteUserMutation,
  useResendActivationMutation,
} from "../hooks/useUsersQuery";
import { completeRegistrationSchema, type CompleteRegistrationFormData } from "../utils/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { PhoneInput } from "../components/ui/PhoneInput";
import { CpfInput } from "../components/ui/CpfInput";
import CepAutoComplete from "../components/CepAutoComplete";

const createUserSchema = z.object({
  fullName: z.string().min(1, "Nome é obrigatório"),
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface UserData {
  id: string;
  email: string;
  fullName: string | null;
  cpf: string | null;
  birthDate: string | null;
  phone: string | null;
  zipCode: string | null;
  state: string | null;
  city: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  registrationStatus: string;
}

const ITEMS_PER_PAGE = 10;

const AdminUsersPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [validatingUser, setValidatingUser] = useState<UserData | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, error } = useUsersQuery();
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const validateMutation = useAdminValidateUserMutation();
  const deleteMutation = useDeleteUserMutation();
  const resendActivationMutation = useResendActivationMutation();

  const createForm = useForm<CreateUserFormData>({ resolver: zodResolver(createUserSchema) });

  const editForm = useForm<Partial<UserData>>();

  const validateForm = useForm<CompleteRegistrationFormData>({
    resolver: zodResolver(completeRegistrationSchema),
  });

  const onCreateSubmit = (formData: CreateUserFormData) => {
    setCreateError(null);
    createMutation.mutate(formData, {
      onSuccess: () => { createForm.reset(); setShowCreateForm(false); },
      onError: (err: unknown) => {
        if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
          setCreateError(err.response.data.error.message);
        } else {
          setCreateError("Erro ao criar usuário. Tente novamente.");
        }
      },
    });
  };

  const onEditSubmit = (formData: Partial<UserData>) => {
    if (!editingUser) return;
    updateMutation.mutate({ id: editingUser.id, ...formData }, {
      onSuccess: () => { setEditingUser(null); editForm.reset(); },
    });
  };

  const onValidateSubmit = (formData: CompleteRegistrationFormData) => {
    if (!validatingUser) return;
    const payload = { ...formData, birthDate: new Date(formData.birthDate).toISOString() };
    validateMutation.mutate({ id: validatingUser.id, ...payload }, {
      onSuccess: () => { setValidatingUser(null); validateForm.reset(); },
    });
  };

  const startEdit = (user: UserData) => {
    setEditingUser(user);
    setValidatingUser(null);
    setShowCreateForm(false);
    editForm.reset({
      fullName: user.fullName ?? "",
      email: user.email,
      cpf: user.cpf ?? "",
      birthDate: user.birthDate ? user.birthDate.split("T")[0] : "",
      phone: user.phone ?? "",
      zipCode: user.zipCode ?? "",
      state: user.state ?? "",
      city: user.city ?? "",
      street: user.street ?? "",
      number: user.number ?? "",
      complement: user.complement ?? "",
      neighborhood: user.neighborhood ?? "",
    });
  };

  const handleDelete = (user: UserData) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${user.fullName ?? user.email}?`)) return;
    deleteMutation.mutate(user.id);
  };

  const handleResendActivation = (user: UserData) => {
    resendActivationMutation.mutate(user.id, {
      onSuccess: () => alert("Email de ativação reenviado com sucesso!"),
      onError: () => alert("Erro ao reenviar email de ativação."),
    });
  };

  const startValidate = (user: UserData) => {
    setValidatingUser(user);
    setEditingUser(null);
    setShowCreateForm(false);
    validateForm.reset({
      fullName: user.fullName ?? "",
      email: user.email,
      cpf: user.cpf ?? "",
      birthDate: user.birthDate ? user.birthDate.split("T")[0] : "",
      phone: user.phone ?? "",
      zipCode: user.zipCode ?? "",
      state: user.state ?? "",
      city: user.city ?? "",
      street: user.street ?? "",
      number: user.number ?? "",
      complement: user.complement ?? "",
      neighborhood: user.neighborhood ?? "",
    });
  };

  const users = (data ?? []) as UserData[];

  // Filter users by search term
  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.fullName ?? "").toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  if (isLoading) return <p className="text-gray-500">Carregando...</p>;
  if (error) return <p className="text-red-500">Erro ao carregar usuários.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <Button onClick={() => { setShowCreateForm(!showCreateForm); setEditingUser(null); setValidatingUser(null); }}>
          {showCreateForm ? "Cancelar" : "Novo Usuário"}
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <Card>
          <CardHeader><CardTitle>Criar Usuário</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {createError && (
                <div className="md:col-span-3 bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
                  {createError}
                </div>
              )}
              <div>
                <Label>Nome</Label>
                <Input {...createForm.register("fullName")} placeholder="Nome completo" />
                {createForm.formState.errors.fullName && <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.fullName.message}</p>}
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" {...createForm.register("email")} />
                {createForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <Label>Senha</Label>
                <Input type="password" {...createForm.register("password")} />
                {createForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.password.message}</p>}
              </div>
              <div className="md:col-span-3">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit form */}
      {editingUser && (
        <Card>
          <CardHeader><CardTitle>Editar Usuário — {editingUser.fullName ?? editingUser.email}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nome Completo</Label>
                <Input {...editForm.register("fullName")} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" {...editForm.register("email")} />
              </div>
              <div>
                <Label>CPF</Label>
                <CpfInput
                  value={editForm.watch("cpf") || ""}
                  onChange={(val) => editForm.setValue("cpf", val)}
                />
              </div>
              <div>
                <Label>Data de Nascimento</Label>
                <Input type="date" {...editForm.register("birthDate")} />
              </div>
              <div>
                <Label>Telefone</Label>
                <PhoneInput
                  value={editForm.watch("phone") || ""}
                  onChange={(val) => editForm.setValue("phone", val)}
                />
              </div>
              <CepAutoComplete
                value={editForm.watch("zipCode") || ""}
                onChange={(val) => editForm.setValue("zipCode", val)}
                onAddressFound={(addr) => {
                  editForm.setValue("state", addr.state);
                  editForm.setValue("city", addr.city);
                  editForm.setValue("street", addr.street);
                  editForm.setValue("neighborhood", addr.neighborhood);
                }}
              />
              <div>
                <Label>Estado</Label>
                <Input {...editForm.register("state")} />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input {...editForm.register("city")} />
              </div>
              <div>
                <Label>Rua</Label>
                <Input {...editForm.register("street")} />
              </div>
              <div>
                <Label>Número</Label>
                <Input {...editForm.register("number")} />
              </div>
              <div>
                <Label>Complemento</Label>
                <Input {...editForm.register("complement")} />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input {...editForm.register("neighborhood")} />
              </div>
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Validate form (admin completes registration for user) */}
      {validatingUser && (
        <Card>
          <CardHeader><CardTitle>Validar Usuário — {validatingUser.fullName ?? validatingUser.email}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={validateForm.handleSubmit(onValidateSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nome Completo</Label>
                <Input {...validateForm.register("fullName")} />
                {validateForm.formState.errors.fullName && <p className="text-red-500 text-xs mt-1">{validateForm.formState.errors.fullName.message}</p>}
              </div>
              <div>
                <Label>CPF</Label>
                <CpfInput
                  value={validateForm.watch("cpf") || ""}
                  onChange={(val) => validateForm.setValue("cpf", val, { shouldValidate: true })}
                />
                {validateForm.formState.errors.cpf && <p className="text-red-500 text-xs mt-1">{validateForm.formState.errors.cpf.message}</p>}
              </div>
              <div>
                <Label>Data de Nascimento</Label>
                <Input type="date" {...validateForm.register("birthDate")} />
                {validateForm.formState.errors.birthDate && <p className="text-red-500 text-xs mt-1">{validateForm.formState.errors.birthDate.message}</p>}
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" {...validateForm.register("email")} />
                {validateForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{validateForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <Label>Telefone</Label>
                <PhoneInput
                  value={validateForm.watch("phone") || ""}
                  onChange={(val) => validateForm.setValue("phone", val, { shouldValidate: true })}
                />
                {validateForm.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{validateForm.formState.errors.phone.message}</p>}
              </div>
              <CepAutoComplete
                value={validateForm.watch("zipCode") || ""}
                onChange={(val) => validateForm.setValue("zipCode", val, { shouldValidate: true })}
                onAddressFound={(addr) => {
                  validateForm.setValue("state", addr.state, { shouldValidate: true });
                  validateForm.setValue("city", addr.city, { shouldValidate: true });
                  validateForm.setValue("street", addr.street, { shouldValidate: true });
                  validateForm.setValue("neighborhood", addr.neighborhood, { shouldValidate: true });
                }}
                error={validateForm.formState.errors.zipCode?.message}
              />
              <div>
                <Label>Estado</Label>
                <Input {...validateForm.register("state")} />
                {validateForm.formState.errors.state && <p className="text-red-500 text-xs mt-1">{validateForm.formState.errors.state.message}</p>}
              </div>
              <div>
                <Label>Cidade</Label>
                <Input {...validateForm.register("city")} />
                {validateForm.formState.errors.city && <p className="text-red-500 text-xs mt-1">{validateForm.formState.errors.city.message}</p>}
              </div>
              <div>
                <Label>Rua</Label>
                <Input {...validateForm.register("street")} />
                {validateForm.formState.errors.street && <p className="text-red-500 text-xs mt-1">{validateForm.formState.errors.street.message}</p>}
              </div>
              <div>
                <Label>Número</Label>
                <Input {...validateForm.register("number")} />
                {validateForm.formState.errors.number && <p className="text-red-500 text-xs mt-1">{validateForm.formState.errors.number.message}</p>}
              </div>
              <div>
                <Label>Complemento</Label>
                <Input {...validateForm.register("complement")} />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input {...validateForm.register("neighborhood")} />
                {validateForm.formState.errors.neighborhood && <p className="text-red-500 text-xs mt-1">{validateForm.formState.errors.neighborhood.message}</p>}
              </div>
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" disabled={validateMutation.isPending}>
                  {validateMutation.isPending ? "Validando..." : "Validar Usuário"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setValidatingUser(null)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usuários Gerenciados</CardTitle>
            <span className="text-sm text-gray-500">{filteredUsers.length} usuário(s)</span>
          </div>
          <div className="mt-3">
            <Input
              placeholder="Pesquisar por nome ou email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {paginatedUsers.length > 0 ? (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2">Nome</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2">{u.fullName ?? "—"}</td>
                      <td className="py-2">{u.email}</td>
                      <td className="py-2">
                        <span className={u.registrationStatus === "COMPLETE" ? "text-green-600" : "text-yellow-600"}>
                          {u.registrationStatus === "COMPLETE" ? "Completo" : "Pendente"}
                        </span>
                      </td>
                      <td className="py-2 flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(u)}>Editar</Button>
                        {u.registrationStatus === "PENDING" && (
                          <Button variant="ghost" size="sm" onClick={() => startValidate(u)}>Validar</Button>
                        )}
                        {u.registrationStatus === "PENDING" && (
                          <Button variant="ghost" size="sm" onClick={() => handleResendActivation(u)}>
                            Reenviar Email
                          </Button>
                        )}
                        {u.registrationStatus === "PENDING" && (
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800" onClick={() => handleDelete(u)}>
                            Excluir
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500">
              {searchTerm ? "Nenhum usuário encontrado para a pesquisa." : "Nenhum usuário cadastrado."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersPage;
