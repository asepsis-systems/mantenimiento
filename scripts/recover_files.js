const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  console.log('=== INICIANDO RECUPERACIÓN DE ARCHIVOS ===');

  // 1. Recuperar desde el directorio físico uploads/certificados
  const certificadosDir = path.join(__dirname, '..', 'uploads', 'certificados');
  if (fs.existsSync(certificadosDir)) {
    console.log('Directorio de certificados encontrado.');
    const files = fs.readdirSync(certificadosDir);
    console.log(`Encontrados ${files.length} archivos físicos.`);

    for (const file of files) {
      const uuidRegex = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
      const match = file.match(uuidRegex);
      if (match) {
        const tareaId = match[1];
        console.log(`\nArchivo: "${file}" -> Tarea ID: "${tareaId}"`);

        const tarea = await prisma.tarea.findUnique({
          where: { id: tareaId }
        });

        if (tarea) {
          console.log(`[OK] Tarea encontrada en la BD: Item ${tarea.itemNumber} - ${tarea.equipo}`);
          const relPath = `uploads/certificados/${file}`;

          const existingRecord = await prisma.tareaArchivo.findFirst({
            where: {
              tareaId: tareaId,
              path: relPath
            }
          });

          if (!existingRecord) {
            const originalName = tarea.certificadoNombre || file.replace(`${tareaId}-`, '');
            const newRecord = await prisma.tareaArchivo.create({
              data: {
                tareaId: tareaId,
                originalName: originalName,
                path: relPath
              }
            });
            console.log(`[AÑADIDO] Registro TareaArchivo creado con ID: ${newRecord.id} y nombre: "${originalName}"`);
          } else {
            console.log(`[EXISTE] Ya existe un registro para este archivo.`);
          }
        } else {
          console.log(`[ADVERTENCIA] La tarea con ID ${tareaId} no existe en la base de datos.`);
        }
      }
    }
  } else {
    console.log('No se encontró el directorio físico de certificados.');
  }

  // 2. Sincronizar desde la tabla Tarea
  console.log('\n=== COMPROBANDO TAREAS CON CERTIFICADOS ASOCIADOS ===');
  const tareasConCertificado = await prisma.tarea.findMany({
    where: {
      certificadoPath: {
        not: null
      }
    }
  });

  console.log(`Encontradas ${tareasConCertificado.length} tareas con certificadoPath en la base de datos.`);

  for (const t of tareasConCertificado) {
    if (t.certificadoPath) {
      const existing = await prisma.tareaArchivo.findFirst({
        where: {
          tareaId: t.id,
          path: t.certificadoPath
        }
      });

      if (!existing) {
        const newRecord = await prisma.tareaArchivo.create({
          data: {
            tareaId: t.id,
            originalName: t.certificadoNombre || 'Certificado',
            path: t.certificadoPath
          }
        });
        console.log(`[RESTAURADO] Creado TareaArchivo desde Tarea para Item ${t.id} -> "${t.certificadoNombre}"`);
      }
    }
  }

  console.log('\n=== PROCESO DE RECUPERACIÓN TERMINADO ===');
}

main()
  .catch(e => {
    console.error('Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
