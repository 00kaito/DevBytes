import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Headphones, Play, Users, Star, Car, Microscope, Bus, Check, ShoppingCart } from "lucide-react";
import type { Category, Podcast } from "@shared/schema";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: javaPodcasts } = useQuery<Podcast[]>({
    queryKey: ["/api/categories/java/podcasts"],
    enabled: !!categories,
  });

  const { data: jsPodcasts } = useQuery<Podcast[]>({
    queryKey: ["/api/categories/javascript/podcasts"],
    enabled: !!categories,
  });

  const { data: azurePodcasts } = useQuery<Podcast[]>({
    queryKey: ["/api/categories/azure/podcasts"],
    enabled: !!categories,
  });

  const { data: archPodcasts } = useQuery<Podcast[]>({
    queryKey: ["/api/categories/architecture/podcasts"],
    enabled: !!categories,
  });

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleBuyPodcast = (podcastId: string) => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }
    window.location.href = `/checkout/${podcastId}`;
  };

  const scrollToCategories = () => {
    document.getElementById('categories')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
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

  const getGradientClass = (index: number) => {
    const gradients = [
      'from-orange-400 to-red-500',
      'from-green-400 to-blue-500',
      'from-purple-400 to-pink-500',
      'from-indigo-400 to-purple-500',
      'from-red-400 to-pink-500',
      'from-yellow-400 to-orange-500',
      'from-blue-400 to-cyan-500',
      'from-teal-400 to-green-500',
    ];
    return gradients[index % gradients.length];
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
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
              <Headphones className="text-2xl text-blue-600 mr-3" />
              <span className="text-xl font-bold text-slate-900">DevPodcasts</span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <a href="#categories" className="text-slate-700 hover:text-blue-600 transition-colors">Kategorie</a>
              <a href="#about" className="text-slate-700 hover:text-blue-600 transition-colors">O nas</a>
            </div>
            
            <div className="flex items-center space-x-4">
              {!isAuthenticated && (
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Naucz się programowania 
                <span className="text-amber-400"> w samochodzie</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
                Pogłębiona wiedza techniczna w formacie audio. Zamiast oglądać kod, 
                słuchaj o tym jak wszystko działa pod spodem.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  onClick={scrollToCategories}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-lg px-8 py-4"
                >
                  <Play className="mr-3 h-5 w-5" />
                  Rozpocznij naukę
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold text-lg px-8 py-4"
                  onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Dowiedz się więcej
                </Button>
              </div>
              <div className="flex items-center space-x-8 text-blue-100">
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  <span>500+ programistów</span>
                </div>
                <div className="flex items-center">
                  <Star className="mr-2 h-5 w-5" />
                  <span>4.9/5 ocena</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="h-4 bg-white/30 rounded w-3/4"></div>
                  <div className="h-4 bg-white/20 rounded w-1/2"></div>
                  <div className="h-4 bg-amber-500/60 rounded w-2/3"></div>
                  <div className="h-32 bg-white/10 rounded-lg flex items-center justify-center">
                    <Headphones className="h-16 w-16 text-white/50" />
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-amber-500 rounded-full p-4">
                <Play className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Kategorie podcastów</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Wybierz technologię, którą chcesz zgłębić. Każdy podcast to głęboka analiza 
              tematu przygotowana z myślą o rozmowach rekrutacyjnych.
            </p>
          </div>

          {/* Java Category */}
          {javaPodcasts && (
            <div className="mb-16">
              <div className="flex items-center mb-8">
                <span className="text-4xl mr-4">☕</span>
                <h3 className="text-2xl font-bold">Java</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {javaPodcasts.map((podcast, index) => (
                  <Card key={podcast.id} className="p-6 hover:shadow-lg transition-all duration-300 border border-slate-200 hover:border-blue-600">
                    <div className={`h-48 bg-gradient-to-br ${getGradientClass(index)} rounded-lg mb-4 flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/20"></div>
                      <Headphones className="h-12 w-12 text-white relative z-10" />
                      {podcast.duration && (
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded px-2 py-1 text-white text-xs font-medium">
                          {podcast.duration} min
                        </div>
                      )}
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{podcast.title}</h4>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                      {podcast.description?.replace(/<[^>]*>/g, '').substring(0, 120)}...
                    </p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(podcast.price)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href={`/product/${podcast.slug}`} className="w-full">
                        <Button variant="outline" className="w-full">
                          Poznaj produkt
                        </Button>
                      </Link>
                      <Button onClick={() => handleBuyPodcast(podcast.id)} className="bg-amber-500 hover:bg-amber-600 w-full">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Kup
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* JavaScript Category */}
          {jsPodcasts && (
            <div className="mb-16">
              <div className="flex items-center mb-8">
                <span className="text-4xl mr-4">🟨</span>
                <h3 className="text-2xl font-bold">JavaScript</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jsPodcasts.map((podcast, index) => (
                  <Card key={podcast.id} className="p-6 hover:shadow-lg transition-all duration-300 border border-slate-200 hover:border-blue-600">
                    <div className={`h-48 bg-gradient-to-br ${getGradientClass(index + 5)} rounded-lg mb-4 flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/20"></div>
                      <Headphones className="h-12 w-12 text-white relative z-10" />
                      {podcast.duration && (
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded px-2 py-1 text-white text-xs font-medium">
                          {podcast.duration} min
                        </div>
                      )}
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{podcast.title}</h4>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                      {podcast.description?.replace(/<[^>]*>/g, '').substring(0, 120)}...
                    </p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(podcast.price)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href={`/product/${podcast.slug}`} className="w-full">
                        <Button variant="outline" className="w-full">
                          Poznaj produkt
                        </Button>
                      </Link>
                      <Button onClick={() => handleBuyPodcast(podcast.id)} className="bg-amber-500 hover:bg-amber-600 w-full">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Kup
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Azure Category */}
          {azurePodcasts && azurePodcasts.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center mb-8">
                <span className="text-4xl mr-4">☁️</span>
                <h3 className="text-2xl font-bold">Microsoft Azure</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {azurePodcasts.map((podcast, index) => (
                  <Card key={podcast.id} className="p-6 hover:shadow-lg transition-all duration-300 border border-slate-200 hover:border-blue-600">
                    <div className={`h-48 bg-gradient-to-br ${getGradientClass(index + 10)} rounded-lg mb-4 flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/20"></div>
                      <Headphones className="h-12 w-12 text-white relative z-10" />
                      {podcast.duration && (
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded px-2 py-1 text-white text-xs font-medium">
                          {podcast.duration} min
                        </div>
                      )}
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{podcast.title}</h4>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                      {podcast.description?.replace(/<[^>]*>/g, '').substring(0, 120)}...
                    </p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(podcast.price)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href={`/product/${podcast.slug}`} className="w-full">
                        <Button variant="outline" className="w-full">
                          Poznaj produkt
                        </Button>
                      </Link>
                      <Button onClick={() => handleBuyPodcast(podcast.id)} className="bg-amber-500 hover:bg-amber-600 w-full">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Kup
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Architecture Category */}
          {archPodcasts && archPodcasts.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center mb-8">
                <span className="text-4xl mr-4">🏗️</span>
                <h3 className="text-2xl font-bold">Software Architecture</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archPodcasts.map((podcast, index) => (
                  <Card key={podcast.id} className="p-6 hover:shadow-lg transition-all duration-300 border border-slate-200 hover:border-blue-600 cursor-pointer"
                    onClick={() => window.location.href = `/product/${podcast.slug}`}>
                    <div className={`h-48 bg-gradient-to-br ${getGradientClass(index + 15)} rounded-lg mb-4 flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/20"></div>
                      <Headphones className="h-12 w-12 text-white relative z-10" />
                      {podcast.duration && (
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded px-2 py-1 text-white text-xs font-medium">
                          {podcast.duration} min
                        </div>
                      )}
                    </div>
                    <Link href={`/product/${podcast.slug}`}>
                      <h4 className="text-lg font-semibold mb-2 hover:text-blue-600 transition-colors cursor-pointer">{podcast.title}</h4>
                    </Link>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                      {podcast.description?.replace(/<[^>]*>/g, '').substring(0, 120)}...
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(podcast.price)}
                      </span>
                    <div className="flex flex-col gap-2">
                      <Link href={`/product/${podcast.slug}`} className="w-full">
                        <Button variant="outline" className="w-full">
                          Poznaj produkt
                        </Button>
                      </Link>
                      <Button onClick={() => handleBuyPodcast(podcast.id)} className="bg-amber-500 hover:bg-amber-600 w-full">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Kup
                      </Button>
                    </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Dlaczego nasze podcasty są 
                <span className="text-blue-600"> wyjątkowe?</span>
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600/10 p-3 rounded-lg">
                    <Car className="text-blue-600 h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ucz się w drodze do pracy</h3>
                    <p className="text-slate-600">
                      Zamiast oglądać kod na ekranie, słuchasz o koncepcjach i mechanizmach. 
                      Idealne do samochodu, autobusu czy podczas treningu.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600/10 p-3 rounded-lg">
                    <Microscope className="text-blue-600 h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Głęboka analiza techniczna</h3>
                    <p className="text-slate-600">
                      Nie tylko "jak", ale przede wszystkim "dlaczego". Rozumiemy mechanizmy 
                      działania technologii od środka, nie tylko API.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600/10 p-3 rounded-lg">
                    <Bus className="text-blue-600 h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Przygotowanie na rozmowy</h3>
                    <p className="text-slate-600">
                      Odpowiadamy na najtrudniejsze pytania rekrutacyjne. Po wysłuchaniu 
                      naszych podcastów nie zaskoczy Cię żadne techniczne pytanie.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <Card className="p-6 border shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-2 rounded-full mr-4">
                    <Check className="text-green-600 h-5 w-5" />
                  </div>
                  <span className="font-semibold">500+ zadowolonych programistów</span>
                </div>
                <p className="text-slate-600 text-sm">
                  "Dzięki podcastom DevPodcasts dostałem pracę w Google. 
                  Głęboka wiedza techniczna była kluczowa na rozmowie."
                </p>
                <div className="mt-3 text-sm text-slate-500">- Michał K., Senior Java Developer</div>
              </Card>
              
              <Card className="p-6 border shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-2 rounded-full mr-4">
                    <Star className="text-blue-600 h-5 w-5" />
                  </div>
                  <span className="font-semibold">Średnia ocena: 4.9/5</span>
                </div>
                <p className="text-slate-600 text-sm">
                  "Najlepsza inwestycja w rozwój. Słucham w samochodzie 
                  i czuję jak moja wiedza techniczna rośnie każdego dnia."
                </p>
                <div className="mt-3 text-sm text-slate-500">- Anna W., Frontend Architect</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Headphones className="h-6 w-6 mr-3" />
                <span className="text-xl font-bold">DevPodcasts</span>
              </div>
              <p className="text-slate-300 mb-4">
                Pogłębiona wiedza techniczna dla programistów w formacie audio.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Kategorie</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white">Java</a></li>
                <li><a href="#" className="hover:text-white">JavaScript</a></li>
                <li><a href="#" className="hover:text-white">Azure</a></li>
                <li><a href="#" className="hover:text-white">Architecture</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Pomoc</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white">Kontakt</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Regulamin</a></li>
                <li><a href="#" className="hover:text-white">Polityka prywatności</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Newsletter</h3>
              <p className="text-slate-300 mb-4">
                Otrzymuj informacje o nowych podcastach
              </p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Twój email" 
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-l-lg focus:outline-none focus:border-blue-600 text-white"
                />
                <Button className="bg-blue-600 px-4 py-2 rounded-r-lg hover:bg-blue-700">
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <Separator className="my-8 bg-slate-700" />
          <div className="text-center text-slate-400">
            <p>&copy; 2024 DevPodcasts. Wszystkie prawa zastrzeżone.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
