import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Headphones, BookOpen, ShoppingCart, LogOut } from "lucide-react";
import type { Category, Podcast } from "@shared/schema";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

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

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleBuyPodcast = (podcastId: string) => {
    window.location.href = `/checkout/${podcastId}`;
  };

  const formatPrice = (priceInCents: number) => {
    return `${(priceInCents / 100).toFixed(0)} zł`;
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      'from-orange-400 to-red-500',
      'from-green-400 to-blue-500',
      'from-purple-400 to-pink-500',
      'from-indigo-400 to-purple-500',
      'from-red-400 to-pink-500',
      'from-yellow-400 to-orange-500',
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
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <div className="flex items-center space-x-4">
                  <Link href="/library">
                    <Button variant="ghost" className="flex items-center text-slate-700 hover:text-blue-600">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Moja Biblioteka
                    </Button>
                  </Link>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-700">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <Button variant="ghost" onClick={handleLogout} className="text-slate-500 hover:text-slate-700">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section for authenticated users */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Witaj ponownie, {user?.firstName}!
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Kontynuuj naukę z naszymi najnowszymi podcastami
            </p>
            <Link href="/library">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                <BookOpen className="mr-2 h-5 w-5" />
                Przejdź do biblioteki
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Najnowsze podcasty</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Sprawdź najnowsze episody i rozszerz swoją wiedzę techniczną
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
                {javaPodcasts.slice(0, 3).map((podcast, index) => (
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
                      {podcast.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(podcast.price)}
                      </span>
                      <Button onClick={() => handleBuyPodcast(podcast.id)} className="bg-amber-500 hover:bg-amber-600">
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
                {jsPodcasts.slice(0, 3).map((podcast, index) => (
                  <Card key={podcast.id} className="p-6 hover:shadow-lg transition-all duration-300 border border-slate-200 hover:border-blue-600">
                    <div className={`h-48 bg-gradient-to-br ${getGradientClass(index + 3)} rounded-lg mb-4 flex items-center justify-center relative overflow-hidden`}>
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
                      {podcast.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(podcast.price)}
                      </span>
                      <Button onClick={() => handleBuyPodcast(podcast.id)} className="bg-amber-500 hover:bg-amber-600">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Kup
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
