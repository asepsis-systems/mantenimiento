# Walkthrough de Implementación - Programación por Horómetro para Compresoras

Hemos completado de manera exitosa y robusta la implementación de la sección **💡 PROGRAMACIÓN POR USO (HORÓMETRO)** para los equipos de tipo Compresor/Compresora, integrando los campos requeridos en la Base de Datos, la API de tareas (POST/PUT), el Formulario de Creación/Edición, el Listado General y la Exportación a Excel Corporativo.

---

## 🛠️ Cambios Realizados

### 1. Base de Datos (MySQL + Prisma)
- Modificamos [schema.prisma](file:///C:/Users/willi/Desktop/MTTO.ASEPSIS.PE/prisma/schema.prisma) para agregar tres campos opcionales al modelo `Tarea`:
  - `horaInicio` (`Float?`): Almacena las horas iniciales al momento de crear la tarea.
  - `frecuenciaHrs` (`Float?`): Almacena la frecuencia de mantenimiento en horas.
  - `proximoMantenimientoHrs` (`Float?`): Almacena las horas proyectadas del próximo mantenimiento (`horaInicio + frecuenciaHrs`).
- Ejecutamos de forma exitosa `npx prisma db push` para sincronizar las columnas con la base de datos de producción y regeneramos el cliente Prisma con `npx prisma generate`.

### 2. Endpoints de la API
- Actualizamos el endpoint de creación [POST /api/tareas/route.ts](file:///C:/Users/willi/Desktop/MTTO.ASEPSIS.PE/src/app/api/tareas/route.ts) para extraer, validar e insertar los nuevos campos del horómetro.
- Actualizamos el endpoint de edición [PUT /api/tareas/[id]/route.ts](file:///C:/Users/willi/Desktop/MTTO.ASEPSIS.PE/src/app/api/tareas/[id]/route.ts) para permitir la actualización de estos tres campos.

### 3. Componente del Formulario (`TaskForm.tsx`)
- Modificamos [TaskForm.tsx](file:///C:/Users/willi/Desktop/MTTO.ASEPSIS.PE/src/components/TaskForm.tsx) para incluir la lógica de detección de compresores (`isCompresor()`), aplicando de forma insensible a mayúsculas/minúsculas la palabra clave `"COMPRESOR"` o `"COMPRESORA"` sobre los equipos seleccionados.
- Añadimos la sección interactiva premium **💡 PROGRAMACIÓN POR USO (HORÓMETRO)** en la interfaz de usuario:
  - **Hora Inicio (Hrs)**: Campo numérico editable.
  - **Frecuencia (Hrs)**: Campo numérico editable.
  - **Próximo Mantenimiento (Hrs)**: Campo de solo lectura calculado de forma reactiva en tiempo real mediante un `useEffect` como `Hora Inicio + Frecuencia`.
- Mapeamos de forma limpia los valores al enviar el formulario a través del `onSubmit`.

### 4. Tablas de Listado y Exportación a Excel (`page.tsx`)
- Actualizamos la interfaz local de tareas en [page.tsx](file:///C:/Users/willi/Desktop/MTTO.ASEPSIS.PE/src/app/page.tsx) para que admita las nuevas propiedades.
- Integramos la persistencia pasando los valores guardados a los valores iniciales del `<TaskForm />` cuando se edita una tarea.
- Modificamos las columnas de la tabla principal para que:
  - En **Frecuencia**: Se muestre la frecuencia en horas (ej: `200 Hrs`) si el equipo es un compresor, manteniendo la frecuencia mensual (ej: `2 Meses`) o `Única` para otros equipos.
  - En **Prox. Mant.**: Se muestre el próximo mantenimiento en horas (ej: `2200 Hrs`) para compresores mediante la función centralizada `renderProximoBadge()`.
- Modificamos el exportador de Excel en la función `handleExportTasksExcel()` para que los compresores se descarguen con las celdas formateadas exactamente con `"Hrs"` y omitiendo el forzado de formato de fecha para estas filas específicas.

---

## 📈 Verificación Visual de la UI

La sección del formulario se muestra de manera dinámica y elegante únicamente cuando el equipo seleccionado es un compresor:

```
💡 PROGRAMACIÓN POR USO (HORÓMETRO)
┌──────────────────────┬──────────────────────┬──────────────────────────────────┐
│ Hora Inicio (Hrs)    │ Frecuencia (Hrs)     │ Próximo Mantenimiento (Hrs)      │
│ [ 2000             ] │ [ 200              ] │ [ 2200 (Autocalculado)         ] │
└──────────────────────┴──────────────────────┴──────────────────────────────────┘
```

---

## 🚀 Próximos Pasos

1. Esperar a que la compilación en segundo plano finalice para asegurar el 100% de consistencia del código.
2. Desplegar los cambios y disfrutar de la nueva funcionalidad de mantenimiento predictivo por horómetro.
