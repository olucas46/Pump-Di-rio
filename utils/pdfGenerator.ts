import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WorkoutPlan } from '../types';

export const generateWorkoutPDF = (plan: WorkoutPlan) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text(plan.name, 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado pelo Pump Diário`, 14, 28);

  // Exercises Table
  const tableColumn = ["Exercício", "Músculo", "Séries", "Reps", "Carga", "Descanso", "Notas"];
  const tableRows: any[] = [];

  plan.exercises.forEach(exercise => {
    const exerciseData = [
      exercise.name,
      exercise.muscle || '-',
      exercise.sets,
      exercise.reps,
      exercise.load ? `${exercise.load} kg` : '-',
      exercise.rest,
      exercise.notes || exercise.method || '-'
    ];
    tableRows.push(exerciseData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233] }, // Sky-500 color
    styles: { fontSize: 10, cellPadding: 3 },
    alternateRowStyles: { fillColor: [240, 240, 240] }
  });

  // Cardio Section
  if (plan.cardio) {
    const finalY = (doc as any).lastAutoTable.finalY || 35;
    
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Cardio", 14, finalY + 15);

    const cardioData = [
      ["Tipo", plan.cardio.type],
      ["Duração", plan.cardio.duration],
      ["Distância", plan.cardio.distance ? `${plan.cardio.distance} km` : '-'],
      ["Calorias", plan.cardio.calories ? `${plan.cardio.calories} kcal` : '-']
    ];

    autoTable(doc, {
      body: cardioData,
      startY: finalY + 20,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Página ' + i + ' de ' + pageCount, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  doc.save(`${plan.name.replace(/\s+/g, '_')}_Treino.pdf`);
};
