const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando limpieza del inventario de repuestos...');
  const result = await prisma.sparePart.deleteMany({});
  console.log(`Éxito: Se eliminaron ${result.count} registros del inventario de repuestos.`);
}

main()
  .catch((e) => {
    console.error('Error al limpiar inventario de repuestos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
