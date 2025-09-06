import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Plus, Edit, Trash2, ArrowLeft, LogOut, Settings, Upload, Users, BookOpen } from "lucide-react";
import type { Podcast, Category, User } from "@shared/schema";
import SimpleEditor from "@/components/SimpleEditor";
import { ObjectUploader } from "@/components/ObjectUploader";

const podcastFormSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  slug: z.string().min(1, "Slug jest wymagany"),
  description: z.string().optional(),
  duration: z.number().min(1, "Czas trwania musi być większy niż 0"),
  price: z.number().min(1, "Cena musi być większa niż 0"),
  categoryId: z.string().min(1, "Kategoria jest wymagana"),
  imageObjectPath: z.string().optional(),
  audioObjectPath: z.string().optional(),
  status: z.enum(["draft", "public", "coming_soon"]),
});

type PodcastFormData = z.infer<typeof podcastFormSchema>;

export default function Admin() {
  const { user, isAuthenticated, isLoading, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<Podcast | null>(null);
  const [activeTab, setActiveTab] = useState<"podcasts" | "users">("podcasts");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserLibraryDialogOpen, setIsUserLibraryDialogOpen] = useState(false);

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

  const { data: podcasts, isLoading: podcastsLoading, error: podcastsError } = useQuery<Podcast[]>({
    queryKey: ["/api/admin/podcasts"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle admin access denied
  useEffect(() => {
    if (podcastsError) {
      const errorMessage = (podcastsError as Error).message;
      if (errorMessage.includes('403') || errorMessage.includes('Access Denied')) {
        toast({
          title: "Brak uprawnień administratora",
          description: "Nie masz uprawnień do dostępu do panelu administracyjnego.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
        return;
      }
      if (isUnauthorizedError(podcastsError as Error)) {
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
    }
  }, [podcastsError, toast]);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && activeTab === "users",
    retry: false,
  });

  const form = useForm<PodcastFormData>({
    resolver: zodResolver(podcastFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      duration: 30,
      price: 2900,
      categoryId: "",
      imageObjectPath: "",
      audioObjectPath: "",
      status: "draft",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PodcastFormData) => {
      const response = await apiRequest("POST", "/api/admin/podcasts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/podcasts"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Sukces",
        description: "Podcast został dodany pomyślnie",
      });
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
        title: "Błąd",
        description: "Nie udało się dodać podcastu",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PodcastFormData }) => {
      const response = await apiRequest("PUT", `/api/admin/podcasts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/podcasts"] });
      setEditingPodcast(null);
      form.reset();
      toast({
        title: "Sukces",
        description: "Podcast został zaktualizowany pomyślnie",
      });
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
        title: "Błąd",
        description: "Nie udało się zaktualizować podcastu",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/podcasts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/podcasts"] });
      toast({
        title: "Sukces",
        description: "Podcast został usunięty pomyślnie",
      });
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
        title: "Błąd",
        description: "Nie udało się usunąć podcastu",
        variant: "destructive",
      });
    },
  });

  const addPodcastToLibraryMutation = useMutation({
    mutationFn: async ({ userId, podcastId }: { userId: string; podcastId: string }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/add-podcast/${podcastId}`);
      return response.json();
    },
    onSuccess: () => {
      setIsUserLibraryDialogOpen(false);
      toast({
        title: "Sukces",
        description: "Podcast został dodany do biblioteki użytkownika",
      });
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
        title: "Błąd",
        description: "Nie udało się dodać podcastu do biblioteki",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const onSubmit = (data: PodcastFormData) => {
    console.log('[ADMIN FORM] Submitting form with data:', {
      formData: data,
      hasStatus: 'status' in data,
      statusValue: data.status,
      isEditing: !!editingPodcast
    });
    
    if (editingPodcast) {
      updateMutation.mutate({ id: editingPodcast.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (podcast: Podcast) => {
    console.log('[EDIT] Starting edit with podcast data:', {
      id: podcast.id,
      title: podcast.title,
      status: podcast.status,
      hasStatus: 'status' in podcast,
      statusValue: podcast.status
    });
    
    setEditingPodcast(podcast);
    form.reset({
      title: podcast.title,
      slug: podcast.slug,
      description: podcast.description || "",
      duration: podcast.duration || 30,
      price: podcast.price,
      categoryId: podcast.categoryId,
      imageObjectPath: podcast.imageObjectPath || "",
      audioObjectPath: podcast.audioObjectPath || "",
      status: (podcast.status as "draft" | "public" | "coming_soon") || "draft",
    });
    
    console.log('[EDIT] Form reset with values:', form.getValues());
  };

  const formatPrice = (priceInGrosze: number) => {
    return `${(priceInGrosze / 100).toFixed(2)} zł`;
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  if (isLoading || podcastsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Settings className="text-2xl text-blue-600 mr-3" />
              <span className="text-xl font-bold text-slate-900">Panel Administracyjny</span>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="flex items-center text-slate-700 hover:text-blue-600">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Powrót do strony głównej
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

      {/* Admin Content */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("podcasts")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "podcasts"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Zarządzanie Podcastami
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "users"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Zarządzanie Użytkownikami
                </button>
              </nav>
            </div>
          </div>

          {/* Podcasts Tab */}
          {activeTab === "podcasts" && (
            <>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Zarządzanie Podcastami</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    setEditingPodcast(null);
                    form.reset({
                      title: "",
                      slug: "",
                      description: "",
                      duration: 30,
                      price: 2900,
                      categoryId: "",
                      imageObjectPath: "",
                      audioObjectPath: "",
                      status: "draft",
                    });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj Podcast
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Dodaj Nowy Podcast</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tytuł</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (!editingPodcast) {
                                  form.setValue("slug", generateSlug(e.target.value));
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug (URL)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Opis (HTML)</FormLabel>
                          <FormControl>
                            <SimpleEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="Wprowadź opis produktu używając HTML..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Czas trwania (minuty)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cena (grosze)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategoria</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wybierz kategorię" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="imageObjectPath"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Obrazek</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                placeholder="Ścieżka do obrazka..."
                                {...field}
                              />
                              <p className="text-sm text-gray-500">
                                Zostaw puste dla domyślnego tła lub wklej ścieżkę do pliku w Object Storage
                              </p>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="audioObjectPath"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plik Audio</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                placeholder="Ścieżka do pliku audio..."
                                {...field}
                              />
                              <div className="flex gap-2">
                                <ObjectUploader
                                  maxNumberOfFiles={1}
                                  maxFileSize={104857600} // 100MB for audio files
                                  onGetUploadParameters={async () => {
                                    const response = await apiRequest("POST", "/api/objects/upload");
                                    const data = await response.json();
                                    return {
                                      method: "PUT" as const,
                                      url: data.uploadURL,
                                    };
                                  }}
                                  onComplete={async (result) => {
                                    if (result.successful?.[0]?.uploadURL) {
                                      const uploadUrl = result.successful[0].uploadURL;
                                      try {
                                        // Send the upload URL to backend to normalize the path
                                        const response = await apiRequest("PUT", "/api/objects/normalize", { 
                                          uploadURL: uploadUrl 
                                        });
                                        const data = await response.json();
                                        // Set the normalized object path to the form field
                                        field.onChange(data.objectPath);
                                        toast({
                                          title: "Sukces",
                                          description: "Plik audio został przesłany pomyślnie",
                                        });
                                      } catch (error) {
                                        console.error("Error normalizing path:", error);
                                        // Fallback: use the upload URL directly
                                        field.onChange(uploadUrl);
                                        toast({
                                          title: "Ostrzeżenie",
                                          description: "Plik został przesłany, ale ścieżka może wymagać korekty",
                                          variant: "destructive",
                                        });
                                      }
                                    }
                                  }}
                                  buttonClassName="w-full"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Prześlij Audio
                                </ObjectUploader>
                              </div>
                              <p className="text-sm text-gray-500">
                                Prześlij plik audio (MP3, WAV, M4A) lub wklej ścieżkę do pliku w Object Storage
                              </p>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wybierz status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Szkic</SelectItem>
                              <SelectItem value="public">Publiczny</SelectItem>
                              <SelectItem value="coming_soon">Wkrótce</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          setEditingPodcast(null);
                          form.reset();
                        }}
                      >
                        Anuluj
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        Dodaj
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Podcasts List */}
          {podcasts && podcasts.length > 0 ? (
            <div className="grid gap-6">
              {podcasts.map((podcast) => (
                <Card key={podcast.id} className="p-6 border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{podcast.title}</h3>
                      <p className="text-slate-600 mb-4">{podcast.description}</p>
                      <div className="flex space-x-6 text-sm text-slate-500">
                        <span>Czas: {podcast.duration} min</span>
                        <span>Cena: {formatPrice(podcast.price)}</span>
                        <span>Stan: {podcast.status}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          startEdit(podcast);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Czy na pewno chcesz usunąć ten podcast?")) {
                            deleteMutation.mutate(podcast.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Settings className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">Brak podcastów</h3>
              <p className="text-slate-500 mb-6">Dodaj pierwszy podcast aby rozpocząć zarządzanie treścią</p>
            </div>
          )}
            </>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Zarządzanie Użytkownikami</h1>
              </div>

              {/* Users List */}
              {usersLoading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                </div>
              ) : users && users.length > 0 ? (
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user.id} className="p-6 border border-slate-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-slate-600 mb-2">{user.email}</p>
                          <div className="flex space-x-4 text-sm text-slate-500">
                            <span>Admin: {user.isAdmin ? "Tak" : "Nie"}</span>
                            <span>Zweryfikowany: {user.isEmailVerified ? "Tak" : "Nie"}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsUserLibraryDialogOpen(true);
                            }}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Dodaj do biblioteki
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">Brak użytkowników</h3>
                  <p className="text-slate-500 mb-6">Nie znaleziono użytkowników w systemie</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Edit Dialog */}
      {editingPodcast && (
        <Dialog open={true} onOpenChange={() => setEditingPodcast(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edytuj Podcast</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tytuł</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!editingPodcast) {
                              form.setValue("slug", generateSlug(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opis (HTML)</FormLabel>
                      <FormControl>
                        <SimpleEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Wprowadź opis produktu używając HTML..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Czas trwania (minuty)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cena (grosze)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz kategorię" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageObjectPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obrazek</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            placeholder="Ścieżka do obrazka..."
                            {...field}
                          />
                          <p className="text-sm text-gray-500">
                            Zostaw puste dla domyślnego tła lub wklej ścieżkę do pliku w Object Storage
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="audioObjectPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plik Audio</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            placeholder="Ścieżka do pliku audio..."
                            {...field}
                          />
                          <div className="flex gap-2">
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={104857600} // 100MB for audio files
                              onGetUploadParameters={async () => {
                                const response = await apiRequest("POST", "/api/objects/upload");
                                const data = await response.json();
                                return {
                                  method: "PUT" as const,
                                  url: data.uploadURL,
                                };
                              }}
                              onComplete={async (result) => {
                                if (result.successful?.[0]?.uploadURL) {
                                  const uploadUrl = result.successful[0].uploadURL;
                                  try {
                                    // Send the upload URL to backend to normalize the path
                                    const response = await apiRequest("PUT", "/api/objects/normalize", { 
                                      uploadURL: uploadUrl 
                                    });
                                    const data = await response.json();
                                    // Set the normalized object path to the form field
                                    field.onChange(data.objectPath);
                                    toast({
                                      title: "Sukces",
                                      description: "Plik audio został przesłany pomyślnie",
                                    });
                                  } catch (error) {
                                    console.error("Error normalizing path:", error);
                                    // Fallback: use the upload URL directly
                                    field.onChange(uploadUrl);
                                    toast({
                                      title: "Ostrzeżenie",
                                      description: "Plik został przesłany, ale ścieżka może wymagać korekty",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                              buttonClassName="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Prześlij Audio
                            </ObjectUploader>
                          </div>
                          <p className="text-sm text-gray-500">
                            Prześlij plik audio (MP3, WAV, M4A) lub wklej ścieżkę do pliku w Object Storage
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Szkic</SelectItem>
                          <SelectItem value="public">Publiczny</SelectItem>
                          <SelectItem value="coming_soon">Wkrótce</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingPodcast(null);
                      form.reset();
                    }}
                  >
                    Anuluj
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                  >
                    Zaktualizuj
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* User Library Management Dialog */}
      {selectedUser && (
        <Dialog open={isUserLibraryDialogOpen} onOpenChange={setIsUserLibraryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Dodaj podcast do biblioteki: {selectedUser.firstName} {selectedUser.lastName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-600">
                Wybierz podcast, który chcesz dodać do biblioteki użytkownika {selectedUser.email}
              </p>
              
              {podcasts && podcasts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {podcasts.map((podcast) => (
                    <Card key={podcast.id} className="p-4 border border-slate-200 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">{podcast.title}</h4>
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{podcast.description}</p>
                          <div className="flex space-x-4 text-xs text-slate-500">
                            <span>Czas: {podcast.duration} min</span>
                            <span>Cena: {formatPrice(podcast.price)}</span>
                            <span>Stan: {podcast.status}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            addPodcastToLibraryMutation.mutate({
                              userId: selectedUser.id,
                              podcastId: podcast.id,
                            });
                          }}
                          disabled={addPodcastToLibraryMutation.isPending}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Dodaj
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Brak dostępnych podcastów</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsUserLibraryDialogOpen(false);
                    setSelectedUser(null);
                  }}
                >
                  Anuluj
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}