import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Headphones, ArrowLeft, CreditCard, Lock } from "lucide-react";
import type { PodcastWithCategory } from "@shared/schema";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  podcast: PodcastWithCategory;
}

const CheckoutForm = ({ podcast }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: { podcastId: string; stripePaymentIntentId: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/purchases", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/purchases"] });
      toast({
        title: "Zakup pomyślny!",
        description: "Podcast został dodany do Twojej biblioteki. Możesz go teraz pobrać.",
      });
      setLocation("/library");
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd zakupu",
        description: "Nie udało się sfinalizować zakupu. Spróbuj ponownie.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || isProcessing) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/library",
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Błąd płatności",
        description: error.message || "Wystąpił błąd podczas przetwarzania płatności.",
        variant: "destructive",
      });
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Create purchase record
      createPurchaseMutation.mutate({
        podcastId: podcast.id,
        stripePaymentIntentId: paymentIntent.id,
        amount: podcast.price,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Szczegóły płatności
        </h3>
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || !elements || isProcessing || createPurchaseMutation.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold"
      >
        {isProcessing || createPurchaseMutation.isPending ? (
          <div className="flex items-center">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Przetwarzanie...
          </div>
        ) : (
          `Zapłać ${(podcast.price / 100).toFixed(0)} zł`
        )}
      </Button>
      
      <div className="flex items-center justify-center text-sm text-slate-600">
        <Lock className="mr-1 h-4 w-4" />
        Bezpieczna płatność przez Stripe
      </div>
    </form>
  );
};

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");

  // Get podcast ID from URL
  const podcastId = window.location.pathname.split('/checkout/')[1];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Wymagane logowanie",
        description: "Musisz być zalogowany, aby kupić podcast.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch podcast details
  const { data: podcast, isLoading: podcastLoading, error: podcastError } = useQuery<PodcastWithCategory>({
    queryKey: ["/api/podcasts/by-id", podcastId],
    enabled: !!podcastId && isAuthenticated,
    retry: false,
  });

  // Create payment intent
  useEffect(() => {
    if (podcast && isAuthenticated) {
      apiRequest("POST", "/api/create-payment-intent", { podcastId: podcast.id })
        .then((res) => res.json())
        .then((data) => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            throw new Error(data.message || "Failed to create payment intent");
          }
        })
        .catch((error) => {
          console.error("Error creating payment intent:", error);
          if (isUnauthorizedError(error)) {
            toast({
              title: "Unauthorized",
              description: "You are logged out. Logging in again...",
              variant: "destructive",
            });
            setTimeout(() => {
              window.location.href = "/api/login";
            }, 500);
            return;
          }
          
          if (error.message?.includes("already purchased")) {
            toast({
              title: "Podcast już kupiony",
              description: "Ten podcast znajduje się już w Twojej bibliotece.",
              variant: "destructive",
            });
            setLocation("/library");
            return;
          }
          
          toast({
            title: "Błąd",
            description: "Nie udało się przygotować płatności. Spróbuj ponownie.",
            variant: "destructive",
          });
          setLocation("/");
        });
    }
  }, [podcast, isAuthenticated, toast, setLocation]);

  const handleBack = () => {
    setLocation("/");
  };

  const formatPrice = (priceInCents: number) => {
    return `${(priceInCents / 100).toFixed(0)} zł`;
  };

  if (isLoading || podcastLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (podcastError || !podcast) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Podcast nie znaleziony</h1>
            <p className="text-slate-600 mb-6">Nie można znaleźć wybranego podcastu.</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót do głównej
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Przygotowywanie płatności...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Headphones className="text-2xl text-blue-600 mr-3" />
              <span className="text-xl font-bold text-slate-900">DevPodcasts</span>
            </div>
            <Button variant="ghost" onClick={handleBack} className="flex items-center text-slate-700 hover:text-blue-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót
            </Button>
          </div>
        </div>
      </nav>

      {/* Checkout Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <h1 className="text-2xl font-bold mb-6">Podsumowanie zamówienia</h1>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="h-24 w-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Headphones className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{podcast.title}</h3>
                    <p className="text-slate-600 text-sm mb-2">
                      Kategoria: {podcast.category.name}
                    </p>
                    {podcast.duration && (
                      <p className="text-slate-600 text-sm mb-2">
                        Czas trwania: {podcast.duration} minut
                      </p>
                    )}
                    <p className="text-slate-700 text-sm line-clamp-3">
                      {podcast.description}
                    </p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Cena podcast:</span>
                    <span>{formatPrice(podcast.price)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Łącznie:</span>
                    <span className="text-blue-600">{formatPrice(podcast.price)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Płatność</h2>
            <Card>
              <CardContent className="p-6">
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm podcast={podcast} />
                </Elements>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
