const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tareasCount = await prisma.tarea.count();
    const archivosCount = await prisma.tareaArchivo.count();
    console.log('--- DATABASE STATUS ---');
    console.log('Total Tareas:', tareasCount);
    console.log('Total TareaArchivos (historial de archivos):', archivosCount);
    
    const withCert = await prisma.tarea.count({
      where: {
        NOT: {
          certificadoPath: null
        }
      }
    });
    console.log('Tareas con certificadoPath (certificado):', withCert);

    const sampleArchivos = await prisma.tareaArchivo.findMany({
      take: 5
    });
    console.log('Sample TareaArchivos:', sampleArchivos);

  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
