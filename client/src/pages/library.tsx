import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import { Headphones, BookOpen, Download, ArrowLeft, LogOut } from "lucide-react";
import type { PurchaseWithPodcast } from "@shared/schema";

export default function Library() {
  const { user, isAuthenticated, isLoading, logoutMutation } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: purchases, isLoading: purchasesLoading, error } = useQuery<PurchaseWithPodcast[]>({
    queryKey: ["/api/user/purchases"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle unauthorized error at endpoint level
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleDownload = (podcastId: string, title: string) => {
    // Create download URL for the podcast audio file
    const downloadUrl = `/objects/uploads/${podcastId}`;
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${title}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Downloading ${title}...`,
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Nieznana data';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pl-PL');
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

  if (isLoading || purchasesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
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
            
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="flex items-center text-slate-700 hover:text-blue-600">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Powrót do głównej
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
          </div>
        </div>
      </nav>

      {/* Library Content */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <BookOpen className="h-8 w-8 text-blue-600 mr-4" />
            <h1 className="text-3xl font-bold">Moja Biblioteka</h1>
          </div>
          
          {purchases && purchases.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchases.map((purchase, index) => (
                <Card key={purchase.id} className="p-6 border border-slate-200">
                  <div className={`h-48 bg-gradient-to-br ${getGradientClass(index)} rounded-lg mb-4 flex items-center justify-center relative`}>
                    <Headphones className="h-12 w-12 text-white" />
                    <div className="absolute top-4 right-4 bg-green-500 rounded-full p-2">
                      <Download className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">{purchase.podcast.title}</h4>
                  <p className="text-slate-600 text-sm mb-2">
                    Kategoria: {purchase.podcast.category.name}
                  </p>
                  <p className="text-slate-600 text-sm mb-4">
                    Zakupiony: {formatDate(purchase.purchasedAt || '')}
                  </p>
                  <Button 
                    onClick={() => handleDownload(purchase.podcast.id, purchase.podcast.title)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Pobierz MP3
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">Twoja biblioteka jest pusta</h3>
              <p className="text-slate-500 mb-6">Kup pierwszy podcast i zacznij naukę już dziś!</p>
              <Link href="/">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Przeglądaj podcasty
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
