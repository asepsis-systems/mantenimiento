'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SEDE_OPTIONS, SedeKey, normalizeSede, formatSedeName } from '@/config/sedes';
import MtoTopNavbar from '@/components/MtoTopNavbar';
import MtoSidebar from '@/components/MtoSidebar';
import MtoLoadingScreen from '@/components/MtoLoadingScreen';
import {
  Plus,
  Trash2,
  Edit3,
  LogOut,
  User as UserIcon,
  Wrench,
  AlertCircle,
  Search,
  FileCheck,
  AlertTriangle,
  Clock,
  Calendar,
  X,
  Folder,
  FolderPlus,
  Upload,
  FileText,
  Eye,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

interface License {
  id: string;
  name: string;
  entity: string;
  code: string | null;
  issueDate: string;
  expiryDate: string;
  status: string;
  details: string | null;
  createdAt: string;
  updatedAt: string;
  archivoNombre: string | null;
  archivoPath: string | null;
  archivoNombreCertificado: string | null;
  archivoPathCertificado: string | null;
  archivoNombreProtocolo: string | null;
  archivoPathProtocolo: string | null;
  archivoNombreInformeTecnico: string | null;
  archivoPathInformeTecnico: string | null;
  archivoNombreFactura: string | null;
  archivoPathFactura: string | null;
  archivoNombrePresupuesto: string | null;
  archivoPathPresupuesto: string | null;
  archivoNombreCheckList: string | null;
  archivoPathCheckList: string | null;
  carpetaId: string | null;
  vencimientoCertificado: string | null;
  vencimientoProtocolo: string | null;
  vencimientoInformeTecnico: string | null;
  vencimientoFactura: string | null;
  vencimientoPresupuesto: string | null;
  vencimientoCheckList: string | null;
}

const docTypeExpiryFieldMap: Record<LicenseDocType, keyof License> = {
  certificado: 'vencimientoCertificado',
  protocolo: 'vencimientoProtocolo',
  informeTecnico: 'vencimientoInformeTecnico',
  factura: 'vencimientoFactura',
  presupuesto: 'vencimientoPresupuesto',
  checklist: 'vencimientoCheckList'
};

type LicenseDocType = 'certificado' | 'protocolo' | 'informeTecnico' | 'factura' | 'presupuesto' | 'checklist';

const docTypeLabels: Record<LicenseDocType, string> = {
  certificado: 'CERTIFICADO',
  protocolo: 'PROTOCOLO',
  informeTecnico: 'INFORME TÉCNICO',
  factura: 'FACTURA',
  presupuesto: 'PRESUPUESTO',
  checklist: 'CHECK LIST'
};

const docTypeFieldMap: Record<LicenseDocType, { nameField: keyof License; pathField: keyof License }> = {
  certificado: { nameField: 'archivoNombreCertificado', pathField: 'archivoPathCertificado' },
  protocolo: { nameField: 'archivoNombreProtocolo', pathField: 'archivoPathProtocolo' },
  informeTecnico: { nameField: 'archivoNombreInformeTecnico', pathField: 'archivoPathInformeTecnico' },
  factura: { nameField: 'archivoNombreFactura', pathField: 'archivoPathFactura' },
  presupuesto: { nameField: 'archivoNombrePresupuesto', pathField: 'archivoPathPresupuesto' },
  checklist: { nameField: 'archivoNombreCheckList', pathField: 'archivoPathCheckList' }
};

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

const sectionNames = ['EQUIPOS', 'ELÉCTRICO', 'PLANTA'] as const;

type SectionName = (typeof sectionNames)[number];

const sectionMachines: Record<SectionName, string[]> = {
  EQUIPOS: [
    'OE 4XL 1',
    'OE 5XL 2',
    'OE 4XL 3',
    'OE 5XL 4',
    'OE 5XL 5',
    'OE 5XL 6',
    'OE 8XL 7',
    'OE 8XL 8',
    'OE 4XL 9',
    'OE 5XL 10',
    'OE 4 XL',
    'OE 5 XL',
    'AUTOCLAVE V1',
    'AUTOCLAVE V2',
    'AUTOCLAVE V3',
    'AUTOCLAVE V4',
    'AUTOCLAVE V5',
    'AUTOCLAVE V6',
    'PLASMA P1',
    'PLASMA P2',
    'PLASMA P3',
    'FORMALDEHIDO F01',
    'AUTOCLAVE V-2',
    'AUTOCLAVE V-5',
    'LAVADORA',
    'CALDERA',
    'COMPRESOR 25HP',
    'COMPRESOR 10HP'
  ],
  ELÉCTRICO: [],
  PLANTA: []
};

const parseDetails = (details: string | null): Record<string, string> => {
  if (!details) return {};
  try {
    return JSON.parse(details);
  } catch (e) {
    return {};
  }
};

const getRowSede = (row: { machineName: string; license?: License }): SedeKey => {
  if (row.license?.details) {
    const details = parseDetails(row.license.details);
    const norm = normalizeSede(details.sede);
    if (norm) return norm;
  }
  const upper = row.machineName.toUpperCase();
  if (upper.includes('TRUJILLO')) return 'TRUJILLO';
  if (upper.includes('COCHERA')) return 'COCHERA';
  return 'LIMA';
};

export default function LicensesPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mto_sidebar_collapsed');
      if (saved !== null) setSidebarCollapsed(saved === 'true');
    }
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('mto_sidebar_collapsed', String(next));
      }
      return next;
    });
  };
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<string>('TODAS');
  const [carpetas, setCarpetas] = useState<any[]>([]);
  const [currentSection, setCurrentSection] = useState<SectionName>('EQUIPOS');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [isDocUploadModalOpen, setIsDocUploadModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [detailEquipo, setDetailEquipo] = useState('');
  const [detailMarca, setDetailMarca] = useState('');
  const [detailModelo, setDetailModelo] = useState('');
  const [detailSerie, setDetailSerie] = useState('');
  const [detailCapacidad, setDetailCapacidad] = useState('');
  const [detailEstado, setDetailEstado] = useState('');
  const [detailSede, setDetailSede] = useState('');
  const [detailProcesos, setDetailProcesos] = useState('');

  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineSede, setNewMachineSede] = useState<string>('LIMA');
  const [machineError, setMachineError] = useState('');

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [currentDocUploadLicenseId, setCurrentDocUploadLicenseId] = useState<string | null>(null);
  const [currentDocUploadType, setCurrentDocUploadType] = useState<LicenseDocType>('certificado');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewExt, setPreviewExt] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsModalLicense, setDetailsModalLicense] = useState<License | null>(null);
  const [isDetailsEditMode, setIsDetailsEditMode] = useState(false);

  // Files history for license details
  const [licenseFiles, setLicenseFiles] = useState<any[]>([]);
  const [licenseFilesLoading, setLicenseFilesLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [deletedPlaceholders, setDeletedPlaceholders] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('deletedPlaceholders');
    if (saved) {
      try {
        setDeletedPlaceholders(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleDeletePlaceholder = (name: string) => {
    const updated = [...deletedPlaceholders, name];
    setDeletedPlaceholders(updated);
    localStorage.setItem('deletedPlaceholders', JSON.stringify(updated));
  };

  const handleDeleteFile = async (id: string, type: LicenseDocType) => {
    if (!confirm('¿Está seguro de eliminar este archivo?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/licencias/archivo?id=${id}&type=${type}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchLicenses();
      } else {
        alert(data.error || 'Error al eliminar el archivo.');
      }
    } catch (err) {
      alert('Error de conexión al eliminar el archivo.');
    } finally {
      setActionLoading(false);
    }
  };

  const normalizeFolderName = (name: string) =>
    name.toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

  const findSectionFolder = () => {
    return carpetas.find((folder) => normalizeFolderName(folder.nombre) === normalizeFolderName(currentSection));
  };

  const ensureSectionFolderId = async () => {
    const existing = findSectionFolder();
    if (existing) return existing.id;

    const res = await fetch('/api/licencias/carpetas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: currentSection })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'No se pudo crear la sección.');
    }
    await fetchCarpetas();
    return data.carpeta.id;
  };

  const fetchCarpetas = async () => {
    try {
      const res = await fetch('/api/licencias/carpetas');
      const data = await res.json();
      if (data.success) {
        setCarpetas(data.carpetas);
      }
    } catch (err) {
      console.error('Error al cargar secciones:', err);
    }
  };

  const fetchLicenses = async () => {
    try {
      const sectionFolder = findSectionFolder();
      const folderId = sectionFolder ? sectionFolder.id : null;
      const url = `/api/licencias?carpetaId=${folderId || 'null'}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLicenses(data.licenses);
      } else {
        setError(data.error || 'Error al cargar licencias');
      }
    } catch (err) {
      setError('Error al comunicar con el servidor');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }

        const meData = await meRes.json();
        setUser(meData.user);
        await fetchCarpetas();
      } catch (err) {
        setError('Error de comunicación con el servidor');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchLicenses();
    }
  }, [currentSection, carpetas, user]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        console.error(err);
      } finally {
        window.location.href = '/login';
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openCreateModal = (defaultName = '') => {
    setEditingId(null);
    setFormName(defaultName || currentSection);
    setDetailEquipo(defaultName);
    setDetailMarca('');
    setDetailModelo('');
    setDetailSerie('');
    setDetailCapacidad('');
    setDetailEstado('');
    setDetailSede('');
    setDetailProcesos('');
    setError('');
    setIsModalOpen(true);
  };

  const openCreateMachineModal = () => {
    setNewMachineName('');
    setNewMachineSede(selectedSedeFilter !== 'TODAS' ? selectedSedeFilter : 'LIMA');
    setMachineError('');
    setIsMachineModalOpen(true);
  };

  const handleSaveMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    const newName = newMachineName.trim();
    if (!newName) {
      setMachineError('El nombre de la máquina es obligatorio.');
      return;
    }

    const sectionPlaceholders = sectionMachines[currentSection] || [];
    const nameExists = sectionPlaceholders.some((machine) => machine.toLowerCase() === newName.toLowerCase()) ||
                       licenses.some((lic) => (lic.name || '').toLowerCase() === newName.toLowerCase());

    if (nameExists) {
      setMachineError('Ya existe una máquina con ese nombre en la sección.');
      return;
    }

    setMachineError('');
    setActionLoading(true);

    try {
      const carpetaId = await ensureSectionFolderId();
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const todayStr = `${dd}/${mm}/${yyyy}`;

      const payload = {
        name: newName,
        entity: 'POR ESPECIFICAR',
        code: 'S/N',
        issueDate: todayStr,
        expiryDate: todayStr,
        status: 'EN_TRAMITE',
        details: JSON.stringify({
          equipo: newName,
          marca: '',
          modelo: '',
          serie: '',
          capacidad: '',
          estado: 'OPERATIVO',
          sede: newMachineSede || 'LIMA',
          procesos: '',
          garantia: ''
        }),
        carpetaId
      };

      const res = await fetch('/api/licencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const updated = deletedPlaceholders.filter(
          (name) => normalizeMachineName(name) !== normalizeMachineName(newName)
        );
        setDeletedPlaceholders(updated);
        localStorage.setItem('deletedPlaceholders', JSON.stringify(updated));

        setIsMachineModalOpen(false);
        await fetchLicenses();
      } else {
        setMachineError(data.error || 'Error al guardar la máquina.');
      }
    } catch (err: any) {
      setMachineError('Error de conexión con el servidor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadForPlaceholder = async (machineName: string, docType: LicenseDocType) => {
    setActionLoading(true);
    try {
      const carpetaId = await ensureSectionFolderId();
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const todayStr = `${dd}/${mm}/${yyyy}`;

      const payload = {
        name: machineName,
        entity: 'POR ESPECIFICAR',
        code: 'S/N',
        issueDate: todayStr,
        expiryDate: todayStr,
        status: 'EN_TRAMITE',
        details: JSON.stringify({
          equipo: machineName,
          marca: '',
          modelo: '',
          serie: '',
          capacidad: '',
          estado: 'OPERATIVO',
          sede: machineName.toUpperCase().includes('TRUJILLO') ? 'TRUJILLO' : machineName.toUpperCase().includes('COCHERA') ? 'COCHERA' : 'LIMA',
          procesos: '',
          garantia: ''
        }),
        carpetaId
      };

      const res = await fetch('/api/licencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        const updated = deletedPlaceholders.filter(
          (name) => normalizeMachineName(name) !== normalizeMachineName(machineName)
        );
        setDeletedPlaceholders(updated);
        localStorage.setItem('deletedPlaceholders', JSON.stringify(updated));

        await fetchLicenses();
        openDocUploadModal(data.data.id, docType, '');
      } else {
        alert(data.error || 'Error al registrar la máquina automáticamente.');
      }
    } catch (err) {
      alert('Error de conexión al registrar la máquina.');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailsModalForMachine = (machineName: string, lic?: License) => {
    if (lic) {
      setDetailsModalLicense(lic);
      // fetch files for this license
      if (lic.id) fetchLicenseFiles(lic.id);
    } else {
      const dummyLicense: License = {
        id: '',
        name: machineName,
        entity: 'POR ESPECIFICAR',
        code: 'S/N',
        issueDate: '',
        expiryDate: '',
        status: 'EN_TRAMITE',
        details: null,
        createdAt: '',
        updatedAt: '',
        archivoNombre: null,
        archivoPath: null,
        archivoNombreCertificado: null,
        archivoPathCertificado: null,
        archivoNombreProtocolo: null,
        archivoPathProtocolo: null,
        archivoNombreInformeTecnico: null,
        archivoPathInformeTecnico: null,
        archivoNombreFactura: null,
        archivoPathFactura: null,
        archivoNombrePresupuesto: null,
        archivoPathPresupuesto: null,
        archivoNombreCheckList: null,
        archivoPathCheckList: null,
        carpetaId: null,
        vencimientoCertificado: null,
        vencimientoProtocolo: null,
        vencimientoInformeTecnico: null,
        vencimientoFactura: null,
        vencimientoPresupuesto: null,
        vencimientoCheckList: null
      };
      setDetailsModalLicense(dummyLicense);
    }
    setIsDetailsModalOpen(true);
    setIsDetailsEditMode(false);
  };

  const openDetailsModal = (lic: License) => {
    setDetailsModalLicense(lic);
    if (lic.id) fetchLicenseFiles(lic.id);
    setIsDetailsModalOpen(true);
    setIsDetailsEditMode(false);
  };

  const fetchLicenseFiles = async (licenseId: string) => {
    setLicenseFilesLoading(true);
    try {
      const res = await fetch(`/api/licencias/archivo?id=${encodeURIComponent(licenseId)}&list=true`);
      const data = await res.json();
      if (res.ok && data.success) {
        setLicenseFiles(data.files || []);
      } else {
        setLicenseFiles([]);
      }
    } catch (err) {
      console.error('Error fetching license files:', err);
      setLicenseFiles([]);
    } finally {
      setLicenseFilesLoading(false);
    }
  };

  const openEditModal = (lic: License) => {
    const parsedDetails = parseDetails(lic.details);

    setEditingId(lic.id || null);
    setFormName(lic.name);
    setDetailEquipo(parsedDetails.equipo || '');
    setDetailMarca(parsedDetails.marca || '');
    setDetailModelo(parsedDetails.modelo || '');
    setDetailSerie(parsedDetails.serie || '');
    setDetailCapacidad(parsedDetails.capacidad || '');
    setDetailEstado(parsedDetails.estado || '');
    setDetailSede(parsedDetails.sede || '');
    setDetailProcesos(parsedDetails.procesos || '');
    setError('');
    setIsModalOpen(true);
  };

  const openFilePreview = (id: string, filename: string | null, docType: LicenseDocType = 'certificado') => {
    const url = `/api/licencias/archivo?id=${encodeURIComponent(id)}&type=${encodeURIComponent(docType)}`;
    const getExtension = (name: string | null) => {
      if (!name) return '';
      const idx = name.lastIndexOf('.');
      return idx === -1 ? '' : name.slice(idx).toLowerCase();
    };

    const lic = licenses.find((l) => l.id === id);
    const field = docTypeFieldMap[docType];
    const physicalPath = lic ? ((lic as any)[field.pathField] as string | undefined) : undefined;

    let ext = getExtension(filename);
    if (!ext && physicalPath) {
      ext = getExtension(physicalPath);
    }
    if (!ext) {
      ext = '.pdf';
    }

    const previewable = ['.pdf', '.jpg', '.jpeg', '.png', '.gif'];

    if (!previewable.includes(ext)) {
      window.open(url, '_blank');
      return;
    }

    setPreviewUrl(url);
    const displayName = (filename && filename.toLowerCase().endsWith(ext)) ? filename : `${filename || 'documento'}${ext}`;
    setPreviewName(displayName);
    setPreviewExt(ext);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewUrl(null);
    setPreviewName(null);
    setPreviewExt(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setActionLoading(true);
    setError('');

    try {
      const carpetaId = await ensureSectionFolderId();
      const payload = {
        name: formName.trim() || currentSection,
        details: JSON.stringify({
          equipo: detailEquipo.trim(),
          marca: detailMarca.trim(),
          modelo: detailModelo.trim(),
          serie: detailSerie.trim(),
          capacidad: detailCapacidad.trim(),
          estado: detailEstado.trim(),
          sede: detailSede.trim(),
          procesos: detailProcesos.trim()
        }),
        carpetaId
      };

      const url = editingId ? `/api/licencias/${editingId}` : '/api/licencias';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsModalOpen(false);
        await fetchLicenses();
      } else {
        setError(data.error || 'Error al guardar licencia.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setActionLoading(false);
    }
  };

  const openDocUploadModal = (licenseId: string, docType: LicenseDocType, expiryDate = '') => {
    const license = licenses.find((lic) => lic.id === licenseId);

    setCurrentDocUploadLicenseId(licenseId);
    setCurrentDocUploadType(docType);
    setUploadFile(null);
    setIsDocUploadModalOpen(true);
  };

  const closeDocUploadModal = () => {
    setCurrentDocUploadLicenseId(null);
    setCurrentDocUploadType('certificado');
    setUploadFile(null);
    setIsDocUploadModalOpen(false);
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDocUploadLicenseId) return;
    
    // If not editing, or editing but no file exists and no file is selected, return
    const isEditing = !!currentDocUploadLicenseId;
    const hasExistingFile = isEditing && !!(licenses.find(l => l.id === currentDocUploadLicenseId)?.[docTypeFieldMap[currentDocUploadType].nameField]);
    
    if (!uploadFile && !hasExistingFile) return;

    setActionLoading(true);
    const formData = new FormData();
    if (uploadFile) {
      formData.append('file', uploadFile);
    }
    formData.append('docType', currentDocUploadType);
    formData.append('id', currentDocUploadLicenseId);

    try {
      const res = await fetch('/api/licencias/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        closeDocUploadModal();
        await fetchLicenses();
      } else {
        alert(data.error || 'Error al subir documento');
      }
    } catch (err) {
      alert('Error de red al subir documento');
    } finally {
      setActionLoading(false);
    }
  };


  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const parseLicenseDate = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return null;

    const parts = normalized.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map((part) => parseInt(part, 10));
      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        return new Date(year, month - 1, day);
      }
    }

    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const today = new Date();
  const daysUntilExpiry = (expiryDate: string) => {
    const date = parseLicenseDate(expiryDate);
    if (!date) return null;
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isExpiredByDate = (expiryDate: string) => {
    const diffDays = daysUntilExpiry(expiryDate);
    return diffDays !== null && diffDays < 0;
  };

  const isPendingByDate = (expiryDate: string) => {
    const diffDays = daysUntilExpiry(expiryDate);
    return diffDays !== null && diffDays >= 0 && diffDays <= 30;
  };

  const getDocumentState = (expiryDate: string | null) => {
    if (!expiryDate) return { variant: 'none', label: 'Sin fecha' };
    const diffDays = daysUntilExpiry(expiryDate);
    if (diffDays === null) return { variant: 'none', label: 'Fecha inválida' };
    if (diffDays < 0) return { variant: 'expired', label: `Venció hace ${Math.abs(diffDays)} día${Math.abs(diffDays) === 1 ? '' : 's'}` };
    if (diffDays <= 30) return { variant: 'dueSoon', label: `Vence en ${diffDays} día${diffDays === 1 ? '' : 's'}` };
    return { variant: 'active', label: 'Activo' };
  };

  const getLicenseExpiryStatus = (lic: License) => {
    let hasExpired = false;
    let hasPending = false;

    const docTypes: LicenseDocType[] = ['certificado', 'protocolo', 'informeTecnico', 'factura', 'presupuesto', 'checklist'];
    docTypes.forEach((docType) => {

      const field = docTypeFieldMap[docType];
      const name = lic[field.nameField];
      if (name) {
        const expiryField = docTypeExpiryFieldMap[docType];
        const expDate = lic[expiryField] as string | null;
        if (expDate) {
          if (isExpiredByDate(expDate)) {
            hasExpired = true;
          } else if (isPendingByDate(expDate)) {
            hasPending = true;
          }
        }
      }
    });

    return { hasExpired, hasPending };
  };

  const totalLic = licenses.length;
  const expiredLic = licenses.filter((l) => getLicenseExpiryStatus(l).hasExpired).length;
  const pendingLic = licenses.filter((l) => {
    const status = getLicenseExpiryStatus(l);
    return !status.hasExpired && status.hasPending;
  }).length;

  const filteredLicenses = licenses.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.code && l.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const normalizeMachineName = (name: string) =>
    name.toUpperCase().replace(/\s+/g, ' ').trim();

  const sectionPlaceholders = sectionMachines[currentSection] || [];

  type DisplayRow = { machineName: string; license?: License };

  const visibleMachineRows: DisplayRow[] = sectionPlaceholders
    .filter((machineName) => 
      !deletedPlaceholders.some(
        (delName) => normalizeMachineName(delName) === normalizeMachineName(machineName)
      )
    )
    .map((machineName) => {
      const license = filteredLicenses.find(
        (lic) => normalizeMachineName(lic.name || '') === normalizeMachineName(machineName)
      );
      return { machineName, license };
    });

  const extraLicenseRows: DisplayRow[] = filteredLicenses
    .filter((lic) => !sectionPlaceholders.some(
      (machineName) => normalizeMachineName(lic.name || '') === normalizeMachineName(machineName)
    ))
    .map((lic) => ({
      machineName: lic.name || 'Sin nombre',
      license: lic
    }));

  const displayRows = [...visibleMachineRows, ...extraLicenseRows]
    .filter((row) => {
      if (selectedSedeFilter === 'TODAS') return true;
      return getRowSede(row) === selectedSedeFilter;
    })
    .sort((a, b) =>
      a.machineName.localeCompare(b.machineName, undefined, { numeric: true, sensitivity: 'base' })
    );

  const rowStatus = (lic?: License) => {
    if (!lic) return null;
    if (isExpiredByDate(lic.expiryDate)) return 'expired';
    if (isPendingByDate(lic.expiryDate)) return 'pending';
    return 'ok';
  };

  if (loading) {
    return (
      <MtoLoadingScreen 
        message="Cargando Registros Generales..." 
        submessage="Consultando licencias y carpetas técnicas de planta"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Modern ERP TopNavbar */}
      <MtoTopNavbar
        user={user}
        selectedSede={selectedSedeFilter}
        onSedeChange={(val) => setSelectedSedeFilter(val)}
        searchTerm={searchQuery}
        onSearchChange={(val) => setSearchQuery(val)}
        onOpenCreateTask={openCreateMachineModal}
        onLogout={handleLogout}
        mobileMenuOpen={mobileSidebarOpen}
        onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* App Body with Sidebar */}
      <div className="flex-1 flex min-h-[calc(100vh-3.5rem)]">
        <MtoSidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onToggleCollapse={handleToggleSidebar}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          userRole={user?.role}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 bg-[#080d1a] overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">

      
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Licencias y Permisos</h2>
            <p className="text-xs text-slate-400 font-light mt-1">Control de vigencia, fechas de vencimiento y renovación de autorizaciones legales.</p>
          </div>

          {user?.role !== 'VIEWER' && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={openCreateMachineModal}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-xs cursor-pointer border border-blue-400/30"
              >
                <FolderPlus className="w-4.5 h-4.5" />
                <span>Crear Máquina</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-[#0c1322] rounded-2xl border border-[#1e293b] p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Licencias</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{totalLic} <span className="text-xs font-normal text-slate-400">registros</span></p>
              <p className="text-[11px] text-cyan-400 mt-0.5">Sección {currentSection}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
              <FileCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-[#0c1322] rounded-2xl border border-[#1e293b] p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Licencias Vencidas</p>
              <p className={`text-2xl sm:text-3xl font-black mt-1 ${expiredLic > 0 ? 'text-rose-400' : 'text-white'}`}>{expiredLic} <span className="text-xs font-normal text-slate-400">críticas</span></p>
              <p className="text-[11px] text-rose-400 mt-0.5">{expiredLic > 0 ? 'Requiere atención urgente' : 'Sin alertas críticas'}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${expiredLic > 0 ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-pulse shadow-md shadow-rose-500/10' : 'bg-slate-800/60 border border-slate-700/60 text-slate-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-[#0c1322] rounded-2xl border border-[#1e293b] p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendientes por vencer</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{pendingLic} <span className="text-xs font-normal text-slate-400">próximos</span></p>
              <p className="text-[11px] text-amber-400 mt-0.5">Dentro de 30 días</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Secciones</h3>
          <div className="flex flex-wrap items-center gap-3">
            {sectionNames.map((section) => {
              const isActive = currentSection === section;

              // inactive styles per section
              const inactiveStyle = 'bg-[#121c33] border-slate-700/60 text-slate-400 hover:text-white hover:bg-[#182544]';

              // active styles per section
              const activeStyle = section === 'EQUIPOS'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20 border-cyan-400/40'
                : section === 'ELÉCTRICO'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/20 border-pink-400/40'
                  : 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-500/20 border-amber-400/40';

              const iconColor = isActive
                ? 'text-white'
                : section === 'EQUIPOS'
                  ? 'text-slate-900'
                  : section === 'ELÉCTRICO'
                    ? 'text-pink-500'
                    : 'text-amber-500';

              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => setCurrentSection(section)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${isActive ? activeStyle : `${inactiveStyle} hover:bg-opacity-90`}`}
                >
                  <Folder className={`w-5 h-5 ${iconColor}`} />
                  <span>{section}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6 relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4.5 h-4.5" />
          </div>
          <input
            type="text"
            placeholder="Buscar licencia por nombre, entidad o código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121c33] hover:bg-[#182544] border border-slate-700/80 rounded-2xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 text-xs sm:text-sm font-semibold transition-all shadow-md"
          />
        </div>

        <div className="bg-[#0b0f19] rounded-2xl border border-[#1e293b] overflow-hidden shadow-xl w-full max-w-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left border-collapse text-sm">
              <thead className="bg-[#0f172a] text-white shadow-sm">
                <tr className="text-[10px] tracking-[0.24em] uppercase font-bold border-b border-slate-800">
                  <th className="p-4 text-center border-r border-white/5">N°</th>
                  <th className="p-4 border-r border-white/5">NOMBRE/MAQUINA</th>
                  <th className="p-4 text-center border-r border-white/5">SEDE</th>
                  <th className="p-4 border-r border-white/5">DETALLES</th>
                  <th className="p-4 border-r border-white/5">CERTIFICADO</th>
                  <th className="p-4 border-r border-white/5">PROTOCOLO</th>
                  <th className="p-4 border-r border-white/5">INFORME TÉCNICO</th>
                  <th className="p-4 text-center border-r border-white/5">FACTURA</th>
                  <th className="p-4 text-center border-r border-white/5">PRESUPUESTO</th>
                  <th className="p-4 text-center border-r border-white/5">CHECK LIST</th>
                  <th className="p-4 text-center w-32">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-slate-400">
                      No hay máquinas ni licencias registradas en esta sección. Usa el botón "Crear Máquina" para comenzar.
                    </td>
                  </tr>
                ) : (
                  displayRows.map((row, index) => {
                    if (!row.license) {
                      return (
                        <tr key={`placeholder-${row.machineName}`} className="hover:bg-[#121c33]/40 transition-colors">
                          <td className="p-4 text-left align-top font-mono text-slate-400 text-xs">{index + 1}</td>
                          <td className="p-4 text-left align-top font-semibold text-slate-100 text-xs">{row.machineName}</td>
                          <td className="p-4 text-center align-top text-xs">
                            {(() => {
                              const s = getRowSede(row);
                              const badgeStyle = s === 'TRUJILLO'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : s === 'COCHERA'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
                              return (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border ${badgeStyle}`}>
                                  {s}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-4 text-left align-top text-slate-300 text-xs">
                            <button
                              type="button"
                              onClick={() => openDetailsModalForMachine(row.machineName)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-[#121c33] px-3 py-1.5 text-[11px] font-semibold text-cyan-400 hover:bg-[#182544] hover:text-cyan-300 transition cursor-pointer shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver
                            </button>
                          </td>
                          {(['certificado', 'protocolo', 'informeTecnico', 'factura', 'presupuesto', 'checklist'] as LicenseDocType[]).map((docType) => {
                            return (
                              <td key={docType} className="p-4 text-center align-top">
                                <div className="space-y-2">
                                  <span className="block text-[11px] text-slate-400">Sin archivo</span>
                                  {user?.role !== 'VIEWER' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUploadForPlaceholder(row.machineName, docType)}
                                      className="text-[11px] text-slate-300 hover:text-white font-semibold rounded-xl px-2.5 py-1 bg-[#121c33] hover:bg-[#182544] border border-slate-700/80 transition cursor-pointer shadow-xs"
                                    >
                                      Subir
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {user?.role !== 'VIEWER' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`¿Está seguro de eliminar la máquina "${row.machineName}" de la lista?`)) {
                                      handleDeletePlaceholder(row.machineName);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    const lic = row.license;
                    return (
                      <tr key={lic.id} className="hover:bg-[#121c33]/40 transition-colors">
                        <td className="p-4 text-left align-top font-mono text-slate-400 text-xs">{index + 1}</td>
                        <td className="p-4 text-left align-top font-semibold text-slate-100 text-xs">{lic.name || '-'}</td>
                        <td className="p-4 text-center align-top text-xs">
                          {(() => {
                            const s = getRowSede(row);
                            const badgeStyle = s === 'TRUJILLO'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : s === 'COCHERA'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
                            return (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border ${badgeStyle}`}>
                                {s}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-4 text-left align-top text-slate-300 text-xs">
                          <button
                            type="button"
                            onClick={() => openDetailsModalForMachine(lic.name, lic)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-[#121c33] px-3 py-1.5 text-[11px] font-semibold text-cyan-400 hover:bg-[#182544] hover:text-cyan-300 transition cursor-pointer shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver
                          </button>
                        </td>
                        {(['certificado', 'protocolo', 'informeTecnico', 'factura', 'presupuesto', 'checklist'] as LicenseDocType[]).map((docType) => {
                          const field = docTypeFieldMap[docType];
                          const name = lic[field.nameField] as string | null;
                          const expiryField = docTypeExpiryFieldMap[docType];
                          const specificExpiryDate = lic[expiryField] as string | null;
                          const documentState = getDocumentState(specificExpiryDate);
                          const stateStyles = {
                            active: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
                            dueSoon: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
                            expired: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
                            none: 'bg-slate-800/40 text-slate-500 border-slate-700/50'
                          };
                          return (
                            <td key={docType} className="p-4 text-center align-top">
                              <div className="space-y-2">
                                {name ? (
                                  <>
                                    <div className={`inline-flex items-center justify-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${stateStyles[documentState.variant as keyof typeof stateStyles]}`}>
                                      {documentState.variant === 'active' && <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />}
                                      {documentState.variant === 'dueSoon' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                                      {documentState.variant === 'expired' && <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
                                      <span>{documentState.label}</span>
                                    </div>
                                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{specificExpiryDate || '-'}</p>
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => openFilePreview(lic.id, name, docType)}
                                        className="inline-flex items-center justify-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium bg-[#131d33] hover:bg-[#182544] px-2.5 py-1 rounded-xl border border-slate-700/80 transition shadow-xs"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-brand-500" />
                                        <span className="truncate max-w-[7rem]">{name}</span>
                                      </button>
                                      {user?.role !== 'VIEWER' && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteFile(lic.id, docType)}
                                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200"
                                          title="Eliminar archivo"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <span className="block text-[11px] text-slate-400">Sin archivo</span>
                                )}
                                {user?.role !== 'VIEWER' && (
                                  <button
                                    type="button"
                                    onClick={() => openDocUploadModal(lic.id, docType, specificExpiryDate || '')}
                                    className="text-[11px] text-slate-300 hover:text-white font-semibold rounded-xl px-2.5 py-1 bg-[#121c33] hover:bg-[#182544] border border-slate-700/80 transition cursor-pointer shadow-xs"
                                  >
                                    {name ? 'Editar' : 'Subir'}
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {user?.role !== 'VIEWER' && (
                              <button
                                onClick={() => {
                                  if (confirm(`¿Está seguro de eliminar la máquina "${lic.name}" de la lista?`)) {
                                    fetch(`/api/licencias/${lic.id}`, { method: 'DELETE' })
                                      .then((res) => res.json())
                                      .then((data) => {
                                        if (data.success) {
                                          handleDeletePlaceholder(lic.name);
                                          fetchLicenses();
                                        }
                                      });
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0d1527] rounded-3xl border border-slate-700/80 shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">{editingId ? 'Editar Registro de Autorización' : 'Registrar Nueva Licencia / Permiso'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipo</label>
                  <input
                    type="text"
                    value={detailEquipo}
                    onChange={(e) => setDetailEquipo(e.target.value)}
                    placeholder="Equipo"
                    className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marca</label>
                  <input
                    type="text"
                    value={detailMarca}
                    onChange={(e) => setDetailMarca(e.target.value)}
                    placeholder="Marca"
                    className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modelo</label>
                  <input
                    type="text"
                    value={detailModelo}
                    onChange={(e) => setDetailModelo(e.target.value)}
                    placeholder="Modelo"
                    className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Serie</label>
                  <input
                    type="text"
                    value={detailSerie}
                    onChange={(e) => setDetailSerie(e.target.value)}
                    placeholder="Serie"
                    className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Capacidad</label>
                  <input
                    type="text"
                    value={detailCapacidad}
                    onChange={(e) => setDetailCapacidad(e.target.value)}
                    placeholder="Capacidad"
                    className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</label>
                  <input
                    type="text"
                    value={detailEstado}
                    onChange={(e) => setDetailEstado(e.target.value)}
                    placeholder="Estado"
                    className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sede</label>
                  <select
                    value={detailSede}
                    onChange={(e) => setDetailSede(e.target.value)}
                    className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 cursor-pointer"
                  >
                    <option value="">-- Seleccionar Sede --</option>
                    {SEDE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.shortLabel}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nro Procesos x día</label>
                  <input
                    type="text"
                    value={detailProcesos}
                    onChange={(e) => setDetailProcesos(e.target.value)}
                    placeholder="Nro Procesos x día"
                    className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2 px-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {isDocUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0d1527] rounded-3xl border border-slate-700/80 shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-150 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-base">Registrar Nueva Licencia / Permiso</h3>
                <p className="text-xs text-slate-500 mt-1">Subir {docTypeLabels[currentDocUploadType]}</p>
              </div>
              <button
                onClick={closeDocUploadModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleDocUpload} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seleccionar Archivo (PDF, JPG, PNG)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > 50 * 1024 * 1024) {
                      alert('El archivo excede el límite máximo permitido de 50MB.');
                      e.target.value = '';
                      setUploadFile(null);
                    } else if (file) {
                      setUploadFile(file);
                    } else {
                      setUploadFile(null);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  required={!currentDocUploadLicenseId || !(licenses.find(l => l.id === currentDocUploadLicenseId)?.[docTypeFieldMap[currentDocUploadType].nameField])}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeDocUploadModal}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || (!uploadFile && !currentDocUploadLicenseId)}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Guardando...' : (currentDocUploadLicenseId && (licenses.find(l => l.id === currentDocUploadLicenseId)?.[docTypeFieldMap[currentDocUploadType].nameField]) ? 'Guardar Cambios' : 'Subir Archivo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMachineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0d1527] rounded-3xl border border-slate-700/80 shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-150 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">Crear Máquina</h3>
              <button
                onClick={() => setIsMachineModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleSaveMachine} className="space-y-4">
              {machineError && (
                <div className="text-xs text-rose-700 bg-rose-50 rounded-2xl p-3 border border-rose-200">
                  {machineError}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sede</label>
                <select
                  value={newMachineSede}
                  onChange={(e) => setNewMachineSede(e.target.value)}
                  className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                >
                  {SEDE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0f172a] text-slate-200">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre de la Máquina</label>
                <input
                  type="text"
                  value={newMachineName}
                  onChange={(e) => setNewMachineName(e.target.value)}
                  placeholder="Ej. GRUPO ELECTROGENO COCHERA"
                  className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMachineModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Guardar Máquina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailsModalOpen && detailsModalLicense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0d1527] rounded-3xl border border-slate-700/80 shadow-2xl p-6 w-full max-w-lg animate-in zoom-in-95 duration-150 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-base">Detalles de la Máquina</h3>
                <p className="text-xs text-cyan-400 font-semibold mt-1">{detailsModalLicense.name}</p>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm pb-4 max-h-[50vh] overflow-y-auto pr-1">
              {(() => {
                const details = parseDetails(detailsModalLicense.details);
                const inferredSede = detailsModalLicense.name.toUpperCase().includes('TRUJILLO') ? 'Trujillo' : detailsModalLicense.name.toUpperCase().includes('COCHERA') ? 'Cochera' : 'Lima';
                const items = [
                  { label: 'Equipo', value: details.equipo || detailsModalLicense.name },
                  { label: 'Marca', value: details.marca },
                  { label: 'Modelo', value: details.modelo },
                  { label: 'Serie / Identificación', value: details.serie },
                  { label: 'Capacidad', value: details.capacidad },
                  { label: 'Estado', value: details.estado || 'OPERATIVO' },
                  { label: 'Sede', value: formatSedeName(details.sede) !== 'Todas' ? formatSedeName(details.sede) : inferredSede },
                  { label: 'Procesos', value: details.procesos },
                  { label: 'Garantía', value: details.garantia }
                ];
                return items.map((item) => (
                  <div key={item.label} className="bg-[#131d33] p-3 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{item.label}</span>
                    <span className="font-semibold text-slate-200 mt-1 block whitespace-pre-wrap text-xs">
                      {item.value || <span className="text-slate-500 font-normal italic">No registrado</span>}
                    </span>
                  </div>
                ));
              })()}
            </div>

            {/* Document history section */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Historial de Documentos
              </h4>
              {licenseFilesLoading ? (
                <div className="text-xs text-slate-400 py-3 text-center">Cargando archivos...</div>
              ) : licenseFiles.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center bg-[#131d33]/50 rounded-xl border border-slate-800">
                  No se encontraron archivos para esta máquina.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {licenseFiles.map((f, fIdx) => {
                    const fileName = f.fileName || '';
                    const displayName = f.docTypeName || (f.originalName && f.originalName !== f.fileName ? f.originalName : null) || 'Documento Adjunto';
                    const originalName = f.originalName || fileName;
                    const ext = (originalName.split('.').pop() || fileName.split('.').pop() || '').toLowerCase();
                    const previewable = ['pdf', 'jpg', 'jpeg', 'png', 'gif'];
                    const fileUrl = `/api/licencias/archivo?file=${encodeURIComponent(fileName)}`;

                    return (
                      <div key={fileName || fIdx} className="flex items-center justify-between bg-[#131d33] border border-slate-700/70 rounded-xl p-3 hover:border-slate-600 transition-colors">
                        <div className="min-w-0 pr-3">
                          <div className="font-semibold text-xs text-cyan-300 truncate flex items-center gap-1.5">
                            <FileCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{displayName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {originalName !== displayName && <span className="text-slate-300 mr-2">{originalName}</span>}
                            <span>{f.mtime ? new Date(f.mtime).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : ''}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {previewable.includes(ext) ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewUrl(fileUrl);
                                setPreviewName(originalName);
                                setPreviewExt(ext);
                                setIsPreviewOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Ver
                            </button>
                          ) : (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                            >
                              Abrir
                            </a>
                          )}
                          <a
                            href={fileUrl}
                            download={originalName}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                          >
                            Descargar
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              {user?.role !== 'VIEWER' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    openEditModal(detailsModalLicense);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreviewOpen && previewUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-5xl w-full max-h-[90vh]">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
              <div>
                <p className="font-semibold text-slate-900">Vista previa del archivo</p>
                <p className="text-xs text-slate-500 truncate max-w-xl">{previewName}</p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-full p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Cerrar vista previa"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-950 text-white min-h-[60vh]">
              {previewExt === '.pdf' ? (
                <iframe src={previewUrl} className="w-full h-[70vh]" title="Vista previa PDF" />
              ) : (previewExt === '.jpg' || previewExt === '.jpeg' || previewExt === '.png' || previewExt === '.gif') ? (
                <img src={previewUrl} alt={previewName || 'Archivo'} className="w-full h-[70vh] object-contain bg-slate-950" />
              ) : (
                <div className="p-8 text-center text-slate-200">
                  <p className="mb-3 text-sm">Vista previa no disponible para este tipo de archivo.</p>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl">
                    Abrir archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
