import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Headphones, 
  ShoppingCart, 
  Clock, 
  Star, 
  ArrowLeft,
  CheckCircle,
  Users,
  BookOpen,
  LogOut
} from "lucide-react";
import type { PodcastWithCategory } from "@shared/schema";
import { DemoPlayer } from "@/components/DemoPlayer";

export default function Product() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated, logoutMutation } = useAuth();

  const { data: podcast, isLoading } = useQuery<PodcastWithCategory>({
    queryKey: ["/api/podcasts", slug],
    enabled: !!slug,
  });

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);

  const handleBuyNow = () => {
    if (!podcast) return;
    window.location.href = `/checkout/${podcast.id}`;
  };

  const handleJoinWaitlist = async () => {
    if (!waitlistEmail || !podcast) return;
    
    setIsJoiningWaitlist(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail, podcastId: podcast.id }),
      });
      
      if (response.ok) {
        alert("Dodano do listy zainteresowanych! Powiadomimy Cię o dostępności.");
        setWaitlistEmail("");
      } else {
        const error = await response.json();
        alert(error.message || "Błąd podczas dodawania do listy");
      }
    } catch (error) {
      alert("Błąd podczas dodawania do listy");
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `${(priceInCents / 100).toFixed(0)} zł`;
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'java': return '☕';
      case 'javascript': return '🟨';
      case 'azure': return '☁️';
      case 'architecture': return '🏗️';
      default: return '🎧';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Podcast nie został znaleziony</h1>
          <Link href="/">
            <Button>Wróć do strony głównej</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Headphones className="text-2xl text-blue-600 mr-3" />
                <span className="text-xl font-bold text-slate-900">DevPodcasts</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link href="/library">
                    <Button variant="ghost" className="flex items-center text-slate-700 hover:text-blue-600">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Moja Biblioteka
                    </Button>
                  </Link>
                  <span className="text-slate-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <Button variant="ghost" onClick={handleLogout} className="text-slate-500 hover:text-slate-700">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="ghost" onClick={handleLogin} className="text-blue-600 hover:text-blue-700">
                    Zaloguj się
                  </Button>
                  <Link href="/register">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Zarejestruj się
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Link href="/" className="hover:text-blue-600">
              Strona główna
            </Link>
            <span>/</span>
            <span className="flex items-center">
              <span className="mr-1">{getCategoryIcon(podcast.category.slug)}</span>
              {podcast.category.name}
            </span>
            <span>/</span>
            <span className="text-slate-900 font-medium">{podcast.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Product Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Wróć do kategorii
              </Link>
              
              <Badge variant="secondary" className="mb-4">
                <span className="mr-1">{getCategoryIcon(podcast.category.slug)}</span>
                {podcast.category.name}
              </Badge>
              
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {podcast.title}
              </h1>
              
              <div className="flex items-center space-x-4 text-slate-600 mb-6">
                {podcast.duration && (
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>{podcast.duration} minut</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Star className="mr-1 h-4 w-4 text-yellow-500" />
                  <span>5.0 (124 opinii)</span>
                </div>
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  <span>2,847 uczestników</span>
                </div>
              </div>
            </div>

            {/* Demo Player */}
            {podcast.demoObjectPath && (
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Posłuchaj demo</h2>
                <DemoPlayer
                  demoUrl={`/api/objects/${podcast.demoObjectPath}`}
                  title={podcast.title}
                />
              </Card>
            )}

            {/* Description */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Opis produktu</h2>
              <div 
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: podcast.description || '' }}
              />
            </Card>

            {/* What You'll Learn */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Co się nauczysz</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  "Zaawansowane koncepty programowania",
                  "Najlepsze praktyki w branży",
                  "Przygotowanie do rozmów rekrutacyjnych",
                  "Praktyczne przykłady z rzeczywistych projektów",
                  "Optymalizacja wydajności",
                  "Współczesne podejścia do architektury"
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Purchase Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <Headphones className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{podcast.title}</h3>
                {podcast.duration && (
                  <p className="text-slate-600">Czas trwania: {podcast.duration} minut</p>
                )}
              </div>

              <Separator className="my-6" />

              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatPrice(podcast.price)}
                </div>
                <p className="text-slate-600">Jednorazowa płatność</p>
              </div>

              {podcast.status === "coming_soon" ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-2">Wkrótce dostępne</Badge>
                    <p className="text-sm text-slate-600 mb-4">
                      Ten podcast będzie dostępny wkrótce. Zostaw swój email, a powiadomimy Cię o dostępności.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Twój email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                    />
                    <Button 
                      onClick={handleJoinWaitlist}
                      disabled={!waitlistEmail || isJoiningWaitlist}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isJoiningWaitlist ? "..." : "Powiadom mnie"}
                    </Button>
                  </div>
                </div>
              ) : podcast.status === "public" ? (
                <Button 
                  onClick={handleBuyNow}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg"
                  size="lg"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Kup Teraz
                </Button>
              ) : (
                <Badge variant="secondary" className="w-full justify-center py-3">
                  Niedostępny
                </Badge>
              )}

              <div className="mt-4 text-xs text-slate-500 text-center">
                <p>✓ Natychmiastowy dostęp</p>
                <p>✓ Dożywotni dostęp do treści</p>
                <p>✓ Możliwość pobrania</p>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Gwarancja jakości</h4>
                <div className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  30 dni gwarancji zwrotu pieniędzy
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Najwyższa jakość audio
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Wsparcie techniczne
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}