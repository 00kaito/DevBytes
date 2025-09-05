import { db } from "./db";
import { categories, podcasts, users } from "@shared/schema";
import { AuthService } from "./authService";
import { eq } from "drizzle-orm";

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Clear existing data
    await db.delete(podcasts);
    await db.delete(categories);

    // Create categories
    const categoryData = [
      {
        name: "Java",
        slug: "java",
        icon: "☕",
        description: "Pogłębiona wiedza o języku Java, JVM i frameworkach enterprise",
      },
      {
        name: "JavaScript",
        slug: "javascript",
        icon: "🟨",
        description: "Nowoczesny JavaScript, Node.js i frameworki frontendowe",
      },
      {
        name: "Azure",
        slug: "azure",
        icon: "☁️",
        description: "Microsoft Azure - chmura, DevOps i architektura rozproszonych systemów",
      },
      {
        name: "Architecture",
        slug: "architecture",
        icon: "🏗️",
        description: "Architektura oprogramowania, wzorce projektowe i best practices",
      },
    ];

    console.log("📁 Creating categories...");
    const insertedCategories = await db.insert(categories).values(categoryData).returning();
    console.log(`✅ Created ${insertedCategories.length} categories`);

    // Find category IDs
    const javaCategory = insertedCategories.find(c => c.slug === "java");
    const jsCategory = insertedCategories.find(c => c.slug === "javascript");
    const azureCategory = insertedCategories.find(c => c.slug === "azure");
    const archCategory = insertedCategories.find(c => c.slug === "architecture");

    if (!javaCategory || !jsCategory || !azureCategory || !archCategory) {
      throw new Error("Failed to create all categories");
    }

    // Create podcasts
    const podcastData = [
      // Java podcasts
      {
        title: "Kolekcja Map w Java",
        slug: "java-map-collections",
        description: "Głęboka analiza HashMap, LinkedHashMap, TreeMap. Jak działają pod spodem, kiedy używać każdej z nich i najczęstsze pułapki.",
        duration: 45,
        price: 2900, // 29 zł in grosze
        categoryId: javaCategory.id,
        isActive: true,
      },
      {
        title: "Kolekcja Set w Java",
        slug: "java-set-collections",
        description: "HashSet vs LinkedHashSet vs TreeSet. Implementacja, wydajność i praktyczne zastosowania w projektach enterprise.",
        duration: 38,
        price: 2900, // 29 zł
        categoryId: javaCategory.id,
        isActive: true,
      },
      {
        title: "Java Concurrency",
        slug: "java-concurrency",
        description: "Wielowątkowość od podstaw: synchronized, volatile, Executor Framework, CompletableFuture i unikanie deadlocków.",
        duration: 52,
        price: 3900, // 39 zł
        categoryId: javaCategory.id,
        isActive: true,
      },
      {
        title: "Java Memory Model",
        slug: "java-memory-model",
        description: "Jak działa pamięć w JVM: heap, stack, method area, happens-before i optymalizacje JIT compiler.",
        duration: 48,
        price: 3500, // 35 zł
        categoryId: javaCategory.id,
        isActive: true,
      },
      {
        title: "Garbage Collection",
        slug: "java-garbage-collection",
        description: "G1, ZGC, Parallel GC - jak wybrać odpowiedni collector, tuning JVM i analiza memory leaków.",
        duration: 41,
        price: 3500, // 35 zł
        categoryId: javaCategory.id,
        isActive: true,
      },
      // JavaScript podcasts
      {
        title: "Event Loop i Asynchroniczność",
        slug: "js-event-loop",
        description: "Call stack, message queue, micro/macro tasks. Jak działa Promise, async/await i dlaczego setTimeout(0) nie zawsze działa.",
        duration: 43,
        price: 3200, // 32 zł
        categoryId: jsCategory.id,
        isActive: true,
      },
      {
        title: "Prototypes i Inheritance",
        slug: "js-prototypes",
        description: "Prototype chain, __proto__ vs prototype, dziedziczenie w JS vs class syntax. Dlaczego this jest problematyczne.",
        duration: 39,
        price: 2900, // 29 zł
        categoryId: jsCategory.id,
        isActive: true,
      },
      {
        title: "V8 Engine Optimizations",
        slug: "js-v8-optimizations",
        description: "Hidden classes, inline caching, TurboFan compiler. Jak pisać JavaScript, który będzie szybko wykonywany.",
        duration: 36,
        price: 3500, // 35 zł
        categoryId: jsCategory.id,
        isActive: true,
      },
      // Azure podcasts
      {
        title: "Azure Functions Deep Dive",
        slug: "azure-functions",
        description: "Serverless architecture, cold starts, bindings i triggers. Monitoring, performance tuning i cost optimization.",
        duration: 47,
        price: 4200, // 42 zł
        categoryId: azureCategory.id,
        isActive: true,
      },
      {
        title: "Cosmos DB Architecture",
        slug: "azure-cosmos-db",
        description: "Multi-model database, consistency levels, partitioning strategies. Global distribution i request units optimization.",
        duration: 52,
        price: 4500, // 45 zł
        categoryId: azureCategory.id,
        isActive: true,
      },
      // Architecture podcasts
      {
        title: "Microservices Patterns",
        slug: "arch-microservices",
        description: "Service discovery, circuit breaker, saga pattern. Distributed transactions i eventual consistency.",
        duration: 55,
        price: 4900, // 49 zł
        categoryId: archCategory.id,
        isActive: true,
      },
      {
        title: "Domain Driven Design",
        slug: "arch-ddd",
        description: "Bounded contexts, aggregates, value objects. Event sourcing i CQRS w praktyce enterprise.",
        duration: 48,
        price: 5200, // 52 zł
        categoryId: archCategory.id,
        isActive: true,
      },
    ];

    console.log("🎧 Creating podcasts...");
    const insertedPodcasts = await db.insert(podcasts).values(podcastData).returning();
    console.log(`✅ Created ${insertedPodcasts.length} podcasts`);

    console.log("🎉 Database seeding completed successfully!");
    
    // Log summary
    console.log("\n📊 Summary:");
    console.log(`Categories: ${insertedCategories.length}`);
    console.log(`Podcasts: ${insertedPodcasts.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

async function createAdminUser() {
  console.log("🔑 Checking for admin user...");
  
  try {
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@admin.com"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("✅ Admin user already exists");
      return existingAdmin[0];
    }

    // Create admin user
    const passwordHash = await AuthService.hashPassword("admin@admin.com");
    
    const [adminUser] = await db
      .insert(users)
      .values({
        email: "admin@admin.com",
        passwordHash,
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        isEmailVerified: true,
      })
      .returning();

    console.log("✅ Created admin user:", adminUser.email);
    return adminUser;
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase, createAdminUser };
