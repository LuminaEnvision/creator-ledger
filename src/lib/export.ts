import Papa from 'papaparse';
import { jsPDF } from 'jspdf';

// Define the shape of the data we are exporting
interface ExportEntry {
    wallet_address: string;
    url: string;
    platform: string;
    timestamp: string;
    content_published_at?: string;
    verification_status: string;
    description?: string;
    campaign_tag?: string;
    payload_hash: string;
    title?: string;
    image_url?: string;
    custom_image_url?: string;
    site_name?: string;
}

export const exportToCSV = (data: ExportEntry[], filename: string = 'ledger-export.csv') => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const exportToPDF = async (data: ExportEntry[], filename: string = 'ledger-export.pdf') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
            return true;
        }
        return false;
    };

    // Header with gradient-like effect (using colored rectangles)
    doc.setFillColor(100, 50, 200); // Primary color
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Creator Portfolio', margin, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 35);
    
    yPosition = 50;

    // Process each entry
    for (let i = 0; i < data.length; i++) {
        const entry = data[i];
        const imageUrl = entry.custom_image_url || entry.image_url;
        
        checkPageBreak(80);

        // Entry header
        doc.setTextColor(100, 50, 200);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const entryTitle = entry.title || entry.site_name || entry.platform || 'Content Entry';
        doc.text(entryTitle.substring(0, 50), margin, yPosition);
        
        yPosition += 8;

        // Entry details
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const details = [
            `Platform: ${entry.platform}`,
            `Date: ${entry.content_published_at 
                ? new Date(entry.content_published_at).toLocaleDateString() 
                : new Date(entry.timestamp).toLocaleDateString() + ' (submitted)'}`,
            `Status: ${entry.verification_status}`,
            entry.campaign_tag ? `Tags: ${entry.campaign_tag}` : null,
        ].filter(Boolean);

        details.forEach((detail) => {
            if (detail) {
                doc.text(detail, margin, yPosition);
                yPosition += 6;
            }
        });

        // Description if available
        if (entry.description) {
            yPosition += 3;
            doc.setFontSize(8);
            const descriptionLines = doc.splitTextToSize(entry.description, contentWidth - 10);
            descriptionLines.forEach((line: string) => {
                checkPageBreak(6);
                doc.text(line, margin + 5, yPosition);
                yPosition += 5;
            });
        }

        // Try to add image if available
        if (imageUrl) {
            try {
                yPosition += 5;
                checkPageBreak(60);
                
                // Create an image element to load the image
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                await new Promise((resolve) => {
                    img.onload = () => {
                        try {
                            const imgWidth = Math.min(60, contentWidth);
                            const imgHeight = (img.height / img.width) * imgWidth;
                            
                            checkPageBreak(imgHeight + 5);
                            
                            // Add image to PDF
                            doc.addImage(img, 'JPEG', margin, yPosition, imgWidth, imgHeight);
                            yPosition += imgHeight + 5;
                            resolve(true);
                        } catch (err) {
                            console.warn('Could not add image to PDF:', err);
                            resolve(false);
                        }
                    };
                    img.onerror = () => {
                        console.warn('Could not load image:', imageUrl);
                        resolve(false);
                    };
                    img.src = imageUrl;
                });
            } catch (err) {
                console.warn('Error processing image:', err);
            }
        }

        // URL (truncated)
        yPosition += 3;
        checkPageBreak(8);
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 200);
        const truncatedUrl = entry.url.length > 60 ? entry.url.substring(0, 57) + '...' : entry.url;
        doc.text(truncatedUrl, margin, yPosition);
        
        yPosition += 15; // Space between entries
        
        // Add separator line
        if (i < data.length - 1) {
            checkPageBreak(5);
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;
        }
    }

    // Footer on each page
    const addFooter = (pageNum: number, totalPages: number) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Page ${pageNum} of ${totalPages} | Creator Ledger Portfolio`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    };

    // Add page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
    }

    doc.save(filename);
};
