import React, { useState, useEffect, useRef } from 'react';
import { getCars, getDistanceSaleForms, createDistanceSaleForm, updateDistanceSaleForm, deleteDistanceSaleForm } from '../../../services/dataService';
import { LOGO_BASE64 } from './logoBase64';
import './DistanceSaleGenerator.css';

export default function DistanceSaleGenerator() {
    const [carsList, setCarsList] = useState([]);
    const [savedForms, setSavedForms] = useState([]);
    const [selectedCarId, setSelectedCarId] = useState('');
    const [vehicleMode, setVehicleMode] = useState('stock'); // 'stock' | 'custom'
    const [currentFormId, setCurrentFormId] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [zoomPercent, setZoomPercent] = useState(65);
    const scale = zoomPercent / 100;

    // Form fields state
    const [traderDetails, setTraderDetails] = useState({
        telephone: '',
        email: ''
    });

    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        contractDate: new Date().toISOString().slice(0, 10)
    });

    const [vehicleDetails, setVehicleDetails] = useState({
        makeModel: '',
        registration: ''
    });

    const [signatureDetails, setSignatureDetails] = useState({
        customerName: '',
        signatureType: 'blank', // 'blank' | 'draw' | 'upload' | 'typed'
        signatureData: '',
        typedSignature: '',
        signatureDate: new Date().toISOString().slice(0, 10)
    });

    // Signature Canvas Ref
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const cars = getCars() || [];
        setCarsList(cars);
        const forms = getDistanceSaleForms() || [];
        setSavedForms(forms);
    }, []);

    // Sync Customer Name into Signature Section if not customized separately
    useEffect(() => {
        if (!signatureDetails.customerName) {
            setSignatureDetails(prev => ({ ...prev, customerName: customerDetails.name }));
        }
    }, [customerDetails.name]);

    // Handle car selector change
    const handleCarSelect = (carId) => {
        setSelectedCarId(carId);
        if (!carId) return;
        const car = carsList.find(c => c.id === carId);
        if (car) {
            const makeModelStr = `${car.make || ''} ${car.model || ''}`.trim();
            setVehicleDetails({
                makeModel: makeModelStr,
                registration: car.registration || ''
            });
        }
    };

    // Canvas Signature Handlers
    const startDrawing = (e) => {
        if (signatureDetails.signatureType !== 'draw') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0f172a';
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing || signatureDetails.signatureType !== 'draw') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            setSignatureDetails(prev => ({
                ...prev,
                signatureData: canvas.toDataURL()
            }));
        }
    };

    const clearCanvasSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setSignatureDetails(prev => ({ ...prev, signatureData: '' }));
    };

    // Handle Upload Image Signature
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                setSignatureDetails(prev => ({
                    ...prev,
                    signatureData: uploadEvent.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Reset Form
    const handleResetForm = () => {
        setCurrentFormId(null);
        setSelectedCarId('');
        setTraderDetails({ telephone: '', email: '' });
        setCustomerDetails({ name: '', contractDate: new Date().toISOString().slice(0, 10) });
        setVehicleDetails({ makeModel: '', registration: '' });
        setSignatureDetails({
            customerName: '',
            signatureType: 'blank',
            signatureData: '',
            typedSignature: '',
            signatureDate: new Date().toISOString().slice(0, 10)
        });
        clearCanvasSignature();
    };

    // Load saved record
    const handleLoadForm = (form) => {
        setCurrentFormId(form.id);
        setTraderDetails(form.traderDetails || { telephone: '', email: '' });
        setCustomerDetails(form.customerDetails || { name: '', contractDate: '' });
        setVehicleDetails(form.vehicleDetails || { makeModel: '', registration: '' });
        setSignatureDetails(form.signatureDetails || {
            customerName: form.customerDetails?.name || '',
            signatureType: 'blank',
            signatureData: '',
            typedSignature: '',
            signatureDate: new Date().toISOString().slice(0, 10)
        });
    };

    // Save record to local storage history
    const handleSaveRecord = () => {
        const payload = {
            traderDetails,
            customerDetails,
            vehicleDetails,
            signatureDetails
        };
        if (currentFormId) {
            updateDistanceSaleForm(currentFormId, payload);
        } else {
            const newDoc = createDistanceSaleForm(payload);
            setCurrentFormId(newDoc.id);
        }
        setSavedForms(getDistanceSaleForms());
    };

    // Delete record
    const handleDeleteRecord = (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this record?')) {
            deleteDistanceSaleForm(id);
            setSavedForms(getDistanceSaleForms());
            if (currentFormId === id) handleResetForm();
        }
    };

    // Helper: Format UK Date
    const formatDateUK = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Helper: Filename formatting: Distance Sale Right to Cancel - {Customer Name} - {Registration}.pdf
    const getPDFFilename = () => {
        const cust = (customerDetails.name || 'Customer').trim().replace(/[/\\?%*:|"<>]/g, '');
        const reg = (vehicleDetails.registration || 'Vehicle').trim().replace(/[/\\?%*:|"<>]/g, '');
        return `Distance Sale Right to Cancel - ${cust} - ${reg}.pdf`;
    };

    // Direct Browser Print (Opens print/save as PDF dialog)
    const handlePrint = () => {
        handleSaveRecord();
        window.print();
    };

    // PDF Generation & Download via html2pdf.js
    const handleGeneratePDF = async () => {
        setIsGenerating(true);
        handleSaveRecord();

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

            let tempDiv = document.getElementById('temp-pdf-render-container');
            if (tempDiv) tempDiv.remove();

            // Append directly to documentElement to bypass body sidebar & flex layout offsets completely
            tempDiv = document.createElement('div');
            tempDiv.id = 'temp-pdf-render-container';
            tempDiv.setAttribute('style', `
                position: fixed !important;
                top: 0px !important;
                left: 0px !important;
                width: 287mm !important;
                height: 200mm !important;
                margin: 0 !important;
                padding: 0 !important;
                z-index: 999999 !important;
                background: #ffffff !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                transform: none !important;
            `);
            document.documentElement.appendChild(tempDiv);

            // Render signature HTML for PDF
            let sigHtml = '';
            if (signatureDetails.signatureType === 'draw' && signatureDetails.signatureData) {
                sigHtml = `<img src="${signatureDetails.signatureData}" style="max-height: 26px; max-width: 160px; object-fit: contain; display: block;" />`;
            } else if (signatureDetails.signatureType === 'upload' && signatureDetails.signatureData) {
                sigHtml = `<img src="${signatureDetails.signatureData}" style="max-height: 26px; max-width: 160px; object-fit: contain; display: block;" />`;
            } else if (signatureDetails.signatureType === 'typed' && signatureDetails.typedSignature) {
                sigHtml = `<span style="font-family: 'Dancing Script', 'Caveat', cursive, sans-serif; font-size: 13pt; color: #0f172a; line-height: 1;">${signatureDetails.typedSignature}</span>`;
            }

            const formattedContractDate = formatDateUK(customerDetails.contractDate);
            const formattedSigDate = formatDateUK(signatureDetails.signatureDate);
            const sigName = signatureDetails.customerName || customerDetails.name || '';

            tempDiv.innerHTML = `
                <div style="width: 287mm; height: 200mm; padding: 6mm 10mm; box-sizing: border-box; background: #ffffff; font-family: Arial, Helvetica, sans-serif; color: #222222; font-size: 8pt; line-height: 1.2; display: flex; flex-direction: column; justify-content: space-between; margin: 0;">
                    <div>
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 3px;">
                            <img src="${LOGO_BASE64}" style="max-height: 40px; margin: 0 auto 3px auto; display: block;" />
                            <h1 style="font-size: 12pt; font-weight: bold; color: #222222; margin: 2px 0 1px 0; letter-spacing: 0.5px; text-transform: uppercase;">DISTANCE SALE - YOUR RIGHT TO CANCEL</h1>
                            <p style="font-size: 8pt; color: #666666; margin: 0 0 5px 0;">Consumer cancellation terms for vehicles purchased at a distance</p>
                        </div>

                        <!-- Top Info Table -->
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 7.8pt;">
                            <tbody>
                                <tr>
                                    <td style="width: 12%; background-color: #f4f9f1; font-weight: bold; color: #49A921; border: 1px solid #666666; padding: 2.5px 5px; vertical-align: top;">Trader</td>
                                    <td style="width: 38%; border: 1px solid #666666; padding: 2.5px 5px; vertical-align: top;">
                                        <strong>VanCar Autos Limited</strong><br />
                                        Yard on Midland Street, Manchester, M12 6LB
                                    </td>
                                    <td style="width: 12%; background-color: #f4f9f1; font-weight: bold; color: #49A921; border: 1px solid #666666; padding: 2.5px 5px; vertical-align: top;">Contact</td>
                                    <td style="width: 38%; border: 1px solid #666666; padding: 2.5px 5px; vertical-align: top;">
                                        Telephone: <strong>${traderDetails.telephone || '______________________________________________'}</strong><br />
                                        Email: <strong>${traderDetails.email || '_________________________________________________'}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background-color: #f4f9f1; font-weight: bold; color: #49A921; border: 1px solid #666666; padding: 2.5px 5px; vertical-align: top;">Customer</td>
                                    <td style="border: 1px solid #666666; padding: 2.5px 5px; vertical-align: top;">
                                        Name: <strong>${customerDetails.name || '____________________________________'}</strong> &nbsp;&nbsp;
                                        Contract date: <strong>${formattedContractDate || '__________________'}</strong>
                                    </td>
                                    <td style="background-color: #f4f9f1; font-weight: bold; color: #49A921; border: 1px solid #666666; padding: 2.5px 5px; vertical-align: top;">Vehicle</td>
                                    <td style="border: 1px solid #666666; padding: 2.5px 5px; vertical-align: top;">
                                        Make/model: <strong>${vehicleDetails.makeModel || '__________________________'}</strong> &nbsp;&nbsp;
                                        Registration: <strong>${vehicleDetails.registration || '__________________'}</strong>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <!-- 2 Column Body -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <!-- Left Column -->
                            <div style="display: flex; flex-direction: column;">
                                <h2 style="font-size: 9pt; font-weight: bold; color: #49A921; margin: 3px 0 2px 0;">Your cancellation right</h2>
                                <p style="font-size: 7.5pt; color: #222222; margin: 0 0 3px 0; line-height: 1.18;">
                                    If you buy as a consumer and the Consumer Contracts Regulations 2013 apply, you will have the right to cancel this contract within 14 days, subject to the terms below.
                                </p>
                                <p style="font-size: 7.5pt; color: #222222; margin: 0 0 3px 0; line-height: 1.18;">
                                    The cancellation period will expire after 14 days from the day on which you, or a third party on your behalf, collect or take delivery of your vehicle.
                                </p>
                                <p style="font-size: 7.5pt; color: #222222; margin: 0 0 3px 0; line-height: 1.18;">
                                    To exercise the right to cancel, you must inform us of your decision to cancel this contract by a clear statement sent by email to <span style="color: #0056b3; text-decoration: underline;">hellovancarautos@gmail.com</span>, or by hand to the address listed above.
                                </p>
                                <p style="font-size: 7.5pt; color: #222222; margin: 0 0 3px 0; line-height: 1.18;">
                                    To meet the cancellation deadline, it is sufficient for you to send your clear statement or form confirming your exercise of the right to cancel before the cancellation period has expired.
                                </p>

                                <h2 style="font-size: 9pt; font-weight: bold; color: #49A921; margin: 5px 0 2px 0;">Effects of cancellation</h2>
                                <p style="font-size: 7.5pt; color: #222222; margin: 0 0 3px 0; line-height: 1.18;">
                                    If you cancel this contract, we will reimburse payments received from you, excluding the cost of delivering the vehicle to you. This reimbursement is subject to the following conditions:
                                </p>
                                <p style="font-size: 7.2pt; color: #222222; margin: 0 0 2px 0; padding-left: 8px; text-indent: -8px; line-height: 1.15;">
                                    • We may make a deduction from the reimbursement for loss in value of any goods supplied if the loss is the result of unnecessary handling by you. Anything over and above a standard test drive will be considered unnecessary handling and will lead to a deduction of £2 for each mile driven over 20 miles. In addition, we will also be entitled to make a deduction for any damage or excess wear. We will also make a deduction for any costs involved in prepping the vehicle for retail.
                                </p>
                                <p style="font-size: 7.2pt; color: #222222; margin: 0 0 2px 0; padding-left: 8px; text-indent: -8px; line-height: 1.15;">
                                    • We will make the reimbursement without undue delay, and not later than 14 days after the day we receive back from you the vehicle and all documents supplied, including but not limited to service histories and the V5 documentation. We reserve the right to register the vehicle with the DVLA only on expiry of your 14-day cancellation period.
                                </p>
                            </div>

                            <!-- Right Column -->
                            <div style="display: flex; flex-direction: column;">
                                <h2 style="font-size: 9pt; font-weight: bold; color: #49A921; margin: 3px 0 2px 0;">Conditions applying to reimbursement and return</h2>
                                <p style="font-size: 7.2pt; color: #222222; margin: 0 0 2px 0; padding-left: 8px; text-indent: -8px; line-height: 1.15;">
                                    • We will make the reimbursement using the same means of payment as you used for the initial transaction, unless you have expressly agreed otherwise. In any event, you will not incur any fees as a result of the reimbursement. This may include handing back any part-exchange vehicle if still available and/or seeking payment from you to cover any negative equity.
                                </p>
                                <p style="font-size: 7.2pt; color: #222222; margin: 0 0 2px 0; padding-left: 8px; text-indent: -8px; line-height: 1.15;">
                                    • We will withhold the reimbursement until we have received the vehicle and all paperwork back in good order.
                                </p>
                                <p style="font-size: 7.2pt; color: #222222; margin: 0 0 2px 0; padding-left: 8px; text-indent: -8px; line-height: 1.15;">
                                    • It is your responsibility to return the vehicle without undue delay and, in any event, not later than 14 days from the day on which you communicate your cancellation of this contract to us. The vehicle must not be driven from the date you notify us of your cancellation, other than to drive it back to us.
                                </p>
                                <p style="font-size: 7.2pt; color: #222222; margin: 0 0 2px 0; padding-left: 8px; text-indent: -8px; line-height: 1.15;">
                                    • You will remain liable for the vehicle and therefore for its tax, insurance, and any fines, charges or penalties until it has been accepted back at our premises.
                                </p>
                                <p style="font-size: 7.2pt; color: #222222; margin: 0 0 2px 0; padding-left: 8px; text-indent: -8px; line-height: 1.15;">
                                    • You will have to bear the direct cost of returning the vehicle and take full responsibility for its safe return.
                                </p>
                                <p style="font-size: 7.2pt; color: #222222; margin: 0 0 2px 0; padding-left: 8px; text-indent: -8px; line-height: 1.15;">
                                    • You are only liable for any diminished value of the vehicle resulting from handling other than that which is necessary to establish the nature, characteristics and functioning of the vehicle, in accordance with the previous reference to test drives.
                                </p>

                                <div style="background-color: #efefef; border: 1px solid #d0d0d0; padding: 3px 6px; font-size: 7.5pt; font-weight: bold; color: #222222; margin: 4px 0 6px 0;">
                                    I have read, understood and agree to the terms regarding my 14-day right to cancel.
                                </div>

                                <table style="width: 100%; border-collapse: collapse; margin-top: 2px; font-size: 7.8pt;">
                                    <tbody>
                                        <tr>
                                            <td style="font-weight: bold; color: #49A921; width: 60px; padding: 2px 3px; vertical-align: bottom;">Signature</td>
                                            <td style="border-bottom: 1px solid #666666; height: 26px; vertical-align: bottom; padding-bottom: 2px; width: 55%;">
                                                ${sigHtml}
                                            </td>
                                            <td style="font-weight: bold; color: #49A921; width: 35px; padding: 2px 3px 2px 6px; vertical-align: bottom;">Date</td>
                                            <td style="border-bottom: 1px solid #666666; height: 26px; vertical-align: bottom; padding-bottom: 2px;">
                                                <strong>${formattedSigDate}</strong>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold; color: #49A921; padding: 5px 3px 2px 3px; vertical-align: bottom;">Name</td>
                                            <td style="border-bottom: 1px solid #666666; height: 26px; vertical-align: bottom; padding-bottom: 2px;">
                                                <strong>${sigName}</strong>
                                            </td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; font-size: 7pt; color: #555555; border-top: 1px solid #e2e8f0; padding-top: 3px; margin-top: 3px;">
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
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
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

    // Render signature representation inside preview
    const renderSignatureContent = () => {
        if (signatureDetails.signatureType === 'draw' && signatureDetails.signatureData) {
            return <img src={signatureDetails.signatureData} alt="Signature" className="vdg-sig-img-render" />;
        }
        if (signatureDetails.signatureType === 'upload' && signatureDetails.signatureData) {
            return <img src={signatureDetails.signatureData} alt="Signature" className="vdg-sig-img-render" />;
        }
        if (signatureDetails.signatureType === 'typed' && signatureDetails.typedSignature) {
            return <span className="vdg-sig-text-render">{signatureDetails.typedSignature}</span>;
        }
        return null;
    };

    return (
        <div className="vdg-container">
            <div className="vdg-header no-print">
                <h1 className="vdg-title">Distance Sale Right to Cancel Form Generator</h1>
                <p className="vdg-subtitle">
                    Generate standard, legal-grade 14-day Distance Sale cancellation forms with exact layout, branding, and wording matching the original template.
                </p>
            </div>

            <div className="vdg-main-grid">
                {/* Left Panel: Form Controls */}
                <div className="vdg-form-card no-print">
                    {/* Vehicle Source Mode Toggle */}
                    <div className="vdg-form-section">
                        <label className="vdg-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Vehicle Source</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <button
                                type="button"
                                className={`vdg-btn-secondary ${vehicleMode === 'stock' ? 'vdg-radio-btn--active' : ''}`}
                                style={{ flex: 1, padding: '0.5rem' }}
                                onClick={() => setVehicleMode('stock')}
                            >
                                🚗 Select from Stock
                            </button>
                            <button
                                type="button"
                                className={`vdg-btn-secondary ${vehicleMode === 'custom' ? 'vdg-radio-btn--active' : ''}`}
                                style={{ flex: 1, padding: '0.5rem' }}
                                onClick={() => {
                                    setVehicleMode('custom');
                                    setSelectedCarId('');
                                }}
                            >
                                ✏️ Custom Vehicle (Not in Stock)
                            </button>
                        </div>

                        {vehicleMode === 'stock' && carsList.length > 0 && (
                            <select
                                className="vdg-select"
                                value={selectedCarId}
                                onChange={(e) => handleCarSelect(e.target.value)}
                            >
                                <option value="">-- Select a vehicle from stock --</option>
                                {carsList.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.registration ? `[${c.registration}] ` : ''}{c.make} {c.model} {c.year ? `(${c.year})` : ''}
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

                    {/* Section 1: Trader Details */}
                    <div className="vdg-form-section">
                        <h3 className="vdg-section-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#49A921" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            Trader Details
                        </h3>
                        <div className="vdg-field-group">
                            <label className="vdg-label">Telephone</label>
                            <input
                                type="text"
                                className="vdg-input"
                                placeholder="e.g. 0161 123 4567"
                                value={traderDetails.telephone}
                                onChange={(e) => setTraderDetails({ ...traderDetails, telephone: e.target.value })}
                            />
                        </div>
                        <div className="vdg-field-group">
                            <label className="vdg-label">Email</label>
                            <input
                                type="email"
                                className="vdg-input"
                                placeholder="e.g. sales@vancarautos.co.uk"
                                value={traderDetails.email}
                                onChange={(e) => setTraderDetails({ ...traderDetails, email: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Section 2: Customer Details */}
                    <div className="vdg-form-section">
                        <h3 className="vdg-section-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#49A921" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                            Customer Details
                        </h3>
                        <div className="vdg-field-group">
                            <label className="vdg-label">Customer Name</label>
                            <input
                                type="text"
                                className="vdg-input"
                                placeholder="e.g. John Smith"
                                value={customerDetails.name}
                                onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                            />
                        </div>
                        <div className="vdg-field-group">
                            <label className="vdg-label">Contract Date</label>
                            <input
                                type="date"
                                className="vdg-input"
                                value={customerDetails.contractDate}
                                onChange={(e) => setCustomerDetails({ ...customerDetails, contractDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Section 3: Vehicle Details */}
                    <div className="vdg-form-section">
                        <h3 className="vdg-section-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#49A921" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                            Vehicle Details
                        </h3>
                        <div className="vdg-field-group">
                            <label className="vdg-label">Make / Model</label>
                            <input
                                type="text"
                                className="vdg-input"
                                placeholder="e.g. Ford Transit Custom"
                                value={vehicleDetails.makeModel}
                                onChange={(e) => setVehicleDetails({ ...vehicleDetails, makeModel: e.target.value })}
                            />
                        </div>
                        <div className="vdg-field-group">
                            <label className="vdg-label">Registration</label>
                            <input
                                type="text"
                                className="vdg-input"
                                placeholder="e.g. AB12 CDE"
                                value={vehicleDetails.registration}
                                onChange={(e) => setVehicleDetails({ ...vehicleDetails, registration: e.target.value.toUpperCase() })}
                            />
                        </div>
                    </div>

                    {/* Section 4: Signature Section */}
                    <div className="vdg-form-section">
                        <h3 className="vdg-section-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#49A921" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                            Signature Section
                        </h3>
                        <div className="vdg-field-group">
                            <label className="vdg-label">Signatory Name</label>
                            <input
                                type="text"
                                className="vdg-input"
                                placeholder="Customer Name"
                                value={signatureDetails.customerName}
                                onChange={(e) => setSignatureDetails({ ...signatureDetails, customerName: e.target.value })}
                            />
                        </div>

                        <div className="vdg-field-group">
                            <label className="vdg-label">Signature Mode</label>
                            <div className="vdg-sig-options">
                                <label className={`vdg-radio-btn ${signatureDetails.signatureType === 'blank' ? 'vdg-radio-btn--active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="sigMode"
                                        value="blank"
                                        checked={signatureDetails.signatureType === 'blank'}
                                        onChange={() => setSignatureDetails({ ...signatureDetails, signatureType: 'blank' })}
                                    />
                                    Leave Blank
                                </label>
                                <label className={`vdg-radio-btn ${signatureDetails.signatureType === 'draw' ? 'vdg-radio-btn--active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="sigMode"
                                        value="draw"
                                        checked={signatureDetails.signatureType === 'draw'}
                                        onChange={() => setSignatureDetails({ ...signatureDetails, signatureType: 'draw' })}
                                    />
                                    Draw Signature
                                </label>
                                <label className={`vdg-radio-btn ${signatureDetails.signatureType === 'upload' ? 'vdg-radio-btn--active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="sigMode"
                                        value="upload"
                                        checked={signatureDetails.signatureType === 'upload'}
                                        onChange={() => setSignatureDetails({ ...signatureDetails, signatureType: 'upload' })}
                                    />
                                    Upload Image
                                </label>
                                <label className={`vdg-radio-btn ${signatureDetails.signatureType === 'typed' ? 'vdg-radio-btn--active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="sigMode"
                                        value="typed"
                                        checked={signatureDetails.signatureType === 'typed'}
                                        onChange={() => setSignatureDetails({ ...signatureDetails, signatureType: 'typed' })}
                                    />
                                    Type Signature
                                </label>
                            </div>
                        </div>

                        {/* Interactive Signature Input Modes */}
                        {signatureDetails.signatureType === 'draw' && (
                            <div className="vdg-field-group">
                                <label className="vdg-label">Draw Signature on Box Below:</label>
                                <div className="vdg-canvas-wrapper">
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
                                    />
                                </div>
                                <button type="button" className="vdg-btn-secondary" onClick={clearCanvasSignature}>
                                    Clear Signature
                                </button>
                            </div>
                        )}

                        {signatureDetails.signatureType === 'upload' && (
                            <div className="vdg-field-group">
                                <label className="vdg-label">Upload Signature Image (PNG/JPG)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="vdg-input"
                                    onChange={handleImageUpload}
                                />
                                {signatureDetails.signatureData && (
                                    <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                                        <img src={signatureDetails.signatureData} alt="Preview" style={{ maxHeight: '60px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                )}
                            </div>
                        )}

                        {signatureDetails.signatureType === 'typed' && (
                            <div className="vdg-field-group">
                                <label className="vdg-label">Typed Signature Text</label>
                                <input
                                    type="text"
                                    className="vdg-input vdg-sig-typed"
                                    placeholder="Type signature..."
                                    value={signatureDetails.typedSignature}
                                    onChange={(e) => setSignatureDetails({ ...signatureDetails, typedSignature: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="vdg-field-group" style={{ marginTop: '0.75rem' }}>
                            <label className="vdg-label">Signature Date</label>
                            <input
                                type="date"
                                className="vdg-input"
                                value={signatureDetails.signatureDate}
                                onChange={(e) => setSignatureDetails({ ...signatureDetails, signatureDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="vdg-action-bar">
                        <button
                            type="button"
                            className="vdg-btn-primary"
                            onClick={handleGeneratePDF}
                            disabled={isGenerating}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            {isGenerating ? 'Generating PDF...' : 'Generate & Download PDF'}
                        </button>
                        <button
                            type="button"
                            className="vdg-btn-secondary"
                            onClick={handlePrint}
                        >
                            🖨️ Print / Save PDF Dialog
                        </button>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="vdg-btn-secondary" style={{ flex: 1 }} onClick={handleSaveRecord}>
                                Save Record
                            </button>
                            <button type="button" className="vdg-btn-secondary" style={{ flex: 1 }} onClick={handleResetForm}>
                                Reset Form
                            </button>
                        </div>
                    </div>

                    {/* Saved History List */}
                    {savedForms.length > 0 && (
                        <div className="vdg-history-card">
                            <h4 className="vdg-label" style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Saved Document Records</h4>
                            <div className="vdg-history-list">
                                {savedForms.map(f => (
                                    <div key={f.id} className="vdg-history-item" onClick={() => handleLoadForm(f)} style={{ cursor: 'pointer' }}>
                                        <div>
                                            <strong>{f.customerDetails?.name || 'Unnamed Customer'}</strong>
                                            <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>({f.vehicleDetails?.registration || 'No Reg'})</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteRecord(f.id, e)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Live Document Preview */}
                <div className="vdg-preview-panel">
                    <div className="vdg-zoom-bar no-print">
                        <span>Zoom Preview:</span>
                        <button type="button" onClick={() => setZoomPercent(prev => Math.max(40, prev - 10))}>-</button>
                        <span>{zoomPercent}%</span>
                        <button type="button" onClick={() => setZoomPercent(prev => Math.min(100, prev + 10))}>+</button>
                    </div>

                    <div className="vdg-doc-scale-wrapper" style={{ transform: `scale(${scale})`, height: `${210 * scale}mm` }}>
                        <div id="distance-sale-pdf-template" className="vdg-document-page">

                            {/* Header */}
                            <div>
                                <div className="vdg-doc-header">
                                    <img src={LOGO_BASE64} alt="VanCar Autos" className="vdg-doc-logo" />
                                    <h1 className="vdg-doc-title">DISTANCE SALE - YOUR RIGHT TO CANCEL</h1>
                                    <p className="vdg-doc-subtitle">Consumer cancellation terms for vehicles purchased at a distance</p>
                                </div>

                                {/* Top Grid Table */}
                                <table className="vdg-info-table">
                                    <tbody>
                                        <tr>
                                            <td className="vdg-col-label">Trader</td>
                                            <td className="vdg-col-val1">
                                                <strong>VanCar Autos Limited</strong><br />
                                                Yard on Midland Street, Manchester, M12 6LB
                                            </td>
                                            <td className="vdg-col-label">Contact</td>
                                            <td className="vdg-col-val2">
                                                Telephone: <span className="vdg-doc-val">{traderDetails.telephone || '______________________________________________'}</span><br />
                                                Email: <span className="vdg-doc-val">{traderDetails.email || '_________________________________________________'}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="vdg-col-label">Customer</td>
                                            <td className="vdg-col-val1">
                                                Name: <span className="vdg-doc-val">{customerDetails.name || '____________________________________'}</span> &nbsp;&nbsp;
                                                Contract date: <span className="vdg-doc-val">{formatDateUK(customerDetails.contractDate) || '__________________'}</span>
                                            </td>
                                            <td className="vdg-col-label">Vehicle</td>
                                            <td className="vdg-col-val2">
                                                Make/model: <span className="vdg-doc-val">{vehicleDetails.makeModel || '__________________________'}</span> &nbsp;&nbsp;
                                                Registration: <span className="vdg-doc-val">{vehicleDetails.registration || '__________________'}</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* 2-Column Body Structure */}
                                <div className="vdg-body-grid">
                                    {/* Left Column */}
                                    <div className="vdg-body-col">
                                        <h2 className="vdg-section-h2">Your cancellation right</h2>
                                        <p className="vdg-p">
                                            If you buy as a consumer and the Consumer Contracts Regulations 2013 apply, you will have the right to cancel this contract within 14 days, subject to the terms below.
                                        </p>
                                        <p className="vdg-p">
                                            The cancellation period will expire after 14 days from the day on which you, or a third party on your behalf, collect or take delivery of your vehicle.
                                        </p>
                                        <p className="vdg-p">
                                            To exercise the right to cancel, you must inform us of your decision to cancel this contract by a clear statement sent by email to <span style={{ color: '#0056b3', textDecoration: 'underline' }}>hellovancarautos@gmail.com</span>, or by hand to the address listed above.
                                        </p>
                                        <p className="vdg-p">
                                            To meet the cancellation deadline, it is sufficient for you to send your clear statement or form confirming your exercise of the right to cancel before the cancellation period has expired.
                                        </p>

                                        <h2 className="vdg-section-h2" style={{ marginTop: '6px' }}>Effects of cancellation</h2>
                                        <p className="vdg-p">
                                            If you cancel this contract, we will reimburse payments received from you, excluding the cost of delivering the vehicle to you. This reimbursement is subject to the following conditions:
                                        </p>
                                        <p className="vdg-bullet-p">
                                            • We may make a deduction from the reimbursement for loss in value of any goods supplied if the loss is the result of unnecessary handling by you. Anything over and above a standard test drive will be considered unnecessary handling and will lead to a deduction of £2 for each mile driven over 20 miles. In addition, we will also be entitled to make a deduction for any damage or excess wear. We will also make a deduction for any costs involved in prepping the vehicle for retail.
                                        </p>
                                        <p className="vdg-bullet-p">
                                            • We will make the reimbursement without undue delay, and not later than 14 days after the day we receive back from you the vehicle and all documents supplied, including but not limited to service histories and the V5 documentation. We reserve the right to register the vehicle with the DVLA only on expiry of your 14-day cancellation period.
                                        </p>
                                    </div>

                                    {/* Right Column */}
                                    <div className="vdg-body-col">
                                        <h2 className="vdg-section-h2">Conditions applying to reimbursement and return</h2>
                                        <p className="vdg-bullet-p">
                                            • We will make the reimbursement using the same means of payment as you used for the initial transaction, unless you have expressly agreed otherwise. In any event, you will not incur any fees as a result of the reimbursement. This may include handing back any part-exchange vehicle if still available and/or seeking payment from you to cover any negative equity.
                                        </p>
                                        <p className="vdg-bullet-p">
                                            • We will withhold the reimbursement until we have received the vehicle and all paperwork back in good order.
                                        </p>
                                        <p className="vdg-bullet-p">
                                            • It is your responsibility to return the vehicle without undue delay and, in any event, not later than 14 days from the day on which you communicate your cancellation of this contract to us. The vehicle must not be driven from the date you notify us of your cancellation, other than to drive it back to us.
                                        </p>
                                        <p className="vdg-bullet-p">
                                            • You will remain liable for the vehicle and therefore for its tax, insurance, and any fines, charges or penalties until it has been accepted back at our premises.
                                        </p>
                                        <p className="vdg-bullet-p">
                                            • You will have to bear the direct cost of returning the vehicle and take full responsibility for its safe return.
                                        </p>
                                        <p className="vdg-bullet-p">
                                            • You are only liable for any diminished value of the vehicle resulting from handling other than that which is necessary to establish the nature, characteristics and functioning of the vehicle, in accordance with the previous reference to test drives.
                                        </p>

                                        {/* Statement Box */}
                                        <div className="vdg-agreed-box">
                                            I have read, understood and agree to the terms regarding my 14-day right to cancel.
                                        </div>

                                        {/* Signature Table */}
                                        <table className="vdg-sig-table">
                                            <tbody>
                                                <tr>
                                                    <td className="vdg-sig-label">Signature</td>
                                                    <td className="vdg-sig-line-cell" style={{ width: '55%' }}>
                                                        {renderSignatureContent()}
                                                    </td>
                                                    <td className="vdg-sig-label" style={{ width: '40px', paddingLeft: '8px' }}>Date</td>
                                                    <td className="vdg-sig-line-cell">
                                                        <span className="vdg-doc-val">{formatDateUK(signatureDetails.signatureDate)}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="vdg-sig-label" style={{ paddingTop: '8px' }}>Name</td>
                                                    <td className="vdg-sig-line-cell" style={{ paddingTop: '8px' }}>
                                                        <span className="vdg-doc-val">{signatureDetails.customerName || customerDetails.name}</span>
                                                    </td>
                                                    <td></td>
                                                    <td></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="vdg-doc-footer">
                                VanCar Autos Limited trading as VanCar Autos | Yard on Midland Street, Manchester, M12 6LB
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
