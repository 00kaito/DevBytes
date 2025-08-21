import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Headphones, Mail, User, ArrowLeft, CheckCircle } from "lucide-react";

const registerSchema = z.object({
  email: z.string().email("Podaj prawidłowy adres email"),
  firstName: z.string().min(2, "Imię musi mieć co najmniej 2 znaki"),
  lastName: z.string().min(2, "Nazwisko musi mieć co najmniej 2 znaki"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie są identyczne",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const { toast } = useToast();
  const [isRegistered, setIsRegistered] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: Omit<RegisterFormData, 'confirmPassword'>) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: () => {
      setIsRegistered(true);
      toast({
        title: "Rejestracja pomyślna",
        description: "Konto zostało utworzone. Możesz się teraz zalogować.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd rejestracji",
        description: error.message || "Nie udało się utworzyć konta",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Rejestracja zakończona pomyślnie!
          </h2>
          <p className="text-slate-600 mb-6">
            Twoje konto zostało utworzone. Możesz się teraz zalogować i rozpocząć naukę z naszymi podcastami.
          </p>
          <div className="space-y-3">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.location.href = '/api/login'}
            >
              Zaloguj się
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Powrót do strony głównej
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Headphones className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Utwórz konto</h2>
          <p className="text-slate-600 mt-2">
            Dołącz do społeczności programistów uczących się przez podcasty
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imię</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwisko</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adres email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input {...field} className="pl-10" type="email" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasło</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potwierdź hasło</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Tworzenie konta..." : "Utwórz konto"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-slate-600">
            Masz już konto?{" "}
            <button
              onClick={() => window.location.href = '/api/login'}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Zaloguj się
            </button>
          </p>
          <Link href="/">
            <Button variant="ghost" className="flex items-center text-slate-600 hover:text-slate-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót do strony głównej
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}