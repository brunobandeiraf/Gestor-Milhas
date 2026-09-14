import { Link, Outlet } from "react-router-dom";
import { Button } from "./ui/Button";
import { Plane } from "lucide-react";

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-900">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
            <Plane className="h-6 w-6" />
            Gestor Milhas
          </Link>

          <nav className="flex items-center gap-6">
            <Link to="/" className="text-blue-200 hover:text-white text-sm font-medium">
              Início
            </Link>
            <Link to="/funcionalidades" className="text-blue-200 hover:text-white text-sm font-medium">
              Funcionalidades
            </Link>
            <Link to="/contato" className="text-blue-200 hover:text-white text-sm font-medium">
              Contato
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-white text-blue-900 hover:bg-blue-50">Entrar</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-blue-900 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-blue-300">
          © {new Date().getFullYear()} Gestor Milhas. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
