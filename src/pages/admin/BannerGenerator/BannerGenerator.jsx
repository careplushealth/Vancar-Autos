import { useState, useEffect, useRef } from 'react';
import { getCars } from '../../../services/dataService';
import './BannerGenerator.css';

export default function BannerGenerator() {
    const canvasRef = useRef(null);
    const [carsList, setCarsList] = useState([]);
    const [selectedCarId, setSelectedCarId] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        make: 'Volkswagen',
        model: 'Polo',
        year: '2012',
        trim: '1.4 Match',
        condition: 'Great Condition',
        subtitle: 'Drives Perfect',
        price: '2600'
    });

    const [badges, setBadges] = useState([
        { id: 1, icon: 'speedometer', heading: 'Mileage', value: '156000 Miles' },
        { id: 2, icon: 'document', heading: 'MOT', value: '12 Months MOT' },
        { id: 3, icon: 'key', heading: 'Keys', value: 'V5 Present' },
        { id: 4, icon: 'shield', heading: 'History Audit', value: 'History Checked' }
    ]);

    const handleBadgeChange = (id, field, value) => {
        setBadges(prev => prev.map(badge => {
            if (badge.id === id) {
                return { ...badge, [field]: value };
            }
            return badge;
        }));
    };

    const [uploadedImage, setUploadedImage] = useState(null);
    const [imageObj, setImageObj] = useState(null);
    const [logoObj, setLogoObj] = useState(null);
    const [exportFormat, setExportFormat] = useState('widescreen'); // 'widescreen' (1920x1080), 'medium' (1200x675), 'instagram' (1080x1080), 'autotrader' (1200x900)
    const [triggerRedraw, setTriggerRedraw] = useState(0);
    const [downloadModalData, setDownloadModalData] = useState({
        isOpen: false,
        imgSrc: '',
        filename: ''
    });

    // Load Vancar Autos logo
    useEffect(() => {
        const img = new Image();
        img.src = '/images/logo.png';
        img.onload = () => {
            setLogoObj(img);
        };
    }, []);

    // Redraw when fonts load
    useEffect(() => {
        if (document.fonts) {
            document.fonts.ready.then(() => {
                setTriggerRedraw(prev => prev + 1);
            });
        }
    }, []);

    // Load inventory cars for pre-filling
    useEffect(() => {
        const fetchCars = async () => {
            try {
                const data = await getCars();
                setCarsList(data);
            } catch (err) {
                console.error('Failed to load cars inventory:', err);
            }
        };
        fetchCars();
    }, []);

    // Handle pre-fill from selected car
    const handleCarSelectionChange = (e) => {
        const carId = e.target.value;
        setSelectedCarId(carId);
        if (!carId) return;

        const car = carsList.find(c => c.id === carId);
        if (car) {
            setFormData({
                make: car.make || '',
                model: car.model || '',
                year: car.year?.toString() || '',
                trim: car.trim || '',
                condition: 'Great Condition',
                subtitle: 'Drives Perfect',
                price: car.price?.toString() || ''
            });

            setBadges([
                { id: 1, icon: 'speedometer', heading: 'Mileage', value: car.mileage ? `${car.mileage.toLocaleString('en-GB')} Miles` : '' },
                { id: 2, icon: 'document', heading: 'MOT', value: '12 Months MOT' },
                { id: 3, icon: 'key', heading: 'Keys', value: 'V5 Present' },
                { id: 4, icon: 'shield', heading: 'History Audit', value: 'History Checked' }
            ]);

            // Set vehicle image if available
            if (car.images && car.images.length > 0) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = car.images[0];
                img.onload = () => {
                    setImageObj(img);
                    setUploadedImage(car.images[0]);
                };
            }
        }
    };

    // Handle text input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle custom image uploads
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                setImageObj(img);
                setUploadedImage(event.target.result);
            };
        };
        reader.readAsDataURL(file);
    };

    // Canvas drawing function
    const drawBanner = (canvas, width, height, data, imgObj, logoObj, badgesList) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set dimensions
        canvas.width = width;
        canvas.height = height;

        // Base width for scaling
        const baseWidth = 1920;
        const scale = width / baseWidth;

        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw car image in top 75%
        const imageAreaHeight = height * 0.75;
        if (imgObj) {
            // Draw image with cover behavior
            const imgRatio = imgObj.width / imgObj.height;
            const destRatio = width / imageAreaHeight;
            let sWidth, sHeight, sx, sy;

            if (imgRatio > destRatio) {
                sHeight = imgObj.height;
                sWidth = imgObj.height * destRatio;
                sx = (imgObj.width - sWidth) / 2;
                sy = 0;
            } else {
                sWidth = imgObj.width;
                sHeight = imgObj.width / destRatio;
                sx = 0;
                sy = (imgObj.height - sHeight) / 2;
            }

            ctx.drawImage(imgObj, sx, sy, sWidth, sHeight, 0, 0, width, imageAreaHeight);
        } else {
            // Placeholder background
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, width, imageAreaHeight);
            
            // Draw placeholder text
            ctx.fillStyle = '#94a3b8';
            ctx.font = `bold ${Math.round(48 * scale)}px Oswald, Impact, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('UPLOAD VEHICLE IMAGE', width / 2, imageAreaHeight / 2);
        }

        // Draw bottom white info panel (starts at 75% of height)
        const panelY = imageAreaHeight;
        const panelHeight = height - panelY;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, panelY, width, panelHeight);

        // Compute vertical coordinates based on 270px ideal height on 1920 base scale
        const idealContentHeight = 270 * scale;
        const verticalOffset = (panelHeight - idealContentHeight) / 2;
        const topOffsetY = panelY + verticalOffset; // base Y position for contents

        // Colors
        const blueColor = '#55A01F';
        const blackColor = '#000000';

        // Column grid percentages to match reference image exactly
        const colWidths = [0.248, 0.165, 0.132, 0.157, 0.130, 0.168];
        const colXPositions = [];
        let currentX = 0;
        for (let i = 0; i < colWidths.length; i++) {
            colXPositions.push(currentX);
            currentX += width * colWidths[i];
        }

        // Draw vertical blue dividers in top row
        ctx.strokeStyle = blueColor;
        ctx.lineWidth = Math.max(2, Math.round(3.5 * scale));
        for (let i = 1; i < colXPositions.length; i++) {
            const divX = colXPositions[i];
            ctx.beginPath();
            ctx.moveTo(divX, topOffsetY + 22 * scale);
            ctx.lineTo(divX, topOffsetY + 130 * scale);
            ctx.stroke();
        }

        // Helper: Ensure text fits within max width by scaling font down
        const fillTextWithScaleLimit = (text, x, y, baseFont, color, align, maxWidth, letterSpacing = 'normal') => {
            ctx.save();
            ctx.textAlign = align;
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = color;
            
            if ('letterSpacing' in ctx) {
                ctx.letterSpacing = letterSpacing;
            }
            
            let currentFontSize = baseFont.size * scale;
            ctx.font = `${baseFont.style} ${currentFontSize}px Oswald, Impact, Arial Black, sans-serif`;
            
            let textWidth = ctx.measureText(text).width;
            if (maxWidth && textWidth > maxWidth) {
                const ratio = maxWidth / textWidth;
                currentFontSize = Math.max(10, Math.round(currentFontSize * ratio));
                ctx.font = `${baseFont.style} ${currentFontSize}px Oswald, Impact, Arial Black, sans-serif`;
            }
            ctx.fillText(text, x, y);
            ctx.restore();
        };

        // Col 1: Make & Model
        fillTextWithScaleLimit(
            data.make.toUpperCase(), 
            75 * scale, 
            topOffsetY + 44 * scale, 
            { style: 'bold', size: 28 }, 
            blackColor, 
            'left', 
            colXPositions[1] - 90 * scale,
            '2px'
        );
        fillTextWithScaleLimit(
            data.model.toUpperCase(), 
            75 * scale, 
            topOffsetY + 130 * scale, 
            { style: 'bold', size: 95 }, 
            blackColor, 
            'left', 
            colXPositions[1] - 90 * scale
        );

        // Col 2: Year & Variant
        const col2CenterX = (colXPositions[1] + colXPositions[2]) / 2;
        fillTextWithScaleLimit(
            data.year, 
            col2CenterX, 
            topOffsetY + 72 * scale, 
            { style: 'bold', size: 64 }, 
            blueColor, 
            'center', 
            colXPositions[2] - colXPositions[1] - 10 * scale
        );
        fillTextWithScaleLimit(
            data.trim.toUpperCase(), 
            col2CenterX, 
            topOffsetY + 128 * scale, 
            { style: 'bold', size: 28 }, 
            blackColor, 
            'center', 
            colXPositions[2] - colXPositions[1] - 10 * scale,
            '0.5px'
        );

        // Helper: Draw icon on canvas
        const drawIcon = (type, cx, cy, iconSize) => {
            ctx.save();
            ctx.strokeStyle = blueColor;
            ctx.fillStyle = blueColor;
            ctx.lineWidth = Math.max(1.5, 3.5 * scale);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (type === 'speedometer') {
                // outer dial
                ctx.beginPath();
                ctx.arc(cx, cy + 4 * scale, iconSize * 0.9, Math.PI * 0.95, Math.PI * 2.05);
                ctx.stroke();
                // inner dial
                ctx.beginPath();
                ctx.arc(cx, cy + 4 * scale, iconSize * 0.5, Math.PI * 1.1, Math.PI * 1.9);
                ctx.stroke();
                // needle
                ctx.beginPath();
                ctx.moveTo(cx, cy + 4 * scale);
                ctx.lineTo(cx + iconSize * 0.6 * Math.cos(-Math.PI / 4), cy + 4 * scale + iconSize * 0.6 * Math.sin(-Math.PI / 4));
                ctx.stroke();
                // center cap
                ctx.beginPath();
                ctx.arc(cx, cy + 4 * scale, iconSize * 0.15, 0, Math.PI * 2);
                ctx.fill();
            } 
            else if (type === 'document') {
                // Draw folded paper outline
                const w = iconSize * 0.9;
                const h = iconSize * 1.15;
                const x = cx - w / 2;
                const y = cy - h / 2 + 2 * scale;
                const fold = iconSize * 0.35;

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + w - fold, y);
                ctx.lineTo(x + w, y + fold);
                ctx.lineTo(x + w, y + h);
                ctx.lineTo(x, y + h);
                ctx.closePath();
                ctx.stroke();

                // corner fold line
                ctx.beginPath();
                ctx.moveTo(x + w - fold, y);
                ctx.lineTo(x + w - fold, y + fold);
                ctx.lineTo(x + w, y + fold);
                ctx.stroke();

                // horizontal lines inside document
                ctx.beginPath();
                ctx.moveTo(x + w * 0.25, y + h * 0.4); ctx.lineTo(x + w * 0.75, y + h * 0.4);
                ctx.moveTo(x + w * 0.25, y + h * 0.6); ctx.lineTo(x + w * 0.75, y + h * 0.6);
                ctx.moveTo(x + w * 0.25, y + h * 0.8); ctx.lineTo(x + w * 0.55, y + h * 0.8);
                ctx.stroke();
            } 
            else if (type === 'key') {
                // Circular head of key (slanted)
                const kSize = iconSize * 0.95;
                ctx.beginPath();
                ctx.arc(cx - kSize * 0.25, cy - kSize * 0.25, kSize * 0.3, 0, Math.PI * 2);
                ctx.stroke();
                // small ring inner circle
                ctx.beginPath();
                ctx.arc(cx - kSize * 0.25, cy - kSize * 0.25, kSize * 0.12, 0, Math.PI * 2);
                ctx.stroke();
                
                // key shaft
                ctx.beginPath();
                ctx.moveTo(cx - kSize * 0.03, cy - kSize * 0.03);
                ctx.lineTo(cx + kSize * 0.45, cy + kSize * 0.45);
                ctx.stroke();

                // teeth
                ctx.beginPath();
                ctx.moveTo(cx + kSize * 0.2, cy + kSize * 0.2);
                ctx.lineTo(cx + kSize * 0.32, cy + kSize * 0.08);
                ctx.moveTo(cx + kSize * 0.35, cy + kSize * 0.35);
                ctx.lineTo(cx + kSize * 0.47, cy + kSize * 0.23);
                ctx.stroke();
            } 
            else if (type === 'shield') {
                // Shield outline
                const w = iconSize * 0.9;
                const h = iconSize * 1.1;
                const x = cx;
                const y = cy - h / 2 + 2 * scale;

                ctx.beginPath();
                ctx.moveTo(x, y);
                // top curves
                ctx.quadraticCurveTo(x + w * 0.4, y - h * 0.05, x + w / 2, y + h * 0.1);
                // right side
                ctx.quadraticCurveTo(x + w / 2, y + h * 0.6, x, y + h);
                // left side
                ctx.quadraticCurveTo(x - w / 2, y + h * 0.6, x - w / 2, y + h * 0.1);
                // top curves left
                ctx.quadraticCurveTo(x - w * 0.4, y - h * 0.05, x, y);
                ctx.closePath();
                ctx.stroke();

                // checkmark inside shield
                ctx.beginPath();
                ctx.moveTo(cx - w * 0.22, cy - h * 0.02);
                ctx.lineTo(cx - w * 0.03, cy + h * 0.15);
                ctx.lineTo(cx + w * 0.22, cy - h * 0.15);
                ctx.stroke();
            }
            else if (type === 'calendar') {
                const w = iconSize * 0.9;
                const h = iconSize * 0.9;
                const x = cx - w / 2;
                const y = cy - h / 2 + 2 * scale;
                // outline box
                ctx.beginPath();
                ctx.rect(x, y + 4 * scale, w, h - 4 * scale);
                ctx.stroke();
                // top binder bar
                ctx.beginPath();
                ctx.moveTo(x, y + 4 * scale);
                ctx.lineTo(x + w, y + 4 * scale);
                ctx.stroke();
                // rings / binders
                ctx.beginPath();
                ctx.moveTo(x + w * 0.25, y); ctx.lineTo(x + w * 0.25, y + 6 * scale);
                ctx.moveTo(x + w * 0.75, y); ctx.lineTo(x + w * 0.75, y + 6 * scale);
                ctx.stroke();
            }
            else if (type === 'user') {
                const r = iconSize * 0.35;
                // Head
                ctx.beginPath();
                ctx.arc(cx, cy - r + 2 * scale, r, 0, Math.PI * 2);
                ctx.stroke();
                // Shoulders
                ctx.beginPath();
                ctx.arc(cx, cy + r * 1.8 + 2 * scale, r * 1.5, Math.PI, 0);
                ctx.stroke();
            }
            else if (type === 'star') {
                const r = iconSize * 0.6;
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    ctx.lineTo(cx + Math.cos((18 + i * 72) * Math.PI / 180 - Math.PI / 2) * r,
                               cy + Math.sin((18 + i * 72) * Math.PI / 180 - Math.PI / 2) * r);
                    ctx.lineTo(cx + Math.cos((54 + i * 72) * Math.PI / 180 - Math.PI / 2) * (r * 0.4),
                               cy + Math.sin((54 + i * 72) * Math.PI / 180 - Math.PI / 2) * (r * 0.4));
                }
                ctx.closePath();
                ctx.stroke();
            }
            else if (type === 'gear') {
                const r = iconSize * 0.5;
                // outer circle
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
                // inner circle
                ctx.beginPath();
                ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
                ctx.stroke();
                // gear teeth
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI) / 4;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
                    ctx.lineTo(cx + Math.cos(angle) * (r * 1.25), cy + Math.sin(angle) * (r * 1.25));
                    ctx.stroke();
                }
            }
            else if (type === 'bolt') {
                const w = iconSize * 0.8;
                const h = iconSize * 1.2;
                ctx.beginPath();
                ctx.moveTo(cx + w * 0.1, cy - h * 0.5);
                ctx.lineTo(cx - w * 0.4, cy + h * 0.05);
                ctx.lineTo(cx + w * 0.05, cy + h * 0.05);
                ctx.lineTo(cx - w * 0.1, cy + h * 0.5);
                ctx.lineTo(cx + w * 0.4, cy - h * 0.05);
                ctx.lineTo(cx - w * 0.05, cy - h * 0.05);
                ctx.closePath();
                ctx.stroke();
            }

            ctx.restore();
        };

        // Draw the 4 customizable badges (Col 3 to Col 6)
        const badgeSlots = badgesList || [
            { icon: 'speedometer', heading: 'Mileage', value: '156,000 Miles' },
            { icon: 'document', heading: 'MOT', value: '12 Months MOT' },
            { icon: 'key', heading: 'Keys', value: 'V5 Present' },
            { icon: 'shield', heading: 'History Audit', value: 'History Checked' }
        ];

        badgeSlots.forEach((badge, index) => {
            const colIndex = index + 2;
            const colLeftX = colXPositions[colIndex];
            const colRightX = (colIndex + 1 < colXPositions.length) ? colXPositions[colIndex + 1] : width;
            let colCenterX = (colLeftX + colRightX) / 2;
            let maxColWidth = colRightX - colLeftX - 10 * scale;

            // Move the last slot (Col 6 / HPI) a little to the left
            if (index === 3) {
                colCenterX -= 45 * scale;
                maxColWidth = 240 * scale;
            }

            // Draw badge heading if it exists
            const hasHeading = badge.heading && badge.heading.trim().length > 0;
            if (hasHeading) {
                fillTextWithScaleLimit(
                    badge.heading.toUpperCase(), 
                    colCenterX, 
                    topOffsetY + 96 * scale, 
                    { style: 'normal', size: 13 }, 
                    blackColor, 
                    'center', 
                    maxColWidth,
                    '1px'
                );
            }

            // Draw icon
            const iconY = topOffsetY + 50 * scale;
            const iconSize = 32 * scale;
            drawIcon(badge.icon, colCenterX, iconY, iconSize);

            // Draw value
            fillTextWithScaleLimit(
                badge.value.toUpperCase(), 
                colCenterX, 
                topOffsetY + 124 * scale, 
                { style: 'bold', size: 22 }, 
                blackColor, 
                'center', 
                maxColWidth,
                '0.5px'
            );
        });

        // --- HORIZONTAL BLUE DIVIDER ---
        ctx.strokeStyle = blueColor;
        ctx.lineWidth = Math.max(2, Math.round(3.5 * scale));
        ctx.beginPath();
        ctx.moveTo(80 * scale, topOffsetY + 142 * scale);
        ctx.lineTo(width - 80 * scale, topOffsetY + 142 * scale);
        ctx.stroke();

        // --- BOTTOM SECTION (Headlines & Price) ---

        // Left / Center-Left: Condition Headline
        const conditionCenterX = width * 0.38; // centered exactly below middle parameters
        fillTextWithScaleLimit(
            data.condition.toUpperCase(), 
            conditionCenterX, 
            topOffsetY + 200 * scale, 
            { style: 'bold', size: 36 }, 
            blueColor, 
            'center', 
            width * 0.45,
            '1px'
        );
        fillTextWithScaleLimit(
            data.subtitle.toUpperCase(), 
            conditionCenterX, 
            topOffsetY + 248 * scale, 
            { style: 'italic bold', size: 36 }, 
            blackColor, 
            'center', 
            width * 0.45,
            '1px'
        );

        // Right: Price tag (Very Large Blue text)
        const formattedPrice = `£${Number(data.price || 0).toLocaleString('en-GB')}`;
        fillTextWithScaleLimit(
            formattedPrice, 
            width - 80 * scale, 
            topOffsetY + 262 * scale, 
            { style: 'bold', size: 115 }, 
            blueColor, 
            'right', 
            width * 0.40
        );

        // Draw small Vancar Autos logo below the horizontal divider
        if (logoObj) {
            const logoHeight = 60 * scale;
            const logoWidth = (logoObj.width / logoObj.height) * logoHeight;
            const logoX = 75 * scale;
            const logoY = topOffsetY + (206 * scale) - (logoHeight / 2);
            ctx.drawImage(logoObj, logoX, logoY, logoWidth, logoHeight);
        }
    };

    // Redraw whenever inputs, image, logo, or format changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let width = 1920;
        let height = 1080;

        if (exportFormat === 'widescreen') {
            width = 1920;
            height = 1080;
        } else if (exportFormat === 'medium') {
            width = 1200;
            height = 675;
        } else if (exportFormat === 'instagram') {
            width = 1080;
            height = 1080;
        } else if (exportFormat === 'autotrader') {
            width = 1200;
            height = 900;
        }

        drawBanner(canvas, width, height, formData, imageObj, logoObj, badges);
    }, [formData, imageObj, exportFormat, triggerRedraw, logoObj, badges]);

    // Handle canvas downloads
    const handleDownload = (type) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let filename = `vehicle_banner_${formData.make.toLowerCase()}_${formData.model.toLowerCase()}`;
        let mimeType = 'image/png';
        if (type === 'jpg' || type === 'facebook' || type === 'autotrader') {
            mimeType = 'image/jpeg';
        }

        // Determine correct size depending on select download
        let w = 1920;
        let h = 1080;

        if (type === 'png' || type === 'jpg') {
            w = 1920;
            h = 1080;
            filename += `_1920x1080.${type}`;
        } else if (type === 'facebook') {
            w = 1200;
            h = 630;
            filename += `_facebook.jpg`;
        } else if (type === 'instagram') {
            w = 1080;
            h = 1080;
            filename += `_instagram.png`;
            mimeType = 'image/png';
        } else if (type === 'autotrader') {
            w = 1200;
            h = 900;
            filename += `_autotrader.jpg`;
        }

        // Create temporary canvas of exact export size to render high quality
        const tempCanvas = document.createElement('canvas');
        
        try {
            drawBanner(tempCanvas, w, h, formData, imageObj, logoObj, badges);

            // Check if mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

            const triggerStandardDownload = (dataUrlOrBlobUrl) => {
                const link = document.createElement('a');
                link.download = filename;
                link.href = dataUrlOrBlobUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            const showMobileFallback = (imgSrc) => {
                setDownloadModalData({
                    isOpen: true,
                    imgSrc: imgSrc,
                    filename: filename
                });
            };

            if (isMobile) {
                // On mobile, try Web Share API first
                tempCanvas.toBlob((blob) => {
                    if (!blob) {
                        // Fallback to dataURL if toBlob returns null
                        try {
                            const dataUrl = tempCanvas.toDataURL(mimeType, 0.95);
                            showMobileFallback(dataUrl);
                        } catch (e) {
                            alert("Failed to export the banner. If you are using a stock image, the external server might have blocked saving it due to security (CORS) restrictions. Try uploading the image manually using 'Upload Custom Image'.");
                        }
                        return;
                    }

                    const file = new File([blob], filename, { type: mimeType });
                    const shareData = {
                        files: [file],
                    };

                    if (navigator.canShare && navigator.canShare(shareData)) {
                        navigator.share(shareData).catch((err) => {
                            if (err.name !== 'AbortError') {
                                console.error('Share failed:', err);
                                // Fallback to modal if sharing fails and was not aborted
                                const blobUrl = URL.createObjectURL(blob);
                                showMobileFallback(blobUrl);
                            }
                        });
                    } else {
                        // Web Share API not supported for files, use fallback modal
                        const blobUrl = URL.createObjectURL(blob);
                        showMobileFallback(blobUrl);
                    }
                }, mimeType, 0.95);
            } else {
                // On desktop, use standard download using blob URL (more reliable for large sizes)
                tempCanvas.toBlob((blob) => {
                    if (!blob) {
                        // Fallback to dataUrl
                        try {
                            const dataUrl = tempCanvas.toDataURL(mimeType, 0.95);
                            triggerStandardDownload(dataUrl);
                        } catch (e) {
                            alert("Failed to export the banner. If you are using a stock image, the external server might have blocked saving it due to security (CORS) restrictions. Try uploading the image manually using 'Upload Custom Image'.");
                        }
                        return;
                    }
                    const blobUrl = URL.createObjectURL(blob);
                    triggerStandardDownload(blobUrl);
                    
                    // Clean up the blob URL after a short delay
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                }, mimeType, 0.95);
            }
        } catch (err) {
            console.error('Error during canvas download export:', err);
            alert("Failed to export the banner. If you are using a stock image, the external server might have blocked saving it due to security (CORS) restrictions. Try uploading the image manually using 'Upload Custom Image'.");
        }
    };

    return (
        <div className="banner-generator bg-slate-50 min-h-screen">
            <header className="banner-generator__header mb-8">
                <h1 className="banner-generator__title">Promotional Banner Generator</h1>
                <p className="banner-generator__subtitle">
                    Upload a car photo, enter specification details, and export dealership-branded marketing banners.
                </p>
            </header>

            <div className="banner-generator__layout">
                {/* Left Side: Form Controls */}
                <div className="banner-generator__form-panel bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    {/* Inventory prefiller */}
                    <div className="banner-generator__prefill mb-6">
                        <label className="form-label font-bold text-xs uppercase text-slate-600 mb-2">Pre-fill From Inventory</label>
                        <select 
                            className="form-select" 
                            value={selectedCarId} 
                            onChange={handleCarSelectionChange}
                        >
                            <option value="">Select a vehicle in stock...</option>
                            {carsList.map(car => (
                                <option key={car.id} value={car.id}>
                                    {car.year} {car.make} {car.model} {car.trim ? `(${car.trim})` : ''} - £{car.price?.toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <h3 className="banner-generator__section-title mb-4 border-b pb-2 text-slate-700 font-semibold text-sm">Vehicle Details</h3>
                    <div className="banner-generator__form-grid mb-6">
                        <div className="form-group">
                            <label className="form-label">Make</label>
                            <input name="make" value={formData.make} onChange={handleInputChange} className="form-input" placeholder="e.g. Volkswagen" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Model</label>
                            <input name="model" value={formData.model} onChange={handleInputChange} className="form-input" placeholder="e.g. Polo" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Year</label>
                            <input name="year" value={formData.year} onChange={handleInputChange} className="form-input" placeholder="e.g. 2012" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Trim / Variant</label>
                            <input name="trim" value={formData.trim} onChange={handleInputChange} className="form-input" placeholder="e.g. 1.4 Match" />
                        </div>
                    </div>

                    <h3 className="banner-generator__section-title mb-4 border-b pb-2 text-slate-700 font-semibold text-sm">Banner Badges</h3>
                    <div className="banner-generator__badges-container space-y-4 mb-6">
                        {badges.map((badge, idx) => (
                            <div key={badge.id} className="badge-editor-row p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 items-end">
                                <div className="badge-editor-field flex-1 min-w-[120px]">
                                    <label className="form-label text-xs mb-1 font-semibold text-slate-500">Badge {idx + 1} Icon</label>
                                    <select 
                                        value={badge.icon} 
                                        onChange={(e) => handleBadgeChange(badge.id, 'icon', e.target.value)} 
                                        className="form-select text-xs py-1.5"
                                    >
                                        <option value="speedometer">Speedometer</option>
                                        <option value="document">Document</option>
                                        <option value="key">Key</option>
                                        <option value="shield">Shield</option>
                                        <option value="calendar">Calendar</option>
                                        <option value="user">User / Owner</option>
                                        <option value="star">Star</option>
                                        <option value="gear">Gear</option>
                                        <option value="bolt">Bolt / Electric</option>
                                    </select>
                                </div>
                                <div className="badge-editor-field flex-1 min-w-[120px]">
                                    <label className="form-label text-xs mb-1 font-semibold text-slate-500">Heading</label>
                                    <input 
                                        type="text" 
                                        value={badge.heading} 
                                        onChange={(e) => handleBadgeChange(badge.id, 'heading', e.target.value)} 
                                        className="form-input text-xs py-1.5" 
                                        placeholder="e.g. Mileage" 
                                    />
                                </div>
                                <div className="badge-editor-field flex-1 min-w-[150px]">
                                    <label className="form-label text-xs mb-1 font-semibold text-slate-500">Value</label>
                                    <input 
                                        type="text" 
                                        value={badge.value} 
                                        onChange={(e) => handleBadgeChange(badge.id, 'value', e.target.value)} 
                                        className="form-input text-xs py-1.5" 
                                        placeholder="e.g. 156k Miles" 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <h3 className="banner-generator__section-title mb-4 border-b pb-2 text-slate-700 font-semibold text-sm">Marketing Headlines</h3>
                    <div className="banner-generator__form-grid mb-6">
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Condition Headline (Blue)</label>
                            <input name="condition" value={formData.condition} onChange={handleInputChange} className="form-input" placeholder="e.g. Great Condition" />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Secondary Subtitle (Black Italic)</label>
                            <input name="subtitle" value={formData.subtitle} onChange={handleInputChange} className="form-input" placeholder="e.g. Drives Perfect" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Price (£)</label>
                            <input name="price" type="number" value={formData.price} onChange={handleInputChange} className="form-input" placeholder="e.g. 2600" />
                        </div>
                    </div>

                    <h3 className="banner-generator__section-title mb-4 border-b pb-2 text-slate-700 font-semibold text-sm">Vehicle Image</h3>
                    <div className="form-group">
                        <label className="form-label">Upload Custom Image</label>
                        <div className="banner-generator__upload-box">
                            <input type="file" accept="image/*" onChange={handleImageUpload} id="banner-image-upload" className="sr-only" />
                            <label htmlFor="banner-image-upload" className="banner-generator__upload-label">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                <span>Click to select or upload image</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right Side: Live Canvas Preview & Exports */}
                <div className="banner-generator__preview-panel">
                    <div className="banner-generator__preview-card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
                        <div className="banner-generator__preview-toolbar mb-4 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm">Live Banner Preview</h3>
                            <div className="flex gap-2">
                                <select 
                                    className="form-select py-1 px-3 text-xs w-auto"
                                    value={exportFormat}
                                    onChange={(e) => setExportFormat(e.target.value)}
                                >
                                    <option value="widescreen">Widescreen (16:9 - 1920x1080)</option>
                                    <option value="medium">Medium Size (16:9 - 1200x675)</option>
                                    <option value="instagram">Instagram (1:1 - 1080x1080)</option>
                                    <option value="autotrader">AutoTrader (4:3 - 1200x900)</option>
                                </select>
                            </div>
                        </div>

                        <div className="banner-generator__canvas-container bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-950">
                            <canvas 
                                ref={canvasRef} 
                                className="banner-generator__canvas"
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                        </div>
                    </div>

                    <div className="banner-generator__export-card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-sm mb-4">Export & Download Options</h3>
                        <div className="banner-generator__export-grid">
                            <button onClick={() => handleDownload('png')} className="btn btn--primary py-3 flex items-center justify-center gap-2 text-sm">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                Download PNG (High-Res)
                            </button>
                            <button onClick={() => handleDownload('jpg')} className="btn btn--outline py-3 flex items-center justify-center gap-2 text-sm">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                Download JPEG
                            </button>
                            <button onClick={() => handleDownload('facebook')} className="btn btn--secondary py-3 flex items-center justify-center gap-2 text-sm">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                                Download for Facebook
                            </button>
                            <button onClick={() => handleDownload('instagram')} className="btn btn--secondary py-3 flex items-center justify-center gap-2 text-sm">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                                Download for Instagram
                            </button>
                            <button onClick={() => handleDownload('autotrader')} className="btn btn--secondary py-3 flex items-center justify-center gap-2 text-sm" style={{ gridColumn: '1 / -1' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                                Download for AutoTrader (4:3)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {downloadModalData.isOpen && (
                <div className="banner-modal-overlay" onClick={() => setDownloadModalData(prev => ({ ...prev, isOpen: false }))}>
                    <div className="banner-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="banner-modal__header">
                            <h3 className="banner-modal__title">Save Promotional Banner</h3>
                            <button 
                                className="banner-modal__close-btn" 
                                onClick={() => setDownloadModalData(prev => ({ ...prev, isOpen: false }))}
                                aria-label="Close modal"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="banner-modal__body">
                            <p className="banner-modal__instruction">
                                Tap and hold the banner image below to save it directly to your Photos or Files.
                            </p>
                            <div className="banner-modal__image-wrapper">
                                <img 
                                    src={downloadModalData.imgSrc} 
                                    alt="Generated Promotional Banner" 
                                    className="banner-modal__image"
                                />
                            </div>
                        </div>
                        <div className="banner-modal__footer">
                            <button 
                                className="btn btn--primary w-full py-3"
                                onClick={() => setDownloadModalData(prev => ({ ...prev, isOpen: false }))}
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
