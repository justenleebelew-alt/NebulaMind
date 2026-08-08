import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, User, Stethoscope, ShieldAlert, CheckCircle2, RefreshCw, Download, ExternalLink, Filter, FileText, ChevronRight, AlertCircle, HeartPulse, Sparkles, X } from 'lucide-react';
import { MedicalAppointment, MedicalPortalStatus, MedicalPortalProvider } from '../types';
import { MedicalPortalModal } from './MedicalPortalModal';

interface MedicalCalendarProps {
  appointments: MedicalAppointment[];
  portalStatuses: MedicalPortalStatus[];
  onAddAppointment: (app: MedicalAppointment) => void;
  onSyncPortalComplete: (provider: MedicalPortalProvider, newApps: MedicalAppointment[], statusInfo: MedicalPortalStatus) => void;
}

export const MedicalCalendar: React.FC<MedicalCalendarProps> = ({
  appointments,
  portalStatuses,
  onAddAppointment,
  onSyncPortalComplete,
}) => {
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState<MedicalAppointment | null>(null);

  // Form state for adding manual appointment
  const [newTitle, setNewTitle] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('Psychiatry & Behavioral Health');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('10:00');
  const [newLocation, setNewLocation] = useState('');
  const [newPrep, setNewPrep] = useState('');

  const specialties = [
    'ALL',
    'Psychiatry & Behavioral Health',
    'Individual Psychotherapy',
    'Laboratory & Pathology',
    'Primary Care & Neurology',
  ];

  const filteredAppointments = appointments.filter((app) => {
    if (selectedSpecialty === 'ALL') return true;
    return app.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
  });

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: MedicalAppointment = {
      id: `manual-${Date.now()}`,
      title: newTitle,
      doctorName: newDoctor || 'Healthcare Provider',
      specialty: newSpecialty,
      portalProvider: 'MANUAL',
      date: newDate,
      time: newTime,
      location: newLocation || 'In-Person / Clinic',
      status: 'UPCOMING',
      prepInstructions: newPrep || undefined,
      syncedToCalendar: false,
    };

    onAddAppointment(created);
    setNewTitle('');
    setNewDoctor('');
    setNewLocation('');
    setNewPrep('');
    setIsAddModalOpen(false);
  };

  // Helper to generate Google Calendar URL
  const getGoogleCalendarUrl = (app: MedicalAppointment) => {
    const title = encodeURIComponent(`Medical Appointment: ${app.title} (${app.doctorName})`);
    const details = encodeURIComponent(
      `Provider: ${app.doctorName}\nSpecialty: ${app.specialty}\nLocation: ${app.location}\nPrep Instructions: ${app.prepInstructions || 'None'}\nSynced via AuraCosmos Health Portal`
    );
    const location = encodeURIComponent(app.location);

    // Format dates (assuming YYYY-MM-DD and HH:MM)
    const startTimeStr = `${app.date.replace(/-/g, '')}T${app.time.replace(':', '')}00`;
    // Add 1 hour duration
    const endDate = new Date(`${app.date}T${app.time}`);
    endDate.setHours(endDate.getHours() + 1);
    const endTimeStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '').substring(0, 15);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTimeStr}/${endTimeStr}&details=${details}&location=${location}`;
  };

  // Helper to download iCal .ics file
  const handleDownloadICS = (app: MedicalAppointment) => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AuraCosmos Health Portal//EN
BEGIN:VEVENT
SUMMARY:Medical Appointment: ${app.title}
DESCRIPTION:Provider: ${app.doctorName}\\nSpecialty: ${app.specialty}\\nPrep: ${app.prepInstructions || 'None'}
LOCATION:${app.location}
DTSTART:${app.date.replace(/-/g, '')}T${app.time.replace(':', '')}00Z
DTEND:${app.date.replace(/-/g, '')}T${app.time.replace(':', '')}00Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${app.title.replace(/\s+/g, '_')}_appointment.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-3 space-y-4 text-white z-10 relative">
      {/* Page Header */}
      <div className="p-5 rounded-3xl bg-black/70 border border-cyan-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_30px_rgba(0,243,255,0.15)]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-pink-500 text-black shadow-[0_0_20px_rgba(0,243,255,0.4)]">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-wide bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent">
              Medical Appointments & Calendar
            </h2>
            <p className="text-xs text-cyan-200/80 font-mono">
              Auto-synced with MyChart, Cerner & Quest Portals
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsPortalModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(0,243,255,0.3)]"
          >
            <RefreshCw className="w-4 h-4 text-black" />
            <span>Sync Health Portal</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-black/80 hover:bg-gray-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Add Appointment</span>
          </button>
        </div>
      </div>

      {/* Connected Portals Status Strip */}
      <div className="p-3.5 rounded-2xl bg-black/60 border border-cyan-500/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-pink-400" />
          <span className="font-semibold text-gray-300">Connected Health Portals:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {portalStatuses.map((st) => (
            <span
              key={st.provider}
              className="px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,243,255,0.1)]"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{st.name}</span>
            </span>
          ))}

          {portalStatuses.length === 0 && (
            <span className="text-gray-400 text-xs italic">
              No portals connected yet. Click "Sync Health Portal" above.
            </span>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Filter className="w-4 h-4 text-cyan-400 shrink-0" />
        {specialties.map((spec) => (
          <button
            key={spec}
            onClick={() => setSelectedSpecialty(spec)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
              selectedSpecialty === spec
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold shadow-[0_0_12px_rgba(0,243,255,0.2)]'
                : 'bg-black/60 text-gray-400 border-gray-800 hover:text-gray-200'
            }`}
          >
            {spec === 'ALL' ? 'All Specialties' : spec}
          </button>
        ))}
      </div>

      {/* Appointments List View */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-black/60 border border-gray-800 backdrop-blur-md space-y-3">
            <CalendarIcon className="w-10 h-10 text-cyan-400/50 mx-auto" />
            <p className="text-sm text-gray-400 font-medium">No upcoming appointments found in this category.</p>
            <p className="text-xs text-gray-500">
              Sync your MyChart / Epic account or add an appointment manually.
            </p>
          </div>
        ) : (
          filteredAppointments.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-black/70 border border-cyan-500/30 backdrop-blur-md hover:border-cyan-400 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition">
                    {app.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-500/40 text-[10px] font-mono">
                    {app.specialty}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                    {app.portalProvider === 'MYCHART_EPIC'
                      ? 'Epic MyChart'
                      : app.portalProvider === 'CERNER'
                      ? 'Cerner'
                      : app.portalProvider === 'QUEST_LABCORP'
                      ? 'Quest / Labcorp'
                      : app.portalProvider === 'AI_NOTE_EXTRACTED'
                      ? 'AI Extracted'
                      : 'Manual'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 pt-0.5">
                  <span className="flex items-center gap-1 text-cyan-200">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    {app.doctorName}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-pink-300">
                    <Clock className="w-3.5 h-3.5 text-pink-400" />
                    {app.date} at {app.time}
                  </span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    {app.location}
                  </span>
                </div>

                {app.prepInstructions && (
                  <div className="mt-2 p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-amber-300">Prep Notice:</strong> {app.prepInstructions}
                    </span>
                  </div>
                )}
              </div>

              {/* 1-Click Calendar Export Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <a
                  href={getGoogleCalendarUrl(app)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-400 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition shadow-[0_0_10px_rgba(0,243,255,0.2)]"
                  title="Add directly to Google Calendar"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Google Calendar</span>
                </a>
                <button
                  onClick={() => handleDownloadICS(app)}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold flex items-center gap-1 transition"
                  title="Download iCal file for Apple Calendar or Outlook"
                >
                  <Download className="w-3.5 h-3.5 text-gray-400" />
                  <span>.ics iCal</span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Manual Appointment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg p-5 rounded-3xl bg-black/95 border border-cyan-500/40 shadow-2xl text-left space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <span className="font-bold text-cyan-300 flex items-center gap-2">
                <Plus className="w-5 h-5 text-pink-400" /> Add Medical Appointment
              </span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Appointment Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Bipolar Medication Check-in or Bloodwork"
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Doctor / Clinic Name</label>
                  <input
                    type="text"
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    placeholder="e.g. Dr. Miller, MD"
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Specialty</label>
                  <select
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Psychiatry & Behavioral Health">Psychiatry & Behavioral Health</option>
                    <option value="Individual Psychotherapy">Individual Psychotherapy</option>
                    <option value="Laboratory & Pathology">Laboratory & Pathology</option>
                    <option value="Primary Care & Neurology">Primary Care & Neurology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Location / Address / Telehealth</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Main Hospital Bldg B or Telehealth Video Link"
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Preparation Instructions (Optional)</label>
                <input
                  type="text"
                  value={newPrep}
                  onChange={(e) => setNewPrep(e.target.value)}
                  placeholder="e.g. Fasting required 8 hours prior, bring lab forms"
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 text-black font-extrabold shadow-md"
                >
                  Save Appointment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Health Portal Connect Modal */}
      <MedicalPortalModal
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
        portalStatuses={portalStatuses}
        onSyncComplete={onSyncPortalComplete}
      />
    </div>
  );
};
