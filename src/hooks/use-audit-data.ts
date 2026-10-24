'use client';

import { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getInstallations, getId } from 'firebase/installations';
import { UAParser } from 'ua-parser-js';

const firebaseConfig = {
  apiKey: "AIzaSyAPCTKaTqLW-9UMJjGlxPiA3PlhWETOJ60",
  authDomain: "prestagana-ey5tu.firebaseapp.com",
  projectId: "prestagana-ey5tu",
  storageBucket: "prestagana-ey5tu.firebasestorage.app",
  messagingSenderId: "894508861062",
  appId: "1:894508861062:web:9917e098b906d0e9637307"
};
const app = getApps()[0] ?? initializeApp(firebaseConfig);

export type AuditData = {
  deviceId: string;
  deviceModel: string;
  latitude: string;
  longitude: string;
};

/** Junta los datos de auditoría (dispositivo y GPS) que se mandan al crear un vale. */
export function useAuditData(): AuditData {
  const [auditData, setAuditData] = useState<AuditData>({
    deviceId: '',
    deviceModel: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    const gatherAuditData = async () => {
        let newAuditData = { ...auditData };

        try {
            const parser = new UAParser();
            const result = parser.getResult();
            const vendor = result.device.vendor || '';
            const model = result.device.model || 'PC/Genérico';
            const os = result.os.name || '';
            newAuditData.deviceModel = `${vendor} ${model} (${os})`.trim();
        } catch (e) {
            console.warn('Error user-agent', e);
        }

        try {
            const installations = getInstallations(app);
            const fid = await getId(installations);
            newAuditData.deviceId = fid;
        } catch (e) {
            console.warn('No se pudo obtener FID'); 
            newAuditData.deviceId = 'sin-id-capturado'; 
        }

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setAuditData(prev => ({
                        ...prev,
                        ...newAuditData,
                        latitude: position.coords.latitude.toString(),
                        longitude: position.coords.longitude.toString()
                    }));
                },
                (error) => {
                    console.warn("GPS denegado o error:", error.message);
                    setAuditData(prev => ({ ...prev, ...newAuditData }));
                },
                { enableHighAccuracy: false, 
                  timeout: 15000,           
                  maximumAge: 60000 }
            );
        } else {
            setAuditData(prev => ({ ...prev, ...newAuditData }));
        }
    };

    gatherAuditData();
  }, []);

  return auditData;
}
