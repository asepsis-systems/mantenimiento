const mockTareas = [
  { id: '1', fecha: '2026-07-20', itemNumber: 1, fecha_creacion: '2026-07-20T10:00:00Z' },
  { id: '2', fecha: '2026-07-20', itemNumber: 2, fecha_creacion: '2026-07-20T11:00:00Z' },
  { id: '3', fecha: '2026-07-19', itemNumber: 1, fecha_creacion: '2026-07-19T10:00:00Z' },
];

const getTaskDate = (t) => t.fecha;

const getStableItemNumbers = (sortedTareas, tareas) => {
  const groups = {};
  
  sortedTareas.forEach(t => {
    const d = getTaskDate(t);
    if (d) {
      const monthStr = d.substring(0, 7);
      if (!groups[monthStr]) groups[monthStr] = [];
      groups[monthStr].push(t.id);
    }
  });

  const itemMap = {};
  Object.keys(groups).forEach(monthStr => {
    const monthTasks = groups[monthStr].map(id => tareas.find(x => x.id === id));
    monthTasks.sort((a, b) => {
      const dateA = getTaskDate(a);
      const dateB = getTaskDate(b);
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      const itemA = a.itemNumber || 0;
      const itemB = b.itemNumber || 0;
      if (itemA !== itemB) {
        return itemB - itemA;
      }
      return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
    });

    monthTasks.forEach((t, idx) => {
      itemMap[t.id] = monthTasks.length - idx;
    });
  });

  return itemMap;
};

try {
  const sorted = [...mockTareas];
  const res = getStableItemNumbers(sorted, mockTareas);
  console.log('Result:', res);
} catch (err) {
  console.error('Error:', err);
}
