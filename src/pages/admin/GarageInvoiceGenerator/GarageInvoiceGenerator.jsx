import { useState, useEffect, useRef } from 'react';
import {
    getCars,
    getGarageInvoices,
    createGarageInvoice,
    updateGarageInvoice,
    deleteGarageInvoice,
    generateGarageInvoiceNumber,
    DEFAULT_GARAGE_BUSINESS
} from '../../../services/dataService';
import { normalizeMake } from '../../../utils/makeUtils';
import './GarageInvoiceGenerator.css';

// Currency formatter
const formatGBP = (num) => {
    const val = parseFloat(num) || 0;
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val);
};

// Date formatter e.g. "15 Aug 2023"
const formatDateUK = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
};

export default function GarageInvoiceGenerator() {
    const [invoicesList, setInvoicesList] = useState([]);
    const [carsList, setCarsList] = useState([]);
    const [viewMode, setViewMode] = useState('form'); // 'list' or 'form'
    const [layoutMode, setLayoutMode] = useState('split'); // 'split', 'form-only', 'preview-only'
    const [currentInvoiceId, setCurrentInvoiceId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [zoomPercent, setZoomPercent] = useState(70);
    const [autoFit, setAutoFit] = useState(true);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Draggable Split-Pane State
    const [splitRatio, setSplitRatio] = useState(() => {
        const saved = localStorage.getItem('gig_split_ratio');
        return saved ? Math.min(78, Math.max(22, parseFloat(saved))) : 48;
    });
    const [isDraggingSplit, setIsDraggingSplit] = useState(false);

    // 1. Invoice Details
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [customerRef, setCustomerRef] = useState('');
    const [vatNumber, setVatNumber] = useState('404320354');
    const [jobNumber, setJobNumber] = useState('');
    const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [mileage, setMileage] = useState('');

    // 2. Customer Details
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        telephone: '',
        mobile: '',
        email: '',
        address: ''
    });

    // 3. Vehicle Details
    const [selectedCarId, setSelectedCarId] = useState('');
    const [vehicleDetails, setVehicleDetails] = useState({
        registration: '',
        make: '',
        model: '',
        bodyType: '',
        engineSize: '',
        fuelType: '',
        year: '',
        mileage: ''
    });

    // 4. Labour Section
    const [labourItems, setLabourItems] = useState([
        {
            id: 'lab-1',
            code: 'LAB1',
            description: 'Standard Labour\nO/S/F SUSPENSION ARM TOP',
            quantity: 1.00,
            unitPrice: 62.00
        },
        {
            id: 'lab-2',
            code: 'LAB1',
            description: 'Standard Labour\nN/S/F SUSPENSION ARM TOP',
            quantity: 1.00,
            unitPrice: 63.00
        }
    ]);

    // 5. Products Section
    const [productItems, setProductItems] = useState([
        {
            id: 'prod-1',
            productNumber: '615630269',
            description: 'SUSPENSION ARM (FR AXLE) UPP LH -\nS-TYPE 99-09 / XF 08- (FROM M45255)',
            quantity: 1,
            unitPrice: 96.35
        },
        {
            id: 'prod-2',
            productNumber: '615630279',
            description: 'SUSPENSION ARM (FR AXLE) UPP RH -\nS-TYPE 99-09 / XF 08- (FROM M45255)',
            quantity: 1,
            unitPrice: 95.36
        }
    ]);

    // 6. Garage Stamp Settings
    const [garageStamp, setGarageStamp] = useState({
        type: 'box', // 'box' (Blank Rubber Stamp Box), 'digital' (Official Digital Seal), 'text' (Custom Text), 'upload' (Image)
        text: 'Crystal Shine Motors Ltd\nAuthorised Workshop Seal\nOpenshaw, Manchester',
        imageData: ''
    });

    // 7. Invoice Totals & VAT Rate
    const [vatRate, setVatRate] = useState(20); // Default 20% UK rate, editable

    // 8. CRITICAL: Additional Empty Field at the Very End
    // Blank label, blank value, no placeholder
    const [bottomCustomField, setBottomCustomField] = useState('');

    const printableDocRef = useRef(null);
    const pdfCaptureRef = useRef(null);
    const splitContainerRef = useRef(null);
    const previewWrapperRef = useRef(null);

    // Initial load
    useEffect(() => {
        const storedInvoices = getGarageInvoices() || [];
        setInvoicesList(storedInvoices);
        setCarsList(getCars() || []);

        // If invoices exist, load the first one by default for immediate preview
        if (storedInvoices.length > 0) {
            loadInvoiceIntoForm(storedInvoices[0]);
        } else {
            handleCreateNewInvoice();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Drag Listener for Sliding Splitter Left/Right
    useEffect(() => {
        if (!isDraggingSplit) return;

        const handleMouseMove = (e) => {
            if (!splitContainerRef.current) return;
            const rect = splitContainerRef.current.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const relativeX = clientX - rect.left;
            const newPercent = (relativeX / rect.width) * 100;
            const clamped = Math.min(78, Math.max(22, newPercent));
            setSplitRatio(clamped);
            localStorage.setItem('gig_split_ratio', String(clamped));
        };

        const handleMouseUp = () => {
            setIsDraggingSplit(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleMouseMove);
        window.addEventListener('touchend', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDraggingSplit]);

    // Auto-Fit Document Zoom based on Preview Pane Width
    useEffect(() => {
        if (!autoFit || !previewWrapperRef.current) return;

        const updateAutoZoom = () => {
            if (previewWrapperRef.current) {
                const wrapperW = previewWrapperRef.current.clientWidth - 40; // account for padding
                // Standard A4 width is 794px at 96 DPI (210mm)
                const fitScale = Math.min(100, Math.max(35, Math.round((wrapperW / 794) * 100)));
                setZoomPercent(fitScale);
            }
        };

        updateAutoZoom();
        const timeout = setTimeout(updateAutoZoom, 50);
        window.addEventListener('resize', updateAutoZoom);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('resize', updateAutoZoom);
        };
    }, [autoFit, splitRatio, layoutMode]);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3500);
    };

    // Load an invoice into form state
    const loadInvoiceIntoForm = (inv) => {
        setCurrentInvoiceId(inv.id);
        setInvoiceNumber(inv.invoice_number || '');
        setInvoiceDate(inv.invoice_date || new Date().toISOString().slice(0, 10));
        setCustomerRef(inv.customer_ref || '');
        setVatNumber(inv.vat_number || '404320354');
        setJobNumber(inv.job_number || '');
        setBookingDate(inv.booking_date || new Date().toISOString().slice(0, 10));
        setMileage(inv.mileage || inv.vehicle_details?.mileage || '');

        setCustomerDetails({
            name: inv.customer_details?.name || '',
            telephone: inv.customer_details?.telephone || '',
            mobile: inv.customer_details?.mobile || '',
            email: inv.customer_details?.email || '',
            address: inv.customer_details?.address || ''
        });

        setVehicleDetails({
            registration: inv.vehicle_details?.registration || '',
            make: inv.vehicle_details?.make || '',
            model: inv.vehicle_details?.model || '',
            bodyType: inv.vehicle_details?.bodyType || inv.vehicle_details?.body_type || '',
            engineSize: inv.vehicle_details?.engineSize || inv.vehicle_details?.engine_size || '',
            fuelType: inv.vehicle_details?.fuelType || inv.vehicle_details?.fuel_type || '',
            year: inv.vehicle_details?.year || inv.vehicle_details?.manufacture_year || '',
            mileage: inv.vehicle_details?.mileage || inv.mileage || ''
        });

        // Parse labour items
        if (Array.isArray(inv.labour_items) && inv.labour_items.length > 0) {
            setLabourItems(inv.labour_items.map(l => ({
                id: l.id || `lab-${Date.now()}-${Math.random()}`,
                code: l.code || '',
                description: l.description || '',
                quantity: parseFloat(l.quantity) || 0,
                unitPrice: parseFloat(l.unitPrice ?? l.unit_price) || 0
            })));
        } else {
            setLabourItems([]);
        }

        // Parse product items
        if (Array.isArray(inv.product_items) && inv.product_items.length > 0) {
            setProductItems(inv.product_items.map(p => ({
                id: p.id || `prod-${Date.now()}-${Math.random()}`,
                productNumber: p.productNumber || p.product_number || '',
                description: p.description || '',
                quantity: parseFloat(p.quantity) || 0,
                unitPrice: parseFloat(p.unitPrice ?? p.unit_price) || 0
            })));
        } else {
            setProductItems([]);
        }

        if (inv.garage_stamp) {
            setGarageStamp({
                type: inv.garage_stamp.type || 'box',
                text: inv.garage_stamp.text || 'Crystal Shine Motors Ltd\nAuthorised Workshop Seal\nOpenshaw, Manchester',
                imageData: inv.garage_stamp.imageData || ''
            });
        } else {
            setGarageStamp({
                type: 'box',
                text: 'Crystal Shine Motors Ltd\nAuthorised Workshop Seal\nOpenshaw, Manchester',
                imageData: ''
            });
        }

        setVatRate(inv.vat_rate !== undefined ? parseFloat(inv.vat_rate) : 20);
        setBottomCustomField(inv.bottom_custom_field || '');
    };

    // Reset and Create New Blank Invoice
    const handleCreateNewInvoice = () => {
        const newInvNum = generateGarageInvoiceNumber();
        const todayStr = new Date().toISOString().slice(0, 10);
        setCurrentInvoiceId(null);
        setInvoiceNumber(newInvNum);
        setInvoiceDate(todayStr);
        setCustomerRef('');
        setVatNumber('404320354');
        setJobNumber(`JB-${Math.floor(100000 + Math.random() * 900000)}`);
        setBookingDate(todayStr);
        setMileage('');

        setCustomerDetails({
            name: '',
            telephone: '',
            mobile: '',
            email: '',
            address: ''
        });

        setSelectedCarId('');
        setVehicleDetails({
            registration: '',
            make: '',
            model: '',
            bodyType: '',
            engineSize: '',
            fuelType: '',
            year: '',
            mileage: ''
        });

        setLabourItems([
            { id: `lab-${Date.now()}-1`, code: 'LAB1', description: '', quantity: 1, unitPrice: 0 }
        ]);

        setProductItems([
            { id: `prod-${Date.now()}-1`, productNumber: '', description: '', quantity: 1, unitPrice: 0 }
        ]);

        setGarageStamp({
            type: 'box',
            text: 'Crystal Shine Motors Ltd\nAuthorised Workshop Seal\nOpenshaw, Manchester',
            imageData: ''
        });

        setVatRate(20);
        setBottomCustomField('');
        setViewMode('form');
        showToast(`Created new invoice draft: ${newInvNum}`);
    };

    // Quick populate vehicle from stock
    const handleCarSelect = (carId) => {
        setSelectedCarId(carId);
        if (!carId) return;
        const car = carsList.find(c => c.id === carId);
        if (car) {
            setVehicleDetails({
                registration: (car.registration || '').toUpperCase(),
                make: normalizeMake(car.make) || '',
                model: car.model || '',
                bodyType: (car.bodyType || '').toUpperCase(),
                engineSize: car.engine || '',
                fuelType: (car.fuel || '').toUpperCase(),
                year: car.year ? String(car.year) : '',
                mileage: car.mileage ? String(car.mileage) : ''
            });
            if (car.mileage && !mileage) {
                setMileage(String(car.mileage));
            }
            showToast(`Loaded ${car.make} ${car.model} (${car.registration || 'No Reg'})`);
        }
    };

    // --- Calculations ---
    // Labour Line Totals & Subtotal
    const labourTotalExVat = labourItems.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        return sum + (qty * price);
    }, 0);

    // Products Line Totals & Subtotal
    const productsTotalExVat = productItems.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        return sum + (qty * price);
    }, 0);

    // Subtotal = Labour Total + Products Total
    const subtotal = labourTotalExVat + productsTotalExVat;

    // VAT = Subtotal × VAT Rate
    const vatAmount = subtotal * ((parseFloat(vatRate) || 0) / 100);

    // Total Including VAT = Subtotal + VAT
    const totalIncVat = subtotal + vatAmount;

    // --- Labour Actions ---
    const handleAddLabourRow = () => {
        setLabourItems(prev => [
            ...prev,
            { id: `lab-${Date.now()}-${Math.random()}`, code: 'LAB1', description: '', quantity: 1, unitPrice: 0 }
        ]);
    };

    const handleUpdateLabourRow = (id, field, value) => {
        setLabourItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleRemoveLabourRow = (id) => {
        setLabourItems(prev => prev.filter(item => item.id !== id));
    };

    // --- Product Actions ---
    const handleAddProductRow = () => {
        setProductItems(prev => [
            ...prev,
            { id: `prod-${Date.now()}-${Math.random()}`, productNumber: '', description: '', quantity: 1, unitPrice: 0 }
        ]);
    };

    const handleUpdateProductRow = (id, field, value) => {
        setProductItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleRemoveProductRow = (id) => {
        setProductItems(prev => prev.filter(item => item.id !== id));
    };

    // Handle Stamp Image Upload
    const handleStampImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setGarageStamp(prev => ({
                ...prev,
                type: 'upload',
                imageData: event.target.result
            }));
            showToast('Stamp image uploaded successfully');
        };
        reader.readAsDataURL(file);
    };

    // Save invoice to storage
    const handleSaveInvoice = (e) => {
        if (e && e.preventDefault) e.preventDefault();

        const invPayload = {
            id: currentInvoiceId || undefined,
            invoice_number: invoiceNumber.trim() || generateGarageInvoiceNumber(),
            invoice_date: invoiceDate,
            customer_ref: customerRef.trim(),
            vat_number: vatNumber.trim(),
            job_number: jobNumber.trim(),
            booking_date: bookingDate,
            mileage: mileage.trim() || vehicleDetails.mileage.trim(),
            customer_details: {
                ...customerDetails
            },
            vehicle_details: {
                ...vehicleDetails,
                mileage: mileage.trim() || vehicleDetails.mileage.trim()
            },
            labour_items: labourItems.map(l => ({
                id: l.id,
                code: l.code,
                description: l.description,
                quantity: parseFloat(l.quantity) || 0,
                unit_price: parseFloat(l.unitPrice) || 0
            })),
            product_items: productItems.map(p => ({
                id: p.id,
                product_number: p.productNumber,
                description: p.description,
                quantity: parseFloat(p.quantity) || 0,
                unit_price: parseFloat(p.unitPrice) || 0
            })),
            garage_stamp: {
                ...garageStamp
            },
            vat_rate: parseFloat(vatRate) || 0,
            bottom_custom_field: bottomCustomField,
            subtotal: subtotal,
            vat_amount: vatAmount,
            total_inc_vat: totalIncVat
        };

        let saved;
        if (currentInvoiceId) {
            saved = updateGarageInvoice(currentInvoiceId, invPayload);
            showToast(`Invoice ${saved.invoice_number} updated successfully!`);
        } else {
            saved = createGarageInvoice(invPayload);
            setCurrentInvoiceId(saved.id);
            showToast(`Invoice ${saved.invoice_number} saved successfully!`);
        }

        setInvoicesList(getGarageInvoices());
        return saved;
    };

    // Print Invoice
    const handlePrintInvoice = () => {
        handleSaveInvoice();
        window.print();
    };

    // Download PDF via html2pdf.js - captures the EXACT rendered preview element with ZERO changes
    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        handleSaveInvoice();

        const loadHtml2Pdf = () => {
            return new Promise((resolve, reject) => {
                if (window.html2pdf) {
                    resolve(window.html2pdf);
                    return;
                }
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                script.onload = () => resolve(window.html2pdf);
                script.onerror = (err) => reject(err);
                document.body.appendChild(script);
            });
        };

        try {
            const html2pdf = await loadHtml2Pdf();
            const cleanReg = (vehicleDetails.registration || 'VEHICLE').trim().replace(/[/\\?%*:|"<>]/g, '');
            const cleanInv = (invoiceNumber || 'INVOICE').trim().replace(/[/\\?%*:|"<>]/g, '');
            const filename = `Garage_Invoice_${cleanInv}_${cleanReg}.pdf`;

            // Wait 150ms for React state and DOM to position the capture container at 1:1 scale
            await new Promise(r => setTimeout(r, 150));

            const targetElement = pdfCaptureRef.current;
            if (!targetElement) {
                throw new Error('PDF capture element not available');
            }

            const opt = {
                margin: 0,
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    scrollX: 0,
                    scrollY: 0
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait'
                },
                pagebreak: { mode: 'avoid-all' }
            };

            await html2pdf().set(opt).from(targetElement).save();
            showToast(`PDF downloaded: ${filename}`);
        } catch (err) {
            console.error('PDF Generation Error:', err);
            alert('Failed to generate PDF. You can also use the "Print Invoice" button to save as PDF.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // Delete Invoice
    const handleDeleteInvoice = () => {
        if (!invoiceToDelete) return;
        deleteGarageInvoice(invoiceToDelete.id);
        const updated = getGarageInvoices();
        setInvoicesList(updated);
        setShowDeleteModal(false);
        setInvoiceToDelete(null);
        showToast('Invoice deleted successfully');

        if (currentInvoiceId === invoiceToDelete.id) {
            if (updated.length > 0) {
                loadInvoiceIntoForm(updated[0]);
            } else {
                handleCreateNewInvoice();
            }
        }
    };

    // Filter invoices in list view
    const filteredInvoices = invoicesList.filter(inv => {
        const q = searchQuery.toLowerCase();
        const num = (inv.invoice_number || '').toLowerCase();
        const name = (inv.customer_details?.name || '').toLowerCase();
        const reg = (inv.vehicle_details?.registration || '').toLowerCase();
        const make = (inv.vehicle_details?.make || '').toLowerCase();
        return num.includes(q) || name.includes(q) || reg.includes(q) || make.includes(q);
    });

    // Render Garage Stamp inside Printable Invoice Document
    const renderGarageStamp = () => {
        if (garageStamp.type === 'digital') {
            return (
                <div className="gig-doc-stamp-digital">
                    <div className="gig-doc-stamp-digital-title">★ CRYSTAL SHINE MOTORS LTD ★</div>
                    <div className="gig-doc-stamp-digital-sub">OFFICIAL GARAGE WORKSHOP STAMP</div>
                    <div className="gig-doc-stamp-digital-sub">QUALITY APPROVED • MANCHESTER M11 2NQ</div>
                </div>
            );
        }

        if (garageStamp.type === 'text') {
            return (
                <div className="gig-doc-stamp-custom-text">
                    {garageStamp.text || 'Crystal Shine Motors Ltd\nAuthorised Workshop Seal'}
                </div>
            );
        }

        if (garageStamp.type === 'upload' && garageStamp.imageData) {
            return (
                <img src={garageStamp.imageData} alt="Garage Stamp" className="gig-doc-stamp-img" />
            );
        }

        // Default 'box' (Blank Rubber Stamp Area for physical ink stamping on paper)
        // User requested: remove the text from blank stamp box
        return <div className="gig-doc-stamp-blank-inner" />;
    };

    // Render the Printable A4 Garage Invoice Document
    const renderInvoiceDocument = (isModal = false, isPdfCapture = false) => {
        const scaleVal = isModal ? 0.9 : zoomPercent / 100;

        return (
            <div
                className="gig-document"
                ref={isPdfCapture ? pdfCaptureRef : (!isModal ? printableDocRef : null)}
                style={isPdfCapture ? {
                    transform: 'none',
                    boxShadow: 'none',
                    margin: 0
                } : {
                    transform: `scale(${scaleVal})`,
                    marginBottom: isModal ? '0' : `${(scaleVal - 1) * 297 * 3.78}px`
                }}
            >
                <div>
                    {/* Header */}
                    <div className="gig-doc-top">
                        <div className="gig-doc-top-left">
                            <span className="gig-doc-top-inv-title">INVOICE NO: {invoiceNumber || 'MWJ101512'}</span>
                            <span className="gig-doc-top-inv-copy">CUSTOMER COPY</span>
                        </div>
                        <div className="gig-doc-top-right">
                            <h1 className="gig-doc-business-name">{DEFAULT_GARAGE_BUSINESS.name}</h1>
                            <p className="gig-doc-business-addr">{DEFAULT_GARAGE_BUSINESS.address}</p>
                            <p className="gig-doc-business-tel">Tel: {DEFAULT_GARAGE_BUSINESS.telephone}</p>
                        </div>
                    </div>

                    {/* Invoice Details Bar: Invoice No & Invoice Date only */}
                    <div className="gig-doc-meta-bar">
                        <div className="gig-doc-meta-bar-item">
                            <span className="gig-doc-meta-label">Invoice No:</span>
                            <span className="gig-doc-meta-val">{invoiceNumber || '—'}</span>
                        </div>
                        <div className="gig-doc-meta-bar-item">
                            <span className="gig-doc-meta-label">Invoice Date:</span>
                            <span className="gig-doc-meta-val">{formatDateUK(invoiceDate)}</span>
                        </div>
                    </div>

                    {/* Customer & Vehicle Information 2-Column Row */}
                    <div className="gig-doc-mid-row">
                        {/* Customer Information (Invoice To) */}
                        <div className="gig-doc-cust-col">
                            <h2 className="gig-doc-section-heading">Invoice To</h2>
                            <div className="gig-doc-cust-info">
                                <div className="gig-doc-cust-name">{customerDetails.name || '—'}</div>
                                {customerDetails.address && (
                                    <div style={{ whiteSpace: 'pre-line', color: '#374151', marginBottom: '4px' }}>
                                        {customerDetails.address}
                                    </div>
                                )}
                                <div className="gig-doc-veh-item">
                                    <span className="gig-doc-veh-label">Telephone:</span>
                                    <span className="gig-doc-veh-val">{customerDetails.telephone || '—'}</span>
                                </div>
                                <div className="gig-doc-veh-item">
                                    <span className="gig-doc-veh-label">Mobile:</span>
                                    <span className="gig-doc-veh-val">{customerDetails.mobile || '—'}</span>
                                </div>
                                <div className="gig-doc-veh-item">
                                    <span className="gig-doc-veh-label">Email:</span>
                                    <span className="gig-doc-veh-val" style={{ textTransform: 'none' }}>{customerDetails.email || '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Information */}
                        <div className="gig-doc-veh-col">
                            <h2 className="gig-doc-section-heading">Vehicle Information</h2>
                            {/* UK Yellow Number Plate */}
                            <div className="gig-doc-plate-container">
                                <div className="gig-doc-plate">
                                    <div className="gig-doc-plate-badge">
                                        <span className="gig-doc-plate-stars">★★★★</span>
                                        <span className="gig-doc-plate-country">GB</span>
                                    </div>
                                    <span className="gig-doc-plate-reg">
                                        {vehicleDetails.registration || 'YR62XEJ'}
                                    </span>
                                </div>
                            </div>

                            <div className="gig-doc-veh-details">
                                <div className="gig-doc-veh-item">
                                    <span className="gig-doc-veh-label">Make/Model:</span>
                                    <span className="gig-doc-veh-val">
                                        {vehicleDetails.make || vehicleDetails.model ? `${vehicleDetails.make} ${vehicleDetails.model}`.trim() : '—'}
                                    </span>
                                </div>
                                <div className="gig-doc-veh-item">
                                    <span className="gig-doc-veh-label">Body Type:</span>
                                    <span className="gig-doc-veh-val">{vehicleDetails.bodyType || '—'}</span>
                                </div>
                                <div className="gig-doc-veh-item">
                                    <span className="gig-doc-veh-label">Engine Size:</span>
                                    <span className="gig-doc-veh-val">{vehicleDetails.engineSize || '—'}</span>
                                </div>
                                <div className="gig-doc-veh-item">
                                    <span className="gig-doc-veh-label">Fuel Type:</span>
                                    <span className="gig-doc-veh-val">{vehicleDetails.fuelType || '—'}</span>
                                </div>
                                <div className="gig-doc-veh-item">
                                    <span className="gig-doc-veh-label">Manufacture:</span>
                                    <span className="gig-doc-veh-val">{vehicleDetails.year || '—'}</span>
                                </div>
                                <div className="gig-doc-veh-item">
                                    <span className="gig-doc-veh-label">Mileage:</span>
                                    <span className="gig-doc-veh-val">{vehicleDetails.mileage || mileage || '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Labour Section */}
                    <div className="gig-doc-table-section">
                        <h2 className="gig-doc-section-heading">Labour</h2>
                        <table className="gig-doc-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '18%' }}>Labour Code</th>
                                    <th style={{ width: '42%' }}>Description</th>
                                    <th style={{ width: '12%' }} className="gig-text-center">Quantity</th>
                                    <th style={{ width: '14%' }} className="gig-text-right">Unit Price</th>
                                    <th style={{ width: '14%' }} className="gig-text-right">Total (ex. VAT)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {labourItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '8px' }}>
                                            No labour items entered.
                                        </td>
                                    </tr>
                                ) : (
                                    labourItems.map((item, idx) => {
                                        const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
                                        return (
                                            <tr key={item.id || idx}>
                                                <td style={{ fontWeight: 600 }}>{item.code || '—'}</td>
                                                <td style={{ whiteSpace: 'pre-line' }}>{item.description || '—'}</td>
                                                <td className="gig-text-center">{(parseFloat(item.quantity) || 0).toFixed(2)}</td>
                                                <td className="gig-text-right">{formatGBP(item.unitPrice)}</td>
                                                <td className="gig-text-right" style={{ fontWeight: 600 }}>{formatGBP(lineTotal)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                        <div className="gig-doc-subtotal-line">
                            Labour Total Ex Vat: {formatGBP(labourTotalExVat)}
                        </div>
                    </div>

                    {/* Products Section */}
                    <div className="gig-doc-table-section">
                        <h2 className="gig-doc-section-heading">Products</h2>
                        <table className="gig-doc-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '18%' }}>Product No.</th>
                                    <th style={{ width: '42%' }}>Description</th>
                                    <th style={{ width: '12%' }} className="gig-text-center">Quantity</th>
                                    <th style={{ width: '14%' }} className="gig-text-right">Unit Price</th>
                                    <th style={{ width: '14%' }} className="gig-text-right">Total (ex. VAT)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '8px' }}>
                                            No products entered.
                                        </td>
                                    </tr>
                                ) : (
                                    productItems.map((item, idx) => {
                                        const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
                                        return (
                                            <tr key={item.id || idx}>
                                                <td style={{ fontWeight: 600 }}>{item.productNumber || '—'}</td>
                                                <td style={{ whiteSpace: 'pre-line' }}>{item.description || '—'}</td>
                                                <td className="gig-text-center">{parseFloat(item.quantity) || 0}</td>
                                                <td className="gig-text-right">{formatGBP(item.unitPrice)}</td>
                                                <td className="gig-text-right" style={{ fontWeight: 600 }}>{formatGBP(lineTotal)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                        <div className="gig-doc-subtotal-line">
                            Products Total Ex Vat: {formatGBP(productsTotalExVat)}
                        </div>
                    </div>

                    {/* Bottom Summary Row: Garage Stamp on Left + Totals on Right */}
                    <div className="gig-doc-bottom-summary-row">
                        {/* Garage Stamp Box */}
                        <div className="gig-doc-stamp-container">
                            <div className="gig-doc-stamp-box">
                                {renderGarageStamp()}
                            </div>
                        </div>

                        {/* Invoice Totals Summary Block */}
                        <div className="gig-doc-totals-block">
                            <table className="gig-doc-totals-table">
                                <tbody>
                                    <tr>
                                        <td className="gig-total-label">Sub Total:</td>
                                        <td className="gig-total-val">{formatGBP(subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td className="gig-total-label">VAT:</td>
                                        <td className="gig-total-val">{formatGBP(vatAmount)}</td>
                                    </tr>
                                    <tr>
                                        <td className="gig-total-label gig-doc-grand-total">Total (inc. VAT):</td>
                                        <td className="gig-total-val gig-doc-grand-total">{formatGBP(totalIncVat)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* CRITICAL Requirement 5: Additional Empty Field at the Very End */}
                {/* No label, no placeholder, completely unlabelled and editable on invoice */}
                <div className="gig-doc-empty-field">
                    {bottomCustomField || ''}
                </div>
            </div>
        );
    };

    return (
        <div className="gig-container">
            {/* Header */}
            <header className="gig-header no-print">
                <div>
                    <h1 className="gig-header-title">Garage Invoice Generator</h1>
                    <p className="gig-header-subtitle">
                        Create, edit, calculate, print, and export Crystal Shine Motors Ltd garage repair & service invoices.
                    </p>
                </div>
                <div className="gig-header-actions">
                    {viewMode === 'form' ? (
                        <>
                            {/* Layout Mode Selector (Split / Full Editor / Preview) */}
                            <div className="gig-layout-mode-toggles">
                                <button
                                    type="button"
                                    className={`gig-layout-toggle-btn ${layoutMode === 'split' ? 'gig-layout-toggle-btn--active' : ''}`}
                                    onClick={() => setLayoutMode('split')}
                                    title="Interactive Resizable Split View"
                                >
                                    <span>🔲 Split View</span>
                                </button>
                                <button
                                    type="button"
                                    className={`gig-layout-toggle-btn ${layoutMode === 'form-only' ? 'gig-layout-toggle-btn--active' : ''}`}
                                    onClick={() => setLayoutMode('form-only')}
                                    title="Wide Full-Width Editor"
                                >
                                    <span>📝 Full Editor</span>
                                </button>
                                <button
                                    type="button"
                                    className={`gig-layout-toggle-btn ${layoutMode === 'preview-only' ? 'gig-layout-toggle-btn--active' : ''}`}
                                    onClick={() => setLayoutMode('preview-only')}
                                    title="Full-Width Document Preview"
                                >
                                    <span>👁️ Full Preview</span>
                                </button>
                            </div>

                            <button
                                type="button"
                                className="btn btn--outline"
                                onClick={() => setViewMode('list')}
                            >
                                📋 Invoices Directory ({invoicesList.length})
                            </button>
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={handleCreateNewInvoice}
                            >
                                ＋ Create New Invoice
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="btn btn--primary"
                            onClick={handleCreateNewInvoice}
                        >
                            ＋ Create New Invoice
                        </button>
                    )}
                </div>
            </header>

            {/* LIST VIEW */}
            {viewMode === 'list' && (
                <div className="gig-card gig-list-view">
                    <div className="gig-table-controls">
                        <input
                            type="text"
                            className="gig-search-input"
                            placeholder="Search by invoice #, customer name, vehicle reg, or make..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="gig-count-badge">
                            {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Invoice' : 'Invoices'}
                        </div>
                    </div>

                    <div className="gig-table-scroll">
                        <table className="gig-table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Vehicle</th>
                                    <th>Registration</th>
                                    <th>Subtotal (ex. VAT)</th>
                                    <th>Total (inc. VAT)</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                                            No garage invoices found. Click <strong>＋ Create New Invoice</strong> to start.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((inv) => (
                                        <tr key={inv.id}>
                                            <td>
                                                <span className="gig-badge gig-badge--inv">
                                                    {inv.invoice_number || '—'}
                                                </span>
                                            </td>
                                            <td>{formatDateUK(inv.invoice_date)}</td>
                                            <td>
                                                <strong>{inv.customer_details?.name || '—'}</strong>
                                                {inv.customer_details?.mobile && (
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        {inv.customer_details.mobile}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {inv.vehicle_details?.make} {inv.vehicle_details?.model}
                                            </td>
                                            <td>
                                                <span className="gig-badge gig-badge--yellow-plate">
                                                    {inv.vehicle_details?.registration || '—'}
                                                </span>
                                            </td>
                                            <td>{formatGBP(inv.subtotal)}</td>
                                            <td style={{ fontWeight: 700, color: '#0f172a' }}>
                                                {formatGBP(inv.total_inc_vat)}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn--sm btn--outline"
                                                        onClick={() => {
                                                            loadInvoiceIntoForm(inv);
                                                            setViewMode('form');
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn--sm btn--secondary"
                                                        onClick={() => {
                                                            loadInvoiceIntoForm(inv);
                                                            setShowPreviewModal(true);
                                                        }}
                                                    >
                                                        Preview
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn--sm btn--danger"
                                                        onClick={() => {
                                                            setInvoiceToDelete(inv);
                                                            setShowDeleteModal(true);
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* FORM & LIVE PREVIEW VIEW */}
            {viewMode === 'form' && (
                <div
                    ref={splitContainerRef}
                    className={`gig-split-layout ${isDraggingSplit ? 'gig-split-layout--dragging' : ''} ${layoutMode === 'form-only' ? 'gig-split-layout--full-form' : ''} ${layoutMode === 'preview-only' ? 'gig-split-layout--full-preview' : ''}`}
                >
                    {/* LEFT COLUMN: FORM CONTROLS */}
                    {(layoutMode === 'split' || layoutMode === 'form-only') && (
                        <div
                            className="gig-form-column no-print"
                            style={{
                                width: layoutMode === 'split' ? `${splitRatio}%` : '100%'
                            }}
                        >
                            {/* Section 1: Invoice Details */}
                            <div className="gig-section">
                                <h2 className="gig-section-title">
                                    <span>1. Invoice Details</span>
                                    <span className="gig-section-badge">Crystal Shine Motors Ltd</span>
                                </h2>

                                <div className="gig-form-grid-2">
                                    <div className="gig-form-group">
                                        <label className="gig-label">Invoice Number</label>
                                        <input
                                            type="text"
                                            className="gig-input"
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="gig-form-group">
                                        <label className="gig-label">Invoice Date</label>
                                        <input
                                            type="date"
                                            className="gig-input"
                                            value={invoiceDate}
                                            onChange={(e) => setInvoiceDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Customer Details */}
                            <div className="gig-section">
                                <h2 className="gig-section-title">2. Customer Details</h2>

                                <div className="gig-form-group">
                                    <label className="gig-label">Customer Name</label>
                                    <input
                                        type="text"
                                        className="gig-input"
                                        placeholder="e.g. Mr SATTAR"
                                        value={customerDetails.name}
                                        onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                                    />
                                </div>

                                <div className="gig-form-grid-3">
                                    <div className="gig-form-group">
                                        <label className="gig-label">Telephone</label>
                                        <input
                                            type="text"
                                            className="gig-input"
                                            placeholder="e.g. 0161 000 0000"
                                            value={customerDetails.telephone}
                                            onChange={(e) => setCustomerDetails({ ...customerDetails, telephone: e.target.value })}
                                        />
                                    </div>
                                    <div className="gig-form-group">
                                        <label className="gig-label">Mobile</label>
                                        <input
                                            type="text"
                                            className="gig-input"
                                            placeholder="e.g. 07581423424"
                                            value={customerDetails.mobile}
                                            onChange={(e) => setCustomerDetails({ ...customerDetails, mobile: e.target.value })}
                                        />
                                    </div>
                                    <div className="gig-form-group">
                                        <label className="gig-label">Email</label>
                                        <input
                                            type="email"
                                            className="gig-input"
                                            placeholder="e.g. customer@example.com"
                                            value={customerDetails.email}
                                            onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="gig-form-group">
                                    <label className="gig-label">Customer Address</label>
                                    <textarea
                                        className="gig-textarea"
                                        placeholder="Enter street address, city, postcode..."
                                        value={customerDetails.address}
                                        onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Section 3: Vehicle Details */}
                            <div className="gig-section">
                                <h2 className="gig-section-title">3. Vehicle Details</h2>

                                {/* Quick fill from inventory */}
                                <div className="gig-quickfill-box">
                                    <div className="gig-quickfill-title">
                                        <span>Quick Fill from Dealership Inventory</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>
                                            (Optional)
                                        </span>
                                    </div>
                                    <select
                                        className="gig-select"
                                        value={selectedCarId}
                                        onChange={(e) => handleCarSelect(e.target.value)}
                                    >
                                        <option value="">-- Choose a vehicle from inventory --</option>
                                        {carsList.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.registration || 'NO REG'} — {c.make} {c.model} ({c.year || 'N/A'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="gig-form-grid-2">
                                    <div className="gig-form-group">
                                        <label className="gig-label">Registration Number (VRM)</label>
                                        <input
                                            type="text"
                                            className="gig-input"
                                            placeholder="e.g. YR62XEJ"
                                            style={{ textTransform: 'uppercase', fontWeight: 700 }}
                                            value={vehicleDetails.registration}
                                            onChange={(e) => setVehicleDetails({ ...vehicleDetails, registration: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="gig-form-group">
                                        <label className="gig-label">Make</label>
                                        <input
                                            type="text"
                                            className="gig-input"
                                            placeholder="e.g. JAGUAR"
                                            value={vehicleDetails.make}
                                            onChange={(e) => setVehicleDetails({ ...vehicleDetails, make: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="gig-form-grid-3">
                                    <div className="gig-form-group">
                                        <label className="gig-label">Model</label>
                                        <input
                                            type="text"
                                            className="gig-input"
                                            placeholder="e.g. XF"
                                            value={vehicleDetails.model}
                                            onChange={(e) => setVehicleDetails({ ...vehicleDetails, model: e.target.value })}
                                        />
                                    </div>
                                    <div className="gig-form-group">
                                        <label className="gig-label">Body Type</label>
                                        <input
                                            type="text"
                                            className="gig-input"
                                            placeholder="e.g. SALOON"
                                            value={vehicleDetails.bodyType}
                                            onChange={(e) => setVehicleDetails({ ...vehicleDetails, bodyType: e.target.value })}
                                        />
                                    </div>
                                    <div className="gig-form-group">
                                        <label className="gig-label">Engine Size</label>
                                        <input
                                            type="text"
                                            className="gig-input"
                                            placeholder="e.g. 2.2L (2179cc)"
                                            value={vehicleDetails.engineSize}
                                            onChange={(e) => setVehicleDetails({ ...vehicleDetails, engineSize: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="gig-form-grid-3">
                                    <div className="gig-form-group">
                                        <label className="gig-label">Fuel Type</label>
                                        <input
                                            type="text"
                                            className="gig-input"
                                            placeholder="e.g. DIESEL"
                                            value={vehicleDetails.fuelType}
                                            onChange={(e) => setVehicleDetails({ ...vehicleDetails, fuelType: e.target.value })}
                                        />
                                    </div>
                                    <div className="gig-form-group">
                                        <label className="gig-label">Year of Manufacture</label>
                                        <input
                                            type="text"
                                            className="gig-input"
                                            placeholder="e.g. 2012"
                                            value={vehicleDetails.year}
                                            onChange={(e) => setVehicleDetails({ ...vehicleDetails, year: e.target.value })}
                                        />
                                    </div>
                                    <div className="gig-form-group">
                                        <label className="gig-label">Mileage</label>
                                        <input
                                            type="text"
                                            className="gig-input"
                                            placeholder="e.g. 84598"
                                            value={vehicleDetails.mileage || mileage}
                                            onChange={(e) => {
                                                setVehicleDetails({ ...vehicleDetails, mileage: e.target.value });
                                                setMileage(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Labour */}
                            <div className="gig-section">
                                <h2 className="gig-section-title">4. Labour</h2>

                                <div className="gig-items-table-wrapper">
                                    <table className="gig-items-form-table">
                                        <thead>
                                            <tr>
                                                <th className="gig-col-code">Labour Code</th>
                                                <th className="gig-col-desc">Description</th>
                                                <th className="gig-col-qty">Quantity</th>
                                                <th className="gig-col-price">Unit Price (£)</th>
                                                <th className="gig-col-action"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {labourItems.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="gig-col-code">
                                                        <input
                                                            type="text"
                                                            value={item.code}
                                                            placeholder="e.g. LAB1"
                                                            onChange={(e) => handleUpdateLabourRow(item.id, 'code', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="gig-col-desc">
                                                        <textarea
                                                            rows="2"
                                                            value={item.description}
                                                            placeholder="Description (multi-line supported)"
                                                            onChange={(e) => handleUpdateLabourRow(item.id, 'description', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="gig-col-qty">
                                                        <input
                                                            type="number"
                                                            step="0.25"
                                                            min="0"
                                                            value={item.quantity}
                                                            onChange={(e) => handleUpdateLabourRow(item.id, 'quantity', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="gig-col-price">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handleUpdateLabourRow(item.id, 'unitPrice', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="gig-col-action">
                                                        <button
                                                            type="button"
                                                            className="gig-btn-remove"
                                                            title="Remove labour entry"
                                                            onClick={() => handleRemoveLabourRow(item.id)}
                                                        >
                                                            ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        className="gig-btn-add"
                                        onClick={handleAddLabourRow}
                                    >
                                        ＋ Add Labour Entry
                                    </button>
                                    <div className="gig-subtotal-indicator">
                                        Labour Subtotal Ex VAT: {formatGBP(labourTotalExVat)}
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Products */}
                            <div className="gig-section">
                                <h2 className="gig-section-title">5. Products</h2>

                                <div className="gig-items-table-wrapper">
                                    <table className="gig-items-form-table">
                                        <thead>
                                            <tr>
                                                <th className="gig-col-code">Product No.</th>
                                                <th className="gig-col-desc">Description</th>
                                                <th className="gig-col-qty">Quantity</th>
                                                <th className="gig-col-price">Unit Price (£)</th>
                                                <th className="gig-col-action"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productItems.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="gig-col-code">
                                                        <input
                                                            type="text"
                                                            value={item.productNumber}
                                                            placeholder="e.g. 615630269"
                                                            onChange={(e) => handleUpdateProductRow(item.id, 'productNumber', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="gig-col-desc">
                                                        <textarea
                                                            rows="2"
                                                            value={item.description}
                                                            placeholder="Description (multi-line supported)"
                                                            onChange={(e) => handleUpdateProductRow(item.id, 'description', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="gig-col-qty">
                                                        <input
                                                            type="number"
                                                            step="1"
                                                            min="0"
                                                            value={item.quantity}
                                                            onChange={(e) => handleUpdateProductRow(item.id, 'quantity', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="gig-col-price">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handleUpdateProductRow(item.id, 'unitPrice', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="gig-col-action">
                                                        <button
                                                            type="button"
                                                            className="gig-btn-remove"
                                                            title="Remove product"
                                                            onClick={() => handleRemoveProductRow(item.id)}
                                                        >
                                                            ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        className="gig-btn-add"
                                        onClick={handleAddProductRow}
                                    >
                                        ＋ Add Product
                                    </button>
                                    <div className="gig-subtotal-indicator">
                                        Products Subtotal Ex VAT: {formatGBP(productsTotalExVat)}
                                    </div>
                                </div>
                            </div>

                            {/* Section 6: Garage Stamp */}
                            <div className="gig-section">
                                <h2 className="gig-section-title">
                                    <span>6. Garage Stamp</span>
                                    <span className="gig-section-badge">Official Stamp & Seal</span>
                                </h2>

                                <div className="gig-stamp-selector-grid">
                                    <div
                                        className={`gig-stamp-option-card ${garageStamp.type === 'box' ? 'gig-stamp-option-card--active' : ''}`}
                                        onClick={() => setGarageStamp({ ...garageStamp, type: 'box' })}
                                    >
                                        <span className="gig-stamp-option-icon">📄</span>
                                        <span className="gig-stamp-option-title">Blank Stamp Box</span>
                                        <span className="gig-stamp-option-desc">For physical rubber stamp on print</span>
                                    </div>

                                    <div
                                        className={`gig-stamp-option-card ${garageStamp.type === 'digital' ? 'gig-stamp-option-card--active' : ''}`}
                                        onClick={() => setGarageStamp({ ...garageStamp, type: 'digital' })}
                                    >
                                        <span className="gig-stamp-option-icon">⭐</span>
                                        <span className="gig-stamp-option-title">Official Digital Seal</span>
                                        <span className="gig-stamp-option-desc">Crystal Shine Motors badge</span>
                                    </div>

                                    <div
                                        className={`gig-stamp-option-card ${garageStamp.type === 'text' ? 'gig-stamp-option-card--active' : ''}`}
                                        onClick={() => setGarageStamp({ ...garageStamp, type: 'text' })}
                                    >
                                        <span className="gig-stamp-option-icon">✍️</span>
                                        <span className="gig-stamp-option-title">Custom Text Stamp</span>
                                        <span className="gig-stamp-option-desc">Type your stamp details</span>
                                    </div>

                                    <div
                                        className={`gig-stamp-option-card ${garageStamp.type === 'upload' ? 'gig-stamp-option-card--active' : ''}`}
                                        onClick={() => setGarageStamp({ ...garageStamp, type: 'upload' })}
                                    >
                                        <span className="gig-stamp-option-icon">🖼️</span>
                                        <span className="gig-stamp-option-title">Upload Image</span>
                                        <span className="gig-stamp-option-desc">Upload rubber stamp graphic</span>
                                    </div>
                                </div>

                                {garageStamp.type === 'text' && (
                                    <div className="gig-form-group" style={{ marginTop: '0.5rem' }}>
                                        <label className="gig-label">Stamp Content / Workshop Details</label>
                                        <textarea
                                            className="gig-textarea"
                                            rows="3"
                                            value={garageStamp.text}
                                            onChange={(e) => setGarageStamp({ ...garageStamp, text: e.target.value })}
                                            placeholder="Enter garage name, branch, phone, or approval notes..."
                                        />
                                    </div>
                                )}

                                {garageStamp.type === 'upload' && (
                                    <div className="gig-form-group" style={{ marginTop: '0.5rem' }}>
                                        <label className="gig-label">Upload Stamp Image (PNG / JPG)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleStampImageUpload}
                                            className="gig-input"
                                        />
                                        {garageStamp.imageData && (
                                            <div style={{ marginTop: '0.5rem', textAlign: 'center', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
                                                <img src={garageStamp.imageData} alt="Stamp Preview" style={{ maxHeight: '60px', margin: '0 auto' }} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Section 7: Invoice Totals & VAT */}
                            <div className="gig-section">
                                <h2 className="gig-section-title">7. Invoice Totals</h2>

                                <div className="gig-totals-summary-card">
                                    <div className="gig-total-row">
                                        <span>Labour Total Ex VAT:</span>
                                        <strong>{formatGBP(labourTotalExVat)}</strong>
                                    </div>
                                    <div className="gig-total-row">
                                        <span>Products Total Ex VAT:</span>
                                        <strong>{formatGBP(productsTotalExVat)}</strong>
                                    </div>
                                    <div className="gig-total-row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem' }}>
                                        <span style={{ fontWeight: 600 }}>Subtotal (Ex VAT):</span>
                                        <strong>{formatGBP(subtotal)}</strong>
                                    </div>

                                    <div className="gig-total-row" style={{ alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>VAT Rate:</span>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                max="100"
                                                value={vatRate}
                                                onChange={(e) => setVatRate(e.target.value)}
                                                style={{
                                                    width: '65px',
                                                    padding: '0.25rem 0.5rem',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '4px',
                                                    fontSize: '0.875rem'
                                                }}
                                            />
                                            <span>%</span>
                                        </div>
                                        <strong>{formatGBP(vatAmount)}</strong>
                                    </div>

                                    <div className="gig-total-row gig-total-row--strong">
                                        <span>Total Including VAT:</span>
                                        <span style={{ color: '#166534' }}>{formatGBP(totalIncVat)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 8: Additional Empty Field at the Very End */}
                            {/* CRITICAL: Blank label, blank value, no placeholder */}
                            <div className="gig-empty-field-section">
                                {/* Intentionally left with NO label */}
                                <textarea
                                    className="gig-empty-textarea"
                                    value={bottomCustomField}
                                    onChange={(e) => setBottomCustomField(e.target.value)}
                                    placeholder=""
                                />
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <button
                                        type="button"
                                        className="btn btn--primary"
                                        onClick={handleSaveInvoice}
                                        style={{ padding: '0.85rem' }}
                                    >
                                        💾 Save Invoice
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn--secondary"
                                        onClick={() => setShowPreviewModal(true)}
                                        style={{ padding: '0.85rem' }}
                                    >
                                        🔍 Preview Invoice
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <button
                                        type="button"
                                        className="btn btn--secondary"
                                        onClick={handlePrintInvoice}
                                        style={{ padding: '0.85rem' }}
                                    >
                                        🖨️ Print Invoice
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn--primary"
                                        onClick={handleDownloadPDF}
                                        disabled={isGeneratingPDF}
                                        style={{ padding: '0.85rem', background: '#0f172a', borderColor: '#0f172a', color: '#ffffff' }}
                                    >
                                        {isGeneratingPDF ? 'Generating PDF...' : '📥 Download as PDF'}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn--outline"
                                    onClick={handleCreateNewInvoice}
                                    style={{ padding: '0.75rem' }}
                                >
                                    ＋ Create New Invoice
                                </button>
                            </div>
                        </div>
                    )}

                    {/* INTERACTIVE DRAGGABLE SPLITTER DIVIDER (Visible in Split Mode) */}
                    {layoutMode === 'split' && (
                        <div
                            className={`gig-splitter-bar ${isDraggingSplit ? 'gig-splitter-bar--dragging' : ''} no-print`}
                            onMouseDown={() => setIsDraggingSplit(true)}
                            onTouchStart={() => setIsDraggingSplit(true)}
                            title="Drag left or right to resize split view. Double-click to reset 50/50."
                            onDoubleClick={() => {
                                setSplitRatio(50);
                                localStorage.setItem('gig_split_ratio', '50');
                            }}
                        >
                            <div className="gig-splitter-handle">
                                <button
                                    type="button"
                                    className="gig-splitter-arrow-btn"
                                    title="Slide left (widen preview)"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSplitRatio(32);
                                        localStorage.setItem('gig_split_ratio', '32');
                                    }}
                                >
                                    ◀
                                </button>
                                <span className="gig-splitter-grip">⋮⋮</span>
                                <button
                                    type="button"
                                    className="gig-splitter-arrow-btn"
                                    title="Slide right (widen form)"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSplitRatio(68);
                                        localStorage.setItem('gig_split_ratio', '68');
                                    }}
                                >
                                    ▶
                                </button>
                            </div>
                        </div>
                    )}

                    {/* RIGHT COLUMN: REAL-TIME A4 INVOICE PREVIEW */}
                    {(layoutMode === 'split' || layoutMode === 'preview-only') && (
                        <div
                            className="gig-preview-column"
                            style={{
                                width: layoutMode === 'split' ? `${100 - splitRatio}%` : '100%'
                            }}
                        >
                            <div className="gig-preview-controls no-print">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>Invoice Live Preview</span>
                                    <button
                                        type="button"
                                        className={`gig-zoom-btn ${autoFit ? 'gig-zoom-btn--active' : ''}`}
                                        style={{ width: 'auto', padding: '0 8px', fontSize: '0.72rem', height: '24px' }}
                                        onClick={() => setAutoFit(!autoFit)}
                                        title="Automatically scale document to fit preview pane width"
                                    >
                                        Auto Fit
                                    </button>
                                </div>
                                <div className="gig-zoom-buttons">
                                    <button
                                        type="button"
                                        className="gig-zoom-btn"
                                        onClick={() => {
                                            setAutoFit(false);
                                            setZoomPercent(z => Math.max(35, z - 10));
                                        }}
                                        title="Zoom Out"
                                    >
                                        −
                                    </button>
                                    <span style={{ minWidth: '45px', textAlign: 'center', fontSize: '0.8rem' }}>
                                        {zoomPercent}%
                                    </span>
                                    <button
                                        type="button"
                                        className="gig-zoom-btn"
                                        onClick={() => {
                                            setAutoFit(false);
                                            setZoomPercent(z => Math.min(100, z + 10));
                                        }}
                                        title="Zoom In"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="gig-document-wrapper" ref={previewWrapperRef}>
                                {renderInvoiceDocument(false)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* FULL PREVIEW MODAL */}
            {showPreviewModal && (
                <div className="gig-modal-backdrop" onClick={() => setShowPreviewModal(false)}>
                    <div className="gig-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Invoice Full Preview</h2>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    className="btn btn--secondary btn--sm"
                                    onClick={() => {
                                        setShowPreviewModal(false);
                                        handlePrintInvoice();
                                    }}
                                >
                                    🖨️ Print
                                </button>
                                <button
                                    type="button"
                                    className="btn btn--primary btn--sm"
                                    onClick={() => {
                                        setShowPreviewModal(false);
                                        handleDownloadPDF();
                                    }}
                                >
                                    📥 Download PDF
                                </button>
                                <button
                                    type="button"
                                    className="btn btn--outline btn--sm"
                                    onClick={() => setShowPreviewModal(false)}
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </div>

                        <div style={{ background: '#64748b', padding: '1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'center' }}>
                            {renderInvoiceDocument(true)}
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && invoiceToDelete && (
                <div className="gig-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
                    <div className="gig-modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#dc2626' }}>
                            Delete Invoice
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Are you sure you want to delete invoice <strong>{invoiceToDelete.invoice_number}</strong>? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                type="button"
                                className="btn btn--outline"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn--danger"
                                onClick={handleDeleteInvoice}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST MESSAGE */}
            {toastMessage && (
                <div className="gig-toast">
                    <span>✓</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Dedicated 1:1 Pristine Element for PDF Capture - 100% Identical to Preview (0 Changes) */}
            <div
                id="gig-pdf-capture-container"
                style={{
                    position: 'fixed',
                    left: isGeneratingPDF ? '0px' : '-99999px',
                    top: '0px',
                    width: '210mm',
                    height: '295mm',
                    zIndex: 999999,
                    background: '#ffffff',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    opacity: isGeneratingPDF ? 1 : 0
                }}
            >
                {renderInvoiceDocument(false, true)}
            </div>
        </div>
    );
}
