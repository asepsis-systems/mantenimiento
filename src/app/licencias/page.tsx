'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const sectionNames = ['EQUIPOS', 'COMPLEMENTARIO1', 'COMPLEMENTARIO2'] as const;

type SectionName = (typeof sectionNames)[number];

const sectionMachines: Record<SectionName, string[]> = {
  EQUIPOS: [
    'AUTOCLAVE V1',
    'AUTOCLAVE V2',
    'AUTOCLAVE V3',
    'AUTOCLAVE V4',
    'AUTOCLAVE V5',
    'AUTOCLAVE V6',
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
    'OE 4 XL  Trujillo',
    'OE 5 XL  Trujillo',
    'PLASMA P1',
    'PLASMA P2',
    'PLASMA P3',
    'FORMALDEHIDO F01',
    'LAVADORA',
    'CALDERA',
    'COMPRESOR 10 HP',
    'COMPRESOR 25 HP',
    'AUTOCLAVE V-2   Trujillo',
    'AUTOCLAVE V-5   Trujillo'
  ],
  COMPLEMENTARIO1: [],
  COMPLEMENTARIO2: []
};

const parseDetails = (details: string | null): Record<string, string> => {
  if (!details) return {};
  try {
    return JSON.parse(details);
  } catch (e) {
    return {};
  }
};

