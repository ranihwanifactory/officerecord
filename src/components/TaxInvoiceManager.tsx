import React, { useState, useMemo } from 'react';
import { 
  TaxInvoice, 
  TaxInvoiceItem, 
  ClientSiteMaster, 
  OfficeSettings, 
  DispatchLog 
} from '../types';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Calendar, 
  Printer, 
  Edit3, 
  Trash2, 
  Copy, 
  Download, 
  Filter, 
  Building2, 
  CheckCircle, 
  Clock, 
  XCircle, 
  X, 
  Receipt,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Pagination } from './Pagination';
import { getTodayDateString } from '../utils/date';

interface TaxInvoiceManagerProps {
  invoices: TaxInvoice[];
  clients: ClientSiteMaster[];
  officeSettings: OfficeSettings;
  officeProfiles: OfficeSettings[];
  dispatchLogs: DispatchLog[];
  onSaveInvoice: (invoice: TaxInvoice) => void;
  onDeleteInvoice: (id: string) => void;
}

export const TaxInvoiceManager: React.FC<TaxInvoiceManagerProps> = ({
  invoices,
  clients,
  officeSettings,
  officeProfiles = [],
  dispatchLogs = [],
  onSaveInvoice,
  onDeleteInvoice,
}) => {
  // Active profiles
  const profiles = officeProfiles.length > 0 ? officeProfiles : [officeSettings];

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [yearMonthFilter, setYearMonthFilter] = useState<string>(''); // e.g. "2026-08"

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<TaxInvoice | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<TaxInvoice | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form states for creating / editing
  const [issueDate, setIssueDate] = useState(getTodayDateString());
  const [invoiceType, setInvoiceType] = useState<'일반' | '영세율' | '면세' | '수정'>('일반');
  const [status, setStatus] = useState<'발행완료' | '임시저장' | '취소'>('발행완료');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [ntsApprovalNumber, setNtsApprovalNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(officeSettings.id || 'default');

  // Supplier info
  const [supplierBizNo, setSupplierBizNo] = useState(officeSettings.registrationNumber || '504-81-12345');
  const [supplierOfficeName, setSupplierOfficeName] = useState(officeSettings.officeName || '젊은인력사무소');
  const [supplierRep, setSupplierRep] = useState(officeSettings.representativeName || '김진환');
  const [supplierAddress, setSupplierAddress] = useState(officeSettings.address || '');
  const [supplierBizType, setSupplierBizType] = useState(officeSettings.bizType || '서비스');
  const [supplierBizCategory, setSupplierBizCategory] = useState(officeSettings.bizCategory || '인력공급, 고용알선');
  const [supplierEmail, setSupplierEmail] = useState(officeSettings.email || 'youngman_hr@naver.com');

  // Buyer (Client) info
  const [buyerBizNo, setBuyerBizNo] = useState('');
  const [buyerOfficeName, setBuyerOfficeName] = useState('');
  const [buyerRep, setBuyerRep] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerBizType, setBuyerBizType] = useState('');
  const [buyerBizCategory, setBuyerBizCategory] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');

  // Items
  const [items, setItems] = useState<TaxInvoiceItem[]>([
    {
      id: `item-1`,
      date: getTodayDateString(),
      itemDescription: '인력 공급 및 알선 수수료',
      specification: '',
      quantity: 1,
      unitPrice: 0,
      supplyAmount: 0,
      taxAmount: 0,
      remark: '',
    },
  ]);

  // Import Log Modal state
  const [importClientId, setImportClientId] = useState<string>('');
  const [importStartDate, setImportStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [importEndDate, setImportEndDate] = useState<string>(getTodayDateString());
  const [importCalculationMode, setImportCalculationMode] = useState<'total_billing' | 'fee_only'>('total_billing');

  // Handle supplier change when selected office changes
  const handleOfficeChange = (profileId: string) => {
    setSelectedOfficeId(profileId);
    const target = profiles.find((p) => (p.id || 'default') === profileId) || officeSettings;
    setSupplierBizNo(target.registrationNumber || '504-81-12345');
    setSupplierOfficeName(target.officeName || '젊은인력사무소');
    setSupplierRep(target.representativeName || '김진환');
    setSupplierAddress(target.address || '');
    setSupplierBizType(target.bizType || '서비스');
    setSupplierBizCategory(target.bizCategory || '인력공급, 고용알선');
    setSupplierEmail(target.email || 'youngman_hr@naver.com');
  };

  // Handle buyer change when client dropdown is selected
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId || c.clientName === clientId);
    if (client) {
      setBuyerOfficeName(client.clientName || '');
      setBuyerBizNo(client.registrationNumber || '');
      setBuyerRep(client.representative || '');
      setBuyerAddress(client.address || '');
      setBuyerBizType(client.bizType || '');
      setBuyerBizCategory(client.bizCategory || '');
      setBuyerEmail(client.email || '');
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const today = getTodayDateString();
    const activeProf = profiles.find((p) => p.id === selectedOfficeId) || officeSettings;

    setEditingInvoice(null);
    setIssueDate(today);
    setInvoiceType('일반');
    setStatus('발행완료');
    setInvoiceNumber(`TAX-${today.replace(/-/g, '')}-${String(invoices.length + 1).padStart(3, '0')}`);
    setNtsApprovalNumber('');
    setRemarks('');
    setSelectedClientId('');

    // Supplier
    setSupplierBizNo(activeProf.registrationNumber || '504-81-12345');
    setSupplierOfficeName(activeProf.officeName || '젊은인력사무소');
    setSupplierRep(activeProf.representativeName || '김진환');
    setSupplierAddress(activeProf.address || '');
    setSupplierBizType(activeProf.bizType || '서비스');
    setSupplierBizCategory(activeProf.bizCategory || '인력공급, 고용알선');
    setSupplierEmail(activeProf.email || 'youngman_hr@naver.com');

    // Buyer
    setBuyerBizNo('');
    setBuyerOfficeName('');
    setBuyerRep('');
    setBuyerAddress('');
    setBuyerBizType('');
    setBuyerBizCategory('');
    setBuyerEmail('');

    // Default item
    setItems([
      {
        id: `item-${Date.now()}-1`,
        date: today,
        itemDescription: '인력 공급 및 알선 수수료',
        specification: '',
        quantity: 1,
        unitPrice: 0,
        supplyAmount: 0,
        taxAmount: 0,
        remark: '',
      },
    ]);

    setIsEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (inv: TaxInvoice) => {
    setEditingInvoice(inv);
    setIssueDate(inv.issueDate || getTodayDateString());
    setInvoiceType(inv.invoiceType || '일반');
    setStatus(inv.status || '발행완료');
    setInvoiceNumber(inv.invoiceNumber || '');
    setNtsApprovalNumber(inv.ntsApprovalNumber || '');
    setRemarks(inv.remarks || '');
    setSelectedOfficeId(inv.supplierOfficeId || 'default');

    // Supplier
    setSupplierBizNo(inv.supplierRegistrationNumber || '');
    setSupplierOfficeName(inv.supplierOfficeName || '');
    setSupplierRep(inv.supplierRepresentative || '');
    setSupplierAddress(inv.supplierAddress || '');
    setSupplierBizType(inv.supplierBizType || '');
    setSupplierBizCategory(inv.supplierBizCategory || '');
    setSupplierEmail(inv.supplierEmail || '');

    // Buyer
    setBuyerBizNo(inv.buyerRegistrationNumber || '');
    setBuyerOfficeName(inv.buyerOfficeName || '');
    setBuyerRep(inv.buyerRepresentative || '');
    setBuyerAddress(inv.buyerAddress || '');
    setBuyerBizType(inv.buyerBizType || '');
    setBuyerBizCategory(inv.buyerBizCategory || '');
    setBuyerEmail(inv.buyerEmail || '');
    setSelectedClientId(inv.buyerClientId || '');

    // Items
    if (inv.items && inv.items.length > 0) {
      setItems(inv.items);
    } else {
      setItems([
        {
          id: `item-${Date.now()}-1`,
          date: inv.issueDate,
          itemDescription: '인력 공급',
          specification: '',
          quantity: 1,
          unitPrice: inv.supplyAmount || 0,
          supplyAmount: inv.supplyAmount || 0,
          taxAmount: inv.taxAmount || 0,
          remark: '',
        },
      ]);
    }

    setIsEditModalOpen(true);
  };

  // Duplicate Invoice
  const handleDuplicateInvoice = (inv: TaxInvoice) => {
    const today = getTodayDateString();
    setEditingInvoice(null);
    setIssueDate(today);
    setInvoiceType(inv.invoiceType || '일반');
    setStatus('발행완료');
    setInvoiceNumber(`TAX-${today.replace(/-/g, '')}-${String(invoices.length + 1).padStart(3, '0')}`);
    setNtsApprovalNumber('');
    setRemarks(inv.remarks || '');
    setSelectedOfficeId(inv.supplierOfficeId || 'default');

    setSupplierBizNo(inv.supplierRegistrationNumber || '');
    setSupplierOfficeName(inv.supplierOfficeName || '');
    setSupplierRep(inv.supplierRepresentative || '');
    setSupplierAddress(inv.supplierAddress || '');
    setSupplierBizType(inv.supplierBizType || '');
    setSupplierBizCategory(inv.supplierBizCategory || '');
    setSupplierEmail(inv.supplierEmail || '');

    setBuyerBizNo(inv.buyerRegistrationNumber || '');
    setBuyerOfficeName(inv.buyerOfficeName || '');
    setBuyerRep(inv.buyerRepresentative || '');
    setBuyerAddress(inv.buyerAddress || '');
    setBuyerBizType(inv.buyerBizType || '');
    setBuyerBizCategory(inv.buyerBizCategory || '');
    setBuyerEmail(inv.buyerEmail || '');
    setSelectedClientId(inv.buyerClientId || '');

    setItems(
      (inv.items || []).map((it, idx) => ({
        ...it,
        id: `item-${Date.now()}-${idx + 1}`,
        date: today,
      }))
    );

    setIsEditModalOpen(true);
  };

  // Item modifications
  const handleItemChange = (index: number, field: keyof TaxInvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : Number(item.quantity);
      const p = field === 'unitPrice' ? Number(value) : Number(item.unitPrice);
      const supply = Math.round(q * p);
      item.supplyAmount = supply;
      item.taxAmount = invoiceType === '면세' || invoiceType === '영세율' ? 0 : Math.round(supply * 0.1);
    } else if (field === 'supplyAmount') {
      const supply = Number(value);
      item.supplyAmount = supply;
      item.taxAmount = invoiceType === '면세' || invoiceType === '영세율' ? 0 : Math.round(supply * 0.1);
      if (item.quantity && item.quantity > 0) {
        item.unitPrice = Math.round(supply / item.quantity);
      }
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}-${items.length + 1}`,
        date: issueDate,
        itemDescription: '',
        specification: '',
        quantity: 1,
        unitPrice: 0,
        supplyAmount: 0,
        taxAmount: 0,
        remark: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('최소 1개 이상의 품목이 필요합니다.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedSupplyAmount = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.supplyAmount) || 0), 0);
  }, [items]);

  const calculatedTaxAmount = useMemo(() => {
    if (invoiceType === '면세' || invoiceType === '영세율') return 0;
    return items.reduce((sum, it) => sum + (Number(it.taxAmount) || 0), 0);
  }, [items, invoiceType]);

  const calculatedTotalAmount = useMemo(() => {
    return calculatedSupplyAmount + calculatedTaxAmount;
  }, [calculatedSupplyAmount, calculatedTaxAmount]);

  // Save Invoice
  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerOfficeName.trim()) {
      alert('공급받는자(거래처) 상호/현장명을 입력해 주세요.');
      return;
    }

    if (!supplierOfficeName.trim()) {
      alert('공급자(사무소) 상호명을 입력해 주세요.');
      return;
    }

    const newInvoice: TaxInvoice = {
      id: editingInvoice?.id || `tax_inv_${Date.now()}`,
      invoiceNumber: invoiceNumber.trim() || `TAX-${issueDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
      ntsIssueId: ntsApprovalNumber.trim(),
      ntsApprovalNumber: ntsApprovalNumber.trim(),
      issueDate: issueDate || getTodayDateString(),
      invoiceType,
      status,

      supplierOfficeId: selectedOfficeId,
      supplierName: supplierOfficeName.trim(),
      supplierOfficeName: supplierOfficeName.trim(),
      supplierRegistrationNumber: supplierBizNo.trim(),
      supplierRepresentative: supplierRep.trim(),
      supplierAddress: supplierAddress.trim(),
      supplierBizType: supplierBizType.trim(),
      supplierBizCategory: supplierBizCategory.trim(),
      supplierEmail: supplierEmail.trim(),

      clientId: selectedClientId,
      buyerClientId: selectedClientId,
      clientName: buyerOfficeName.trim(),
      buyerOfficeName: buyerOfficeName.trim(),
      clientRegistrationNumber: buyerBizNo.trim(),
      buyerRegistrationNumber: buyerBizNo.trim(),
      clientRepresentative: buyerRep.trim(),
      buyerRepresentative: buyerRep.trim(),
      clientAddress: buyerAddress.trim(),
      buyerAddress: buyerAddress.trim(),
      clientBizType: buyerBizType.trim(),
      buyerBizType: buyerBizType.trim(),
      clientBizCategory: buyerBizCategory.trim(),
      buyerBizCategory: buyerBizCategory.trim(),
      clientEmail: buyerEmail.trim(),
      buyerEmail: buyerEmail.trim(),

      taxType: invoiceType === '면세' ? 'tax_free' : invoiceType === '영세율' ? 'zero_rate' : 'taxable',
      supplyAmount: calculatedSupplyAmount,
      taxAmount: calculatedTaxAmount,
      totalAmount: calculatedTotalAmount,

      items: items.map((it) => ({
        ...it,
        itemName: it.itemName || it.itemDescription || '인력 공급',
        itemDescription: it.itemDescription || it.itemName || '인력 공급',
        spec: it.spec || it.specification || '',
        specification: it.specification || it.spec || '',
        remarks: it.remarks || it.remark || '',
        remark: it.remark || it.remarks || '',
      })),

      memo: remarks.trim(),
      remarks: remarks.trim(),
      createdAt: editingInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveInvoice(newInvoice);
    setIsEditModalOpen(false);
    setEditingInvoice(null);
  };

  // Import from Dispatch Logs
  const handleExecuteImportFromLogs = () => {
    if (!importClientId) {
      alert('불러올 업체를 선택해 주세요.');
      return;
    }

    // Filter dispatch logs matching client and date range
    const matchedLogs = dispatchLogs.filter((log) => {
      const matchClient = (log.clientName || '').toLowerCase().includes(importClientId.toLowerCase()) ||
                          log.clientName === importClientId;
      const matchDate = log.date >= importStartDate && log.date <= importEndDate;
      return matchClient && matchDate;
    });

    if (matchedLogs.length === 0) {
      alert(`선택한 기간(${importStartDate} ~ ${importEndDate}) 내 '${importClientId}' 업체의 출력일지가 없습니다.`);
      return;
    }

    const targetClient = clients.find((c) => c.clientName === importClientId || c.id === importClientId);
    const activeProf = profiles.find((p) => p.id === selectedOfficeId) || officeSettings;

    // Generate Items
    let generatedItems: TaxInvoiceItem[] = [];

    if (importCalculationMode === 'total_billing') {
      // Create an item per date or summarize
      generatedItems = matchedLogs.map((log, idx) => {
        const workersCount = log.workers?.length || 0;
        const totalLogBilling = log.totalAmount || 0;
        const tax = Math.round(totalLogBilling * 0.1);
        return {
          id: `item-${Date.now()}-${idx + 1}`,
          date: log.date,
          itemDate: log.date,
          itemName: `인력공급 (${log.clientName || '현장'}, 인부 ${workersCount}명)`,
          itemDescription: `인력공급 (${log.clientName || '현장'}, 인부 ${workersCount}명)`,
          spec: '',
          specification: '',
          quantity: workersCount || 1,
          unitPrice: workersCount > 0 ? Math.round(totalLogBilling / workersCount) : totalLogBilling,
          supplyAmount: totalLogBilling,
          taxAmount: tax,
          remarks: log.memo || '',
          remark: log.memo || '',
        };
      });
    } else {
      // Fee only (Commission)
      generatedItems = matchedLogs.map((log, idx) => {
        const workersCount = log.workers?.length || 0;
        // Office fee calculation: approx standard 10% or 16,000 KRW per head
        const totalFee = Math.round((log.totalAmount || 0) * 0.1) || (workersCount * 16000);
        const tax = Math.round(totalFee * 0.1);
        return {
          id: `item-${Date.now()}-${idx + 1}`,
          date: log.date,
          itemDate: log.date,
          itemName: `인력 알선 및 중개 수수료 (${workersCount}명)`,
          itemDescription: `인력 알선 및 중개 수수료 (${workersCount}명)`,
          spec: '',
          specification: '',
          quantity: workersCount || 1,
          unitPrice: workersCount > 0 ? Math.round(totalFee / workersCount) : totalFee,
          supplyAmount: totalFee,
          taxAmount: tax,
          remarks: `일지: ${log.date}`,
          remark: `일지: ${log.date}`,
        };
      });
    }

    // Set Form states
    setEditingInvoice(null);
    setIssueDate(importEndDate);
    setInvoiceType('일반');
    setStatus('발행완료');
    setInvoiceNumber(`TAX-${importEndDate.replace(/-/g, '')}-${String(invoices.length + 1).padStart(3, '0')}`);
    setNtsApprovalNumber('');
    setRemarks(`[일지연동] ${importStartDate} ~ ${importEndDate} 총 ${matchedLogs.length}건 합산`);
    setSelectedClientId(targetClient?.id || '');

    // Supplier
    setSupplierBizNo(activeProf.registrationNumber || '504-81-12345');
    setSupplierOfficeName(activeProf.officeName || '젊은인력사무소');
    setSupplierRep(activeProf.representativeName || '김진환');
    setSupplierAddress(activeProf.address || '');
    setSupplierBizType(activeProf.bizType || '서비스');
    setSupplierBizCategory(activeProf.bizCategory || '인력공급, 고용알선');
    setSupplierEmail(activeProf.email || 'youngman_hr@naver.com');

    // Buyer
    setBuyerOfficeName(targetClient?.clientName || importClientId);
    setBuyerBizNo(targetClient?.registrationNumber || '');
    setBuyerRep(targetClient?.representative || '');
    setBuyerAddress(targetClient?.address || '');
    setBuyerBizType(targetClient?.bizType || '');
    setBuyerBizCategory(targetClient?.bizCategory || '');
    setBuyerEmail(targetClient?.email || '');

    setItems(generatedItems);
    setIsImportModalOpen(false);
    setIsEditModalOpen(true);
  };

  // Preview & Print Trigger
  const handleOpenPreview = (inv: TaxInvoice) => {
    setPreviewInvoice(inv);
    setIsPreviewModalOpen(true);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (invoices.length === 0) {
      alert('내보낼 세금계산서 데이터가 없습니다.');
      return;
    }

    const headers = [
      '발행일자',
      '관리번호',
      '국세청승인번호',
      '구분',
      '상태',
      '공급자상호',
      '공급자사업자번호',
      '공급받는자상호',
      '공급받는자사업자번호',
      '공급가액',
      '세액',
      '합계금액',
      '비고',
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.issueDate,
      `"${inv.invoiceNumber || ''}"`,
      `"${inv.ntsApprovalNumber || ''}"`,
      inv.invoiceType || '일반',
      inv.status || '발행완료',
      `"${inv.supplierOfficeName || ''}"`,
      `"${inv.supplierRegistrationNumber || ''}"`,
      `"${inv.buyerOfficeName || ''}"`,
      `"${inv.buyerRegistrationNumber || ''}"`,
      inv.supplyAmount || 0,
      inv.taxAmount || 0,
      inv.totalAmount || 0,
      `"${(inv.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `전자세금계산서_목록_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search
      const matchSearch =
        !searchTerm ||
        inv.buyerOfficeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.buyerRegistrationNumber && inv.buyerRegistrationNumber.includes(searchTerm)) ||
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inv.ntsApprovalNumber && inv.ntsApprovalNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inv.remarks && inv.remarks.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status
      const matchStatus = selectedStatus === 'all' || inv.status === selectedStatus;

      // Type
      const matchType = selectedType === 'all' || inv.invoiceType === selectedType;

      // Year/Month
      const matchYearMonth = !yearMonthFilter || inv.issueDate.startsWith(yearMonthFilter);

      return matchSearch && matchStatus && matchType && matchYearMonth;
    }).sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }, [invoices, searchTerm, selectedStatus, selectedType, yearMonthFilter]);

  // Overall Totals
  const totalSummary = useMemo(() => {
    let supply = 0;
    let tax = 0;
    let total = 0;
    filteredInvoices.forEach((inv) => {
      supply += Number(inv.supplyAmount) || 0;
      tax += Number(inv.taxAmount) || 0;
      total += Number(inv.totalAmount) || 0;
    });
    return {
      count: filteredInvoices.length,
      supply,
      tax,
      total,
    };
  }, [filteredInvoices]);

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE) || 1;
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Stats Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-4">
        
        {/* Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <span>전자세금계산서 발행 및 관리</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-full font-bold">
                  {filteredInvoices.length}건
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                현장/거래처별 전자세금계산서 작성, 국세청 전송 관리 및 출력일지 자동 연동 정산
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title="기존 등록된 출력일지 데이터로부터 세금계산서 자동 생성"
            >
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>일지에서 가져오기</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>새 세금계산서 작성</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>총 발행 건수</span>
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-1 text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
              {totalSummary.count.toLocaleString()}<span className="text-xs font-semibold ml-0.5 text-slate-500">건</span>
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
              총 공급가액 합계
            </div>
            <div className="mt-1 text-base sm:text-lg font-black font-mono text-blue-800 dark:text-blue-200">
              {totalSummary.supply.toLocaleString()}<span className="text-xs font-semibold ml-0.5 text-blue-600 dark:text-blue-400">원</span>
            </div>
          </div>

          <div className="bg-amber-50/50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/50">
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
              총 세액(VAT) 합계
            </div>
            <div className="mt-1 text-base sm:text-lg font-black font-mono text-amber-800 dark:text-amber-200">
              {totalSummary.tax.toLocaleString()}<span className="text-xs font-semibold ml-0.5 text-amber-600 dark:text-amber-400">원</span>
            </div>
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              총 청구 합계 금액
            </div>
            <div className="mt-1 text-base sm:text-lg font-black font-mono text-emerald-800 dark:text-emerald-200">
              {totalSummary.total.toLocaleString()}<span className="text-xs font-semibold ml-0.5 text-emerald-600 dark:text-emerald-400">원</span>
            </div>
          </div>
        </div>

      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="거래처명, 사업자번호, 관리번호, 비고 검색..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <input
            type="month"
            value={yearMonthFilter}
            onChange={(e) => {
              setYearMonthFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />

          {yearMonthFilter && (
            <button
              onClick={() => setYearMonthFilter('')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              title="월 필터 초기화"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">상태 전체</option>
            <option value="발행완료">발행완료</option>
            <option value="임시저장">임시저장</option>
            <option value="취소">취소</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">구분 전체</option>
            <option value="일반">일반</option>
            <option value="영세율">영세율</option>
            <option value="면세">면세</option>
            <option value="수정">수정</option>
          </select>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="현재 목록을 엑셀 CSV 파일로 다운로드"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>엑셀 다운</span>
          </button>
        </div>

      </div>

      {/* Main Table (Desktop) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3 text-center w-24">발행일자</th>
                <th className="p-3">관리번호 / 국세청승인번호</th>
                <th className="p-3">공급받는자 (거래처)</th>
                <th className="p-3">품목 요약</th>
                <th className="p-3 text-right">공급가액</th>
                <th className="p-3 text-right">세액 (VAT)</th>
                <th className="p-3 text-right">합계금액</th>
                <th className="p-3 text-center w-20">상태</th>
                <th className="p-3 text-center w-32">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                    등록된 전자세금계산서가 없거나 검색 조건에 맞는 항목이 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* Date */}
                    <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                      {inv.issueDate}
                    </td>

                    {/* Invoice No */}
                    <td className="p-3">
                      <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {inv.invoiceNumber}
                      </div>
                      {inv.ntsApprovalNumber ? (
                        <div className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                          NTS: {inv.ntsApprovalNumber}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400">국세청 미전송</div>
                      )}
                    </td>

                    {/* Buyer */}
                    <td className="p-3">
                      <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inv.buyerOfficeName}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                        <span>{inv.buyerRegistrationNumber || '사업자번호 미기재'}</span>
                        {inv.buyerRepresentative && <span>· {inv.buyerRepresentative}</span>}
                      </div>
                    </td>

                    {/* Items Summary */}
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                      {inv.items && inv.items.length > 0 ? (
                        <span>
                          {inv.items[0].itemDescription}
                          {inv.items.length > 1 && ` 외 ${inv.items.length - 1}건`}
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>

                    {/* Supply */}
                    <td className="p-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      {(inv.supplyAmount || 0).toLocaleString()}원
                    </td>

                    {/* Tax */}
                    <td className="p-3 text-right font-mono font-medium text-amber-700 dark:text-amber-400 text-xs">
                      {(inv.taxAmount || 0).toLocaleString()}원
                    </td>

                    {/* Total */}
                    <td className="p-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                      {(inv.totalAmount || 0).toLocaleString()}원
                    </td>

                    {/* Status */}
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          inv.status === '발행완료'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : inv.status === '임시저장'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenPreview(inv)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="전자세금계산서 양식 미리보기 및 인쇄"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(inv)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="수정하기"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="복사하여 새로 작성"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`관리번호 '${inv.invoiceNumber}' 세금계산서 기록을 삭제하시겠습니까?`)) {
                              onDeleteInvoice(inv.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Card View */}
        <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {paginatedInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              등록된 전자세금계산서가 없거나 검색 결과가 없습니다.
            </div>
          ) : (
            paginatedInvoices.map((inv) => (
              <div key={inv.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                      {inv.issueDate}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        inv.status === '발행완료'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : inv.status === '임시저장'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">
                    {inv.invoiceNumber}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>{inv.buyerOfficeName}</span>
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {inv.buyerRegistrationNumber || '사업자등록번호 없음'}
                      {inv.buyerRepresentative && ` · ${inv.buyerRepresentative}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                      {(inv.totalAmount || 0).toLocaleString()}원
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      (공급가 {(inv.supplyAmount || 0).toLocaleString()} / 부가세 {(inv.taxAmount || 0).toLocaleString()})
                    </div>
                  </div>
                </div>

                {inv.items && inv.items.length > 0 && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg truncate">
                    품목: {inv.items[0].itemDescription}
                    {inv.items.length > 1 && ` 외 ${inv.items.length - 1}건`}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                    {inv.remarks ? `비고: ${inv.remarks}` : ''}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenPreview(inv)}
                      className="px-2 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center space-x-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>인쇄</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(inv)}
                      className="px-2 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-lg flex items-center space-x-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => handleDuplicateInvoice(inv)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                      title="복사"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`'${inv.buyerOfficeName}' 세금계산서 기록을 삭제하시겠습니까?`)) {
                          onDeleteInvoice(inv.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* 1. CREATE / EDIT TAX INVOICE MODAL                        */}
      {/* ========================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-slate-100">
                  {editingInvoice ? '전자세금계산서 수정' : '새 전자세금계산서 작성'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitInvoice} className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Basic Meta Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">작성/발행일자 *</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">계산서 구분</label>
                  <select
                    value={invoiceType}
                    onChange={(e) => setInvoiceType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="일반">일반 (10% 과세)</option>
                    <option value="영세율">영세율 (0%)</option>
                    <option value="면세">면세</option>
                    <option value="수정">수정세금계산서</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">발행 상태</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="발행완료">발행완료 (승인)</option>
                    <option value="임시저장">임시저장 (작성중)</option>
                    <option value="취소">취소건</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">내부 관리번호</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="예: TAX-20260829-001"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Two Parties: Red (Supplier) & Blue (Buyer) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. SUPPLIER BOX (Red Header) */}
                <div className="border border-rose-200 dark:border-rose-900/60 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-rose-50 dark:bg-rose-950/80 px-4 py-2.5 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
                    <span className="text-xs font-black text-rose-700 dark:text-rose-300">
                      공 급 자 (사무소)
                    </span>
                    {profiles.length > 1 && (
                      <select
                        value={selectedOfficeId}
                        onChange={(e) => handleOfficeChange(e.target.value)}
                        className="text-[11px] bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded px-1.5 py-0.5 font-bold text-rose-800 dark:text-rose-300"
                      >
                        {profiles.map((p) => (
                          <option key={p.id || p.officeName} value={p.id || 'default'}>
                            {p.profileName || p.officeName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="p-3.5 space-y-2.5 bg-white dark:bg-slate-900">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">등록번호 *</label>
                        <input
                          type="text"
                          required
                          value={supplierBizNo}
                          onChange={(e) => setSupplierBizNo(e.target.value)}
                          placeholder="504-81-12345"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">상호 (법인명) *</label>
                        <input
                          type="text"
                          required
                          value={supplierOfficeName}
                          onChange={(e) => setSupplierOfficeName(e.target.value)}
                          placeholder="젊은인력사무소"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">성명 (대표자)</label>
                        <input
                          type="text"
                          value={supplierRep}
                          onChange={(e) => setSupplierRep(e.target.value)}
                          placeholder="김진환"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">이메일</label>
                        <input
                          type="email"
                          value={supplierEmail}
                          onChange={(e) => setSupplierEmail(e.target.value)}
                          placeholder="youngman_hr@naver.com"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">사업장 주소</label>
                      <input
                        type="text"
                        value={supplierAddress}
                        onChange={(e) => setSupplierAddress(e.target.value)}
                        placeholder="경북 성주군 성주읍 성주순환로2길 69"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">업태</label>
                        <input
                          type="text"
                          value={supplierBizType}
                          onChange={(e) => setSupplierBizType(e.target.value)}
                          placeholder="서비스"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">종목</label>
                        <input
                          type="text"
                          value={supplierBizCategory}
                          onChange={(e) => setSupplierBizCategory(e.target.value)}
                          placeholder="인력공급, 고용알선"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. BUYER BOX (Blue Header) */}
                <div className="border border-blue-200 dark:border-blue-900/60 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-blue-50 dark:bg-blue-950/80 px-4 py-2.5 border-b border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                    <span className="text-xs font-black text-blue-700 dark:text-blue-300">
                      공급받는자 (거래처 / 구인처)
                    </span>
                    {clients.length > 0 && (
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleClientSelect(e.target.value)}
                        className="text-[11px] bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded px-1.5 py-0.5 font-bold text-blue-800 dark:text-blue-300 max-w-[140px] truncate cursor-pointer"
                      >
                        <option value="">거래처 불러오기...</option>
                        {[...clients]
                          .sort((a, b) => (a.clientName || '').localeCompare(b.clientName || '', 'ko-KR'))
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.clientName}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                  <div className="p-3.5 space-y-2.5 bg-white dark:bg-slate-900">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">등록번호 *</label>
                        <input
                          type="text"
                          value={buyerBizNo}
                          onChange={(e) => setBuyerBizNo(e.target.value)}
                          placeholder="504-81-XXXXX"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">상호 (법인명) *</label>
                        <input
                          type="text"
                          required
                          value={buyerOfficeName}
                          onChange={(e) => setBuyerOfficeName(e.target.value)}
                          placeholder="예: 신성에스엔티"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">성명 (대표자)</label>
                        <input
                          type="text"
                          value={buyerRep}
                          onChange={(e) => setBuyerRep(e.target.value)}
                          placeholder="홍길동"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">수신 이메일</label>
                        <input
                          type="email"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="invoice@client.com"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">사업장 / 현장 주소</label>
                      <input
                        type="text"
                        value={buyerAddress}
                        onChange={(e) => setBuyerAddress(e.target.value)}
                        placeholder="경북 성주군 성주읍"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">업태</label>
                        <input
                          type="text"
                          value={buyerBizType}
                          onChange={(e) => setBuyerBizType(e.target.value)}
                          placeholder="건설업"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">종목</label>
                        <input
                          type="text"
                          value={buyerBizCategory}
                          onChange={(e) => setBuyerBizCategory(e.target.value)}
                          placeholder="철근콘크리트"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <span>📋 품목 상세 내역</span>
                    <span className="text-[11px] font-bold text-blue-600">({items.length}개)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>품목 추가</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-2xs">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2 text-center w-28">월/일</th>
                        <th className="p-2 text-left min-w-[140px]">품목명</th>
                        <th className="p-2 text-right w-20">수량</th>
                        <th className="p-2 text-right w-28">단가</th>
                        <th className="p-2 text-right w-28">공급가액</th>
                        <th className="p-2 text-right w-24">세액</th>
                        <th className="p-2 text-left w-28">비고</th>
                        <th className="p-2 text-center w-12">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="p-1.5 text-center">
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) => handleItemChange(idx, 'date', e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-[11px] font-mono text-center"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              required
                              value={item.itemDescription}
                              onChange={(e) => handleItemChange(idx, 'itemDescription', e.target.value)}
                              placeholder="인력공급 또는 알선수수료"
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs font-semibold"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs text-right font-mono"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs text-right font-mono font-semibold"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              value={item.supplyAmount}
                              onChange={(e) => handleItemChange(idx, 'supplyAmount', e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs text-right font-mono font-bold text-blue-600 dark:text-blue-400"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              value={item.taxAmount}
                              onChange={(e) => handleItemChange(idx, 'taxAmount', e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs text-right font-mono text-amber-600 dark:text-amber-400"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={item.remark || ''}
                              onChange={(e) => handleItemChange(idx, 'remark', e.target.value)}
                              placeholder=""
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-500 p-1"
                              title="품목 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Amount Totals Box */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4 text-xs font-bold">
                    <div>
                      <span className="text-slate-500 mr-1.5">공급가액:</span>
                      <span className="font-mono text-sm text-slate-800 dark:text-slate-100">
                        {calculatedSupplyAmount.toLocaleString()}원
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 mr-1.5">세액(VAT):</span>
                      <span className="font-mono text-sm text-amber-600 dark:text-amber-400">
                        {calculatedTaxAmount.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">총 청구금액 합계:</span>
                    <span className="font-mono text-lg font-black text-blue-600 dark:text-blue-400">
                      {calculatedTotalAmount.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>

              {/* Remarks & NTS Optional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">비고 (참고사항)</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="예: 8월 인력 정산분, 입금계좌: 농협 302-65550038-11"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">국세청 승인번호 (발행 후 등록용)</label>
                  <input
                    type="text"
                    value={ntsApprovalNumber}
                    onChange={(e) => setNtsApprovalNumber(e.target.value)}
                    placeholder="예: 20260829-41000000-00000000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono text-blue-600 dark:text-blue-400"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingInvoice ? '수정사항 저장' : '전자세금계산서 등록'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. PREVIEW & PRINT TAX INVOICE (Hometax Standard Form)     */}
      {/* ========================================================= */}
      {isPreviewModalOpen && previewInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:m-0 print:p-0 p-4 sm:p-8 space-y-6">
            
            {/* Header Actions (Print / Close) */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-bold">
                  공급자 보관용 / 공급받는자용
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  관리번호: {previewInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>인쇄하기 (Print)</span>
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Standard Korean Electronic Tax Invoice Layout (Red Border) */}
            <div className="border-2 border-red-600 p-4 sm:p-6 space-y-4 text-xs">
              
              {/* Title & Issue Header */}
              <div className="flex justify-between items-center border-b-2 border-red-600 pb-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono text-slate-600">
                    승인번호: {previewInvoice.ntsApprovalNumber || previewInvoice.invoiceNumber}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    작성일자: {previewInvoice.issueDate}
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-xl sm:text-2xl font-black tracking-widest text-red-600 underline underline-offset-4 decoration-red-600">
                    전 자 세 금 계 산 서
                  </h2>
                  <p className="text-[11px] text-red-500 font-bold mt-1">
                    (공급자 보관용 / 공급받는자 발행용)
                  </p>
                </div>

                <div className="text-right text-[10px] font-mono text-slate-600">
                  구분: {previewInvoice.invoiceType || '일반'}<br />
                  상태: {previewInvoice.status || '발행완료'}
                </div>
              </div>

              {/* Two Parties Boxes (Red vs Blue Table) */}
              <div className="grid grid-cols-2 border border-red-500 divide-x divide-red-500">
                
                {/* Supplier (공급자) */}
                <table className="w-full text-left divide-y divide-red-200">
                  <tbody>
                    <tr className="bg-red-50/60">
                      <th className="p-1.5 w-16 text-center font-bold text-red-700 border-r border-red-200">등록번호</th>
                      <td className="p-1.5 font-mono font-bold text-red-900 text-sm" colSpan={3}>
                        {previewInvoice.supplierRegistrationNumber || '504-81-12345'}
                      </td>
                    </tr>
                    <tr>
                      <th className="p-1.5 text-center font-bold text-slate-700 border-r border-red-200">상호(법인명)</th>
                      <td className="p-1.5 font-bold text-slate-900">{previewInvoice.supplierOfficeName}</td>
                      <th className="p-1.5 text-center font-bold text-slate-700 border-r border-red-200">성명</th>
                      <td className="p-1.5 font-semibold text-slate-900">{previewInvoice.supplierRepresentative}</td>
                    </tr>
                    <tr>
                      <th className="p-1.5 text-center font-bold text-slate-700 border-r border-red-200">사업장주소</th>
                      <td className="p-1.5 text-[11px]" colSpan={3}>{previewInvoice.supplierAddress || '-'}</td>
                    </tr>
                    <tr>
                      <th className="p-1.5 text-center font-bold text-slate-700 border-r border-red-200">업태</th>
                      <td className="p-1.5">{previewInvoice.supplierBizType || '서비스'}</td>
                      <th className="p-1.5 text-center font-bold text-slate-700 border-r border-red-200">종목</th>
                      <td className="p-1.5">{previewInvoice.supplierBizCategory || '인력공급'}</td>
                    </tr>
                    <tr>
                      <th className="p-1.5 text-center font-bold text-slate-700 border-r border-red-200">이메일</th>
                      <td className="p-1.5 font-mono text-[11px] text-blue-700" colSpan={3}>
                        {previewInvoice.supplierEmail || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Buyer (공급받는자) */}
                <table className="w-full text-left divide-y divide-blue-200">
                  <tbody>
                    <tr className="bg-blue-50/60">
                      <th className="p-1.5 w-16 text-center font-bold text-blue-700 border-r border-blue-200">등록번호</th>
                      <td className="p-1.5 font-mono font-bold text-blue-900 text-sm" colSpan={3}>
                        {previewInvoice.buyerRegistrationNumber || '-'}
                      </td>
                    </tr>
                    <tr>
                      <th className="p-1.5 text-center font-bold text-slate-700 border-r border-blue-200">상호(법인명)</th>
                      <td className="p-1.5 font-bold text-slate-900">{previewInvoice.buyerOfficeName}</td>
                      <th className="p-1.5 text-center font-bold text-slate-700 border-r border-blue-200">성명</th>
                      <td className="p-1.5 font-semibold text-slate-900">{previewInvoice.buyerRepresentative || '-'}</td>
                    </tr>
                    <tr>
                      <th className="p-1.5 text-center font-bold text-slate-700 border-r border-blue-200">사업장주소</th>
                      <td className="p-1.5 text-[11px]" colSpan={3}>{previewInvoice.buyerAddress || '-'}</td>
                    </tr>
                    <tr>
                      <th className="p-1.5 text-center font-bold text-slate-700 border-r border-blue-200">업태</th>
                      <td className="p-1.5">{previewInvoice.buyerBizType || '-'}</td>
                      <th className="p-1.5 text-center font-bold text-slate-700 border-r border-blue-200">종목</th>
                      <td className="p-1.5">{previewInvoice.buyerBizCategory || '-'}</td>
                    </tr>
                    <tr>
                      <th className="p-1.5 text-center font-bold text-slate-700 border-r border-blue-200">이메일</th>
                      <td className="p-1.5 font-mono text-[11px] text-blue-700" colSpan={3}>
                        {previewInvoice.buyerEmail || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>

              </div>

              {/* Total Billing Bar */}
              <div className="border border-red-500 bg-red-50/40 p-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div>
                    <span className="font-bold text-slate-700 mr-2">공급가액:</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {(previewInvoice.supplyAmount || 0).toLocaleString()} 원
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 mr-2">세액(VAT):</span>
                    <span className="font-mono font-bold text-sm text-red-700">
                      {(previewInvoice.taxAmount || 0).toLocaleString()} 원
                    </span>
                  </div>
                </div>
                <div>
                  <span className="font-bold text-slate-800 mr-2">합계금액(총 청구액):</span>
                  <span className="font-mono font-black text-base text-red-700 underline">
                    {(previewInvoice.totalAmount || 0).toLocaleString()} 원
                  </span>
                </div>
              </div>

              {/* Items List Table */}
              <div className="border border-red-500">
                <table className="w-full text-center border-collapse">
                  <thead className="bg-red-50/80 text-red-900 font-bold border-b border-red-500">
                    <tr>
                      <th className="p-2 border-r border-red-300 w-24">월 / 일</th>
                      <th className="p-2 border-r border-red-300 text-left">품 목 (규격)</th>
                      <th className="p-2 border-r border-red-300 w-16">수량</th>
                      <th className="p-2 border-r border-red-300 w-28 text-right">단가</th>
                      <th className="p-2 border-r border-red-300 w-28 text-right">공급가액</th>
                      <th className="p-2 border-r border-red-300 w-24 text-right">세액</th>
                      <th className="p-2 w-28">비고</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-200">
                    {previewInvoice.items && previewInvoice.items.length > 0 ? (
                      previewInvoice.items.map((it, i) => (
                        <tr key={it.id || i}>
                          <td className="p-1.5 border-r border-red-200 font-mono text-[11px]">{it.date}</td>
                          <td className="p-1.5 border-r border-red-200 text-left font-medium">{it.itemDescription}</td>
                          <td className="p-1.5 border-r border-red-200 font-mono">{it.quantity}</td>
                          <td className="p-1.5 border-r border-red-200 text-right font-mono">{(it.unitPrice || 0).toLocaleString()}</td>
                          <td className="p-1.5 border-r border-red-200 text-right font-mono font-bold">{(it.supplyAmount || 0).toLocaleString()}</td>
                          <td className="p-1.5 border-r border-red-200 text-right font-mono text-red-600">{(it.taxAmount || 0).toLocaleString()}</td>
                          <td className="p-1.5 text-[11px] text-slate-500">{it.remark || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-slate-400">품목 내역이 없습니다.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Remarks & Stamp Footer */}
              <div className="border border-red-500 p-3 flex justify-between items-center bg-slate-50">
                <div className="text-xs text-slate-600">
                  <span className="font-bold mr-1">비고:</span>
                  {previewInvoice.remarks || '위 금액을 영수(청구)합니다.'}
                </div>
                <div className="text-xs font-bold text-slate-800">
                  이 금액을 <span className="underline font-black text-red-600">청구(영수)</span>함.
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. IMPORT FROM DISPATCH LOGS MODAL                        */}
      {/* ========================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-5 sm:p-6 space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  출력일지 데이터로 자동 생성
                </h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                선택한 업체의 특정 기간 출력일지(인부 수 및 청구금액/수수료)를 분석하여 세금계산서 품목으로 일괄 불러옵니다.
              </p>

              {/* Client Select */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">대상 거래처 / 현장 *</label>
                <select
                  value={importClientId}
                  onChange={(e) => setImportClientId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">거래처를 선택해 주세요 (가나다순)...</option>
                  {[...clients]
                    .sort((a, b) => (a.clientName || '').localeCompare(b.clientName || '', 'ko-KR'))
                    .map((c) => (
                      <option key={c.id} value={c.clientName}>
                        {c.clientName} {c.registrationNumber ? `(${c.registrationNumber})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">시작일자</label>
                  <input
                    type="date"
                    value={importStartDate}
                    onChange={(e) => setImportStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">종료일자</label>
                  <input
                    type="date"
                    value={importEndDate}
                    onChange={(e) => setImportEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Calculation Mode */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">세금계산서 청구 기준</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportCalculationMode('total_billing')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      importCalculationMode === 'total_billing'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-black">현장 총 청구액 기준</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">인부 일당 + 수수료 전체 금액</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportCalculationMode('fee_only')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      importCalculationMode === 'fee_only'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-black">사무소 수수료만 기준</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">순수 알선수수료(1.6만 등)만 발행</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleExecuteImportFromLogs}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <span>일지 불러오기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
