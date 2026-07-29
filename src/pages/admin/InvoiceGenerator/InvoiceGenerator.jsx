import { useState, useEffect, useRef } from 'react';
import { getCars, getInvoices, createInvoice, updateInvoice, deleteInvoice } from '../../../services/dataService';
import './InvoiceGenerator.css';

const formatMakeModelTitleCase = (makeStr, modelStr) => {
    const formatWord = (w) => {
        if (!w) return '';
        const upper = w.toUpperCase();
        if (['BMW', 'VW', 'MINI', 'MG', 'GT-R', 'RS', 'M3', 'M4', 'M5', 'AMG', 'SUV', 'SLK', 'TT'].includes(upper)) {
            return upper;
        }
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    };

    const formattedMake = (makeStr || '').split(/\s+/).map(formatWord).join(' ');
    const formattedModel = (modelStr || '').split(/\s+/).map(w => {
        const upper = w.toUpperCase();
        if (['BMW', 'VW', 'MINI', 'MG', 'TDI', 'CDTI', 'TFSI', 'DCI', 'HDI', 'S-LINE', 'AMG', 'RS'].includes(upper)) {
            return upper;
        }
        if (/^[0-9]+[a-z]+$/i.test(w)) {
            return w.toLowerCase();
        }
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');

    return { make: formattedMake || '[Make]', model: formattedModel || '[Model]' };
};

export default function InvoiceGenerator() {
    const [invoicesList, setInvoicesList] = useState([]);
    const [carsList, setCarsList] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
    const [selectedCarId, setSelectedCarId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentInvoiceId, setCurrentInvoiceId] = useState(null);
    const containerRef = useRef(null);
    const [zoomPercent, setZoomPercent] = useState(65);
    const scale = zoomPercent / 100;

    // Form Fields State
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        address1: '',
        address2: '',
        city: '',
        postcode: '',
        phone: '',
        email: ''
    });

    const [vehicleDetails, setVehicleDetails] = useState({
        registration: '',
        make: '',
        model: '',
        trim: '',
        colour: '',
        mileage: '',
        vin: '',
        engineNo: '',
        engineCapacity: '',
        firstRegDate: '',
        fuelType: 'Petrol',
        transmission: 'Manual'
    });

    const [saleDetails, setSaleDetails] = useState({
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        cashPrice: 0,
        deposit: 0,
        partExchange: 0,
        settlementFigure: 0,
        financeAmount: 0,
        balanceDue: 0
    });

    const [notes, setNotes] = useState({
        deliveryDetails: '',
        warrantyInfo: '30 Days Warranty Included. Optional Extended Warranty Available (Additional Charges Apply).',
        additionalComments: '',
        termsOfSale: 'Please make payment by the due date shown on this invoice. Title to the vehicle remains with Vancar Autos until funds are cleared in full.'
    });

    // Load database resources
    useEffect(() => {
        setInvoicesList(getInvoices());
        setCarsList(getCars());
    }, [viewMode]);

    // Handle calculation of totals
    useEffect(() => {
        const cashPrice = parseFloat(saleDetails.cashPrice) || 0;
        const deposit = parseFloat(saleDetails.deposit) || 0;
        const px = parseFloat(saleDetails.partExchange) || 0;
        const settlement = parseFloat(saleDetails.settlementFigure) || 0;
        const finance = parseFloat(saleDetails.financeAmount) || 0;

        // Balance Due = Cash Price - Deposit - Part Exchange + Settlement Figure - Finance Amount
        const balance = cashPrice - deposit - px + settlement - finance;
        setSaleDetails(prev => ({
            ...prev,
            balanceDue: balance
        }));
    }, [saleDetails.cashPrice, saleDetails.deposit, saleDetails.partExchange, saleDetails.settlementFigure, saleDetails.financeAmount]);

    // Calculate live preview scaling dynamically to fit screens
    useEffect(() => {
        if (viewMode !== 'form') return;
        
        const updateScale = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const padding = 48; // Padding on container is 24px * 2
                const availableWidth = containerWidth - padding;
                
                // Target width is 794 pixels (210mm at 96dpi)
                const targetWidth = 794; 
                let newScale = availableWidth / targetWidth;
                
                // Clamp between 0.40 and 1.0
                newScale = Math.min(Math.max(newScale, 0.40), 1.0);
                setZoomPercent(Math.round(newScale * 100));
            }
        };

        // Delay slightly to allow DOM to render and stabilize

        const observer = new ResizeObserver(() => {
            updateScale();
        });
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        window.addEventListener('resize', updateScale);
        return () => {
            clearTimeout(timer);
            observer.disconnect();
            window.removeEventListener('resize', updateScale);
        };
    }, [viewMode]);

    // Auto-generate invoice number
    const generateNextInvoiceNumber = () => {
        if (!invoicesList || invoicesList.length === 0) {
            return 'INV-000001';
        }
        const numbers = invoicesList
            .map(inv => {
                const match = inv.invoice_number?.match(/INV-(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => !isNaN(n));
        const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
        return `INV-${(maxNum + 1).toString().padStart(6, '0')}`;
    };

    // Pre-fill from selected stock vehicle
    const handleCarPrefillChange = (e) => {
        const carId = e.target.value;
        setSelectedCarId(carId);
        if (!carId) return;

        const car = carsList.find(c => c.id === carId);
        if (car) {
            setVehicleDetails({
                registration: car.registration || '',
                make: car.make || '',
                model: car.model || '',
                trim: car.trim || '',
                colour: car.colour || '',
                mileage: car.mileage ? car.mileage.toString() : '',
                vin: car.vin || '',
                engineNo: car.engineNo || '',
                engineCapacity: car.engine ? car.engine.replace(/[^0-9]/g, '') : '',
                firstRegDate: car.firstRegDate || '',
                fuelType: car.fuel || 'Petrol',
                transmission: car.transmission || 'Manual'
            });

            // Set sale cash price to vehicle price by default
            setSaleDetails(prev => ({
                ...prev,
                cashPrice: car.price || 0
            }));
        }
    };

    // Trigger form entry for new invoice
    const handleCreateNewTrigger = () => {
        setCurrentInvoiceId(null);
        setSelectedCarId('');
        
        // Reset Customer
        setCustomerDetails({
            name: '',
            address1: '',
            address2: '',
            city: '',
            postcode: '',
            phone: '',
            email: ''
        });

        // Reset Vehicle
        setVehicleDetails({
            registration: '',
            make: '',
            model: '',
            trim: '',
            colour: '',
            mileage: '',
            vin: '',
            engineNo: '',
            engineCapacity: '',
            firstRegDate: '',
            fuelType: 'Petrol',
            transmission: 'Manual'
        });

        // Reset Sale
        setSaleDetails({
            invoiceNumber: generateNextInvoiceNumber(),
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: new Date().toISOString().split('T')[0],
            cashPrice: 0,
            deposit: 0,
            partExchange: 0,
            settlementFigure: 0,
            financeAmount: 0,
            balanceDue: 0
        });

        // Reset Notes
        setNotes({
            deliveryDetails: '',
            warrantyInfo: '30 Days Warranty Included. Optional Extended Warranty Available (Additional Charges Apply).',
            additionalComments: '',
            termsOfSale: 'Please make payment by the due date shown on this invoice. Title to the vehicle remains with Vancar Autos until funds are cleared in full.'
        });

        setViewMode('form');
    };

    // Edit past invoice
    const handleEditTrigger = (invoice) => {
        setCurrentInvoiceId(invoice.id);
        setCustomerDetails(invoice.customer_details);
        setVehicleDetails(invoice.vehicle_details);
        setSaleDetails({
            invoiceNumber: invoice.invoice_number,
            invoiceDate: invoice.invoice_date,
            dueDate: invoice.due_date,
            cashPrice: invoice.sale_details.cashPrice,
            deposit: invoice.sale_details.deposit,
            partExchange: invoice.sale_details.partExchange,
            settlementFigure: invoice.sale_details.settlementFigure,
            financeAmount: invoice.sale_details.financeAmount,
            balanceDue: invoice.sale_details.balanceDue
        });
        setNotes({
            deliveryDetails: invoice.notes?.deliveryDetails || '',
            warrantyInfo: invoice.notes?.warrantyInfo || '',
            additionalComments: invoice.notes?.additionalComments || '',
            termsOfSale: invoice.notes?.termsOfSale || ''
        });
        setViewMode('form');
    };

    // Duplicate invoice
    const handleDuplicateTrigger = (invoice) => {
        setCurrentInvoiceId(null); // Save as new
        setCustomerDetails(invoice.customer_details);
        setVehicleDetails(invoice.vehicle_details);
        setSaleDetails({
            invoiceNumber: generateNextInvoiceNumber(),
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: new Date().toISOString().split('T')[0],
            cashPrice: invoice.sale_details.cashPrice,
            deposit: invoice.sale_details.deposit,
            partExchange: invoice.sale_details.partExchange,
            settlementFigure: invoice.sale_details.settlementFigure,
            financeAmount: invoice.sale_details.financeAmount,
            balanceDue: invoice.sale_details.balanceDue
        });
        setNotes({
            deliveryDetails: invoice.notes?.deliveryDetails || '',
            warrantyInfo: invoice.notes?.warrantyInfo || '',
            additionalComments: invoice.notes?.additionalComments || '',
            termsOfSale: invoice.notes?.termsOfSale || ''
        });
        setViewMode('form');
    };

    // Save invoice to database
    const handleSaveInvoice = () => {
        if (!customerDetails.name.trim()) {
            alert('Please enter a Customer Name.');
            return;
        }
        if (!customerDetails.email || !customerDetails.email.trim()) {
            alert('Customer Email is mandatory. Please enter a valid email address.');
            return;
        }
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(customerDetails.email.trim())) {
            alert('Please enter a valid Customer Email address (e.g. customer@example.com).');
            return;
        }
        if (!saleDetails.invoiceNumber.trim()) {
            alert('Please enter an Invoice Number.');
            return;
        }

        const invoiceData = {
            invoice_number: saleDetails.invoiceNumber,
            invoice_date: saleDetails.invoiceDate,
            due_date: saleDetails.dueDate,
            customer_details: customerDetails,
            vehicle_details: vehicleDetails,
            sale_details: {
                cashPrice: saleDetails.cashPrice,
                deposit: saleDetails.deposit,
                partExchange: saleDetails.partExchange,
                settlementFigure: saleDetails.settlementFigure,
                financeAmount: saleDetails.financeAmount,
                balanceDue: saleDetails.balanceDue
            },
            notes: notes
        };

        if (currentInvoiceId) {
            updateInvoice(currentInvoiceId, invoiceData);
        } else {
            createInvoice(invoiceData);
        }

        setViewMode('list');
    };

    // Delete invoice
    const handleDeleteInvoice = (id) => {
        if (window.confirm('Are you sure you want to delete this invoice record?')) {
            deleteInvoice(id);
            setInvoicesList(getInvoices());
        }
    };

    // Download PDF from clean un-scaled off-screen HTML block using html2pdf.js loaded from CDN
    const handleDownloadPDF = (invoiceToDownload = null) => {
        const invoiceData = invoiceToDownload || {
            invoice_number: saleDetails.invoiceNumber,
            invoice_date: saleDetails.invoiceDate,
            due_date: saleDetails.dueDate,
            customer_details: customerDetails,
            vehicle_details: vehicleDetails,
            sale_details: {
                cashPrice: saleDetails.cashPrice,
                deposit: saleDetails.deposit,
                partExchange: saleDetails.partExchange,
                settlementFigure: saleDetails.settlementFigure,
                financeAmount: saleDetails.financeAmount,
                balanceDue: saleDetails.balanceDue
            },
            notes: notes
        };

        const tempDiv = document.createElement('div');
        tempDiv.id = 'temp-pdf-render-container';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        document.body.appendChild(tempDiv);

        const vehicle = invoiceData.vehicle_details;
        const customer = invoiceData.customer_details;
        const sale = invoiceData.sale_details;
        const invNotes = invoiceData.notes;

        const subtotalFormatted = (parseFloat(sale.cashPrice) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const depositFormatted = (parseFloat(sale.deposit) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const pxFormatted = (parseFloat(sale.partExchange) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const settlementFormatted = (parseFloat(sale.settlementFigure) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const financeFormatted = (parseFloat(sale.financeAmount) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const balanceFormatted = (parseFloat(sale.balanceDue) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const invoiceDateFormatted = invoiceData.invoice_date ? new Date(invoiceData.invoice_date).toLocaleDateString('en-GB') : '';
        const dueDateFormatted = invoiceData.due_date ? new Date(invoiceData.due_date).toLocaleDateString('en-GB') : '';
        const firstRegFormatted = vehicle.firstRegDate ? new Date(vehicle.firstRegDate).toLocaleDateString('en-GB') : '';

        tempDiv.innerHTML = `
            <div id="invoice-pdf-template-download" style="width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; background: white; font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #0f172a; line-height: 1.5;">
                <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #55A01F; padding-bottom: 20px; margin-bottom: 25px;">
                    <div>
                        <img src="/images/logo.png" alt="Vancar Autos" style="height: 55px; margin-bottom: 12px; display: block;" />
                        <div style="font-size: 11px; color: #475569; line-height: 1.4;">
                            <strong>Vancar Autos Ltd</strong><br />
                            Yard 14, Midland Street<br />
                            Manchester, M12 6LB<br />
                            Phone: 07386 533337<br />
                            Email: hellovancarautos@gmail.com<br />
                            Web: www.vancarautos.co.uk
                        </div>
                    </div>
                    <div style="text-align: right; min-width: 220px;">
                        <h1 style="font-size: 32px; font-weight: bold; color: #55A01F; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Invoice</h1>
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 11px; line-height: 1.5; text-align: left;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <strong style="color: #475569;">Invoice No:</strong>
                                <span style="color: #0f172a; font-weight: 600;">${invoiceData.invoice_number}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <strong style="color: #475569;">Invoice Date:</strong>
                                <span style="color: #0f172a;">${invoiceDateFormatted}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <strong style="color: #475569;">Due Date:</strong>
                                <span style="color: #0f172a; font-weight: 600;">${dueDateFormatted}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <h2 style="font-size: 12px; text-transform: uppercase; color: #55A01F; margin: 0 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; letter-spacing: 0.5px;">Bill To</h2>
                    <div style="font-size: 12px; color: #0f172a; line-height: 1.5;">
                        <strong>${customer.name || 'Customer Name'}</strong><br />
                        ${customer.address1 || 'Address Line 1'}${customer.address2 ? `<br />${customer.address2}` : ''}<br />
                        ${customer.city || 'City'}, ${customer.postcode || 'Postcode'}<br />
                        ${customer.phone ? `Phone: ${customer.phone}<br />` : ''}
                        ${customer.email ? `Email: ${customer.email}` : ''}
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px;">
                    <thead>
                        <tr style="background-color: #55A01F; color: white;">
                            <th style="text-align: left; padding: 10px; border-radius: 4px 0 0 4px; font-weight: 600; text-transform: uppercase; border: none;">Description</th>
                            <th style="text-align: center; padding: 10px; width: 80px; font-weight: 600; text-transform: uppercase; border: none;">Qty</th>
                            <th style="text-align: right; padding: 10px; width: 100px; font-weight: 600; text-transform: uppercase; border: none;">Rate</th>
                            <th style="text-align: right; padding: 10px; width: 110px; border-radius: 0 4px 4px 0; font-weight: 600; text-transform: uppercase; border: none;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 10px; font-size: 12px; color: #0f172a; line-height: 1.4;">
                                <strong>Vehicle Sale</strong><br />
                                ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.trim ? `- ${vehicle.trim}` : ''}<br />
                                <span style="color: #64748b; font-size: 10px;">Reg: ${vehicle.registration || 'N/A'} | Mileage: ${vehicle.mileage ? parseFloat(vehicle.mileage).toLocaleString('en-GB') : 'N/A'} Miles</span>
                            </td>
                            <td style="text-align: center; padding: 12px 10px; font-size: 12px; color: #0f172a;">1</td>
                            <td style="text-align: right; padding: 12px 10px; font-size: 12px; color: #0f172a;">£${subtotalFormatted}</td>
                            <td style="text-align: right; padding: 12px 10px; font-size: 12px; color: #0f172a; font-weight: 600;">£${subtotalFormatted}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <div style="width: 48%;">
                        <h2 style="font-size: 12px; text-transform: uppercase; color: #55A01F; margin: 0 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; letter-spacing: 0.5px;">Vehicle Details</h2>
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 10px;">
                            <div><strong style="color:#64748b;">Registration:</strong> <span style="color:#0f172a; font-weight:500;">${vehicle.registration || '-'}</span></div>
                            <div><strong style="color:#64748b;">Make:</strong> <span style="color:#0f172a; font-weight:500;">${vehicle.make || '-'}</span></div>
                            <div><strong style="color:#64748b;">Model:</strong> <span style="color:#0f172a; font-weight:500;">${vehicle.model || '-'}</span></div>
                            <div><strong style="color:#64748b;">Colour:</strong> <span style="color:#0f172a; font-weight:500;">${vehicle.colour || '-'}</span></div>
                            <div><strong style="color:#64748b;">VIN:</strong> <span style="color:#0f172a; font-weight:500; font-family:monospace;">${vehicle.vin || '-'}</span></div>
                            <div><strong style="color:#64748b;">Engine No:</strong> <span style="color:#0f172a; font-weight:500;">${vehicle.engineNo || '-'}</span></div>
                            <div><strong style="color:#64748b;">Capacity:</strong> <span style="color:#0f172a; font-weight:500;">${vehicle.engineCapacity ? `${vehicle.engineCapacity} cc` : '-'}</span></div>
                            <div><strong style="color:#64748b;">Mileage:</strong> <span style="color:#0f172a; font-weight:500;">${vehicle.mileage ? parseInt(vehicle.mileage).toLocaleString('en-GB') : '-'}</span></div>
                            <div style="grid-column: span 2;"><strong style="color:#64748b;">Date Registered:</strong> <span style="color:#0f172a; font-weight:500;">${firstRegFormatted || '-'}</span></div>
                        </div>
                    </div>

                    <div style="width: 45%; margin-left: auto;">
                        <div style="font-size: 11px; line-height: 1.8;">
                            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                                <strong style="color:#475569;">Subtotal:</strong>
                                <span style="color:#0f172a;">£${subtotalFormatted}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 4px 0;">
                                <strong style="color:#475569;">Deposit Paid:</strong>
                                <span style="color:#55A01F; font-weight: 500;">- £${depositFormatted}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 4px 0;">
                                <strong style="color:#475569;">Part Exchange:</strong>
                                <span style="color:#55A01F; font-weight: 500;">- £${pxFormatted}</span>
                            </div>
                            ${parseFloat(sale.settlementFigure) > 0 ? `
                            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 4px 0;">
                                <strong style="color:#475569;">PX Settlement:</strong>
                                <span style="color:#ef4444;">+ £${settlementFormatted}</span>
                            </div>` : ''}
                            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 4px 0;">
                                <strong style="color:#475569;">Finance Amount:</strong>
                                <span style="color:#55A01F; font-weight: 500;">- £${financeFormatted}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding-top: 8px; font-size: 14px;">
                                <strong style="color:#55A01F; font-weight: 700;">Balance Due:</strong>
                                <span style="color:#0f172a; font-weight: 700; border-bottom: 2px double #0f172a;">£${balanceFormatted}</span>
                            </div>
                        </div>
                    </div>
                </div>

                ${invNotes.deliveryDetails || invNotes.additionalComments ? `
                <div style="margin-bottom: 25px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; font-size: 10px; line-height: 1.4; color: #475569;">
                    ${invNotes.deliveryDetails ? `<div><strong>Delivery Details:</strong> ${invNotes.deliveryDetails}</div>` : ''}
                    ${invNotes.additionalComments ? `<div style="margin-top:4px;"><strong>Additional Comments:</strong> ${invNotes.additionalComments}</div>` : ''}
                </div>` : ''}

                <div style="margin-bottom: 40px;">
                    <h2 style="font-size: 10px; text-transform: uppercase; color: #64748b; margin: 0 0 6px 0; letter-spacing: 0.5px;">Terms & Conditions</h2>
                    <p style="font-size: 9px; color: #94a3b8; line-height: 1.4; margin: 0;">
                        ${invNotes.termsOfSale || 'Please make payment by the due date shown on this invoice.'}
                        ${invNotes.warrantyInfo ? ` Warranty: ${invNotes.warrantyInfo}` : ''}
                    </p>
                </div>

                <div style="display: flex; justify-content: space-between; padding-top: 30px; border-top: 1px solid #e2e8f0; font-size: 11px;">
                    <div style="width: 45%;">
                        <div style="height: 40px; border-bottom: 1px solid #94a3b8; margin-bottom: 6px;"></div>
                        <strong style="color: #475569;">Authorized Signature (Vancar Autos)</strong>
                    </div>
                    <div style="width: 45%;">
                        <div style="height: 40px; border-bottom: 1px solid #94a3b8; margin-bottom: 6px;"></div>
                        <strong style="color: #475569;">Customer Signature</strong>
                    </div>
                </div>
            </div>
        `;

        const downloadAction = () => {
            const opt = {
                margin:       [0.25, 0.25, 0.25, 0.25],
                filename:     `Vancar-Autos-INV-${invoiceData.invoice_number}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
            };
            const pdfElement = document.getElementById('invoice-pdf-template-download');
            
            // Check if mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

            if (isMobile) {
                window.html2pdf().set(opt).from(pdfElement).outputPdf('blob').then((blob) => {
                    const file = new File([blob], opt.filename, { type: 'application/pdf' });
                    const shareData = {
                        files: [file],
                        title: opt.filename
                    };

                    if (navigator.canShare && navigator.canShare(shareData)) {
                        navigator.share(shareData).catch((err) => {
                            if (err.name !== 'AbortError') {
                                console.error('Share failed:', err);
                                // Fallback: open blob URL in new tab or same tab if blocked
                                const blobUrl = URL.createObjectURL(blob);
                                try {
                                    const newWindow = window.open(blobUrl, '_blank');
                                    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                                        window.location.href = blobUrl;
                                    }
                                } catch (e) {
                                    window.location.href = blobUrl;
                                }
                            }
                        });
                    } else {
                        // Web Share API not supported, open blob URL
                        const blobUrl = URL.createObjectURL(blob);
                        try {
                            const newWindow = window.open(blobUrl, '_blank');
                            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                                window.location.href = blobUrl;
                            }
                        } catch (e) {
                            window.location.href = blobUrl;
                        }
                    }
                    
                    if (tempDiv.parentNode) {
                        tempDiv.parentNode.removeChild(tempDiv);
                    }
                }).catch(err => {
                    console.error("PDF generation failed:", err);
                    if (tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv);
                });
            } else {
                // Desktop path: standard save
                window.html2pdf().set(opt).from(pdfElement).save().then(() => {
                    if (tempDiv.parentNode) {
                        tempDiv.parentNode.removeChild(tempDiv);
                    }
                }).catch(err => {
                    console.error("PDF generation failed:", err);
                    if (tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv);
                });
            }
        };

        if (!window.html2pdf) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = downloadAction;
            script.onerror = () => {
                alert('Failed to load PDF library. Please check your internet connection.');
                if (tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv);
            };
            document.head.appendChild(script);
        } else {
            downloadAction();
        }
    };

    // Filter invoices list
    const filteredInvoices = invoicesList.filter(inv => {
        const query = searchQuery.toLowerCase();
        const number = inv.invoice_number?.toLowerCase() || '';
        const name = inv.customer_details?.name?.toLowerCase() || '';
        const reg = inv.vehicle_details?.registration?.toLowerCase() || '';
        const make = inv.vehicle_details?.make?.toLowerCase() || '';
        const model = inv.vehicle_details?.model?.toLowerCase() || '';

        return number.includes(query) || name.includes(query) || reg.includes(query) || make.includes(query) || model.includes(query);
    });

    const formattedMakeModel = formatMakeModelTitleCase(vehicleDetails.make, vehicleDetails.model);
    const formattedReg = (vehicleDetails.registration || '').toUpperCase();

    return (
        <div className="invoice-generator bg-slate-50 min-h-screen">
            <header className="invoice-generator__header mb-8 flex justify-between items-center">
                <div>
                    <h1 className="invoice-generator__title text-2xl font-bold text-slate-800">Invoice Manager</h1>
                    <p className="invoice-generator__subtitle text-slate-500 text-sm">
                        Create, search, duplicate, and download professional sales invoices.
                    </p>
                </div>
                {viewMode === 'list' && (
                    <button onClick={handleCreateNewTrigger} className="btn btn--primary py-2.5 px-5 text-sm flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        New Invoice
                    </button>
                )}
            </header>

            {viewMode === 'list' ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    {/* Search & Filters */}
                    <div className="flex gap-4 mb-6">
                        <div className="search-box-wrapper flex-1 relative">
                            <input 
                                type="text"
                                className="form-input py-2.5 pl-10"
                                placeholder="Search by invoice number, customer name, make, model or registration..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="absolute left-3 top-3.5 text-slate-400">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            </div>
                        </div>
                    </div>

                    {filteredInvoices.length > 0 ? (
                        <div className="table-responsive">
                            <table className="invoice-table w-full text-left">
                                <thead>
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Customer</th>
                                        <th>Vehicle</th>
                                        <th>Reg No</th>
                                        <th>Date</th>
                                        <th>Due Date</th>
                                        <th>Balance Due</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map((inv) => (
                                        <tr key={inv.id}>
                                            <td className="font-bold text-slate-800">{inv.invoice_number}</td>
                                            <td>{inv.customer_details.name}</td>
                                            <td>
                                                {inv.vehicle_details.year} {inv.vehicle_details.make} {inv.vehicle_details.model}
                                            </td>
                                            <td>
                                                <span className="badge badge--reg bg-yellow-400/20 text-slate-800 px-2 py-0.5 rounded font-mono text-xs font-semibold uppercase border border-yellow-400">
                                                    {inv.vehicle_details.registration || 'N/A'}
                                                </span>
                                            </td>
                                            <td>{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-GB') : '-'}</td>
                                            <td>{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB') : '-'}</td>
                                            <td className="font-bold text-slate-900">£{(inv.sale_details.balanceDue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="flex justify-end gap-1.5">
                                                    <button onClick={() => handleDownloadPDF(inv)} className="btn btn--icon bg-blue-50 text-blue-600 border-none hover:bg-blue-100 p-2" title="Download PDF">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                                    </button>
                                                    <button onClick={() => handleEditTrigger(inv)} className="btn btn--icon bg-slate-50 text-slate-700 border-none hover:bg-slate-100 p-2" title="Edit">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                    </button>
                                                    <button onClick={() => handleDuplicateTrigger(inv)} className="btn btn--icon bg-slate-50 text-slate-700 border-none hover:bg-slate-100 p-2" title="Duplicate">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                                    </button>
                                                    <button onClick={() => handleDeleteInvoice(inv.id)} className="btn btn--icon bg-red-50 text-red-600 border-none hover:bg-red-100 p-2" title="Delete">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-slate-300"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg>
                            <h3 className="font-bold text-slate-800 text-sm mb-1">No Invoices Found</h3>
                            <p className="text-xs mb-4">You haven't generated any invoices or search filter yielded no results.</p>
                            <button onClick={handleCreateNewTrigger} className="btn btn--primary py-2 px-4 text-xs">Create New Invoice</button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="invoice-generator__layout">
                    {/* Left Panel: Forms Panel */}
                    <div className="invoice-generator__form-panel bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6 pb-2 border-b">
                            <h3 className="font-bold text-slate-800 text-sm">Invoice Editor</h3>
                            <div className="flex gap-2">
                                <select 
                                    className="form-select py-1.5 px-3 text-xs w-auto bg-slate-50"
                                    value={selectedCarId}
                                    onChange={handleCarPrefillChange}
                                >
                                    <option value="">Pre-fill from inventory stock...</option>
                                    {carsList.filter(c => c.status === 'available').map(car => (
                                        <option key={car.id} value={car.id}>
                                            {car.year} {car.make} {car.model} ({car.registration || 'No Reg'}) - £{car.price?.toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="form-section mb-6">
                            <h4 className="font-bold text-xs uppercase text-slate-500 mb-3 tracking-wider">Customer Details</h4>
                            <div className="invoice-generator__form-grid">
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Customer Name</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={customerDetails.name} 
                                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address Line 1</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={customerDetails.address1} 
                                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, address1: e.target.value }))}
                                        placeholder="e.g. 30 Blackthorn Avenue"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address Line 2</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={customerDetails.address2} 
                                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, address2: e.target.value }))}
                                        placeholder="e.g. Flat B (Optional)"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Town / City</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={customerDetails.city} 
                                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, city: e.target.value }))}
                                        placeholder="e.g. Manchester"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Postcode</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={customerDetails.postcode} 
                                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, postcode: e.target.value }))}
                                        placeholder="e.g. M12 6LB"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={customerDetails.phone} 
                                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="e.g. 07700 900077"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Customer Email <span className="text-red-500">*</span></label>
                                    <input 
                                        type="email" 
                                        className="form-input" 
                                        value={customerDetails.email} 
                                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="e.g. john@example.com"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Details */}
                        <div className="form-section mb-6">
                            <h4 className="font-bold text-xs uppercase text-slate-500 mb-3 tracking-wider">Vehicle Details</h4>
                            <div className="invoice-generator__form-grid">
                                <div className="form-group">
                                    <label className="form-label">Registration Number</label>
                                    <input 
                                        type="text" 
                                        className="form-input uppercase" 
                                        value={vehicleDetails.registration} 
                                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, registration: e.target.value.toUpperCase() }))}
                                        placeholder="e.g. YT67BXH"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Make</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={vehicleDetails.make} 
                                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, make: e.target.value }))}
                                        placeholder="e.g. Ford"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Model</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={vehicleDetails.model} 
                                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, model: e.target.value }))}
                                        placeholder="e.g. Ranger"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Trim / Variant</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={vehicleDetails.trim} 
                                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, trim: e.target.value }))}
                                        placeholder="e.g. Limited 4x4 TDCI"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Colour</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={vehicleDetails.colour} 
                                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, colour: e.target.value }))}
                                        placeholder="e.g. Grey"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mileage</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={vehicleDetails.mileage} 
                                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, mileage: e.target.value }))}
                                        placeholder="e.g. 82590"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">VIN Number</label>
                                    <input 
                                        type="text" 
                                        className="form-input uppercase" 
                                        value={vehicleDetails.vin} 
                                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, vin: e.target.value }))}
                                        placeholder="17-digit VIN"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Engine Number</label>
                                    <input 
                                        type="text" 
                                        className="form-input uppercase" 
                                        value={vehicleDetails.engineNo} 
                                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, engineNo: e.target.value }))}
                                        placeholder="e.g. HM53175"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Engine Capacity (cc)</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={vehicleDetails.engineCapacity} 
                                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, engineCapacity: e.target.value }))}
                                        placeholder="e.g. 2198"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date First Registered</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        value={vehicleDetails.firstRegDate} 
                                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, firstRegDate: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Fuel Type</label>
                                    <select 
                                        className="form-select" 
                                        value={vehicleDetails.fuelType}
                                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, fuelType: e.target.value }))}
                                    >
                                        <option value="Petrol">Petrol</option>
                                        <option value="Diesel">Diesel</option>
                                        <option value="Electric">Electric</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Transmission</label>
                                    <select 
                                        className="form-select" 
                                        value={vehicleDetails.transmission}
                                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, transmission: e.target.value }))}
                                    >
                                        <option value="Manual">Manual</option>
                                        <option value="Automatic">Automatic</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Sale details */}
                        <div className="form-section mb-6">
                            <h4 className="font-bold text-xs uppercase text-slate-500 mb-3 tracking-wider">Sale Details</h4>
                            <div className="invoice-generator__form-grid">
                                <div className="form-group">
                                    <label className="form-label">Invoice Number</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={saleDetails.invoiceNumber} 
                                        onChange={(e) => setSaleDetails(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Invoice Date</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        value={saleDetails.invoiceDate} 
                                        onChange={(e) => setSaleDetails(prev => ({ ...prev, invoiceDate: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Due Date</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        value={saleDetails.dueDate} 
                                        onChange={(e) => setSaleDetails(prev => ({ ...prev, dueDate: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Cash Price (£)</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={saleDetails.cashPrice || ''} 
                                        onChange={(e) => setSaleDetails(prev => ({ ...prev, cashPrice: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Deposit (£)</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={saleDetails.deposit || ''} 
                                        onChange={(e) => setSaleDetails(prev => ({ ...prev, deposit: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Part Exchange Value (£)</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={saleDetails.partExchange || ''} 
                                        onChange={(e) => setSaleDetails(prev => ({ ...prev, partExchange: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">PX Settlement Figure (£)</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={saleDetails.settlementFigure || ''} 
                                        onChange={(e) => setSaleDetails(prev => ({ ...prev, settlementFigure: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Finance Amount (£)</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={saleDetails.financeAmount || ''} 
                                        onChange={(e) => setSaleDetails(prev => ({ ...prev, financeAmount: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Balance Due (£)</label>
                                    <input 
                                        type="number" 
                                        className="form-input font-bold text-slate-800 bg-slate-50" 
                                        value={saleDetails.balanceDue} 
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="form-section mb-6">
                            <h4 className="font-bold text-xs uppercase text-slate-500 mb-3 tracking-wider">Additional Notes & Terms</h4>
                            <div className="flex flex-col gap-4">
                                <div className="form-group">
                                    <label className="form-label">Delivery Details</label>
                                    <textarea 
                                        className="form-input h-16 py-2" 
                                        value={notes.deliveryDetails} 
                                        onChange={(e) => setNotes(prev => ({ ...prev, deliveryDetails: e.target.value }))}
                                        placeholder="e.g. Deliver to 30 Blackthorn Avenue..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Warranty Information</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={notes.warrantyInfo} 
                                        onChange={(e) => setNotes(prev => ({ ...prev, warrantyInfo: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Additional Comments</label>
                                    <textarea 
                                        className="form-input h-16 py-2" 
                                        value={notes.additionalComments} 
                                        onChange={(e) => setNotes(prev => ({ ...prev, additionalComments: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Terms of Sale</label>
                                    <textarea 
                                        className="form-input h-20 py-2" 
                                        value={notes.termsOfSale} 
                                        onChange={(e) => setNotes(prev => ({ ...prev, termsOfSale: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form actions */}
                        <div className="flex gap-3 justify-end pt-4 border-t">
                            <button onClick={() => setViewMode('list')} className="btn btn--outline py-2.5 px-5 text-sm">
                                Cancel
                            </button>
                            <button onClick={handleSaveInvoice} className="btn btn--primary py-2.5 px-6 text-sm">
                                Save Invoice
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Live A4 PDF Preview Card */}
                    <div className="invoice-generator__preview-panel">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <h3 className="font-bold text-slate-800 text-sm">Live Invoice Preview</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <span>Zoom:</span>
                                    <input 
                                        type="range" 
                                        min="40" 
                                        max="100" 
                                        value={zoomPercent} 
                                        onChange={(e) => setZoomPercent(parseInt(e.target.value))}
                                        className="invoice-zoom-slider"
                                        style={{ width: '100px', cursor: 'pointer' }}
                                    />
                                    <span className="font-mono w-10 text-right">{zoomPercent}%</span>
                                </div>
                            </div>
                            <button onClick={() => handleDownloadPDF(null)} className="btn btn--secondary py-2 px-4 text-xs flex items-center gap-1.5 self-start sm:self-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                Download PDF
                            </button>
                        </div>

                        <div ref={containerRef} className="invoice-generator__preview-container bg-slate-900 rounded-2xl overflow-hidden flex justify-center shadow-inner border border-slate-950">
                            {/* Real A4 preview template */}
                            <div className="invoice-pdf-scale-wrapper" style={{ width: `${210 * scale}mm`, height: `${297 * scale}mm`, overflow: 'hidden' }}>
                                <div id="invoice-pdf-template" className="invoice-pdf-page bg-white" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                                <div className="invoice-pdf-header">
                                    <div className="invoice-pdf-brand">
                                        <img src="/images/logo.png" alt="Vancar Autos" className="invoice-pdf-logo" />
                                        <div className="invoice-pdf-company-info">
                                            <strong>Vancar Autos Ltd</strong><br />
                                            Yard 14, Midland Street<br />
                                            Manchester, M12 6LB<br />
                                            Phone: 07386 533337<br />
                                            Email: hellovancarautos@gmail.com<br />
                                            Web: www.vancarautos.co.uk
                                        </div>
                                    </div>
                                    <div className="invoice-pdf-meta">
                                        <h1 className="invoice-pdf-type-title">Invoice</h1>
                                        <div className="invoice-pdf-meta-box">
                                            <div className="meta-row">
                                                <strong>Invoice No:</strong>
                                                <span className="font-semibold text-slate-800">{saleDetails.invoiceNumber || 'INV-XXXXXX'}</span>
                                            </div>
                                            <div className="meta-row">
                                                <strong>Invoice Date:</strong>
                                                <span>{saleDetails.invoiceDate ? new Date(saleDetails.invoiceDate).toLocaleDateString('en-GB') : '-'}</span>
                                            </div>
                                            <div className="meta-row">
                                                <strong>Due Date:</strong>
                                                <span className="font-semibold text-slate-800">{saleDetails.dueDate ? new Date(saleDetails.dueDate).toLocaleDateString('en-GB') : '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="invoice-pdf-bill-to mb-5">
                                    <h2 className="invoice-pdf-section-title">Bill To</h2>
                                    <div className="invoice-pdf-client-address">
                                        <strong>{customerDetails.name || 'Customer Name'}</strong><br />
                                        {customerDetails.address1 || 'Address Line 1'}<br />
                                        {customerDetails.address2 && <>{customerDetails.address2}<br /></>}
                                        {customerDetails.city || 'Town/City'}, {customerDetails.postcode || 'Postcode'}<br />
                                        {customerDetails.phone && <>Phone: {customerDetails.phone}<br /></>}
                                        <strong>Email: {customerDetails.email || 'Required'}</strong>
                                    </div>
                                </div>

                                <table className="invoice-pdf-table mb-5">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th className="text-center" style={{ width: '60px' }}>Qty</th>
                                            <th className="text-right" style={{ width: '100px' }}>Rate</th>
                                            <th className="text-right" style={{ width: '110px' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="item-description">
                                                <strong>Vehicle Sale</strong><br />
                                                {vehicleDetails.year || '[Year]'} {formattedMakeModel.make} {formattedMakeModel.model} {vehicleDetails.trim ? `- ${vehicleDetails.trim}` : ''}<br />
                                                <span className="item-sub-desc">Reg: {formattedReg || 'N/A'} | Mileage: {vehicleDetails.mileage ? parseFloat(vehicleDetails.mileage).toLocaleString('en-GB') : '0'} Miles</span>
                                            </td>
                                            <td className="text-center">1</td>
                                            <td className="text-right">£{(saleDetails.cashPrice || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="text-right font-semibold text-slate-800">£{(saleDetails.cashPrice || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="invoice-pdf-details-block mb-5">
                                    <div className="invoice-pdf-vehicle-grid-box">
                                        <h2 className="invoice-pdf-section-title">Vehicle Details</h2>
                                        <div className="vehicle-details-grid">
                                            <div className="grid-cell"><strong>Registration:</strong> {formattedReg || '-'}</div>
                                            <div className="grid-cell"><strong>Make:</strong> {formattedMakeModel.make}</div>
                                            <div className="grid-cell"><strong>Model:</strong> {formattedMakeModel.model}</div>
                                            <div className="grid-cell"><strong>Colour:</strong> {vehicleDetails.colour || '-'}</div>
                                            <div className="grid-cell font-mono"><strong>VIN:</strong> {vehicleDetails.vin || '-'}</div>
                                            <div className="grid-cell"><strong>Engine No:</strong> {vehicleDetails.engineNo || '-'}</div>
                                            <div className="grid-cell"><strong>Capacity:</strong> {vehicleDetails.engineCapacity ? `${vehicleDetails.engineCapacity} cc` : '-'}</div>
                                            <div className="grid-cell"><strong>Mileage:</strong> {vehicleDetails.mileage ? parseInt(vehicleDetails.mileage).toLocaleString('en-GB') : '-'}</div>
                                            <div className="grid-cell span-2"><strong>First Registered:</strong> {vehicleDetails.firstRegDate ? new Date(vehicleDetails.firstRegDate).toLocaleDateString('en-GB') : '-'}</div>
                                        </div>
                                    </div>

                                    <div className="invoice-pdf-totals-box">
                                        <div className="totals-row">
                                            <span>Subtotal:</span>
                                            <span>£{(saleDetails.cashPrice || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="totals-row accent-row">
                                            <span>Deposit Paid:</span>
                                            <span>- £{(saleDetails.deposit || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="totals-row accent-row">
                                            <span>Part Exchange:</span>
                                            <span>- £{(saleDetails.partExchange || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        {saleDetails.settlementFigure > 0 && (
                                            <div className="totals-row danger-row">
                                                <span>PX Settlement:</span>
                                                <span>+ £{(saleDetails.settlementFigure || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        <div className="totals-row accent-row">
                                            <span>Finance Amount:</span>
                                            <span>- £{(saleDetails.financeAmount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="totals-row due-row">
                                            <strong>Balance Due:</strong>
                                            <strong>£{(saleDetails.balanceDue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                                        </div>
                                    </div>
                                </div>

                                {(notes.deliveryDetails || notes.additionalComments) && (
                                    <div className="invoice-pdf-additional-box mb-4">
                                        {notes.deliveryDetails && <div><strong>Delivery Details:</strong> {notes.deliveryDetails}</div>}
                                        {notes.additionalComments && <div style={{ marginTop: '4px' }}><strong>Additional Comments:</strong> {notes.additionalComments}</div>}
                                    </div>
                                )}

                                <div className="invoice-pdf-notes mb-6">
                                    <h2 className="invoice-pdf-section-title-light">Terms & Conditions</h2>
                                    <p className="invoice-pdf-terms-text">
                                        {notes.termsOfSale}
                                        {notes.warrantyInfo ? ` Warranty: ${notes.warrantyInfo}` : ''}
                                    </p>
                                </div>

                                <div className="invoice-pdf-signatures">
                                    <div className="sig-block">
                                        <div className="sig-line"></div>
                                        <strong>Authorized Signature (Vancar Autos)</strong>
                                    </div>
                                    <div className="sig-block">
                                        <div className="sig-line"></div>
                                        <strong>Customer Signature</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}
