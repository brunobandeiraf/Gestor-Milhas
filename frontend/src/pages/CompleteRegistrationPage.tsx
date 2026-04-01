import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  completeRegistrationSchema,
  type CompleteRegistrationFormData,
} from "../utils/schemas";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Button } from "../components/ui/Button";
import CepAutoComplete from "../components/CepAutoComplete";
import { Plane } from "lucide-react";
import axios from "axios";

const CompleteRegistrationPage = () => {
  const navigate = useNavigate();
  const { getUser, logout } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CompleteRegistrationFormData>({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: {
      email: getUser()?.email || "",
      complement: "",
    },
  });

  const zipCodeValue = watch("zipCode") || "";

  const handleNextStep = async () => {
    const valid = await trigger(["fullName", "cpf", "birthDate", "email", "phone"]);
    if (valid) setStep(2);
  };

  const handleAddressFound = (data: {
    state: string;
    city: string;
    street: string;
    neighborhood: string;
  }) => {
    setValue("state", data.state, { shouldValidate: true });
    setValue("city", data.city, { shouldValidate: true });
    setValue("street", data.street, { shouldValidate: true });
    setValue("neighborhood", data.neighborhood, { shouldValidate: true });
  };

  const onSubmit = async (data: CompleteRegistrationFormData) => {
    setError(null);
    setLoading(true);
    const user = getUser();
    if (!user) {
      logout();
      navigate("/login");
      return;
    }

    try {
      // Convert birthDate to ISO datetime for the backend
      const payload = {
        ...data,
        birthDate: new Date(data.birthDate).toISOString(),
      };
      await api.put(`/users/${user.userId}/complete-registration`, payload);
      // Re-login to get updated token with COMPLETE status
      logout();
      navigate("/login");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Erro ao completar cadastro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Plane className="h-10 w-10 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Completar Cadastro</h1>
          <p className="text-gray-600 mt-1 text-sm">
            {step === 1 ? "Passo 1 de 2 — Dados Pessoais" : "Passo 2 de 2 — Endereço"}
          </p>
          {/* Step indicator */}
          <div className="flex gap-2 justify-center mt-4">
            <div className={`h-1.5 w-16 rounded-full ${step >= 1 ? "bg-blue-600" : "bg-gray-300"}`} />
            <div className={`h-1.5 w-16 rounded-full ${step >= 2 ? "bg-blue-600" : "bg-gray-300"}`} />
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4"
        >
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input id="fullName" placeholder="Seu nome completo" {...register("fullName")} />
                {errors.fullName && <p className="text-red-600 text-xs">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" placeholder="00000000000" maxLength={14} {...register("cpf")} />
                {errors.cpf && <p className="text-red-600 text-xs">{errors.cpf.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input id="birthDate" type="date" {...register("birthDate")} />
                {errors.birthDate && <p className="text-red-600 text-xs">{errors.birthDate.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" {...register("email")} />
                {errors.email && <p className="text-red-600 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(00) 00000-0000" {...register("phone")} />
                {errors.phone && <p className="text-red-600 text-xs">{errors.phone.message}</p>}
              </div>

              <Button type="button" className="w-full" onClick={handleNextStep}>
                Próximo
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <CepAutoComplete
                value={zipCodeValue}
                onChange={(val) => setValue("zipCode", val, { shouldValidate: true })}
                onAddressFound={handleAddressFound}
                error={errors.zipCode?.message}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" placeholder="UF" {...register("state")} />
                  {errors.state && <p className="text-red-600 text-xs">{errors.state.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" placeholder="Cidade" {...register("city")} />
                  {errors.city && <p className="text-red-600 text-xs">{errors.city.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="street">Rua</Label>
                <Input id="street" placeholder="Rua" {...register("street")} />
                {errors.street && <p className="text-red-600 text-xs">{errors.street.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="number">Número</Label>
                  <Input id="number" placeholder="Nº" {...register("number")} />
                  {errors.number && <p className="text-red-600 text-xs">{errors.number.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input id="complement" placeholder="Apto, bloco..." {...register("complement")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" placeholder="Bairro" {...register("neighborhood")} />
                {errors.neighborhood && <p className="text-red-600 text-xs">{errors.neighborhood.message}</p>}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Salvando..." : "Finalizar Cadastro"}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CompleteRegistrationPage;
