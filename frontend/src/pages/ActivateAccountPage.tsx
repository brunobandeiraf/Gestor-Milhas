import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Button } from "../components/ui/Button";
import { Plane } from "lucide-react";
import api from "../services/api";
import axios from "axios";

const activateSchema = z.object({
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string().min(8, "Confirme sua senha"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ActivateFormData = z.infer<typeof activateSchema>;

const ActivateAccountPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState("");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivateFormData>({
    resolver: zodResolver(activateSchema),
  });

  useEffect(() => {
    async function verify() {
      if (!token) {
        setTokenError("Token não informado");
        setVerifying(false);
        return;
      }

      try {
        const { data } = await api.get(`/users/activate/${token}`);
        setEmail(data.email);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const msg = err.response?.data?.message || "Link inválido ou expirado";
          setTokenError(msg);
        } else {
          setTokenError("Erro ao verificar link");
        }
      } finally {
        setVerifying(false);
      }
    }

    verify();
  }, [token]);

  const onSubmit = async (data: ActivateFormData) => {
    setSubmitError(null);
    setLoading(true);

    try {
      await api.post("/users/activate", {
        token,
        password: data.password,
      });
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || "Erro ao ativar conta";
        setSubmitError(msg);
      } else {
        setSubmitError("Erro ao ativar conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando link...</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <Plane className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900">Link Inválido</h1>
          <p className="text-gray-600 mt-2 text-sm">{tokenError}</p>
          <div className="mt-6">
            <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <Plane className="h-10 w-10 text-green-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900">Conta Ativada!</h1>
          <p className="text-gray-600 mt-2 text-sm">
            Sua senha foi definida com sucesso. Agora você pode fazer login.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate("/login")} className="w-full">
              Ir para Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <Plane className="h-10 w-10 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Ativar Conta</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Defina sua senha para: <span className="font-medium">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          {submitError && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
              {submitError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password">Nova Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-red-600 text-xs">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repita a senha"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-xs">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ativando..." : "Ativar Conta"}
          </Button>

          <div className="text-center">
            <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Já tem uma conta? Faça login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivateAccountPage;
