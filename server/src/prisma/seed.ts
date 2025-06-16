// server/prisma/seed.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const party = await prisma.party.create({
    data: {
      name: "The Fellowship",
      members: {
        create: [
          {
            name: "Aragorn",
            class: "Ranger",
            level: 5,
            maxHP: 52,
            ac: 16,
            passivePerception: 15
          },
          {
            name: "Legolas",
            class: "Rogue",
            level: 5,
            maxHP: 44,
            ac: 15,
            passivePerception: 17
          }
        ]
      }
    }
  });

  console.log("Seeded party:", party);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
