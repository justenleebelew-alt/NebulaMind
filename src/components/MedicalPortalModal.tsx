import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, RefreshCw, CheckCircle2, AlertCircle, Server, Link, ExternalLink, X, HeartPulse, Stethoscope, Lock } from 'lucide-react';
import { MedicalPortalProvider, MedicalPortalStatus, MedicalAppointment } from '../types';

interface MedicalPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalStatuses: MedicalPortalStatus[];
  onSyncComplete: (provider: MedicalPortalProvider, appointments: MedicalAppointment[], statusInfo: MedicalPortalStatus) => void;
}

export const MedicalPortalModal: React.FC<MedicalPortalModalProps> = ({
  isOpen,
  onClose,
  portalStatuses,
  onSyncComplete,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<MedicalPortalProvider>('MYCHART_EPIC');
  const [fhirEndpointUrl, setFhirEndpointUrl] = useState('');
  const [patientIdToken, setPatientIdToken] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providers = [
    {
      id: 'MYCHART_EPIC' as MedicalPortalProvider,
      name: 'Epic MyChart Portal',
      description: 'Sync appointments, lab results & care plans from Epic-powered health networks.',
      icon: HeartPulse,
      badge: 'SMART-on-FHIR R4',
      accentColor: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'CERNER' as MedicalPortalProvider,
      name: 'Cerner / Oracle Health',
      description: 'Connect directly to Oracle Cerner patient portals and outpatient appointment feeds.',
      icon: Stethoscope,
      badge: 'FHIR API',
      accentColor: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'QUEST_LABCORP' as MedicalPortalProvider,
      name: 'Quest Diagnostics & Labcorp',
      description: 'Auto-retrieve bloodwork lab appointments, fasting orders, and pathology visits.',
      icon: Shield,
      badge: 'Lab Portal Sync',
      accentColor: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'GOOGLE_HEALTH' as MedicalPortalProvider,
      name: 'Google Health Connect',
      description: 'Sync health appointments & medical records stored in Google Health Connect.',
      icon: Server,
      badge: 'OAuth 2.0',
      accentColor: 'from-pink-500 to-rose-600',
    },
    {
      id: 'FHIR_GENERIC' as MedicalPortalProvider,
      name: 'Custom FHIR Server / Portal URL',
      description: 'Connect any custom SMART-on-FHIR server, clinic patient portal, or iCal feed URL.',
      icon: Link,
      badge: 'HL7 FHIR',
      accentColor: 'from-amber-500 to-orange-600',
    },
  ];

  const handleSyncPortal = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const response = await fetch('/api/medical-portal/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          fhirEndpoint: fhirEndpointUrl || undefined,
          credentials: patientIdToken ? { token: patientIdToken } : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync with medical portal');
      }

      const statusInfo: MedicalPortalStatus = {
        provider: selectedProvider,
        name: data.providerName,
        connected: true,
        lastSynced: data.lastSynced,
        patientName: data.patientName,
      };

      onSyncComplete(selectedProvider, data.appointments, statusInfo);
      setIsSyncing(false);
      onClose();
    } catch (err: any) {
      console.error('Portal sync error:', err);
      setError(err?.message || 'Failed to establish portal handshake');
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-black/95 border border-cyan-500/40 p-5 shadow-[0_0_50px_rgba(0,243,255,0.25)] text-white text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-400 text-cyan-300">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-cyan-300">Sync Major Medical Portals</h2>
                <p className="text-xs text-gray-400">
                  Connect Epic MyChart, Cerner, Quest, or SMART-on-FHIR to pull appointments into your calendar
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Privacy HIPAA / SMART on FHIR Notice */}
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2.5 mb-4">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Encrypted SMART-on-FHIR Standard</span>
              <span>
                Your health portal connections use HL7 FHIR read-only authorization tokens. Appointments and prep instructions are synced securely without sharing login credentials.
              </span>
            </div>
          </div>

          {/* Provider Selection Cards */}
          <div className="space-y-2 mb-4">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-1">
              Select Your Medical Portal Provider
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {providers.map((prov) => {
                const isSelected = selectedProvider === prov.id;
                const status = portalStatuses.find((s) => s.provider === prov.id);
                const IconComponent = prov.icon;

                return (
                  <button
                    key={prov.id}
                    onClick={() => setSelectedProvider(prov.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 relative overflow-hidden ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 ring-1 ring-cyan-400/50 shadow-[0_0_15px_rgba(0,243,255,0.2)]'
                        : 'bg-black/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl bg-gradient-to-tr ${prov.accentColor} text-white`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-white block">{prov.name}</span>
                          <span className="text-[10px] text-cyan-300 font-mono">{prov.badge}</span>
                        </div>
                      </div>
                      {status?.connected && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Connected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">{prov.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration Input for Custom FHIR / Portal Credentials */}
          {selectedProvider === 'FHIR_GENERIC' && (
            <div className="space-y-2 mb-4 p-3.5 rounded-2xl bg-black/80 border border-amber-500/30">
              <label className="text-xs font-semibold text-amber-300 block">
                SMART-on-FHIR Endpoint or Portal iCal Feed URL
              </label>
              <input
                type="url"
                value={fhirEndpointUrl}
                onChange={(e) => setFhirEndpointUrl(e.target.value)}
                placeholder="https://fhir.clinic.org/r4/Appointment or iCal Feed URL"
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Optional OAuth Token / Client ID input */}
          <div className="space-y-2 mb-4">
            <label className="text-xs font-medium text-gray-300 flex items-center justify-between">
              <span>Patient Access Token / Portal Client Credentials (Optional)</span>
              <span className="text-[10px] text-cyan-400">Leave blank for standard OAuth sandbox</span>
            </label>
            <input
              type="text"
              value={patientIdToken}
              onChange={(e) => setPatientIdToken(e.target.value)}
              placeholder="e.g. Bearer fhir_oauth_access_token_xxx"
              className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between border-t border-gray-800 pt-4 mt-2">
            <span className="text-[11px] text-gray-400">
              Pulls future appointments, lab visits, and prep instructions
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSyncPortal}
                disabled={isSyncing}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs flex items-center gap-2 transition shadow-[0_0_20px_rgba(0,243,255,0.4)] disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Syncing Portal FHIR...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-black" />
                    <span>Sync Medical Portal Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
