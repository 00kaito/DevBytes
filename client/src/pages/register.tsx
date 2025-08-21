// SECURITY: Registration page replaced with secure authentication notice
// Users authenticate through Replit's OpenID Connect system instead of manual registration
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Check } from "lucide-react";

export default function Register() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-8 text-center">
        <Shield className="h-16 w-16 text-blue-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Bezpieczna Autentykacja
        </h2>
        <p className="text-slate-600 mb-6">
          Używamy bezpiecznej autentykacji przez Replit. Nie musisz tworzyć dodatkowego konta ani pamiętać hasła.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Lock className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-left">
              <h3 className="font-semibold text-green-800 mb-2">Zalety bezpiecznej autentykacji:</h3>
              <ul className="space-y-1 text-sm text-green-700">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Brak haseł do zapamiętania
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Dwuskładnikowa autoryzacja
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Ochrona przed atakami
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Automatyczne aktualizacje bezpieczeństwa
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={() => window.location.href = '/api/login'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-4"
        >
          Zaloguj się bezpiecznie
        </Button>

        <Link href="/">
          <Button variant="ghost" className="flex items-center text-slate-600 hover:text-slate-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do strony głównej
          </Button>
        </Link>
      </Card>
    </div>
  );
}