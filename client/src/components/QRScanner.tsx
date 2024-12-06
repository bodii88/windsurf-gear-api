import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ open, onClose, onScan }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      // Initialize scanner when dialog opens
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: 250 },
        /* verbose= */ false
      );

      scannerRef.current.render((decodedText) => {
        const scannedUrl = decodedText;
        if (scannedUrl && scannedUrl.includes('/gear/')) {
          const gearId = scannedUrl.split('/gear/').pop();
          navigate(`/gear/${gearId}`);
        }
        onScan(decodedText);
        onClose();
      }, (errorMessage) => {
        setError(errorMessage);
      });
    } else {
      // Clean up scanner when dialog closes
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [open, onClose, onScan, navigate]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle>
        Scan QR Code
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
          {error && (
            <Box sx={{ color: 'error.main', mb: 2 }}>
              Error: {error}
            </Box>
          )}
          <div id="qr-reader" style={{ width: '100%' }}></div>
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Point your camera at a gear QR code to scan
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRScanner;