export default function LicensesPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [carpetas, setCarpetas] = useState<any[]>([]);
  const [currentSection, setCurrentSection] = useState<SectionName>('EQUIPOS');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [isDocUploadModalOpen, setIsDocUploadModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEntity, setFormEntity] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formStatus, setFormStatus] = useState('VIGENTE');
  const [detailEquipo, setDetailEquipo] = useState('');
  const [detailMarca, setDetailMarca] = useState('');
  const [detailModelo, setDetailModelo] = useState('');
  const [detailSerie, setDetailSerie] = useState('');
  const [detailCapacidad, setDetailCapacidad] = useState('');
  const [detailEstado, setDetailEstado] = useState('');
  const [detailSede, setDetailSede] = useState('');
  const [detailProcesos, setDetailProcesos] = useState('');
  const [detailGarantia, setDetailGarantia] = useState('');

  const [newMachineName, setNewMachineName] = useState('');
  const [machineError, setMachineError] = useState('');

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [currentDocUploadLicenseId, setCurrentDocUploadLicenseId] = useState<string | null>(null);
  const [currentDocUploadType, setCurrentDocUploadType] = useState<LicenseDocType>('certificado');
  const [uploadEntity, setUploadEntity] = useState('');
  const [uploadCode, setUploadCode] = useState('');
  const [uploadIssueDate, setUploadIssueDate] = useState('');
  const [uploadExpiryDate, setUploadExpiryDate] = useState('');
  const [uploadStatus, setUploadStatus] = useState('VIGENTE');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewExt, setPreviewExt] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsModalLicense, setDetailsModalLicense] = useState<License | null>(null);
  const [isDetailsEditMode, setIsDetailsEditMode] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

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
    setFormEntity('');
    setFormCode('');
    setFormIssueDate('');
    setFormExpiryDate('');
    setFormStatus('VIGENTE');
    setDetailEquipo('');
    setDetailMarca('');
    setDetailModelo('');
    setDetailSerie('');
    setDetailCapacidad('');
    setDetailEstado('');
    setDetailSede('');
    setDetailProcesos('');
    setDetailGarantia('');
    setError('');
    setIsModalOpen(true);
  };

  const openCreateMachineModal = () => {
    setNewMachineName('');
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
          estado: '',
          sede: '',
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

  const openDetailsModalForMachine = (machineName: string, lic?: License) => {
    if (lic) {
      setDetailsModalLicense(lic);
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
    setIsDetailsModalOpen(true);
    setIsDetailsEditMode(false);
  };

  const openEditModal = (lic: License) => {
    const parsedDetails = parseDetails(lic.details);

    setEditingId(lic.id || null);
    setFormName(lic.name);
    setFormEntity(lic.entity);
    setFormCode(lic.code || '');
    setFormIssueDate(lic.issueDate);
    setFormExpiryDate(lic.expiryDate);
    setFormStatus(lic.status);
    setDetailEquipo(parsedDetails.equipo || '');
    setDetailMarca(parsedDetails.marca || '');
    setDetailModelo(parsedDetails.modelo || '');
    setDetailSerie(parsedDetails.serie || '');
    setDetailCapacidad(parsedDetails.capacidad || '');
    setDetailEstado(parsedDetails.estado || '');
    setDetailSede(parsedDetails.sede || '');
    setDetailProcesos(parsedDetails.procesos || '');
    setDetailGarantia(parsedDetails.garantia || '');
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
    const ext = getExtension(filename);
    const previewable = ['.pdf', '.jpg', '.jpeg', '.png', '.gif'];

    if (!filename || !previewable.includes(ext)) {
      window.open(url, '_blank');
      return;
    }

    setPreviewUrl(url);
    setPreviewName(filename);
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
    if (!formEntity.trim() || !formIssueDate.trim() || !formExpiryDate.trim()) {
      setError('Entidad, Emisión y Vencimiento son obligatorios.');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const carpetaId = await ensureSectionFolderId();
      const payload = {
        name: formName.trim() || currentSection,
        entity: formEntity.trim(),
        code: formCode.trim() || null,
        issueDate: formIssueDate.trim(),
        expiryDate: formExpiryDate.trim(),
        status: formStatus,
        details: JSON.stringify({
          equipo: detailEquipo.trim(),
          marca: detailMarca.trim(),
          modelo: detailModelo.trim(),
          serie: detailSerie.trim(),
          capacidad: detailCapacidad.trim(),
          estado: detailEstado.trim(),
          sede: detailSede.trim(),
          procesos: detailProcesos.trim(),
          garantia: detailGarantia.trim()
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
    setUploadEntity(license?.entity || '');
    setUploadCode(license?.code || '');
    setUploadIssueDate(license?.issueDate || '');
    setUploadExpiryDate(expiryDate || license?.expiryDate || '');
    setUploadStatus(license?.status || 'VIGENTE');
    setUploadFile(null);
    setIsDocUploadModalOpen(true);
  };

  const closeDocUploadModal = () => {
    setCurrentDocUploadLicenseId(null);
    setCurrentDocUploadType('certificado');
    setUploadEntity('');
    setUploadCode('');
    setUploadIssueDate('');
    setUploadExpiryDate('');
    setUploadStatus('VIGENTE');
    setUploadFile(null);
    setIsDocUploadModalOpen(false);
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !currentDocUploadLicenseId) return;

    setActionLoading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('docType', currentDocUploadType);
    formData.append('id', currentDocUploadLicenseId);
    if (uploadEntity.trim()) {
      formData.append('entity', uploadEntity.trim());
    }
    if (uploadCode.trim()) {
      formData.append('code', uploadCode.trim());
    }
    if (uploadIssueDate.trim()) {
      formData.append('issueDate', uploadIssueDate.trim());
    }
    if (uploadExpiryDate.trim()) {
      formData.append('expiryDate', uploadExpiryDate.trim());
    }
    if (uploadStatus.trim()) {
      formData.append('status', uploadStatus.trim());
    }

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

  const visibleMachineRows: DisplayRow[] = sectionPlaceholders.map((machineName) => {
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

  const displayRows = [...visibleMachineRows, ...extraLicenseRows];

  const rowStatus = (lic?: License) => {
    if (!lic) return null;
    if (isExpiredByDate(lic.expiryDate)) return 'expired';
    if (isPendingByDate(lic.expiryDate)) return 'pending';
    return 'ok';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white shadow-xl shadow-slate-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-1 shadow-md shrink-0 flex items-center justify-center w-12 h-10">
              <img src="/logo2.jpg" alt="Asepsis Logo" className="h-8 w-auto object-contain rounded-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Mantenimiento</h1>
              <p className="text-xs text-slate-400 font-light">Control de Reportes de Mantenimiento</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 shrink-0">
            <button
              onClick={() => router.push('/')}
              className="py-1.5 px-3.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
            >
              Reporte Semanal
            </button>
            <button
              onClick={() => router.push('/repuestos')}
              className="py-1.5 px-3.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
            >
              Repuestos
            </button>
            <button
              onClick={() => router.push('/licencias')}
              className="py-1.5 px-3.5 rounded-xl text-xs font-semibold text-white bg-white/10 transition-all"
            >
              Licencias
            </button>
          </nav>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl py-1.5 px-3">
                <UserIcon className="w-4 h-4 text-brand-400" />
                <div className="text-left">
                  <p className="text-xs font-semibold leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400 leading-none capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
            )}

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/users')}
                className="py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-all active:scale-95 flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4 text-brand-400" />
                <span>Gestionar Usuarios</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 transition-all active:scale-95"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-screen-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Licencias y Permisos</h2>
            <p className="text-sm text-slate-500">Control de vigencia, fechas de vencimiento y renovación de autorizaciones legales.</p>
          </div>

          {user?.role !== 'VIEWER' && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={openCreateMachineModal}
                className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-brand-600/10 active:scale-[0.98] transition-all text-xs cursor-pointer"
              >
                <FolderPlus className="w-4.5 h-4.5" />
                <span>Crear Máquina</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex items-center gap-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Total Licencias</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalLic} registros</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex items-center gap-4 shadow-xs">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${expiredLic > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Licencias Vencidas</p>
              <p className={`text-2xl font-bold mt-0.5 ${expiredLic > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{expiredLic} críticas</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex items-center gap-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Pendientes por vencer</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{pendingLic} próximos</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Secciones</h3>
          <div className="flex flex-wrap items-center gap-3">
            {sectionNames.map((section) => {
              const isActive = currentSection === section;
              const style = section === 'EQUIPOS'
                ? 'bg-slate-900 text-white border-slate-900'
                : section === 'COMPLEMENTARIO1'
                  ? 'bg-pink-50 border-pink-200 text-pink-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700';

              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => setCurrentSection(section)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-slate-900 text-white shadow-sm border-slate-900' : `${style} hover:bg-opacity-90`}`}
                >
                  <Folder className={`w-5 h-5 ${isActive ? 'text-white' : section === 'EQUIPOS' ? 'text-slate-900' : section === 'COMPLEMENTARIO1' ? 'text-pink-500' : 'text-amber-500'}`} />
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
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 text-sm transition-all"
          />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs w-full max-w-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="p-4">N°</th>
                  <th className="p-4">NOMBRE/MAQUINA</th>
                  <th className="p-4">DETALLES</th>
                  <th className="p-4">CERTIFICADO</th>
                  <th className="p-4">PROTOCOLO</th>
                  <th className="p-4">INFORME TÉCNICO</th>
                  <th className="p-4 text-center">FACTURA</th>
                  <th className="p-4 text-center">PRESUPUESTO</th>
                  <th className="p-4 text-center">CHECK LIST</th>
                  <th className="p-4 text-center w-32">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400">
                      No hay máquinas ni licencias registradas en esta sección. Usa el botón "Crear Máquina" para comenzar.
                    </td>
                  </tr>
                ) : (
                  displayRows.map((row, index) => {
                    if (!row.license) {
                      return (
                        <tr key={`placeholder-${row.machineName}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-left align-top font-mono text-slate-700">{index + 1}</td>
                          <td className="p-4 text-left align-top font-semibold text-slate-800">{row.machineName}</td>
                          <td className="p-4 text-left align-top text-slate-600">
                            <button
                              type="button"
                              onClick={() => openDetailsModalForMachine(row.machineName)}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver
                            </button>
                          </td>
                          <td className="p-4 text-center text-slate-400">-</td>
                          <td className="p-4 text-center text-slate-400">-</td>
                          <td className="p-4 text-center text-slate-400">-</td>
                          <td className="p-4 text-center text-slate-400">-</td>
                          <td className="p-4 text-center text-slate-400">-</td>
                          <td className="p-4 text-center text-slate-400">-</td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => openCreateModal(row.machineName)}
                              className="inline-flex items-center justify-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-100 transition cursor-pointer"
                            >
                              Crear
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    const lic = row.license;
                    return (
                      <tr key={lic.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-left align-top font-mono text-slate-700">{index + 1}</td>
                        <td className="p-4 text-left align-top font-semibold text-slate-800">{lic.name || '-'}</td>
                        <td className="p-4 text-left align-top text-slate-600">
                          <button
                            type="button"
                            onClick={() => openDetailsModalForMachine(lic.name, lic)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
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
                            active: 'bg-sky-100 text-sky-700 border-sky-200',
                            dueSoon: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                            expired: 'bg-rose-100 text-rose-700 border-rose-200',
                            none: 'bg-slate-100 text-slate-500 border-slate-200'
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
                                    <button
                                      type="button"
                                      onClick={() => openFilePreview(lic.id, name, docType)}
                                      className="inline-flex items-center justify-center gap-2 text-[11px] text-brand-600 hover:text-brand-700 font-medium hover:underline bg-brand-50 px-2 py-1 rounded-md border border-brand-100"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-brand-500" />
                                      <span className="truncate max-w-[7rem]">{name}</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="block text-[11px] text-slate-400">Sin archivo</span>
                                )}
                                {user?.role !== 'VIEWER' && (
                                  <button
                                    type="button"
                                    onClick={() => openDocUploadModal(lic.id, docType, specificExpiryDate || '')}
                                    className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold rounded-xl px-2 py-1 bg-slate-100 hover:bg-slate-200 transition"
                                  >
                                    {name ? 'Reemplazar' : 'Subir'}
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {user?.role !== 'VIEWER' && (
                              <>
                                <button
                                  onClick={() => openEditModal(lic)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Está seguro de eliminar la licencia/permiso "${lic.name}"?`)) {
                                      fetch(`/api/licencias/${lic.id}`, { method: 'DELETE' })
                                        .then((res) => res.json())
                                        .then((data) => {
                                          if (data.success) fetchLicenses();
                                        });
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">{editingId ? 'Editar Registro de Autorización' : 'Registrar Nueva Licencia / Permiso'}</h3>
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
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entidad Emisora</label>
                  <input
                    type="text"
                    value={formEntity}
                    onChange={(e) => setFormEntity(e.target.value)}
                    placeholder="ej. Diresa / Municipalidad"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">N° de Documento</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="LIC-2026-098"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">F. de Emisión</label>
                  <input
                    type="text"
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">F. de Vencimiento</label>
                  <input
                    type="text"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipo</label>
                  <input
                    type="text"
                    value={detailEquipo}
                    onChange={(e) => setDetailEquipo(e.target.value)}
                    placeholder="Equipo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marca</label>
                  <input
                    type="text"
                    value={detailMarca}
                    onChange={(e) => setDetailMarca(e.target.value)}
                    placeholder="Marca"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Serie</label>
                  <input
                    type="text"
                    value={detailSerie}
                    onChange={(e) => setDetailSerie(e.target.value)}
                    placeholder="Serie"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</label>
                  <input
                    type="text"
                    value={detailEstado}
                    onChange={(e) => setDetailEstado(e.target.value)}
                    placeholder="Estado"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sede</label>
                  <input
                    type="text"
                    value={detailSede}
                    onChange={(e) => setDetailSede(e.target.value)}
                    placeholder="Sede"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nro Procesos x día</label>
                  <input
                    type="text"
                    value={detailProcesos}
                    onChange={(e) => setDetailProcesos(e.target.value)}
                    placeholder="Nro Procesos x día"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Garantía/Contrato</label>
                <input
                  type="text"
                  value={detailGarantia}
                  onChange={(e) => setDetailGarantia(e.target.value)}
                  placeholder="Garantía/Contrato"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de Vigencia</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  >
                    <option value="VIGENTE">VIGENTE</option>
                    <option value="VENCIDO">VENCIDO</option>
                    <option value="EN_TRAMITE">EN TRÁMITE</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sección</label>
                  <input
                    type="text"
                    value={currentSection}
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-500 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
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
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Registrar Nueva Licencia / Permiso</h3>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entidad Emisora</label>
                  <input
                    type="text"
                    value={uploadEntity}
                    onChange={(e) => setUploadEntity(e.target.value)}
                    placeholder="ej. Diresa / Municipalidad"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">N° de Documento</label>
                  <input
                    type="text"
                    value={uploadCode}
                    onChange={(e) => setUploadCode(e.target.value)}
                    placeholder="LIC-2026-098"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">F. de Emisión</label>
                  <input
                    type="text"
                    value={uploadIssueDate}
                    onChange={(e) => setUploadIssueDate(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">F. de Vencimiento</label>
                  <input
                    type="text"
                    value={uploadExpiryDate}
                    onChange={(e) => setUploadExpiryDate(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de Vigencia</label>
                  <select
                    value={uploadStatus}
                    onChange={(e) => setUploadStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  >
                    <option value="VIGENTE">VIGENTE</option>
                    <option value="VENCIDO">VENCIDO</option>
                    <option value="EN_TRAMITE">EN TRÁMITE</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sección</label>
                  <input
                    type="text"
                    value={currentSection}
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-500 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seleccionar Archivo (PDF, JPG, PNG)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setUploadFile(e.target.files[0]);
                    } else {
                      setUploadFile(null);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeDocUploadModal}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !uploadFile}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Subiendo...' : 'Subir Archivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMachineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Crear Máquina</h3>
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de la Máquina</label>
                <input
                  type="text"
                  value={newMachineName}
                  onChange={(e) => setNewMachineName(e.target.value)}
                  placeholder="Ej. AUTOCLAVE V7"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMachineModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
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
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 w-full max-w-lg animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Detalles de la Máquina</h3>
                <p className="text-xs text-brand-600 font-semibold mt-1">{detailsModalLicense.name}</p>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm pb-4 max-h-[60vh] overflow-y-auto pr-1">
              {(() => {
                const details = parseDetails(detailsModalLicense.details);
                const items = [
                  { label: 'Equipo', value: details.equipo },
                  { label: 'Marca', value: details.marca },
                  { label: 'Modelo', value: details.modelo },
                  { label: 'Serie / Identificación', value: details.serie },
                  { label: 'Capacidad', value: details.capacidad },
                  { label: 'Estado', value: details.estado },
                  { label: 'Sede', value: details.sede },
                  { label: 'Procesos', value: details.procesos },
                  { label: 'Garantía', value: details.garantia }
                ];
                return items.map((item) => (
                  <div key={item.label} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{item.label}</span>
                    <span className="font-semibold text-slate-700 mt-1 block whitespace-pre-wrap">{item.value || <span className="text-slate-300 font-normal">No registrado</span>}</span>
                  </div>
                ));
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              {user?.role !== 'VIEWER' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    openEditModal(detailsModalLicense);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
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
