const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  try {
    // Create test task
    const testTask = await db.tarea.create({
      data: {
        responsable: 'TEST_RESPONSIBLE',
        descripcion: 'Test task for deletion verification',
        estado: 'PENDIENTE'
      }
    });
    console.log('Created test task with ID:', testTask.id);

    // Delete test task
    await db.tarea.delete({
      where: { id: testTask.id }
    });
    console.log('Successfully deleted test task!');
  } catch (err) {
    console.error('Error during test task lifecycle:', err);
  } finally {
    await db.$disconnect();
  }
}

main();
