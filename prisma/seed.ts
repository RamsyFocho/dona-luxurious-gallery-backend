import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import prisma from "../src/utils/prisma";

dotenv.config();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@dona.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: "Admin",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Admin user created:", adminUser.email);

  // Seed categories from your data
  const categories = [
    {
      name: "Necklaces",
      slug: "necklaces",
      image: "/luxury-gold-necklace-pendant-elegant.jpg",
      description: "Exquisite necklaces crafted with finest materials",
      order: 1,
    },
    {
      name: "Rings",
      slug: "rings",
      image: "/elegant-gold-diamond-ring-jewelry.jpg",
      description: "Timeless rings for special moments",
      order: 2,
    },
    {
      name: "Bracelets",
      slug: "bracelets",
      image: "/luxury-gold-bracelet-cuff-bangle.jpg",
      description: "Sophisticated bracelets designed for elegance",
      order: 3,
    },
    {
      name: "Earrings",
      slug: "earrings",
      image: "/dangling-gold-pearl-earrings-luxury.jpg",
      description: "Statement earrings that elevate any look",
      order: 4,
    },
    {
      name: "Anklets",
      slug: "anklets",
      image: "/delicate-gold-anklet-jewelry-charm.jpg",
      description: "Delicate anklets with celestial designs",
      order: 5,
    },
    {
      name: "Sets",
      slug: "sets",
      image: "/jewelry-set-gold-necklace-earrings-matching.jpg",
      description: "Complete sets for coordinated elegance",
      order: 6,
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log("✅ Categories seeded");

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
