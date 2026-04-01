import { useState, useCallback } from "react";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Loader2 } from "lucide-react";

interface CepData {
  state: string;
  city: string;
  street: string;
  neighborhood: string;
}

interface CepAutoCompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressFound: (data: CepData) => void;
  error?: string;
}

const CepAutoComplete = ({ value, onChange, onAddressFound, error }: CepAutoCompleteProps) => {
  const [loading, setLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const fetchCep = useCallback(
    async (cep: string) => {
      const digits = cep.replace(/\D/g, "");
      if (digits.length !== 8) return;

      setLoading(true);
      setCepError(null);

      try {
        const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await response.json();

        if (data.erro) {
          setCepError("CEP não encontrado");
          return;
        }

        onAddressFound({
          state: data.uf || "",
          city: data.localidade || "",
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
        });
      } catch {
        setCepError("Erro ao buscar CEP");
      } finally {
        setLoading(false);
      }
    },
    [onAddressFound]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    onChange(raw);
    setCepError(null);
    if (raw.length === 8) {
      fetchCep(raw);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="zipCode">CEP</Label>
      <div className="relative">
        <Input
          id="zipCode"
          placeholder="00000000"
          value={value}
          onChange={handleChange}
          maxLength={8}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>
      {(error || cepError) && (
        <p className="text-red-600 text-xs">{cepError || error}</p>
      )}
    </div>
  );
};

export default CepAutoComplete;
