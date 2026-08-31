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
  'ELÉCTRICO': [],
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
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<'TODAS' | 'LIMA' | 'TRUJILLO'>('TODAS');
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

  // Files history for license details
  const [licenseFiles, setLicenseFiles] = useState<any[]>([]);
  const [licenseFilesLoading, setLicenseFilesLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [deletedPlaceholders, setDeletedPlaceholders] = useState<string[]>([]);

  // State variables for Electric section Google Drive file manager
  const [loadingElectric, setLoadingElectric] = useState(false);
  const [electricParentId, setElectricParentId] = useState<string | null>(null);
  const [electricFolders, setElectricFolders] = useState<any[]>([]);
  const [electricFiles, setElectricFiles] = useState<any[]>([]);
  const [electricPath, setElectricPath] = useState<Array<{ id: string; nombre: string }>>([]);
  const [electricViewMode, setElectricViewMode] = useState<'grid' | 'list'>('grid');
  
  const [isElectricFolderModalOpen, setIsElectricFolderModalOpen] = useState(false);
  const [isElectricRenameModalOpen, setIsElectricRenameModalOpen] = useState(false);
  const [electricNewFolderName, setElectricNewFolderName] = useState('');
  
  const [electricRenameId, setElectricRenameId] = useState<string | null>(null);
  const [electricRenameType, setElectricRenameType] = useState<'folder' | 'file'>('folder');
  const [electricRenameName, setElectricRenameName] = useState('');
  const [electricSearchQuery, setElectricSearchQuery] = useState('');

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const fetchElectricContents = async () => {
    try {
      setLoadingElectric(true);
      const parentQuery = electricParentId ? `?parentId=${electricParentId}` : '';
      const res = await fetch(`/api/licencias/electrico/carpetas${parentQuery}`);
      const data = await res.json();
      if (data.success) {
        setElectricFolders(data.folders || []);
        setElectricFiles(data.files || []);
        setElectricPath(data.path || []);
      }
    } catch (err) {
      console.error('Error fetching electric content:', err);
    } finally {
      setLoadingElectric(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (user?.role === 'VIEWER') return;
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (user?.role === 'VIEWER') return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadElectricFile(e.dataTransfer.files[0]);
    }
  };

  const openElectricFilePreview = (file: any) => {
    const url = `/api/licencias/electrico/archivos?id=${file.id}`;
    const ext = file.extension.toLowerCase();
    setPreviewUrl(url);
    setPreviewName(file.nombre);
    setPreviewExt(ext);
    setIsPreviewOpen(true);
  };

  const handleGoBack = () => {
    if (electricPath.length <= 1) {
      setElectricParentId(null);
    } else {
      const parentFolder = electricPath[electricPath.length - 2];
      setElectricParentId(parentFolder.id);
    }
  };

  useEffect(() => {
    if (currentSection === 'ELÉCTRICO') {
      fetchElectricContents();
    }
  }, [currentSection, electricParentId]);

  const handleCreateElectricFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!electricNewFolderName.trim()) return;
    try {
      const res = await fetch('/api/licencias/electrico/carpetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: electricNewFolderName.trim(),
          parentId: electricParentId,
          usuarioCreacion: user?.name || user?.username || 'Sistema'
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsElectricFolderModalOpen(false);
        setElectricNewFolderName('');
        fetchElectricContents();
      } else {
        alert(data.error || 'Error al crear la carpeta.');
      }
    } catch (err) {
      console.error('Error creating electric folder:', err);
    }
  };

  const handleUploadElectricFile = async (file: File) => {
    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      if (electricParentId) {
        formData.append('parentId', electricParentId);
      }
      formData.append('usuarioSubida', user?.name || user?.username || 'Sistema');

      const res = await fetch('/api/licencias/electrico/archivos', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        fetchElectricContents();
      } else {
        alert(data.error || 'Error al subir el archivo.');
      }
    } catch (err) {
      console.error('Error uploading electric file:', err);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteElectricFolder = async (id: string, name: string) => {
    if (!confirm(`¿Está seguro de eliminar la carpeta "${name}"? Se eliminarán todas las subcarpetas y archivos dentro.`)) return;
    try {
      const res = await fetch(`/api/licencias/electrico/carpetas?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchElectricContents();
      } else {
        alert(data.error || 'Error al eliminar la carpeta.');
      }
    } catch (err) {
      console.error('Error deleting electric folder:', err);
    }
  };

  const handleDeleteElectricFile = async (id: string, name: string) => {
    if (!confirm(`¿Está seguro de eliminar el archivo "${name}"?`)) return;
    try {
      const res = await fetch(`/api/licencias/electrico/archivos?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchElectricContents();
      } else {
        alert(data.error || 'Error al eliminar el archivo.');
      }
    } catch (err) {
      console.error('Error deleting electric file:', err);
    }
  };

  const handleRenameElectricItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!electricRenameId || !electricRenameName.trim()) return;
    try {
      const endpoint = electricRenameType === 'folder' ? 'carpetas' : 'archivos';
      const res = await fetch(`/api/licencias/electrico/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: electricRenameId,
          nuevoNombre: electricRenameName.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsElectricRenameModalOpen(false);
        setElectricRenameId(null);
        setElectricRenameName('');
        fetchElectricContents();
      } else {
        alert(data.error || 'Error al renombrar el elemento.');
      }
    } catch (err) {
      console.error('Error renaming item:', err);
    }
  };

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
    setFormEntity('');
    setFormCode('');
    setFormIssueDate('');
    setFormExpiryDate('');
    setFormStatus('VIGENTE');
    setDetailEquipo(defaultName);
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

  const filteredLicenses = licenses.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.code && l.code.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedSedeFilter !== 'TODAS') {
      const details = parseDetails(l.details);
      let sede = (details.sede || '').toUpperCase().trim();
      if (!sede) {
        sede = (l.name || '').toUpperCase().includes('TRUJILLO') ? 'TRUJILLO' : 'LIMA';
      }
      
      const isTrujillo = sede.includes('TRUJILLO');
      if (selectedSedeFilter === 'TRUJILLO' && !isTrujillo) return false;
      if (selectedSedeFilter === 'LIMA' && isTrujillo) return false;
    }

    return true;
  });

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
    })
    .filter((row) => {
      if (selectedSedeFilter === 'TODAS') return true;
      if (row.license) return true;
      const isTrujillo = row.machineName.toUpperCase().includes('TRUJILLO');
      if (selectedSedeFilter === 'TRUJILLO') return isTrujillo;
      if (selectedSedeFilter === 'LIMA') return !isTrujillo;
      return true;
    });

  const extraLicenseRows: DisplayRow[] = filteredLicenses
    .filter((lic) => !sectionPlaceholders.some(
      (machineName) => normalizeMachineName(lic.name || '') === normalizeMachineName(machineName)
    ))
    .map((lic) => ({
      machineName: lic.name || 'Sin nombre',
      license: lic
    }));

  const displayRows = [...visibleMachineRows, ...extraLicenseRows].sort((a, b) =>
    a.machineName.localeCompare(b.machineName, undefined, { numeric: true, sensitivity: 'base' })
  );

  const rowStatus = (lic?: License) => {
    if (!lic) return null;
    if (isExpiredByDate(lic.expiryDate)) return 'expired';
    if (isPendingByDate(lic.expiryDate)) return 'pending';
    return 'ok';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white shadow-xl shadow-slate-950/10 sticky top-0 z-[40]">
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
              className="py-1.5 px-4.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Reporte Semanal
            </button>
            <button
              onClick={() => router.push('/repuestos')}
              className="py-1.5 px-4.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Repuestos
            </button>
            <button
              onClick={() => router.push('/licencias')}
              className="py-1.5 px-4.5 rounded-xl text-sm font-bold text-white bg-white/10 transition-all cursor-pointer hover:bg-white/15"
            >
              Registros Generales
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
            <h2 className="text-2xl font-bold text-slate-800">Registros Generales</h2>
            <p className="text-sm text-slate-500">Control de vigencia, fechas de vencimiento y renovación de documentos de equipos y planta.</p>
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
              <p className="text-sm font-semibold text-slate-400">Total Registros</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalLic} registros</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex items-center gap-4 shadow-xs">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${expiredLic > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Registros Vencidos</p>
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

              // inactive styles per section
              const inactiveStyle = section === 'EQUIPOS'
                ? 'bg-slate-100 border-slate-200 text-slate-900'
                : section === 'ELÉCTRICO'
                  ? 'bg-pink-50 border-pink-200 text-pink-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700';

              // active styles per section (keep distinct colors instead of always dark)
              const activeStyle = section === 'EQUIPOS'
                ? 'bg-blue-600 text-white shadow-sm border-blue-600'
                : section === 'ELÉCTRICO'
                  ? 'bg-pink-600 text-white shadow-sm border-pink-600'
                  : 'bg-amber-600 text-white shadow-sm border-amber-600';

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

                {(currentSection as string) === 'ELÉCTRICO_OLD_UNUSED' ? (
          <div 
            className="space-y-6"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 border border-slate-200/80 rounded-3xl p-5 shadow-xs">
              {/* Breadcrumbs Navigation */}
              <div className="flex items-center flex-wrap gap-2 text-sm font-semibold">
                {electricParentId !== null && (
                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="mr-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50/30 transition shadow-xs cursor-pointer text-xs font-bold"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-500" />
                    <span>Atrás</span>
                  </button>
                )}
                <button
                  onClick={() => setElectricParentId(null)}
                  className="flex items-center gap-1.5 text-pink-600 hover:text-pink-700 transition"
                >
                  <Folder className="w-5 h-5 fill-pink-500/10 text-pink-500" />
                  <span>ELÉCTRICO</span>
                </button>
                {electricPath.map((folder, idx) => (
                  <div key={folder.id} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    <button
                      onClick={() => setElectricParentId(folder.id)}
                      className="text-slate-600 hover:text-slate-900 transition max-w-[150px] truncate"
                    >
                      {folder.nombre}
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons & View Toggle */}
              <div className="flex items-center flex-wrap gap-3">
                {/* Search Bar inside Drive */}
                <div className="relative max-w-xs w-full">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar en esta carpeta..."
                    value={electricSearchQuery}
                    onChange={(e) => setElectricSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2 pl-9 pr-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 text-xs transition-all"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                  <button
                    onClick={() => setElectricViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${electricViewMode === 'grid' ? 'bg-pink-50 text-pink-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Vista Cuadrícula"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setElectricViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${electricViewMode === 'list' ? 'bg-pink-50 text-pink-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Vista Lista"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Create Folder & Upload Buttons */}
                {user?.role !== 'VIEWER' && (
                  <>
                    <button
                      onClick={() => setIsElectricFolderModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
                    >
                      <FolderPlus className="w-4 h-4 text-slate-500" />
                      <span>Nueva Carpeta</span>
                    </button>

                    <label className="inline-flex items-center gap-2 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingFile ? 'Subiendo...' : 'Subir Archivo'}</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadElectricFile(e.target.files[0]);
                          }
                        }}
                        disabled={uploadingFile}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Drag & Drop Over Zone Overlay */}
            <div className="relative min-h-[400px]">
              {isDraggingOver && (
                <div className="absolute inset-0 z-10 bg-pink-50/90 border-3 border-dashed border-pink-400 rounded-3xl flex flex-col items-center justify-center p-8 transition-all duration-300">
                  <div className="w-20 h-20 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mb-4 animate-bounce">
                    <Upload className="w-10 h-10" />
                  </div>
                  <h4 className="text-lg font-bold text-pink-800">Suelte los archivos para subirlos</h4>
                  <p className="text-sm text-pink-600 mt-1 font-medium">Se guardarán automáticamente en la carpeta actual</p>
                </div>
              )}

              {loadingElectric ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-12 h-12 border-3 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-semibold text-slate-400 mt-4">Cargando archivos y carpetas...</span>
                </div>
              ) : electricFolders.length === 0 && electricFiles.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mb-4">
                    <Folder className="w-8 h-8 fill-pink-500/10" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">Esta carpeta está vacía</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    {user?.role !== 'VIEWER' 
                      ? 'Arrastre y suelte archivos aquí, o use los botones de arriba para crear carpetas o subir nuevos documentos.' 
                      : 'No hay elementos disponibles en este directorio.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Grid View Mode */}
                  {electricViewMode === 'grid' ? (
                    <div className="space-y-6">
                      {/* Folders Row */}
                      {electricFolders.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Carpetas ({electricFolders.length})</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {electricFolders.filter(f => f.nombre.toLowerCase().includes(electricSearchQuery.toLowerCase())).map((folder) => (
                              <div
                                key={folder.id}
                                className="group relative bg-white border border-slate-200 hover:border-pink-300 hover:shadow-md rounded-2xl p-4 transition-all duration-300 cursor-pointer"
                                onDoubleClick={() => setElectricParentId(folder.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                                    <Folder className="w-6 h-6 fill-pink-500/20" />
                                  </div>
                                  <div className="min-w-0 pr-6">
                                    <p className="text-sm font-semibold text-slate-800 truncate" title={folder.nombre}>
                                      {folder.nombre}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Carpeta</p>
                                  </div>
                                </div>

                                {/* Hover Actions */}
                                {user?.role !== 'VIEWER' && (
                                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setElectricRenameId(folder.id);
                                        setElectricRenameType('folder');
                                        setElectricRenameName(folder.nombre);
                                        setIsElectricRenameModalOpen(true);
                                      }}
                                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                                      title="Renombrar"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteElectricFolder(folder.id, folder.nombre);
                                      }}
                                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Files Row */}
                      {electricFiles.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Archivos ({electricFiles.length})</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {electricFiles.filter(f => f.nombre.toLowerCase().includes(electricSearchQuery.toLowerCase())).map((file) => {
                              const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(file.extension.toLowerCase());
                              const isPdf = file.extension.toLowerCase() === '.pdf';
                              return (
                                <div
                                  key={file.id}
                                  className="group relative bg-white border border-slate-200 hover:border-pink-300 hover:shadow-md rounded-2xl p-4 transition-all duration-300"
                                >
                                  <div className="flex flex-col h-full">
                                    {/* Icon / Thumbnail */}
                                    <div className="w-full h-32 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-center mb-3 overflow-hidden relative">
                                      {isImage ? (
                                        <img
                                          src={`/api/licencias/electrico/archivos?id=${file.id}`}
                                          alt={file.nombre}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 animate-in fade-in"
                                        />
                                      ) : (
                                        <FileText className={`w-12 h-12 ${isPdf ? 'text-rose-500' : 'text-blue-500'}`} />
                                      )}
                                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                          href={`/api/licencias/electrico/archivos?id=${file.id}`}
                                          download={file.nombre}
                                          className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-slate-800 shadow-sm transition"
                                          title="Descargar"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                          </svg>
                                        </a>
                                        {user?.role !== 'VIEWER' && (
                                          <>
                                            <button
                                              onClick={() => {
                                                setElectricRenameId(file.id);
                                                setElectricRenameType('file');
                                                setElectricRenameName(file.nombre);
                                                setIsElectricRenameModalOpen(true);
                                              }}
                                              className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-slate-800 shadow-sm transition"
                                              title="Renombrar"
                                            >
                                              <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteElectricFile(file.id, file.nombre)}
                                              className="p-1 rounded-md bg-white border border-slate-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shadow-sm transition"
                                              title="Eliminar"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                      <p 
                                        className="text-sm font-semibold text-slate-800 truncate cursor-pointer hover:text-pink-600 transition"
                                        title={file.nombre}
                                        onClick={() => openElectricFilePreview(file)}
                                      >
                                        {file.nombre}
                                      </p>
                                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-medium">
                                        <span>{formatBytes(file.tamano)}</span>
                                        <span className="font-mono">{new Date(file.fechaSubida).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* List View Mode */
                    <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs w-full max-w-none">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left border-collapse text-sm">
                          <thead className="bg-[#0f172a] text-white shadow-sm">
                            <tr className="text-[10px] tracking-[0.24em] uppercase font-bold border-b border-slate-800">
                              <th className="p-4 pl-6">Nombre</th>
                              <th className="p-4">Tipo</th>
                              <th className="p-4">Tamaño</th>
                              <th className="p-4">Fecha</th>
                              <th className="p-4">Creado/Subido Por</th>
                              <th className="p-4 text-center w-36">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {/* Folders in List */}
                            {electricFolders.filter(f => f.nombre.toLowerCase().includes(electricSearchQuery.toLowerCase())).map((folder) => (
                              <tr 
                                key={folder.id} 
                                className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                onDoubleClick={() => setElectricParentId(folder.id)}
                              >
                                <td className="p-4 pl-6 font-semibold text-slate-800">
                                  <div className="flex items-center gap-3">
                                    <Folder className="w-5 h-5 fill-pink-500/10 text-pink-500 shrink-0" />
                                    <span className="truncate max-w-md">{folder.nombre}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-slate-500 text-xs">Carpeta de archivos</td>
                                <td className="p-4 text-slate-400 text-xs">-</td>
                                <td className="p-4 text-slate-500 text-xs font-mono">{new Date(folder.fechaCreacion).toLocaleDateString()}</td>
                                <td className="p-4 text-slate-500 text-xs">{folder.usuarioCreacion}</td>
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setElectricParentId(folder.id);
                                      }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                                      title="Abrir"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    {user?.role !== 'VIEWER' && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setElectricRenameId(folder.id);
                                            setElectricRenameType('folder');
                                            setElectricRenameName(folder.nombre);
                                            setIsElectricRenameModalOpen(true);
                                          }}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                                          title="Renombrar"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteElectricFolder(folder.id, folder.nombre);
                                          }}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                          title="Eliminar"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}

                            {/* Files in List */}
                            {electricFiles.filter(f => f.nombre.toLowerCase().includes(electricSearchQuery.toLowerCase())).map((file) => (
                              <tr 
                                key={file.id} 
                                className="hover:bg-slate-50/50 transition-colors group"
                              >
                                <td className="p-4 pl-6 font-semibold text-slate-800">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span 
                                      className="truncate max-w-md cursor-pointer hover:text-pink-600 transition"
                                      onClick={() => openElectricFilePreview(file)}
                                    >
                                      {file.nombre}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4 text-slate-500 text-xs uppercase">{file.extension.replace('.', '') || 'Archivo'}</td>
                                <td className="p-4 text-slate-500 text-xs font-mono">{formatBytes(file.tamano)}</td>
                                <td className="p-4 text-slate-500 text-xs font-mono">{new Date(file.fechaSubida).toLocaleDateString()}</td>
                                <td className="p-4 text-slate-500 text-xs">{file.usuarioSubida}</td>
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => openElectricFilePreview(file)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                                      title="Previsualizar"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <a
                                      href={`/api/licencias/electrico/archivos?id=${file.id}`}
                                      download={file.nombre}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                                      title="Descargar"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>
                                    </a>
                                    {user?.role !== 'VIEWER' && (
                                      <>
                                        <button
                                          onClick={() => {
                                            setElectricRenameId(file.id);
                                            setElectricRenameType('file');
                                            setElectricRenameName(file.nombre);
                                            setIsElectricRenameModalOpen(true);
                                          }}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                                          title="Renombrar"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteElectricFile(file.id, file.nombre)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                          title="Eliminar"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="relative flex-1 w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar registro por nombre, entidad o código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 text-sm transition-all shadow-xs"
                />
              </div>

              <div className="w-full sm:w-56">
                <select
                  value={selectedSedeFilter}
                  onChange={(e) => setSelectedSedeFilter(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-slate-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 text-sm font-semibold transition-all cursor-pointer shadow-xs"
                >
                  <option value="TODAS">📍 SEDE: TODAS</option>
                  <option value="LIMA">📍 LIMA</option>
                  <option value="TRUJILLO">📍 TRUJILLO</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs w-full max-w-none">
              <div className="overflow-x-auto overflow-y-auto max-h-[68vh]">
                <table className="w-full min-w-[1100px] text-left border-collapse text-sm">
                  <thead className="bg-[#0f172a] text-white shadow-sm sticky top-0 z-20">
                    <tr className="text-[10px] tracking-[0.24em] uppercase font-bold border-b border-slate-800">
                      <th className="p-4 text-center border-r border-white/5 sticky top-0 bg-[#0f172a] z-20">N°</th>
                      <th className="p-4 border-r border-white/5 sticky top-0 bg-[#0f172a] z-20">NOMBRE/MAQUINA</th>
                      <th className="p-4 border-r border-white/5 sticky top-0 bg-[#0f172a] z-20">DETALLES</th>
                      <th className="p-4 border-r border-white/5 sticky top-0 bg-[#0f172a] z-20">CERTIFICADO</th>
                      <th className="p-4 border-r border-white/5 sticky top-0 bg-[#0f172a] z-20">PROTOCOLO</th>
                      <th className="p-4 border-r border-white/5 sticky top-0 bg-[#0f172a] z-20">INFORME TÉCNICO</th>
                      <th className="p-4 text-center border-r border-white/5 sticky top-0 bg-[#0f172a] z-20">FACTURA</th>
                      <th className="p-4 text-center border-r border-white/5 sticky top-0 bg-[#0f172a] z-20">PRESUPUESTO</th>
                      <th className="p-4 text-center border-r border-white/5 sticky top-0 bg-[#0f172a] z-20">CHECK LIST</th>
                      <th className="p-4 text-center w-32 sticky top-0 bg-[#0f172a] z-20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayRows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-12 text-center text-slate-400">
                          No hay máquinas ni registros guardados en esta sección. Usa el botón "Crear Máquina" para comenzar.
                        </td>
                      </tr>
                    ) : (
                      displayRows.map((row, index) => {
                        if (!row.license) {
                          return (
                            <tr key={`placeholder-${row.machineName}`} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 text-left align-top font-mono text-slate-700">{index + 1}</td>
                              <td className="p-4 text-left align-top font-semibold text-slate-800">
                                <div>{row.machineName}</div>
                                <span className={`inline-flex items-center px-2 py-0.5 mt-1.5 text-[9px] font-bold rounded-md border ${
                                  row.machineName.toUpperCase().includes('TRUJILLO')
                                    ? 'bg-purple-50 border-purple-200/50 text-purple-700'
                                    : 'bg-sky-50 border-sky-200/50 text-sky-700'
                                }`}>
                                  {row.machineName.toUpperCase().includes('TRUJILLO') ? 'TRUJILLO' : 'LIMA'}
                                </span>
                              </td>
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
                              {(['certificado', 'protocolo', 'informeTecnico', 'factura', 'presupuesto', 'checklist'] as LicenseDocType[]).map((docType) => {
                                return (
                                  <td key={docType} className="p-4 text-center align-top">
                                    <div className="space-y-2">
                                      <span className="block text-[11px] text-slate-400">Sin archivo</span>
                                      {user?.role !== 'VIEWER' && (
                                        <button
                                          type="button"
                                          onClick={() => handleUploadForPlaceholder(row.machineName, docType)}
                                          className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold rounded-xl px-2 py-1 bg-slate-100 hover:bg-slate-200 transition"
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
                          <tr key={lic.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-left align-top font-mono text-slate-700">{index + 1}</td>
                            <td className="p-4 text-left align-top font-semibold text-slate-800">
                               <div>{lic.name || '-'}</div>
                               {(() => {
                                 const details = parseDetails(lic.details);
                                 let sede = (details.sede || '').toUpperCase().trim();
                                 if (!sede) {
                                   sede = (lic.name || '').toUpperCase().includes('TRUJILLO') ? 'TRUJILLO' : 'LIMA';
                                 }
                                 const isTrujillo = sede.includes('TRUJILLO');
                                 return (
                                   <span className={`inline-flex items-center px-2 py-0.5 mt-1.5 text-[9px] font-bold rounded-md border ${
                                     isTrujillo
                                       ? 'bg-purple-50 border-purple-200/50 text-purple-700'
                                       : 'bg-sky-50 border-sky-200/50 text-sky-700'
                                   }`}>
                                     {isTrujillo ? 'TRUJILLO' : 'LIMA'}
                                   </span>
                                 );
                               })()}
                             </td>
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
                              
                              const folderStyles = {
                                active: {
                                  bg: 'bg-sky-50/50 border-sky-100 hover:border-sky-300',
                                  iconBg: 'bg-sky-100 text-sky-600 shadow-sky-100/30',
                                  badge: 'bg-sky-100 text-sky-700 border-sky-200',
                                  dot: 'bg-sky-500'
                                },
                                dueSoon: {
                                  bg: 'bg-amber-50/50 border-amber-100 hover:border-amber-300',
                                  iconBg: 'bg-amber-100 text-amber-600 shadow-amber-100/30',
                                  badge: 'bg-amber-100 text-amber-700 border-amber-200',
                                  dot: 'bg-amber-500'
                                },
                                expired: {
                                  bg: 'bg-rose-50/50 border-rose-100 hover:border-rose-300',
                                  iconBg: 'bg-rose-100 text-rose-600 shadow-rose-100/30',
                                  badge: 'bg-rose-100 text-rose-700 border-rose-200',
                                  dot: 'bg-rose-500'
                                },
                                none: {
                                  bg: 'bg-slate-50/50 border-slate-100 hover:border-slate-300',
                                  iconBg: 'bg-slate-100 text-slate-500 shadow-slate-100/30',
                                  badge: 'bg-slate-100 text-slate-500 border-slate-200',
                                  dot: 'bg-slate-400'
                                }
                              };

                              const folderStyle = folderStyles[documentState.variant as keyof typeof folderStyles] || folderStyles.none;

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
                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => openFilePreview(lic.id, name, docType)}
                                            className="inline-flex items-center justify-center gap-2 text-[11px] text-brand-600 hover:text-brand-700 font-medium hover:underline bg-brand-50 px-2 py-1 rounded-md border border-brand-100"
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
                                        className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold rounded-xl px-2 py-1 bg-slate-100 hover:bg-slate-200 transition"
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
          </>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">{editingId ? 'Editar Registro General' : 'Registrar Nuevo Registro General'}</h3>
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
                <h3 className="font-bold text-slate-800 text-base">Registrar Nuevo Registro General</h3>
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

            {/* Document history section */}
            <div className="mt-4">
              <h4 className="font-semibold text-sm text-slate-700 mb-2">Historial de Documentos</h4>
              {licenseFilesLoading ? (
                <div className="text-sm text-slate-500">Cargando archivos...</div>
              ) : licenseFiles.length === 0 ? (
                <div className="text-sm text-slate-500">No se encontraron archivos para esta máquina.</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {licenseFiles.map((f) => {
                    const fileName = f.fileName || f.fileName;
                    const ext = fileName.split('.').pop()?.toLowerCase() || '';
                    const previewable = ['pdf', 'jpg', 'jpeg', 'png', 'gif'];
                    return (
                      <div key={fileName} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-3">
                        <div>
                          <div className="font-semibold text-sm">{fileName}</div>
                          <div className="text-xs text-slate-500">{new Date(f.mtime).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {previewable.includes(ext) ? (
                            <button
                              type="button"
                              onClick={() => {
                                const url = `/api/licencias/archivo?file=${encodeURIComponent(fileName)}`;
                                setPreviewUrl(url);
                                setPreviewName(fileName);
                                setPreviewExt(ext);
                                setIsPreviewOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-sky-50 border border-sky-100 text-sky-700 text-xs font-semibold"
                            >
                              Ver
                            </button>
                          ) : (
                            <a href={`/api/licencias/archivo?file=${encodeURIComponent(fileName)}`} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold">Abrir</a>
                          )}
                          <a href={`/api/licencias/archivo?file=${encodeURIComponent(fileName)}`} download className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold">Descargar</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

      {/* Modals for Electric section Google Drive file manager */}
      {isElectricFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Crear Nueva Carpeta</h3>
              <button
                onClick={() => setIsElectricFolderModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleCreateElectricFolder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de la Carpeta</label>
                <input
                  type="text"
                  value={electricNewFolderName}
                  onChange={(e) => setElectricNewFolderName(e.target.value)}
                  placeholder="Ej. Planos de Tableros"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-700 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsElectricFolderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                >
                  Crear Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isElectricRenameModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Renombrar {electricRenameType === 'folder' ? 'Carpeta' : 'Archivo'}</h3>
              <button
                onClick={() => setIsElectricRenameModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleRenameElectricItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nuevo Nombre</label>
                <input
                  type="text"
                  value={electricRenameName}
                  onChange={(e) => setElectricRenameName(e.target.value)}
                  placeholder="Ej. Nuevo nombre"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-700 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsElectricRenameModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                >
                  Renombrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
