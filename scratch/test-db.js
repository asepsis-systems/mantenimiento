const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const tasks = await db.tarea.findMany({
    take: 10,
    orderBy: { fecha_creacion: 'desc' },
    select: {
      id: true,
      descripcion: true,
      fecha: true,
      fecha_creacion: true,
      fechaCulminado: true,
      estado: true
    }
  });
  console.log(JSON.stringify(tasks, null, 2));
  await db.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
