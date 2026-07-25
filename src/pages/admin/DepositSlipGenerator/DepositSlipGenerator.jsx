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
import './DepositSlipGenerator.css';

const DEFAULT_SELLER = {
    name: 'Vancar Autos Ltd',
    address: 'Vancar Autos Dealership, London Road, United Kingdom',
    tel: '07386 533337'
};

const fmt = (n) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(n || 0);

const fmtInt = (n) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(n || 0);

export default function DepositSlipGenerator() {
    const [slipsList, setSlipsList] = useState([]);
    const [carsList, setCarsList] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCarId, setSelectedCarId] = useState('');
    const [currentSlipId, setCurrentSlipId] = useState(null);

    // Form States
    const [receiptNumber, setReceiptNumber] = useState('');
    const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [orderNumber, setOrderNumber] = useState('');
    const [stockBookNumber, setStockBookNumber] = useState('');

    const [sellerDetails, setSellerDetails] = useState(DEFAULT_SELLER);

    const [vehicleDetails, setVehicleDetails] = useState({
        make: '',
        model: '',
        registration: '',
        firstRegDate: '',
        chassisNumber: '',
        engineNumber: ''
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
    const [signatureType, setSignatureType] = useState('blank'); // 'blank' | 'digital'
    const [signatureData, setSignatureData] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [slipToDelete, setSlipToDelete] = useState(null);

    useEffect(() => {
        setSlipsList(getDepositSlips());
        setCarsList(getCars());
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
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
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

    // Auto-fill from inventory car selection
    const handleCarSelect = (carId) => {
        setSelectedCarId(carId);
        if (!carId) return;
        const car = carsList.find(c => c.id === carId);
        if (car) {
            setVehicleDetails({
                make: normalizeMake(car.make || ''),
                model: car.model || '',
                registration: (car.registration || '').toUpperCase(),
                firstRegDate: car.year ? `${car.year}-01-01` : '',
                chassisNumber: car.vin || car.chassisNo || '',
                engineNumber: car.engineNo || ''
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
        setReceiptNumber(generateDepositSlipNumber());
        setReceiptDate(new Date().toISOString().slice(0, 10));
        setOrderNumber('');
        setStockBookNumber('');
        setSellerDetails(DEFAULT_SELLER);
        setVehicleDetails({
            make: '',
            model: '',
            registration: '',
            firstRegDate: '',
            chassisNumber: '',
            engineNumber: ''
        });
        setDepositDetails({
            depositAmount: '250',
            reservationPeriod: '14',
            remainingBalance: '12250'
        });
        setBuyerDetails({
            name: '',
            address: '',
            tel: '',
            signatureDate: new Date().toISOString().slice(0, 10)
        });
        setSignatureType('blank');
        setSignatureData('');
        setViewMode('form');
    };

    // Open Form to edit existing slip
    const handleEditSlip = (slip) => {
        setCurrentSlipId(slip.id);
        setSelectedCarId(slip.vehicle_id || '');
        setReceiptNumber(slip.receipt_number || generateDepositSlipNumber());
        setReceiptDate(slip.receipt_date || new Date().toISOString().slice(0, 10));
        setOrderNumber(slip.order_number || '');
        setStockBookNumber(slip.stock_book_number || '');
        setSellerDetails(slip.seller_details || DEFAULT_SELLER);
        setVehicleDetails(slip.vehicle_details || {});
        setDepositDetails(slip.deposit_details || {});
        setBuyerDetails(slip.buyer_details || {});
        setSignatureType(slip.signature_type || 'blank');
        setSignatureData(slip.signature_data || '');
        setViewMode('form');
    };

    // Duplicate slip
    const handleDuplicateSlip = (slip) => {
        setCurrentSlipId(null);
        setSelectedCarId(slip.vehicle_id || '');
        setReceiptNumber(generateDepositSlipNumber());
        setReceiptDate(new Date().toISOString().slice(0, 10));
        setOrderNumber(slip.order_number ? `${slip.order_number}-COPY` : '');
        setStockBookNumber(slip.stock_book_number || '');
        setSellerDetails(slip.seller_details || DEFAULT_SELLER);
        setVehicleDetails(slip.vehicle_details || {});
        setDepositDetails(slip.deposit_details || {});
        setBuyerDetails(slip.buyer_details || {});
        setSignatureType('blank');
        setSignatureData('');
        setViewMode('form');
    };

    // Save Deposit Slip
    const handleSaveSlip = (e) => {
        if (e) e.preventDefault();
        if (!buyerDetails.name.trim()) {
            alert("Please enter the Buyer's Name.");
            return;
        }

        const payload = {
            receipt_number: receiptNumber,
            receipt_date: receiptDate,
            order_number: orderNumber,
            stock_book_number: stockBookNumber,
            seller_details: sellerDetails,
            vehicle_details: vehicleDetails,
            deposit_details: depositDetails,
            buyer_details: buyerDetails,
            signature_data: signatureData,
            signature_type: signatureType,
            vehicle_id: selectedCarId || null,
            created_by: 'admin'
        };

        if (currentSlipId) {
            updateDepositSlip(currentSlipId, payload);
        } else {
            createDepositSlip(payload);
        }

        setViewMode('list');
    };

    // Trigger Delete
    const triggerDelete = (slip) => {
        setSlipToDelete(slip);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (slipToDelete) {
            deleteDepositSlip(slipToDelete.id);
            setSlipToDelete(null);
            setShowDeleteModal(false);
            setSlipsList(getDepositSlips());
        }
    };

    // Print & PDF Download trigger
    const handlePrint = () => {
        window.print();
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
                                placeholder="Search by Buyer Name, Reg, Receipt #, Make/Model..."
                                className="form-input vds-search"
                            />
                            <span className="vds-count">{filteredSlips.length} deposit records</span>
                        </div>

                        {filteredSlips.length > 0 ? (
                            <div className="vds-table-scroll">
                                <table className="vds-table">
                                    <thead>
                                        <tr>
                                            <th>Receipt #</th>
                                            <th>Date</th>
                                            <th>Buyer Name</th>
                                            <th>Vehicle</th>
                                            <th>Registration</th>
                                            <th>Deposit Amount</th>
                                            <th>Balance</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSlips.map(s => {
                                            const depAmt = parseFloat(s.deposit_details?.depositAmount || 0);
                                            const balAmt = parseFloat(s.deposit_details?.remainingBalance || 0);
                                            return (
                                                <tr key={s.id}>
                                                    <td><strong className="vds-num-badge">{s.receipt_number}</strong></td>
                                                    <td>{s.receipt_date}</td>
                                                    <td><strong>{s.buyer_details?.name || '—'}</strong></td>
                                                    <td>{normalizeMake(s.vehicle_details?.make)} {s.vehicle_details?.model}</td>
                                                    <td><span className="vds-reg-tag">{s.vehicle_details?.registration || '—'}</span></td>
                                                    <td><strong style={{ color: '#55A01F' }}>{fmt(depAmt)}</strong></td>
                                                    <td>{fmt(balAmt)}</td>
                                                    <td>
                                                        <div className="vds-actions">
                                                            <button onClick={() => handleEditSlip(s)} className="btn btn--sm btn--secondary">Edit / View</button>
                                                            <button onClick={() => handleDuplicateSlip(s)} className="btn btn--sm btn--outline">Duplicate</button>
                                                            <button onClick={() => triggerDelete(s)} className="btn btn--sm btn--outline vds-danger-btn">Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="vds-empty">
                                <p>No deposit slips found. Click "+ Create Deposit Slip" to generate your first receipt.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* FORM EDITOR + LIVE PREVIEW SPLIT VIEW */
                <div className="vds-editor-view">
                    {/* Top Action Bar */}
                    <div className="vds-top-bar no-print">
                        <button onClick={() => setViewMode('list')} className="btn btn--outline">
                            ← Back to Deposit Slips
                        </button>
                        <div className="vds-top-bar-right">
                            <button onClick={handlePrint} className="btn btn--secondary">
                                🖨️ Print / Download PDF
                            </button>
                            <button onClick={handleSaveSlip} className="btn btn--primary">
                                💾 Save Deposit Slip
                            </button>
                        </div>
                    </div>

                    <div className="vds-split-layout">
                        {/* LEFT COLUMN: INTERACTIVE FORM */}
                        <div className="vds-form-column no-print">
                            <div className="vds-card">
                                <h2>{currentSlipId ? `Edit Receipt (${receiptNumber})` : 'New Deposit Slip'}</h2>

                                <form onSubmit={handleSaveSlip} className="vds-form">
                                    {/* Inventory Select */}
                                    <div className="form-group vds-inventory-box">
                                        <label className="form-label">Link Inventory Vehicle (Auto-fill)</label>
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
                                    </div>

                                    {/* Section 1: Receipt Header Info */}
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

                                    {/* Section 2: Seller Details */}
                                    <h3 className="vds-section-title">Seller Information</h3>
                                    <div className="form-group">
                                        <label className="form-label">Seller Name</label>
                                        <input type="text" value={sellerDetails.name} onChange={e => setSellerDetails({ ...sellerDetails, name: e.target.value })} className="form-input" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Seller Address</label>
                                        <textarea rows="2" value={sellerDetails.address} onChange={e => setSellerDetails({ ...sellerDetails, address: e.target.value })} className="form-input" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Seller Telephone</label>
                                        <input type="text" value={sellerDetails.tel} onChange={e => setSellerDetails({ ...sellerDetails, tel: e.target.value })} className="form-input" />
                                    </div>

                                    {/* Section 3: Vehicle Details */}
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
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Registration Number</label>
                                            <input type="text" placeholder="e.g. AB12 CDE" value={vehicleDetails.registration} onChange={e => setVehicleDetails({ ...vehicleDetails, registration: e.target.value.toUpperCase() })} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">First Registration Date</label>
                                            <input type="date" value={vehicleDetails.firstRegDate} onChange={e => setVehicleDetails({ ...vehicleDetails, firstRegDate: e.target.value })} className="form-input" />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Chassis / VIN Number</label>
                                            <input type="text" placeholder="e.g. WDD2040011A..." value={vehicleDetails.chassisNumber} onChange={e => setVehicleDetails({ ...vehicleDetails, chassisNumber: e.target.value.toUpperCase() })} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Engine Number</label>
                                            <input type="text" placeholder="e.g. 651911..." value={vehicleDetails.engineNumber} onChange={e => setVehicleDetails({ ...vehicleDetails, engineNumber: e.target.value.toUpperCase() })} className="form-input" />
                                        </div>
                                    </div>

                                    {/* Section 4: Deposit & Declaration Info */}
                                    <h3 className="vds-section-title">Deposit & Payment Details</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Deposit Amount (£)</label>
                                            <input type="number" step="0.01" placeholder="e.g. 250" value={depositDetails.depositAmount} onChange={e => setDepositDetails({ ...depositDetails, depositAmount: e.target.value })} className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Reservation Period (Days)</label>
                                            <input type="number" placeholder="e.g. 14" value={depositDetails.reservationPeriod} onChange={e => setDepositDetails({ ...depositDetails, reservationPeriod: e.target.value })} className="form-input" required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Remaining Balance Due (£)</label>
                                        <input type="number" step="0.01" placeholder="e.g. 12250" value={depositDetails.remainingBalance} onChange={e => setDepositDetails({ ...depositDetails, remainingBalance: e.target.value })} className="form-input" />
                                    </div>

                                    {/* Section 5: Buyer Details & Signature */}
                                    <h3 className="vds-section-title">Buyer Information & Signature</h3>
                                    <div className="form-group">
                                        <label className="form-label">Buyer Full Name</label>
                                        <input type="text" placeholder="e.g. John Smith" value={buyerDetails.name} onChange={e => setBuyerDetails({ ...buyerDetails, name: e.target.value })} className="form-input" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Buyer Full Address</label>
                                        <textarea rows="2" placeholder="e.g. 42 High Street, Manchester, M1 2AB" value={buyerDetails.address} onChange={e => setBuyerDetails({ ...buyerDetails, address: e.target.value })} className="form-input" />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Buyer Telephone</label>
                                            <input type="text" placeholder="e.g. 07700 900123" value={buyerDetails.tel} onChange={e => setBuyerDetails({ ...buyerDetails, tel: e.target.value })} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Signature Date</label>
                                            <input type="date" value={buyerDetails.signatureDate} onChange={e => setBuyerDetails({ ...buyerDetails, signatureDate: e.target.value })} className="form-input" />
                                        </div>
                                    </div>

                                    {/* Signature Type */}
                                    <div className="form-group">
                                        <label className="form-label">Buyer Signature Option</label>
                                        <div className="vds-sig-toggle">
                                            <label className={`vds-radio-label ${signatureType === 'blank' ? 'vds-radio-label--active' : ''}`}>
                                                <input type="radio" name="sigType" value="blank" checked={signatureType === 'blank'} onChange={() => setSignatureType('blank')} />
                                                Leave Blank for Printed Signing
                                            </label>
                                            <label className={`vds-radio-label ${signatureType === 'digital' ? 'vds-radio-label--active' : ''}`}>
                                                <input type="radio" name="sigType" value="digital" checked={signatureType === 'digital'} onChange={() => setSignatureType('digital')} />
                                                Draw Digital Signature Pad
                                            </label>
                                        </div>
                                    </div>

                                    {signatureType === 'digital' && (
                                        <div className="form-group vds-canvas-box">
                                            <label className="form-label">Sign Here (Mouse or Touch)</label>
                                            <canvas
                                                ref={canvasRef}
                                                width={400}
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

                                    <div className="vds-form-actions">
                                        <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>
                                            💾 Save Deposit Slip
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: REAL-TIME A4 DOCUMENT PREVIEW (EXACTLY MATCHING SAMPLE RECEIPT) */}
                        <div className="vds-preview-column">
                            <div className="vds-document-container">
                                <div className="vds-document" id="deposit-receipt-document">
                                    {/* Top Header Banner */}
                                    <div className="vds-doc-header-banner">
                                        <h1>DEPOSIT SLIP</h1>
                                    </div>

                                    {/* Seller Section */}
                                    <div className="vds-doc-section vds-doc-seller-box">
                                        <div className="vds-doc-row">
                                            <span className="vds-doc-label">SELLER:</span>
                                        </div>
                                        <div className="vds-doc-row">
                                            <span className="vds-doc-sublabel">NAME:</span>
                                            <span className="vds-doc-dots-value">{sellerDetails.name || 'Vancar Autos Ltd'}</span>
                                        </div>
                                        <div className="vds-doc-row">
                                            <span className="vds-doc-sublabel">ADDRESS:</span>
                                            <span className="vds-doc-dots-value">{sellerDetails.address || '—'}</span>
                                        </div>
                                        <div className="vds-doc-row">
                                            <span className="vds-doc-sublabel">TEL:</span>
                                            <span className="vds-doc-dots-value">{sellerDetails.tel || '07386 533337'}</span>
                                        </div>
                                    </div>

                                    {/* Date, Order No & Legal Notice Row */}
                                    <div className="vds-doc-mid-row">
                                        <div className="vds-doc-mid-left">
                                            <div className="vds-doc-row">
                                                <span className="vds-doc-sublabel">DATE:</span>
                                                <span className="vds-doc-dots-value">{receiptDate ? new Date(receiptDate).toLocaleDateString('en-GB') : '—'}</span>
                                            </div>
                                            <div className="vds-doc-row">
                                                <span className="vds-doc-sublabel">ORDER NO:</span>
                                                <span className="vds-doc-dots-value">{orderNumber || '—'}</span>
                                            </div>
                                            <div className="vds-doc-row">
                                                <span className="vds-doc-sublabel">STOCK BOOK NO:</span>
                                                <span className="vds-doc-dots-value">{stockBookNumber || '—'}</span>
                                            </div>
                                        </div>

                                        <div className="vds-doc-legal-box">
                                            <p>THE SIGNING OF THIS DOCUMENT DOES NOT AND IS NOT INTENDED TO AFFECT THE CUSTOMER'S STATUTORY RIGHTS UNDER THE SALE OF GOODS ACT 1979</p>
                                        </div>
                                    </div>

                                    {/* Vehicle Details Section */}
                                    <div className="vds-doc-section">
                                        <h2 className="vds-doc-heading">VEHICLE DETAILS</h2>
                                        <div className="vds-doc-grid-2col">
                                            <div className="vds-doc-row">
                                                <span className="vds-doc-sublabel">MAKE:</span>
                                                <span className="vds-doc-dots-value">{normalizeMake(vehicleDetails.make) || '................................'}</span>
                                            </div>
                                            <div className="vds-doc-row">
                                                <span className="vds-doc-sublabel">MODEL:</span>
                                                <span className="vds-doc-dots-value">{vehicleDetails.model || '................................'}</span>
                                            </div>
                                        </div>
                                        <div className="vds-doc-grid-2col">
                                            <div className="vds-doc-row">
                                                <span className="vds-doc-sublabel">REG NO:</span>
                                                <span className="vds-doc-dots-value">{vehicleDetails.registration || '................................'}</span>
                                            </div>
                                            <div className="vds-doc-row">
                                                <span className="vds-doc-sublabel">FIRST REG:</span>
                                                <span className="vds-doc-dots-value">{vehicleDetails.firstRegDate ? new Date(vehicleDetails.firstRegDate).toLocaleDateString('en-GB') : '................................'}</span>
                                            </div>
                                        </div>
                                        <div className="vds-doc-row">
                                            <span className="vds-doc-sublabel">CHASSIS NO:</span>
                                            <span className="vds-doc-dots-value">{vehicleDetails.chassisNumber || '................................................................'}</span>
                                        </div>
                                        <div className="vds-doc-row">
                                            <span className="vds-doc-sublabel">ENGINE NO:</span>
                                            <span className="vds-doc-dots-value">{vehicleDetails.engineNumber || '................................................................'}</span>
                                        </div>
                                    </div>

                                    {/* Buyer's Declaration Box */}
                                    <div className="vds-doc-declaration-box">
                                        <div className="vds-doc-dec-header">
                                            <h3>BUYER'S DECLARATION</h3>
                                        </div>
                                        <div className="vds-doc-dec-body">
                                            <p>
                                                I understand that the payment of <strong className="vds-highlight-val">{depositDetails.depositAmount ? fmt(parseFloat(depositDetails.depositAmount)) : '£..........'}</strong> as a deposit for the above vehicle is taken by the seller as part payment. I understand that I am entering into a contract to purchase the vehicle.
                                            </p>
                                            <p>
                                                I understand that the vehicle will be reserved by the seller for a period of <strong className="vds-highlight-val">{depositDetails.reservationPeriod || '......'} days</strong> after which the vehicle will become free for sale to anyone else once again.
                                            </p>
                                            <p>
                                                I acknowledge that this payment is not refundable in the event of myself withdrawing from the contract and deciding not to pay the balance of <strong className="vds-highlight-val">{depositDetails.remainingBalance ? fmt(parseFloat(depositDetails.remainingBalance)) : '£..........'}</strong>.
                                            </p>
                                            <p>
                                                I also understand that I will be personally liable for any expense incurred by the seller in preparing the vehicle ready for completion of the sale and any other loss incurred by my withdrawing from the contract.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Buyer Signature & Contact Details Block */}
                                    <div className="vds-doc-buyer-signature-block">
                                        <div className="vds-doc-row vds-doc-sig-line">
                                            <span className="vds-doc-sublabel">SIGNATURE/BUYER:</span>
                                            <span className="vds-doc-dots-value">
                                                {signatureType === 'digital' && (signatureData || (canvasRef.current && canvasRef.current.toDataURL())) ? (
                                                    <img src={signatureData || (canvasRef.current ? canvasRef.current.toDataURL() : '')} alt="Buyer Signature" className="vds-doc-sig-img" />
                                                ) : (
                                                    '................................................................'
                                                )}
                                            </span>
                                        </div>
                                        <div className="vds-doc-row">
                                            <span className="vds-doc-sublabel">PRINT:</span>
                                            <span className="vds-doc-dots-value">{buyerDetails.name || '................................................................'}</span>
                                        </div>
                                        <div className="vds-doc-row">
                                            <span className="vds-doc-sublabel">DATE:</span>
                                            <span className="vds-doc-dots-value">{buyerDetails.signatureDate ? new Date(buyerDetails.signatureDate).toLocaleDateString('en-GB') : '................................................................'}</span>
                                        </div>
                                        <div className="vds-doc-row">
                                            <span className="vds-doc-sublabel">ADDRESS:</span>
                                            <span className="vds-doc-dots-value">{buyerDetails.address || '................................................................'}</span>
                                        </div>
                                        <div className="vds-doc-row">
                                            <span className="vds-doc-sublabel">TEL:</span>
                                            <span className="vds-doc-dots-value">{buyerDetails.tel || '................................................................'}</span>
                                        </div>
                                    </div>

                                    {/* Footer Branding Bar (Replacing Minerva with Vancar Autos) */}
                                    <div className="vds-doc-footer-branding">
                                        <div className="vds-doc-brand-left">
                                            <div className="vds-brand-logo-text">VANCAR AUTOS</div>
                                            <div className="vds-brand-subtext">Quality Used Vehicles & Dealership Services</div>
                                            <div className="vds-brand-url">www.vancarautos.co.uk</div>
                                        </div>
                                        <div className="vds-doc-brand-qr">
                                            <div className="vds-qr-code-box">
                                                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="5" y="5" width="3" height="3" fill="currentColor" /><rect x="16" y="5" width="3" height="3" fill="currentColor" /><rect x="5" y="16" width="3" height="3" fill="currentColor" />
                                                </svg>
                                            </div>
                                            <span>VERIFY RECEIPT</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="vds-modal-overlay">
                    <div className="vds-modal">
                        <h3>Delete Deposit Receipt</h3>
                        <p>Are you sure you want to delete deposit receipt <strong>{slipToDelete?.receipt_number}</strong> for <strong>{slipToDelete?.buyer_details?.name}</strong>?</p>
                        <p className="vds-modal-warning">This action cannot be undone.</p>
                        <div className="vds-modal-actions">
                            <button onClick={() => setShowDeleteModal(false)} className="btn btn--outline">Cancel</button>
                            <button onClick={confirmDelete} className="btn btn--primary vds-danger-btn">Delete Receipt</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
