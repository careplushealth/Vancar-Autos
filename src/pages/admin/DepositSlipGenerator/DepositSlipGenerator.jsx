import { useState, useEffect, useRef } from 'react';
import {
    getCars,
    getDepositSlips,
    createDepositSlip,
    updateDepositSlip,
    deleteDepositSlip,
    generateDepositSlipNumber
} from '../../../services/dataService';
import { normalizeMake } from '../../../utils/makeUtils';
import { LOGO_BASE64 } from '../DistanceSaleGenerator/logoBase64';
import './DepositSlipGenerator.css';

const DEFAULT_SELLER = {
    name: 'VanCar Autos Limited',
    address: 'Yard on Midland Street, Manchester, M12 6LB',
    tel: '07386 533337',
    email: 'sales@vancarautos.co.uk'
};

const fmt = (n) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(n || 0);

export default function DepositSlipGenerator() {
    const [slipsList, setSlipsList] = useState([]);
    const [carsList, setCarsList] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCarId, setSelectedCarId] = useState('');
    const [vehicleMode, setVehicleMode] = useState('stock'); // 'stock' | 'custom'
    const [currentSlipId, setCurrentSlipId] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [zoomPercent, setZoomPercent] = useState(65);
    const scale = zoomPercent / 100;

    // Form States
    const [receiptNumber, setReceiptNumber] = useState('');
    const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [orderNumber, setOrderNumber] = useState('');
    const [stockBookNumber, setStockBookNumber] = useState('');

    const [sellerDetails, setSellerDetails] = useState(DEFAULT_SELLER);

    // Vehicle Details (Removed firstRegDate, chassisNumber, engineNumber)
    const [vehicleDetails, setVehicleDetails] = useState({
        make: '',
        model: '',
        registration: ''
    });

    const [depositDetails, setDepositDetails] = useState({
        depositAmount: '',
        reservationPeriod: '14',
        remainingBalance: ''
    });

    const [buyerDetails, setBuyerDetails] = useState({
        name: '',
        address: '',
        tel: '',
        signatureDate: new Date().toISOString().slice(0, 10)
    });

    // Signature Pad State
    const [signatureType, setSignatureType] = useState('blank'); // 'blank' | 'digital' | 'upload' | 'typed'
    const [signatureData, setSignatureData] = useState('');
    const [typedSignature, setTypedSignature] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [slipToDelete, setSlipToDelete] = useState(null);

    useEffect(() => {
        setSlipsList(getDepositSlips() || []);
        setCarsList(getCars() || []);
    }, [viewMode]);

    // Handle Signature Canvas drawing
    const startDrawing = (e) => {
        if (signatureType !== 'digital') return;
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0f172a';
    };

    const draw = (e) => {
        if (!isDrawing || signatureType !== 'digital') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            setSignatureData(canvas.toDataURL());
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setSignatureData('');
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                setSignatureData(uploadEvent.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Auto-fill from inventory car selection
    const handleCarSelect = (carId) => {
        setSelectedCarId(carId);
        if (!carId) return;
        const car = carsList.find(c => c.id === carId);
        if (car) {
            setVehicleDetails({
                make: normalizeMake(car.make || ''),
                model: car.model || '',
                registration: (car.registration || '').toUpperCase()
            });
            if (car.price) {
                const dep = parseFloat(depositDetails.depositAmount) || 0;
                setDepositDetails(prev => ({
                    ...prev,
                    remainingBalance: Math.max(0, car.price - dep).toString()
                }));
            }
        }
    };

    // Open Form to create new slip
    const handleCreateNew = () => {
        setCurrentSlipId(null);
        setSelectedCarId('');
        setVehicleMode('stock');
        setReceiptNumber(generateDepositSlipNumber());
        setReceiptDate(new Date().toISOString().slice(0, 10));
        setOrderNumber('');
        setStockBookNumber('');
        setSellerDetails(DEFAULT_SELLER);
        setVehicleDetails({
            make: '',
            model: '',
            registration: ''
        });
        setDepositDetails({
            depositAmount: '',
            reservationPeriod: '14',
            remainingBalance: ''
        });
        setBuyerDetails({
            name: '',
            address: '',
            tel: '',
            signatureDate: new Date().toISOString().slice(0, 10)
        });
        setSignatureType('blank');
        setSignatureData('');
        setTypedSignature('');
        setViewMode('form');
    };

    // Edit Slip
    const handleEditSlip = (slip) => {
        setCurrentSlipId(slip.id);
        setSelectedCarId(slip.vehicle_id || '');
        setVehicleMode(slip.vehicle_id ? 'stock' : 'custom');
        setReceiptNumber(slip.receipt_number || '');
        setReceiptDate(slip.receipt_date || new Date().toISOString().slice(0, 10));
        setOrderNumber(slip.order_number || '');
        setStockBookNumber(slip.stock_book_number || '');
        setSellerDetails(slip.seller_details || DEFAULT_SELLER);
        setVehicleDetails(slip.vehicle_details || { make: '', model: '', registration: '' });
        setDepositDetails(slip.deposit_details || { depositAmount: '', reservationPeriod: '14', remainingBalance: '' });
        setBuyerDetails(slip.buyer_details || { name: '', address: '', tel: '', signatureDate: new Date().toISOString().slice(0, 10) });
        setSignatureType(slip.signature_type || 'blank');
        setSignatureData(slip.signature_data || '');
        setTypedSignature(slip.typed_signature || '');
        setViewMode('form');
    };

    // Save Slip Record
    const handleSaveSlip = (e) => {
        if (e) e.preventDefault();
        const payload = {
            receipt_number: receiptNumber,
            receipt_date: receiptDate,
            order_number: orderNumber,
            stock_book_number: stockBookNumber,
            vehicle_id: selectedCarId || null,
            seller_details: sellerDetails,
            vehicle_details: vehicleDetails,
            deposit_details: depositDetails,
            buyer_details: buyerDetails,
            signature_data: signatureData,
            typed_signature: typedSignature,
            signature_type: signatureType
        };

        if (currentSlipId) {
            updateDepositSlip(currentSlipId, payload);
        } else {
            const newSlip = createDepositSlip(payload);
            setCurrentSlipId(newSlip.id);
        }
        setSlipsList(getDepositSlips());
    };

    // Confirm Delete
    const handleDeleteClick = (slip, e) => {
        e.stopPropagation();
        setSlipToDelete(slip);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (slipToDelete) {
            deleteDepositSlip(slipToDelete.id);
            setShowDeleteModal(false);
            setSlipsList(getDepositSlips());
        }
    };

    // Format UK Date
    const formatDateUK = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // PDF Filename format
    const getPDFFilename = () => {
        const buyer = (buyerDetails.name || 'Buyer').trim().replace(/[/\\?%*:|"<>]/g, '');
        const reg = (vehicleDetails.registration || 'Vehicle').trim().replace(/[/\\?%*:|"<>]/g, '');
        return `Deposit Slip - ${buyer} - ${reg}.pdf`;
    };

    // Print Dialog trigger
    const handlePrint = () => {
        handleSaveSlip();
        window.print();
    };

    // PDF Download via html2pdf.js (Portrait A4 210mm x 297mm)
    const handleGeneratePDF = async () => {
        setIsGenerating(true);
        handleSaveSlip();

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
            const filename = getPDFFilename();

            let tempDiv = document.getElementById('temp-deposit-pdf-container');
            if (tempDiv) tempDiv.remove();

            // Append directly to documentElement (bypasses all admin flex/sidebar offsets)
            tempDiv = document.createElement('div');
            tempDiv.id = 'temp-deposit-pdf-container';
            tempDiv.setAttribute('style', `
                position: fixed !important;
                top: 0px !important;
                left: 0px !important;
                width: 200mm !important;
                height: 287mm !important;
                margin: 0 !important;
                padding: 0 !important;
                z-index: 999999 !important;
                background: #ffffff !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                transform: none !important;
            `);
            document.documentElement.appendChild(tempDiv);

            // Render signature representation
            let sigHtml = '................................................................';
            if ((signatureType === 'digital' || signatureType === 'upload') && signatureData) {
                sigHtml = `<img src="${signatureData}" style="max-height: 28px; max-width: 160px; object-fit: contain; display: block;" />`;
            } else if (signatureType === 'typed' && typedSignature) {
                sigHtml = `<span style="font-family: 'Dancing Script', 'Caveat', cursive, sans-serif; font-size: 13pt; color: #0f172a; line-height: 1;">${typedSignature}</span>`;
            }

            const depositAmtFmt = depositDetails.depositAmount ? fmt(parseFloat(depositDetails.depositAmount)) : '£..........';
            const balanceAmtFmt = depositDetails.remainingBalance ? fmt(parseFloat(depositDetails.remainingBalance)) : '£..........';

            tempDiv.innerHTML = `
                <div style="width: 200mm; height: 287mm; padding: 6mm 10mm; box-sizing: border-box; background: #ffffff; font-family: Arial, Helvetica, sans-serif; color: #222222; font-size: 8pt; line-height: 1.25; display: flex; flex-direction: column; justify-content: space-between; margin: 0;">
                    <div>
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 6px;">
                            <img src="${LOGO_BASE64}" style="max-height: 44px; margin: 0 auto 3px auto; display: block;" />
                            <h1 style="font-size: 14pt; font-weight: bold; color: #222222; margin: 2px 0 1px 0; letter-spacing: 0.5px; text-transform: uppercase;">VEHICLE DEPOSIT RECEIPT</h1>
                            <p style="font-size: 8.5pt; color: #666666; margin: 0 0 6px 0;">Official vehicle reservation & deposit agreement</p>
                        </div>

                        <!-- Top Info Table -->
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 8pt;">
                            <tbody>
                                <tr>
                                    <td style="width: 14%; background-color: #f4f9f1; font-weight: bold; color: #49A921; border: 1px solid #666666; padding: 3px 6px; vertical-align: top;">Seller</td>
                                    <td style="width: 36%; border: 1px solid #666666; padding: 3px 6px; vertical-align: top;">
                                        <strong>${sellerDetails.name || 'VanCar Autos Limited'}</strong><br />
                                        ${sellerDetails.address || 'Yard on Midland Street, Manchester, M12 6LB'}<br />
                                        Tel: <strong>${sellerDetails.tel || '07386 533337'}</strong>
                                    </td>
                                    <td style="width: 14%; background-color: #f4f9f1; font-weight: bold; color: #49A921; border: 1px solid #666666; padding: 3px 6px; vertical-align: top;">Receipt Info</td>
                                    <td style="width: 36%; border: 1px solid #666666; padding: 3px 6px; vertical-align: top;">
                                        Receipt No: <strong>${receiptNumber || '—'}</strong><br />
                                        Date: <strong>${formatDateUK(receiptDate)}</strong><br />
                                        Order No: <strong>${orderNumber || '—'}</strong> &nbsp;&nbsp; Stock: <strong>${stockBookNumber || '—'}</strong>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <!-- Vehicle Details Table -->
                        <h2 style="font-size: 9.5pt; font-weight: bold; color: #49A921; margin: 6px 0 4px 0; text-transform: uppercase;">Vehicle Details</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 8pt;">
                            <tbody>
                                <tr>
                                    <td style="width: 15%; background-color: #f4f9f1; font-weight: bold; color: #49A921; border: 1px solid #666666; padding: 3px 6px;">Make</td>
                                    <td style="width: 35%; border: 1px solid #666666; padding: 3px 6px;"><strong>${normalizeMake(vehicleDetails.make) || '—'}</strong></td>
                                    <td style="width: 15%; background-color: #f4f9f1; font-weight: bold; color: #49A921; border: 1px solid #666666; padding: 3px 6px;">Model</td>
                                    <td style="width: 35%; border: 1px solid #666666; padding: 3px 6px;"><strong>${vehicleDetails.model || '—'}</strong></td>
                                </tr>
                                <tr>
                                    <td style="background-color: #f4f9f1; font-weight: bold; color: #49A921; border: 1px solid #666666; padding: 3px 6px;">Registration</td>
                                    <td style="border: 1px solid #666666; padding: 3px 6px;" colspan="3"><strong>${vehicleDetails.registration || '—'}</strong></td>
                                </tr>
                            </tbody>
                        </table>

                        <!-- Deposit Payment Breakdown Table -->
                        <h2 style="font-size: 9.5pt; font-weight: bold; color: #49A921; margin: 6px 0 4px 0; text-transform: uppercase;">Deposit & Payment Breakdown</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 8pt;">
                            <tbody>
                                <tr>
                                    <td style="width: 33%; background-color: #f4f9f1; font-weight: bold; color: #49A921; border: 1px solid #666666; padding: 4px 6px; text-align: center;">Deposit Amount Paid</td>
                                    <td style="width: 33%; background-color: #f4f9f1; font-weight: bold; color: #49A921; border: 1px solid #666666; padding: 4px 6px; text-align: center;">Reservation Period</td>
                                    <td style="width: 34%; background-color: #f4f9f1; font-weight: bold; color: #49A921; border: 1px solid #666666; padding: 4px 6px; text-align: center;">Remaining Balance Due</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #666666; padding: 6px; text-align: center; font-size: 10pt; font-weight: bold; color: #166534; background: #f0fdf4;">${depositAmtFmt}</td>
                                    <td style="border: 1px solid #666666; padding: 6px; text-align: center; font-size: 9.5pt; font-weight: bold;">${depositDetails.reservationPeriod || '14'} Days</td>
                                    <td style="border: 1px solid #666666; padding: 6px; text-align: center; font-size: 10pt; font-weight: bold; color: #0f172a;">${balanceAmtFmt}</td>
                                </tr>
                            </tbody>
                        </table>

                        <!-- Buyer Declaration Box -->
                        <div style="border: 1px solid #d0d0d0; background-color: #f8fafc; border-radius: 4px; margin: 10px 0;">
                            <div style="background-color: #efefef; padding: 4px 8px; font-weight: bold; font-size: 8.5pt; color: #222222; border-bottom: 1px solid #d0d0d0;">
                                BUYER'S DECLARATION & TERMS
                            </div>
                            <div style="padding: 8px 10px; font-size: 7.8pt; line-height: 1.3; color: #333333;">
                                <p style="margin: 0 0 5px 0;">
                                    I understand that the payment of <strong>${depositAmtFmt}</strong> as a deposit for the above vehicle is taken by the seller as part payment and confirms that I am entering into a contract to purchase the vehicle.
                                </p>
                                <p style="margin: 0 0 5px 0;">
                                    I understand that the vehicle will be reserved by the seller for a period of <strong>${depositDetails.reservationPeriod || '14'} days</strong>, after which the vehicle will become free for sale once again.
                                </p>
                                <p style="margin: 0 0 5px 0;">
                                    I acknowledge that this deposit is non-refundable in the event of withdrawing from the contract and deciding not to pay the remaining balance of <strong>${balanceAmtFmt}</strong>.
                                </p>
                                <p style="margin: 0;">
                                    I also understand that I am personally liable for any expenses incurred by the seller in preparing the vehicle ready for completion of sale.
                                </p>
                            </div>
                        </div>

                        <!-- Buyer Information & Signature Section -->
                        <h2 style="font-size: 9.5pt; font-weight: bold; color: #49A921; margin: 8px 0 4px 0; text-transform: uppercase;">Buyer Information & Signature</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 8pt;">
                            <tbody>
                                <tr>
                                    <td style="font-weight: bold; color: #49A921; width: 110px; padding: 3px 4px; vertical-align: bottom;">Signature / Buyer</td>
                                    <td style="border-bottom: 1px solid #666666; height: 30px; vertical-align: bottom; padding-bottom: 2px; width: 45%;">
                                        ${sigHtml}
                                    </td>
                                    <td style="font-weight: bold; color: #49A921; width: 45px; padding: 3px 4px 3px 8px; vertical-align: bottom;">Date</td>
                                    <td style="border-bottom: 1px solid #666666; height: 30px; vertical-align: bottom; padding-bottom: 2px;">
                                        <strong>${formatDateUK(buyerDetails.signatureDate)}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #49A921; padding: 6px 4px 3px 4px; vertical-align: bottom;">Print Name</td>
                                    <td style="border-bottom: 1px solid #666666; height: 28px; vertical-align: bottom; padding-bottom: 2px;" colspan="3">
                                        <strong>${buyerDetails.name || '—'}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #49A921; padding: 6px 4px 3px 4px; vertical-align: bottom;">Address</td>
                                    <td style="border-bottom: 1px solid #666666; height: 28px; vertical-align: bottom; padding-bottom: 2px;" colspan="3">
                                        <strong>${buyerDetails.address || '—'}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #49A921; padding: 6px 4px 3px 4px; vertical-align: bottom;">Telephone</td>
                                    <td style="border-bottom: 1px solid #666666; height: 28px; vertical-align: bottom; padding-bottom: 2px;" colspan="3">
                                        <strong>${buyerDetails.tel || '—'}</strong>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; font-size: 7.5pt; color: #555555; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 6px;">
                        VanCar Autos Limited trading as VanCar Autos | Yard on Midland Street, Manchester, M12 6LB
                    </div>
                </div>
            `;

            const pdfElement = tempDiv.firstElementChild;

            const opt = {
                margin: [5, 5, 5, 5],
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    scrollX: 0,
                    scrollY: 0
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(pdfElement).save();
            tempDiv.remove();
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Filter slips for table
    const filteredSlips = slipsList.filter(s => {
        const q = searchQuery.toLowerCase();
        const buyer = (s.buyer_details?.name || '').toLowerCase();
        const reg = (s.vehicle_details?.registration || '').toLowerCase();
        const num = (s.receipt_number || '').toLowerCase();
        const makeModel = `${s.vehicle_details?.make || ''} ${s.vehicle_details?.model || ''}`.toLowerCase();
        return buyer.includes(q) || reg.includes(q) || num.includes(q) || makeModel.includes(q);
    });

    // Render signature representation inside preview
    const renderSignatureContent = () => {
        if ((signatureType === 'digital' || signatureType === 'upload') && signatureData) {
            return <img src={signatureData} alt="Buyer Signature" className="vds-doc-sig-img" />;
        }
        if (signatureType === 'typed' && typedSignature) {
            return <span style={{ fontFamily: "'Dancing Script', 'Caveat', cursive", fontSize: '13pt', color: '#0f172a' }}>{typedSignature}</span>;
        }
        return null;
    };

    return (
        <div className="vds-container">
            {viewMode === 'list' ? (
                /* MANAGEMENT DASHBOARD VIEW */
                <div className="vds-list-view">
                    <header className="vds-header">
                        <div>
                            <h1>Deposit Slip Generator</h1>
                            <p>Create, manage, print, and download dealership-grade vehicle deposit receipts.</p>
                        </div>
                        <button className="btn btn--primary vds-create-btn" onClick={handleCreateNew}>
                            + Create Deposit Slip
                        </button>
                    </header>

                    <div className="vds-card">
                        <div className="vds-table-controls">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by buyer, reg, receipt #, or vehicle..."
                                className="form-input vds-search"
                            />
                            <div className="vds-count">{filteredSlips.length} Deposit Slips</div>
                        </div>

                        <div className="vds-table-scroll">
                            <table className="vds-table">
                                <thead>
                                    <tr>
                                        <th>Receipt #</th>
                                        <th>Date</th>
                                        <th>Buyer Name</th>
                                        <th>Vehicle</th>
                                        <th>Reg</th>
                                        <th>Deposit Paid</th>
                                        <th>Balance</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSlips.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)' }}>
                                                No deposit slips found. Click "+ Create Deposit Slip" to start.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSlips.map(slip => (
                                            <tr key={slip.id}>
                                                <td className="vds-num-badge">{slip.receipt_number}</td>
                                                <td>{formatDateUK(slip.receipt_date)}</td>
                                                <td><strong>{slip.buyer_details?.name || '—'}</strong></td>
                                                <td>{normalizeMake(slip.vehicle_details?.make)} {slip.vehicle_details?.model}</td>
                                                <td><span className="badge badge--neutral">{slip.vehicle_details?.registration || '—'}</span></td>
                                                <td style={{ color: '#166534', fontWeight: '700' }}>{fmt(parseFloat(slip.deposit_details?.depositAmount))}</td>
                                                <td>{fmt(parseFloat(slip.deposit_details?.remainingBalance))}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button onClick={() => handleEditSlip(slip)} className="btn btn--sm btn--outline">Edit</button>
                                                        <button onClick={(e) => handleDeleteClick(slip, e)} className="btn btn--sm btn--danger">Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                /* FORM & LIVE PREVIEW VIEW */
                <div className="vds-form-view">
                    <header className="vds-header no-print">
                        <div>
                            <h1>{currentSlipId ? 'Edit Deposit Slip' : 'Create Deposit Slip'}</h1>
                            <p>Generate clean, legal deposit receipts for vehicle reservations.</p>
                        </div>
                        <button className="btn btn--outline" onClick={() => setViewMode('list')}>
                            ← Back to All Slips
                        </button>
                    </header>

                    <div className="vds-split-layout">
                        {/* LEFT COLUMN: FORM CONTROLS */}
                        <div className="vds-form-column no-print">
                            <form onSubmit={handleSaveSlip}>
                                {/* Vehicle Source Toggle */}
                                <div className="vds-inventory-box">
                                    <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Vehicle Source</label>
                                    <div className="vds-mode-selector">
                                        <button
                                            type="button"
                                            className={`vds-mode-btn ${vehicleMode === 'stock' ? 'vds-mode-btn--active' : ''}`}
                                            onClick={() => setVehicleMode('stock')}
                                        >
                                            🚗 Select from Stock
                                        </button>
                                        <button
                                            type="button"
                                            className={`vds-mode-btn ${vehicleMode === 'custom' ? 'vds-mode-btn--active' : ''}`}
                                            onClick={() => {
                                                setVehicleMode('custom');
                                                setSelectedCarId('');
                                            }}
                                        >
                                            ✏️ Custom Vehicle (Not in Stock)
                                        </button>
                                    </div>

                                    {vehicleMode === 'stock' && (
                                        <select
                                            value={selectedCarId}
                                            onChange={e => handleCarSelect(e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="">Select a vehicle from stock...</option>
                                            {carsList.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {normalizeMake(c.make)} {c.model} ({c.registration || 'No Reg'}) - £{c.price}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {vehicleMode === 'custom' && (
                                        <div style={{ fontSize: '0.85rem', color: '#166534', background: '#f0fdf4', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                            💡 Type custom vehicle details in the <strong>Vehicle Details</strong> section below.
                                        </div>
                                    )}
                                </div>

                                {/* Section 1: Receipt Header Info */}
                                <div className="vds-form-section">
                                    <h3 className="vds-section-title">Receipt Information</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Receipt Number</label>
                                            <input type="text" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Receipt Date</label>
                                            <input type="date" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} className="form-input" required />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Order Number</label>
                                            <input type="text" placeholder="e.g. ORD-9921" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Stock Book Number</label>
                                            <input type="text" placeholder="e.g. STK-2026" value={stockBookNumber} onChange={e => setStockBookNumber(e.target.value)} className="form-input" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Seller Details */}
                                <div className="vds-form-section">
                                    <h3 className="vds-section-title">Seller Information</h3>
                                    <div className="form-group">
                                        <label className="form-label">Seller Name</label>
                                        <input type="text" value={sellerDetails.name} onChange={e => setSellerDetails({ ...sellerDetails, name: e.target.value })} className="form-input" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Seller Address</label>
                                        <input type="text" value={sellerDetails.address} onChange={e => setSellerDetails({ ...sellerDetails, address: e.target.value })} className="form-input" />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Telephone</label>
                                            <input type="text" value={sellerDetails.tel} onChange={e => setSellerDetails({ ...sellerDetails, tel: e.target.value })} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <input type="email" value={sellerDetails.email || ''} onChange={e => setSellerDetails({ ...sellerDetails, email: e.target.value })} className="form-input" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Vehicle Details (Removed firstRegDate, chassisNumber, engineNumber) */}
                                <div className="vds-form-section">
                                    <h3 className="vds-section-title">Vehicle Details</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Make</label>
                                            <input type="text" placeholder="e.g. Mercedes-Benz" value={vehicleDetails.make} onChange={e => setVehicleDetails({ ...vehicleDetails, make: e.target.value })} className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Model</label>
                                            <input type="text" placeholder="e.g. C-Class C200" value={vehicleDetails.model} onChange={e => setVehicleDetails({ ...vehicleDetails, model: e.target.value })} className="form-input" required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Registration Number</label>
                                        <input type="text" placeholder="e.g. AB12 CDE" value={vehicleDetails.registration} onChange={e => setVehicleDetails({ ...vehicleDetails, registration: e.target.value.toUpperCase() })} className="form-input" />
                                    </div>
                                </div>

                                {/* Section 4: Deposit & Payment Details */}
                                <div className="vds-form-section">
                                    <h3 className="vds-section-title">Deposit Payment Terms</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Deposit Amount Paid (£)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="e.g. 500"
                                                value={depositDetails.depositAmount}
                                                onChange={e => setDepositDetails({ ...depositDetails, depositAmount: e.target.value })}
                                                className="form-input"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Reservation Period (Days)</label>
                                            <input
                                                type="number"
                                                placeholder="14"
                                                value={depositDetails.reservationPeriod}
                                                onChange={e => setDepositDetails({ ...depositDetails, reservationPeriod: e.target.value })}
                                                className="form-input"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Remaining Balance Due (£)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g. 14500"
                                            value={depositDetails.remainingBalance}
                                            onChange={e => setDepositDetails({ ...depositDetails, remainingBalance: e.target.value })}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                {/* Section 5: Buyer Details & Signature */}
                                <div className="vds-form-section">
                                    <h3 className="vds-section-title">Buyer Information & Signature</h3>
                                    <div className="form-group">
                                        <label className="form-label">Buyer Name</label>
                                        <input type="text" placeholder="e.g. John Smith" value={buyerDetails.name} onChange={e => setBuyerDetails({ ...buyerDetails, name: e.target.value })} className="form-input" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Buyer Address</label>
                                        <input type="text" placeholder="e.g. 12 High Street, Manchester" value={buyerDetails.address} onChange={e => setBuyerDetails({ ...buyerDetails, address: e.target.value })} className="form-input" />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Telephone</label>
                                            <input type="text" placeholder="e.g. 07700 900000" value={buyerDetails.tel} onChange={e => setBuyerDetails({ ...buyerDetails, tel: e.target.value })} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Signature Date</label>
                                            <input type="date" value={buyerDetails.signatureDate} onChange={e => setBuyerDetails({ ...buyerDetails, signatureDate: e.target.value })} className="form-input" />
                                        </div>
                                    </div>

                                    {/* Signature Options */}
                                    <div className="form-group">
                                        <label className="form-label">Signature Option</label>
                                        <div className="vds-radio-group">
                                            <label className={`vds-radio-label ${signatureType === 'blank' ? 'vds-radio-label--active' : ''}`}>
                                                <input type="radio" name="sigOption" value="blank" checked={signatureType === 'blank'} onChange={() => setSignatureType('blank')} />
                                                Leave Blank
                                            </label>
                                            <label className={`vds-radio-label ${signatureType === 'digital' ? 'vds-radio-label--active' : ''}`}>
                                                <input type="radio" name="sigOption" value="digital" checked={signatureType === 'digital'} onChange={() => setSignatureType('digital')} />
                                                Draw Signature
                                            </label>
                                            <label className={`vds-radio-label ${signatureType === 'upload' ? 'vds-radio-label--active' : ''}`}>
                                                <input type="radio" name="sigOption" value="upload" checked={signatureType === 'upload'} onChange={() => setSignatureType('upload')} />
                                                Upload Image
                                            </label>
                                            <label className={`vds-radio-label ${signatureType === 'typed' ? 'vds-radio-label--active' : ''}`}>
                                                <input type="radio" name="sigOption" value="typed" checked={signatureType === 'typed'} onChange={() => setSignatureType('typed')} />
                                                Type Text
                                            </label>
                                        </div>
                                    </div>

                                    {signatureType === 'digital' && (
                                        <div className="form-group vds-canvas-box">
                                            <label className="form-label">Draw Signature Below:</label>
                                            <canvas
                                                ref={canvasRef}
                                                width={360}
                                                height={120}
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                onTouchStart={startDrawing}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDrawing}
                                                className="vds-canvas"
                                            />
                                            <button type="button" onClick={clearSignature} className="btn btn--sm btn--outline" style={{ marginTop: '0.5rem' }}>
                                                Clear Signature
                                            </button>
                                        </div>
                                    )}

                                    {signatureType === 'upload' && (
                                        <div className="form-group">
                                            <label className="form-label">Upload Signature Image</label>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="form-input" />
                                            {signatureData && (
                                                <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                                                    <img src={signatureData} alt="Preview" style={{ maxHeight: '50px' }} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {signatureType === 'typed' && (
                                        <div className="form-group">
                                            <label className="form-label">Typed Signature Text</label>
                                            <input
                                                type="text"
                                                placeholder="Type buyer signature..."
                                                value={typedSignature}
                                                onChange={e => setTypedSignature(e.target.value)}
                                                className="form-input"
                                                style={{ fontFamily: "'Dancing Script', 'Caveat', cursive", fontSize: '1.25rem' }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="vds-action-bar" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                                    <button
                                        type="button"
                                        className="btn btn--primary"
                                        style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: '600' }}
                                        onClick={handleGeneratePDF}
                                        disabled={isGenerating}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                        {isGenerating ? 'Generating PDF...' : 'Generate & Download PDF'}
                                    </button>
                                    <button type="button" className="btn btn--secondary" style={{ width: '100%' }} onClick={handlePrint}>
                                        🖨️ Print / Save PDF Dialog
                                    </button>
                                    <button type="submit" className="btn btn--outline" style={{ width: '100%' }}>
                                        💾 Save Record
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* RIGHT COLUMN: REAL-TIME PORTRAIT A4 PREVIEW (VANCAR AUTOS DESIGN SYSTEM) */}
                        <div className="vds-preview-column">
                            <div className="vds-zoom-bar no-print">
                                <span>Zoom Preview:</span>
                                <button type="button" onClick={() => setZoomPercent(prev => Math.max(40, prev - 10))}>-</button>
                                <span>{zoomPercent}%</span>
                                <button type="button" onClick={() => setZoomPercent(prev => Math.min(100, prev + 10))}>+</button>
                            </div>

                            <div className="vds-document-container" style={{ transform: `scale(${scale})`, height: `${297 * scale}mm` }}>
                                <div className="vds-document" id="deposit-receipt-document">

                                    <div>
                                        {/* Header */}
                                        <div className="vds-doc-header">
                                            <img src={LOGO_BASE64} alt="VanCar Autos" className="vds-doc-logo" />
                                            <h1 className="vds-doc-title">VEHICLE DEPOSIT RECEIPT</h1>
                                            <p className="vds-doc-subtitle">Official vehicle reservation & deposit agreement</p>
                                        </div>

                                        {/* Top Info Table */}
                                        <table className="vds-doc-table">
                                            <tbody>
                                                <tr>
                                                    <td className="vds-col-label" style={{ width: '14%' }}>Seller</td>
                                                    <td style={{ width: '36%' }}>
                                                        <strong>{sellerDetails.name || 'VanCar Autos Limited'}</strong><br />
                                                        {sellerDetails.address || 'Yard on Midland Street, Manchester, M12 6LB'}<br />
                                                        Tel: <strong>{sellerDetails.tel || '07386 533337'}</strong>
                                                    </td>
                                                    <td className="vds-col-label" style={{ width: '14%' }}>Receipt Info</td>
                                                    <td style={{ width: '36%' }}>
                                                        Receipt No: <strong>{receiptNumber || '—'}</strong><br />
                                                        Date: <strong>{formatDateUK(receiptDate)}</strong><br />
                                                        Order No: <strong>{orderNumber || '—'}</strong> &nbsp;&nbsp; Stock: <strong>{stockBookNumber || '—'}</strong>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* Vehicle Details Table (Removed firstRegDate, chassisNumber, engineNumber) */}
                                        <h2 style={{ fontSize: '9.5pt', fontWeight: 'bold', color: '#49A921', margin: '6px 0 4px 0', textTransform: 'uppercase' }}>Vehicle Details</h2>
                                        <table className="vds-doc-table">
                                            <tbody>
                                                <tr>
                                                    <td className="vds-col-label" style={{ width: '15%' }}>Make</td>
                                                    <td style={{ width: '35%' }}><strong>{normalizeMake(vehicleDetails.make) || '—'}</strong></td>
                                                    <td className="vds-col-label" style={{ width: '15%' }}>Model</td>
                                                    <td style={{ width: '35%' }}><strong>{vehicleDetails.model || '—'}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td className="vds-col-label">Registration</td>
                                                    <td colSpan="3"><strong>{vehicleDetails.registration || '—'}</strong></td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* Deposit Payment Breakdown */}
                                        <h2 style={{ fontSize: '9.5pt', fontWeight: 'bold', color: '#49A921', margin: '6px 0 4px 0', textTransform: 'uppercase' }}>Deposit & Payment Breakdown</h2>
                                        <table className="vds-doc-table">
                                            <tbody>
                                                <tr>
                                                    <th className="vds-col-label" style={{ width: '33%', textAlign: 'center' }}>Deposit Amount Paid</th>
                                                    <th className="vds-col-label" style={{ width: '33%', textAlign: 'center' }}>Reservation Period</th>
                                                    <th className="vds-col-label" style={{ width: '34%', textAlign: 'center' }}>Remaining Balance Due</th>
                                                </tr>
                                                <tr>
                                                    <td style={{ textAlign: 'center', fontSize: '10pt', fontWeight: 'bold', color: '#166534', background: '#f0fdf4' }}>
                                                        {depositDetails.depositAmount ? fmt(parseFloat(depositDetails.depositAmount)) : '£..........'}
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontSize: '9.5pt', fontWeight: 'bold' }}>
                                                        {depositDetails.reservationPeriod || '14'} Days
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontSize: '10pt', fontWeight: 'bold', color: '#0f172a' }}>
                                                        {depositDetails.remainingBalance ? fmt(parseFloat(depositDetails.remainingBalance)) : '£..........'}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* Buyer Declaration Box */}
                                        <div className="vds-doc-declaration-box">
                                            <div className="vds-doc-dec-header">
                                                BUYER'S DECLARATION & TERMS
                                            </div>
                                            <div className="vds-doc-dec-body">
                                                <p>
                                                    I understand that the payment of <strong>{depositDetails.depositAmount ? fmt(parseFloat(depositDetails.depositAmount)) : '£..........'}</strong> as a deposit for the above vehicle is taken by the seller as part payment and confirms that I am entering into a contract to purchase the vehicle.
                                                </p>
                                                <p>
                                                    I understand that the vehicle will be reserved by the seller for a period of <strong>{depositDetails.reservationPeriod || '14'} days</strong>, after which the vehicle will become free for sale once again.
                                                </p>
                                                <p>
                                                    I acknowledge that this deposit is non-refundable in the event of withdrawing from the contract and deciding not to pay the remaining balance of <strong>{depositDetails.remainingBalance ? fmt(parseFloat(depositDetails.remainingBalance)) : '£..........'}</strong>.
                                                </p>
                                                <p>
                                                    I also understand that I am personally liable for any expenses incurred by the seller in preparing the vehicle ready for completion of sale.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Buyer Signature & Contact Details */}
                                        <h2 style={{ fontSize: '9.5pt', fontWeight: 'bold', color: '#49A921', margin: '8px 0 4px 0', textTransform: 'uppercase' }}>Buyer Information & Signature</h2>
                                        <table className="vds-doc-sig-table">
                                            <tbody>
                                                <tr>
                                                    <td className="vds-doc-sig-label">Signature / Buyer</td>
                                                    <td className="vds-doc-sig-line-cell" style={{ width: '45%' }}>
                                                        {renderSignatureContent()}
                                                    </td>
                                                    <td className="vds-doc-sig-label" style={{ width: '45px', paddingLeft: '8px' }}>Date</td>
                                                    <td className="vds-doc-sig-line-cell">
                                                        <strong>{formatDateUK(buyerDetails.signatureDate)}</strong>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="vds-doc-sig-label" style={{ paddingTop: '6px' }}>Print Name</td>
                                                    <td className="vds-doc-sig-line-cell" style={{ paddingTop: '6px' }} colSpan="3">
                                                        <strong>{buyerDetails.name || '—'}</strong>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="vds-doc-sig-label" style={{ paddingTop: '6px' }}>Address</td>
                                                    <td className="vds-doc-sig-line-cell" style={{ paddingTop: '6px' }} colSpan="3">
                                                        <strong>{buyerDetails.address || '—'}</strong>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="vds-doc-sig-label" style={{ paddingTop: '6px' }}>Telephone</td>
                                                    <td className="vds-doc-sig-line-cell" style={{ paddingTop: '6px' }} colSpan="3">
                                                        <strong>{buyerDetails.tel || '—'}</strong>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Footer */}
                                    <div className="vds-doc-footer">
                                        VanCar Autos Limited trading as VanCar Autos | Yard on Midland Street, Manchester, M12 6LB
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteModal && (
                <div className="vds-modal-overlay">
                    <div className="vds-modal">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete Deposit Slip <strong>{slipToDelete?.receipt_number}</strong>?</p>
                        <p className="vds-modal-warning">This action cannot be undone.</p>
                        <div className="vds-modal-actions">
                            <button onClick={() => setShowDeleteModal(false)} className="btn btn--outline">Cancel</button>
                            <button onClick={confirmDelete} className="btn btn--danger">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
