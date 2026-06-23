import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DAY_KEYS, DAY_LABELS } from './helpers';
import type { ScheduleData } from '../types';

export const exportToPDF = (schedule: ScheduleData) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(10, 37, 64);
  doc.text('Jadwal Mingguan — Habbit Tracker', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Diekspor pada: ${new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    14,
    28
  );

  let startY = 36;

  DAY_KEYS.forEach((day) => {
    const slots = [...schedule[day]].sort((a, b) => a.start.localeCompare(b.start));

    doc.setFontSize(12);
    doc.setTextColor(27, 108, 168);
    doc.text(DAY_LABELS[day], 14, startY);
    startY += 4;

    autoTable(doc, {
      startY,
      body: slots.length === 0
        ? [['—', '—', 'Tidak ada jadwal']]
        : slots.map((s) => [s.start, s.end, s.activity || '—']),
      columns: [{ header: 'Jam Mulai' }, { header: 'Jam Selesai' }, { header: 'Aktivitas' }],
      headStyles: { fillColor: [27, 108, 168] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    startY = (doc as any).lastAutoTable.finalY + 10;
  });

  doc.save('jadwal-habbit-tracker.pdf');
};
