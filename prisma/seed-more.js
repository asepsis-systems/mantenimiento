const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  try {
    console.log('Seeding spare parts and licenses...');
    
    // Clean
    await db.sparePart.deleteMany({});
    await db.license.deleteMany({});

    // Seed spare parts
    const spares = [
      { name: 'Oring ablandador (Tych)', code: 'REP-001', stock: 12, minStock: 5, price: 15.5, location: 'Almacén Principal - Estante A' },
      { name: 'Válvula solenoide PVC 1"', code: 'REP-002', stock: 4, minStock: 2, price: 180.0, location: 'Almacén Principal - Estante B' },
      { name: 'Filtro de sedimentos 25x20', code: 'REP-003', stock: 2, minStock: 10, price: 35.0, location: 'Almacén Secundario' }, // under stock alert!
      { name: 'Grasa de Litio de alta temperatura', code: 'REP-004', stock: 8, minStock: 3, price: 28.5, location: 'Taller de Mantenimiento' },
    ];

    for (const s of spares) {
      await db.sparePart.create({ data: s });
    }

    // Seed licenses
    const licenses = [
      { name: 'Licencia de Funcionamiento de Planta', entity: 'Municipalidad', code: 'LIC-2026-0045', issueDate: '15/01/2026', expiryDate: '15/01/2030', status: 'VIGENTE' },
      { name: 'Certificado de Calibración de Autoclave V1', entity: 'METRINDUST', code: 'CERT-AUT-01', issueDate: '14/06/2026', expiryDate: '14/06/2027', status: 'VIGENTE' },
      { name: 'Certificado de Inspección de Seguridad Caldero', entity: 'Diresa', code: 'INS-CAL-2026', issueDate: '12/03/2026', expiryDate: '12/03/2027', status: 'VIGENTE' },
      { name: 'Licencia de Operador de Calderas (Técnico)', entity: 'Ministerio de Trabajo', code: 'OP-CALD-98', issueDate: '10/01/2025', expiryDate: '10/01/2026', status: 'VENCIDO' }, // expired!
    ];

    for (const l of licenses) {
      await db.license.create({ data: l });
    }

    console.log('Seeded successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await db.$disconnect();
  }
}

main();
