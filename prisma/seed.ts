import { PrismaClient, Status, KanbanColumn, Priority } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.kanbanCard.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Sokha Vann",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
      },
    }),
    prisma.user.create({
      data: {
        name: "Dara Kim",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
      },
    }),
    prisma.user.create({
      data: {
        name: "Bopha Chan",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella",
      },
    }),
    prisma.user.create({
      data: {
        name: "Vireak Chea",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Liam",
      },
    }),
  ]);

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      title: "គម្រោងវេបសាយថ្មី v2.0",
      description:
        "បង្កើតវេបសាយដែលមានល្បឿនលឿន និងងាយស្រួលប្រើប្រាស់សម្រាប់អតិថិជន។ យើងត្រូវផ្តោតសំខាន់ទៅលើបទពិសោធន៍អ្នកប្រើប្រាស់ (UX)។",
      emoji: "💻",
      status: Status.IN_PROGRESS,
      dueDate: new Date("2024-12-25"),
      isFavorite: true,
      assigneeId: users[0].id,
    },
  });

  // Create Tasks
  await prisma.task.createMany({
    data: [
      {
        text: "រៀបចំរចនាសម្ព័ន្ធ Database",
        tag: "Backend",
        checked: false,
        order: 0,
        projectId: project.id,
      },
      {
        text: "ប្រជុំក្រុមដើម្បីកំណត់ទិសដៅ",
        tag: "General",
        checked: true,
        order: 1,
        projectId: project.id,
      },
      {
        text: "រចនា UI/UX សម្រាប់ទំព័រដើម",
        tag: "Design",
        checked: false,
        order: 2,
        projectId: project.id,
      },
      {
        text: "សរសេរ API endpoints",
        tag: "Backend",
        checked: false,
        order: 3,
        projectId: project.id,
      },
    ],
  });

  // Create Kanban Cards
  await prisma.kanbanCard.createMany({
    data: [
      {
        text: "សរសេរ API Docs",
        column: KanbanColumn.TODO,
        priority: Priority.HIGH,
        order: 0,
        projectId: project.id,
      },
      {
        text: "រៀបចំ Server",
        column: KanbanColumn.TODO,
        priority: Priority.MEDIUM,
        order: 1,
        projectId: project.id,
      },
      {
        text: "Setup CI/CD Pipeline",
        column: KanbanColumn.PROGRESS,
        priority: null,
        order: 0,
        projectId: project.id,
      },
      {
        text: "បង្កើត Database Schema",
        column: KanbanColumn.DONE,
        priority: Priority.HIGH,
        order: 0,
        projectId: project.id,
      },
    ],
  });

  // Create another project
  await prisma.project.create({
    data: {
      title: "កិច្ចការប្រចាំថ្ងៃ",
      description: "បញ្ជីកិច្ចការសម្រាប់ការងារប្រចាំថ្ងៃ",
      emoji: "📝",
      status: Status.IN_PROGRESS,
      isFavorite: true,
      assigneeId: users[1].id,
    },
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
