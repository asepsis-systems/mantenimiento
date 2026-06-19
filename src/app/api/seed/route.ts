import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth-node';

export async function GET(request: NextRequest) {
  try {
    // 1. Clean up or check if users already exist
    const userCount = await db.user.count();
    if (userCount > 0) {
      // Just recreate or return
      return NextResponse.json({
        success: true,
        message: 'La base de datos ya contiene datos. Si deseas reiniciarla, elimina dev.db y vuelve a ejecutar prisma db push.',
        usersCount: userCount
      });
    }

    // 2. Create default users
    const usersToCreate = [
      {
        username: 'admin',
        password: hashPassword('admin123'),
        name: 'Administrador de Mantenimiento',
        role: 'ADMIN'
      },
      {
        username: 'tecnico',
        password: hashPassword('tecnico123'),
        name: 'Técnico Operador',
        role: 'CREATOR'
      },
      {
        username: 'supervisor',
        password: hashPassword('super123'),
        name: 'Supervisor de Planta',
        role: 'VIEWER'
      }
    ];

    for (const u of usersToCreate) {
      await db.user.create({ data: u });
    }

    // 3. Create Sample Report exactly matching the screenshot
    const report = await db.report.create({
      data: {
        title: 'Reporte semanal de mantenimiento',
        periodFrom: '12/06/26',
        periodTo: '20/06/26'
      }
    });

    const reportId = report.id;

    // Define items data
    const itemsData = [
      {
        itemNumber: 1,
        date: '15.06.26',
        responsable: 'PROMAQUIRSA',
        machines: [
          {
            name: 'Ablandador',
            tasks: [
              {
                falla: 'No Succiona la sal',
                tipo: 'correctivo',
                descripcion: 'Limpieza de filtro de succion',
                repuestos: '-',
                cantidad: '-',
                estado: 'completado'
              },
              {
                falla: '',
                tipo: 'correctivo',
                descripcion: 'Cambio de oring en universal (fuga)',
                repuestos: 'oring (tych)',
                cantidad: '1',
                estado: 'completado'
              },
              {
                falla: 'Pasa agua dura al sistema',
                tipo: 'correctivo',
                descripcion: 'Cambio de valvula solenoide N.O.',
                repuestos: 'valvula solenoide PVC',
                cantidad: '1',
                estado: 'Pendiente'
              }
            ]
          },
          {
            name: 'Osmosis (Lima)',
            tasks: [
              {
                falla: 'Fuga del portafiltros',
                tipo: 'correctivo',
                descripcion: 'Cambio de portafiltros',
                repuestos: 'Portafiltros',
                cantidad: '1',
                estado: 'completado'
              },
              {
                falla: 'filtro de sedimentos Saturado',
                tipo: 'correctivo',
                descripcion: 'Cambio de filtro 25x 20 cada 3 meses',
                repuestos: 'filtro de sedimentos',
                cantidad: '1',
                estado: 'Pendiente'
              }
            ]
          },
          {
            name: 'Osmosis (Trujillo)',
            tasks: [
              {
                falla: 'Falta filtros 04 aprox.',
                tipo: 'correctivo',
                descripcion: 'Vicita, compra e instalacion de filtros',
                repuestos: 'filtros',
                cantidad: '4',
                estado: 'Pendiente'
              }
            ]
          }
        ]
      },
      {
        itemNumber: 2,
        date: '14.06.26',
        responsable: 'METRINDUST',
        machines: [
          {
            name: 'Autoclave V1,V2,V3',
            tasks: [
              {
                falla: 'Calibracion valvula de Seguridad',
                tipo: 'Preventivo',
                descripcion: 'Desmontaje, Calibracion, instalacion, Pruebas finales y certificados',
                repuestos: '-',
                cantidad: '3',
                estado: 'Completado'
              }
            ]
          },
          {
            name: 'Autoclave V4,V5,V6',
            tasks: [
              {
                falla: 'Calibracion valvula de Seguridad',
                tipo: 'Preventivo',
                descripcion: 'Desmontaje, Calibracion, instalacion, Pruebas finales y certificados',
                repuestos: '-',
                cantidad: '6',
                estado: 'Proceso'
              }
            ]
          },
          {
            name: 'Caldero',
            tasks: [
              {
                falla: 'Calibracion valvula de Seguridad',
                tipo: 'Preventivo',
                descripcion: 'Desmontaje, Calibracion, instalacion, Pruebas finales y certificados',
                repuestos: '-',
                cantidad: '1',
                estado: 'Proceso'
              }
            ]
          }
        ]
      },
      {
        itemNumber: 3,
        date: '13.06.26',
        responsable: 'Ing. Naveros Mantenimiento',
        machines: [
          {
            name: 'Autoclave V3',
            tasks: [
              {
                falla: 'Fuga de burletes',
                tipo: 'Correctivo',
                descripcion: 'Cambio de junta de puerta siliconeada',
                repuestos: 'junta siliconeada',
                cantidad: '1',
                estado: 'completado'
              },
              {
                falla: 'Mantenimiento Preventivo',
                tipo: 'Preventivo',
                descripcion: 'Mantto de bomba, venturi, pintura, lubricacion',
                repuestos: 'Grasa de Litio',
                cantidad: '1',
                estado: 'Pendiente'
              }
            ]
          }
        ]
      },
      {
        itemNumber: 4,
        date: '12.06.26',
        responsable: 'Mantenimiento',
        machines: [
          {
            name: 'ETTO',
            tasks: [
              {
                falla: 'selladora sin funcionamiento',
                tipo: 'correctivo',
                descripcion: 'Reparacion, cambio contactos.',
                repuestos: '-',
                cantidad: '-',
                estado: 'completado'
              }
            ]
          }
        ]
      },
      {
        itemNumber: 5,
        date: '16.06.26',
        responsable: 'PROINSAC',
        machines: [
          {
            name: 'Autoclave V1 equipos, lavadora',
            tasks: [
              {
                falla: 'Mantenimiento de bomba',
                tipo: 'correctivo',
                descripcion: 'Mantenimiento de bomba de 3 hp',
                repuestos: 'rodajes, sello, etc.',
                cantidad: '-',
                estado: 'Proceso'
              },
              {
                falla: 'stock',
                tipo: 'correctivo',
                descripcion: 'Mantenimiento de bomba de 1.5 hp',
                repuestos: 'rodajes, sello, etc.',
                cantidad: '-',
                estado: 'Proceso'
              }
            ]
          }
        ]
      },
      {
        itemNumber: 6,
        date: '17.06.26',
        responsable: 'Ing. Naveros',
        machines: [
          {
            name: 'Formaldehido',
            tasks: [
              {
                falla: 'La pantalla se queda estatica',
                tipo: 'Reparacion',
                descripcion: 'Evaluar, reparar y realizar pruebas',
                repuestos: '-',
                cantidad: '-',
                estado: 'completado'
              }
            ]
          },
          {
            name: 'V1',
            tasks: [
              {
                falla: 'presenta fuga de vapor',
                tipo: 'correctivo',
                descripcion: 'Cambio de valvula de vaporizacion',
                repuestos: 'valvula vaporizacion',
                cantidad: '1',
                estado: 'completado'
              }
            ]
          },
          {
            name: 'OE 5XL (TRUJILLO)',
            tasks: [
              {
                falla: 'La pantalla se queda estatica',
                tipo: 'correctivo',
                descripcion: 'Realizar una evaluacion presencial',
                repuestos: '-',
                cantidad: '-',
                estado: 'Pendiente'
              }
            ]
          }
        ]
      },
      {
        itemNumber: 7,
        date: '18.06.26',
        responsable: 'LOGIC ENERGY',
        machines: [
          {
            name: 'OE 02',
            tasks: [
              {
                falla: 'automatizacion',
                tipo: 'correctivo',
                descripcion: 'Pruebas realizadas con normalidad',
                repuestos: '-',
                cantidad: '-',
                estado: 'completado'
              }
            ]
          }
        ]
      }
    ];

    // Seed report data hierarchy
    for (const item of itemsData) {
      await db.item.create({
        data: {
          reportId: reportId,
          itemNumber: item.itemNumber,
          date: item.date,
          responsable: item.responsable,
          machines: {
            create: item.machines.map(m => ({
              name: m.name,
              tasks: {
                create: m.tasks.map(t => ({
                  falla: t.falla,
                  tipo: t.tipo,
                  descripcion: t.descripcion,
                  repuestos: t.repuestos,
                  cantidad: t.cantidad,
                  estado: t.estado
                }))
              }
            }))
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Base de datos de mantenimiento poblada con éxito.',
      users: usersToCreate.map(u => ({ username: u.username, role: u.role })),
      sampleReportId: reportId
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
