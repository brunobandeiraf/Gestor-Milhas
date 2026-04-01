import { Link, Outlet } from "react-router-dom";
import { Button } from "./ui/Button";
import { Plane } from "lucide-react";

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-xl">
            <Plane className="h-6 w-6" />
            Gestor Milhas
          </Link>

          <nav className="flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Início
            </Link>
            <Link to="/funcionalidades" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Funcionalidades
            </Link>
            <Link to="/contato" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Contato
            </Link>
            <Link to="/login">
              <Button size="sm">Entrar</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Gestor Milhas. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
