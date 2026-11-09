// src/config/sedes.ts
// Fuente Única de Verdad (Single Source of Truth - SSOT) para Sedes y Equipos en MTO Asepsis

export const SEDES_CONFIG = {
  LIMA: {
    id: 'LIMA',
    label: 'Lima (Planta Central)',
    shortLabel: 'Lima',
    folderSlug: 'lima',
    colorBadge: 'cyan',
    defaultEquipos: [
      'OE 4XL 1', 'OE 5XL 2', 'OE 4XL 3', 'OE 5XL 4', 'OE 5XL 5', 'OE 5XL 6',
      'OE 8XL 7', 'OE 8XL 8', 'OE 4XL 9', 'OE 5XL 10',
      'AUTOCLAVE V1', 'AUTOCLAVE V2', 'AUTOCLAVE V3', 'AUTOCLAVE V4', 'AUTOCLAVE V5', 'AUTOCLAVE V6',
      'PLASMA P1', 'PLASMA P2', 'PLASMA P3',
      'FORMALDEHIDO F01',
      'LAVADORA', 'CALDERA', 'COMPRESOR 25HP', 'COMPRESOR 10HP'
    ]
  },
  TRUJILLO: {
    id: 'TRUJILLO',
    label: 'Trujillo',
    shortLabel: 'Trujillo',
    folderSlug: 'trujillo',
    colorBadge: 'emerald',
    defaultEquipos: [
      'OE 4 XL TRUJILLO', 'OE 5 XL TRUJILLO',
      'AUTOCLAVE V-2 TRUJILLO', 'AUTOCLAVE V-5 TRUJILLO',
      'COMPRESOR TRUJILLO', 'SISTEMA OSMOSIS TRUJILLO'
    ]
  },
  COCHERA: {
    id: 'COCHERA',
    label: 'Cochera',
    shortLabel: 'Cochera',
    folderSlug: 'cochera',
    colorBadge: 'amber',
    defaultEquipos: [
      'GRUPO ELECTROGENO',
      'COMPRESOR AUXILIAR',
      'TABLERO GENERAL COCHERA',
      'UNIDAD VEHICULAR 01',
      'UNIDAD VEHICULAR 02',
      'SISTEMA HIDRONEUMATICO'
    ]
  }
} as const;

export type SedeKey = keyof typeof SEDES_CONFIG;
export type SedeFolder = typeof SEDES_CONFIG[SedeKey]['folderSlug'];

export const SEDE_KEYS = Object.keys(SEDES_CONFIG) as SedeKey[];

export interface SedeOption {
  value: SedeKey;
  label: string;
  shortLabel: string;
  folder: SedeFolder;
}

export const SEDE_OPTIONS: SedeOption[] = SEDE_KEYS.map((key) => ({
  value: key,
  label: SEDES_CONFIG[key].label,
  shortLabel: SEDES_CONFIG[key].shortLabel,
  folder: SEDES_CONFIG[key].folderSlug
}));

/**
 * Normaliza cualquier entrada de sede ("lima", "Lima", "LIMA", "trujillo", etc.) a su clave canónica SedeKey.
 */
export function normalizeSede(value?: string | null): SedeKey | null {
  if (!value) return null;
  const clean = value.trim().toUpperCase();
  if (clean === 'LIMA') return 'LIMA';
  if (clean === 'TRUJILLO') return 'TRUJILLO';
  if (clean === 'COCHERA') return 'COCHERA';
  return null;
}

/**
 * Devuelve el nombre amigable de la sede con formato Capitalizado ("Lima", "Trujillo", "Cochera").
 */
export function formatSedeName(value?: string | null): string {
  const normalized = normalizeSede(value);
  if (!normalized) return value ? value.trim() : 'Todas';
  return SEDES_CONFIG[normalized].shortLabel;
}

/**
 * Retorna el slug de carpeta para almacenamiento a partir de la sede indicada.
 */
export function getSedeStorageFolder(sede?: string | null): string {
  const normalized = normalizeSede(sede);
  return normalized ? SEDES_CONFIG[normalized].folderSlug : 'general';
}

/**
 * Retorna todos los equipos estándar registrados en el sistema.
 */
export function getAllStandardEquipos(): string[] {
  const equipos = new Set<string>();
  for (const key of SEDE_KEYS) {
    SEDES_CONFIG[key].defaultEquipos.forEach((eq) => equipos.add(eq));
  }
  return Array.from(equipos).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base', numeric: true }));
}

/**
 * Retorna los equipos sugeridos según la sede indicada. Si no se especifica sede, devuelve todos.
 */
export function getEquiposPorSede(sede?: string | null): string[] {
  const normalized = normalizeSede(sede);
  if (!normalized) {
    return getAllStandardEquipos();
  }
  return [...SEDES_CONFIG[normalized].defaultEquipos];
}
