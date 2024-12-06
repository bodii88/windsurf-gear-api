import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface GearItem {
  id: number;
  name: string;
}

export const exportQRCodes = async (gear: GearItem[]) => {
  const zip = new JSZip();
  const canvas = document.createElement('canvas');
  const QRCode = require('qrcode');

  for (const item of gear) {
    const url = `${window.location.origin}/gear/${item.id}`;
    
    try {
      // Generate QR code
      await QRCode.toCanvas(canvas, url, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'H'
      });

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob as Blob);
        }, 'image/png');
      });

      // Add to zip
      const fileName = `${item.name.toLowerCase().replace(/\s+/g, '-')}-qr.png`;
      zip.file(fileName, blob);
    } catch (error) {
      console.error(`Error generating QR code for ${item.name}:`, error);
    }
  }

  // Generate and download zip file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, 'gear-qr-codes.zip');
};
