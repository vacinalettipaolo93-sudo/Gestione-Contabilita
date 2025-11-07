import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Lesson, Settings } from '../types';
import { DocumentArrowDownIcon, SpinnerIcon } from './icons';

interface ExportFormProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  settings: Settings;
  currentDate: Date;
}

const ExportForm: React.FC<ExportFormProps> = ({ isOpen, onClose, lessons, settings, currentDate }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'invoiced', 'not-invoiced'
    const [selectedSportId, setSelectedSportId] = useState('all');
    const [selectedLocationId, setSelectedLocationId] = useState('all');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            setStartDate(firstDay.toISOString().split('T')[0]);
            setEndDate(lastDay.toISOString().split('T')[0]);
            setFilter('all');
            setSelectedSportId('all');
            setSelectedLocationId('all');
            setLoading(false);
        }
    }, [isOpen, currentDate]);
    
    const availableLocations = useMemo(() => {
        if (selectedSportId === 'all') {
            const allLocations = settings.sports.flatMap(s => s.locations);
            // Remove duplicates by id
            return Array.from(new Map(allLocations.map(loc => [loc.id, loc])).values());
        }
        const sport = settings.sports.find(s => s.id === selectedSportId);
        return sport?.locations || [];
    }, [selectedSportId, settings.sports]);

    // Reset location filter when sport changes
    useEffect(() => {
        setSelectedLocationId('all');
    }, [selectedSportId]);


    const handleExport = () => {
        setLoading(true);
        // Use a timeout to allow the UI to update to the loading state before the blocking PDF generation starts
        setTimeout(() => {
            try {
                // 1. Filter lessons
                const filteredLessons = lessons.filter(lesson => {
                    const lessonDate = new Date(lesson.date + 'T00:00:00');
                    const start = new Date(startDate + 'T00:00:00');
                    const end = new Date(endDate + 'T23:59:59');

                    const dateMatch = lessonDate >= start && lessonDate <= end;
                    if (!dateMatch) return false;

                    const invoiceMatch = filter === 'all' || (filter === 'invoiced' && lesson.invoiced) || (filter === 'not-invoiced' && !lesson.invoiced);
                    if(!invoiceMatch) return false;
                    
                    const sportMatch = selectedSportId === 'all' || lesson.sportId === selectedSportId;
                    if (!sportMatch) return false;
                    
                    const locationMatch = selectedLocationId === 'all' || lesson.locationId === selectedLocationId;
                    if (!locationMatch) return false;

                    return true;
                }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                // 2. Initialize jsPDF
                const doc = new jsPDF();

                const addFooters = () => {
                    const pageCount = (doc.internal as any).getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        doc.setFontSize(9);
                        doc.setTextColor(150);
                        doc.text(`Pagina ${i} di ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
                    }
                };

                // 3. Add title and info
                doc.setFontSize(18);
                doc.text('Resoconto Lezioni', 14, 22);
                doc.setFontSize(11);
                doc.setTextColor(100);
                const formattedStartDate = new Date(startDate + 'T00:00:00').toLocaleDateString('it-IT');
                const formattedEndDate = new Date(endDate + 'T00:00:00').toLocaleDateString('it-IT');
                doc.text(`Periodo: dal ${formattedStartDate} al ${formattedEndDate}`, 14, 30);

                // 4. Prepare data for autoTable
                const tableData = filteredLessons.map(lesson => {
                    const sport = settings.sports.find(s => s.id === lesson.sportId);
                    const lessonType = sport?.lessonTypes.find(lt => lt.id === lesson.lessonTypeId);
                    const location = sport?.locations.find(l => l.id === lesson.locationId);
                    const profit = lesson.price - lesson.cost;
                    
                    return [
                        new Date(lesson.date + 'T00:00:00').toLocaleDateString('it-IT'),
                        sport?.name || 'N/D',
                        lessonType?.name || 'N/D',
                        location?.name || 'N/D',
                        lesson.invoiced ? 'Fatturata' : 'Non Fatt.',
                        `€ ${profit.toFixed(2)}`
                    ];
                });

                // 5. Generate table
                autoTable(doc, {
                    startY: 40,
                    head: [['Data', 'Sport', 'Tipo Lezione', 'Sede', 'Stato', 'Utile']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [3, 169, 244] } // Sky blue
                });
                
                let finalY = (doc as any).lastAutoTable.finalY;

                // Helper to check for page breaks
                const checkPageBreak = (y: number, margin = 0) => {
                    if (y + margin > 270) {
                        doc.addPage();
                        return 20;
                    }
                    return y;
                };

                // 6. Calculate and add totals or empty message
                if (filteredLessons.length > 0) {
                    finalY = checkPageBreak(finalY, 20) + 15;
                    
                    const totalInvoiced = filteredLessons.filter(l => l.invoiced).reduce((sum, l) => sum + (l.price - l.cost), 0);
                    const totalNotInvoiced = filteredLessons.filter(l => !l.invoiced).reduce((sum, l) => sum + (l.price - l.cost), 0);
                    const totalProfit = totalInvoiced + totalNotInvoiced;

                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Riepilogo Totali', 14, finalY);
                    finalY += 8;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(11);

                    doc.text(`Totale Utile Fatturato:`, 14, finalY);
                    doc.text(`€ ${totalInvoiced.toFixed(2)}`, 200, finalY, { align: 'right' });
                    finalY += 7;
                    
                    doc.text(`Totale Utile Non Fatturato:`, 14, finalY);
                    doc.text(`€ ${totalNotInvoiced.toFixed(2)}`, 200, finalY, { align: 'right' });
                    finalY += 1;
                    
                    doc.line(14, finalY, 200, finalY); // separator line
                    finalY += 7;
                    
                    doc.setFont('helvetica', 'bold');
                    doc.text(`Utile Complessivo:`, 14, finalY);
                    doc.text(`€ ${totalProfit.toFixed(2)}`, 200, finalY, { align: 'right' });

                    // 7. Add detailed breakdowns
                    finalY = checkPageBreak(finalY, 20) + 15;
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Riepiloghi Dettagliati', 14, finalY);

                    // Operational Breakdowns (Lesson Counts)
                    const lessonsBySport = filteredLessons.reduce((acc, lesson) => {
                        const sport = settings.sports.find(s => s.id === lesson.sportId);
                        if (sport) acc[sport.name] = (acc[sport.name] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);

                    const lessonsByLocation = filteredLessons.reduce((acc, lesson) => {
                        const sport = settings.sports.find(s => s.id === lesson.sportId);
                        const location = sport?.locations.find(l => l.id === lesson.locationId);
                        if (location) acc[location.name] = (acc[location.name] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);

                    const lessonsByLessonType = filteredLessons.reduce((acc, lesson) => {
                        const sport = settings.sports.find(s => s.id === lesson.sportId);
                        const lessonType = sport?.lessonTypes.find(lt => lt.id === lesson.lessonTypeId);
                        if (sport && lessonType) {
                            const key = `${lessonType.name} (${sport.name})`;
                            acc[key] = (acc[key] || 0) + 1;
                        }
                        return acc;
                    }, {} as Record<string, number>);

                    // Financial Breakdowns (Profits)
                    const profitBySport = filteredLessons.reduce((acc, lesson) => {
                        const sport = settings.sports.find(s => s.id === lesson.sportId);
                        if (sport) {
                             const profit = lesson.price - lesson.cost;
                             acc[sport.name] = (acc[sport.name] || 0) + profit;
                        }
                        return acc;
                    }, {} as Record<string, number>);

                    const profitByLocation = filteredLessons.reduce((acc, lesson) => {
                        const sport = settings.sports.find(s => s.id === lesson.sportId);
                        const location = sport?.locations.find(l => l.id === lesson.locationId);
                        if (location) {
                            const profit = lesson.price - lesson.cost;
                            acc[location.name] = (acc[location.name] || 0) + profit;
                        }
                        return acc;
                    }, {} as Record<string, number>);

                    const profitByLessonType = filteredLessons.reduce((acc, lesson) => {
                        const sport = settings.sports.find(s => s.id === lesson.sportId);
                        const lessonType = sport?.lessonTypes.find(lt => lt.id === lesson.lessonTypeId);
                        if (sport && lessonType) {
                            const key = `${lessonType.name} (${sport.name})`;
                            const profit = lesson.price - lesson.cost;
                            acc[key] = (acc[key] || 0) + profit;
                        }
                        return acc;
                    }, {} as Record<string, number>);


                    const createBreakdownTable = (title: string, data: Record<string, number>) => {
                        if (Object.keys(data).length > 0) {
                            finalY = checkPageBreak(finalY, 25) + 8;
                            autoTable(doc, {
                                startY: finalY,
                                head: [[title, 'Num. Lezioni']],
                                body: Object.entries(data).sort((a,b) => b[1] - a[1]),
                                theme: 'grid',
                                headStyles: { fillColor: [75, 85, 99] }, // Slate Gray
                            });
                            finalY = (doc as any).lastAutoTable.finalY;
                        }
                    };
                    
                    const createFinancialBreakdownTable = (title: string, data: Record<string, number>) => {
                        if (Object.keys(data).length > 0) {
                            finalY = checkPageBreak(finalY, 25) + 8;
                            const bodyData = Object.entries(data)
                                .sort((a, b) => b[1] - a[1])
                                .map(([name, total]) => [name, `€ ${total.toFixed(2)}`]);
                            
                            autoTable(doc, {
                                startY: finalY,
                                head: [[title, 'Utile Totale']],
                                body: bodyData,
                                theme: 'grid',
                                headStyles: { fillColor: [22, 163, 74] }, // Green
                            });
                            finalY = (doc as any).lastAutoTable.finalY;
                        }
                    };
                    
                    createBreakdownTable('Lezioni per Sport', lessonsBySport);
                    createBreakdownTable('Lezioni per Sede', lessonsByLocation);
                    createBreakdownTable('Lezioni per Tipo', lessonsByLessonType);

                    createFinancialBreakdownTable('Utile per Sport', profitBySport);
                    createFinancialBreakdownTable('Utile per Sede', profitByLocation);
                    createFinancialBreakdownTable('Utile per Tipo', profitByLessonType);

                } else {
                    finalY = checkPageBreak(finalY) + 15;
                    doc.setFontSize(11);
                    doc.setTextColor(100);
                    doc.text('Nessuna lezione trovata per i criteri selezionati.', 14, finalY);
                }

                // 8. Add footers and save
                addFooters();
                doc.save(`Resoconto_Lezioni_${startDate}_${endDate}.pdf`);
                onClose();

            } catch (error) {
                console.error("Failed to generate PDF:", error);
            } finally {
                setLoading(false);
            }
        }, 50);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-40 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-md border border-slate-300 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">Esporta Resoconto PDF</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data Inizio</label>
                            <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            disabled={loading}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data Fine</label>
                            <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                            disabled={loading}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="sportFilter" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Filtra per Sport</label>
                        <select
                            id="sportFilter"
                            value={selectedSportId}
                            onChange={(e) => setSelectedSportId(e.target.value)}
                            disabled={loading}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50"
                        >
                            <option value="all">Tutti gli Sport</option>
                            {settings.sports.map(sport => (
                                <option key={sport.id} value={sport.id}>{sport.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="locationFilter" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Filtra per Sede</label>
                        <select
                            id="locationFilter"
                            value={selectedLocationId}
                            onChange={(e) => setSelectedLocationId(e.target.value)}
                            disabled={loading || availableLocations.length === 0}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50"
                        >
                            <option value="all">Tutte le Sedi</option>
                            {availableLocations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Filtra lezioni</label>
                         <div className={`flex justify-around bg-slate-200 dark:bg-slate-800 rounded-lg p-1 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                             <button onClick={() => setFilter('all')} className={`w-full px-3 py-1 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-white dark:bg-slate-700 shadow text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Tutte</button>
                             <button onClick={() => setFilter('invoiced')} className={`w-full px-3 py-1 text-sm font-medium rounded-md transition-colors ${filter === 'invoiced' ? 'bg-white dark:bg-slate-700 shadow text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Fatturate</button>
                             <button onClick={() => setFilter('not-invoiced')} className={`w-full px-3 py-1 text-sm font-medium rounded-md transition-colors ${filter === 'not-invoiced' ? 'bg-white dark:bg-slate-700 shadow text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Non Fatt.</button>
                         </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                        Annulla
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={loading}
                        className="px-4 py-2 w-[150px] flex items-center justify-center gap-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-sky-500 transition-colors disabled:bg-sky-400 disabled:cursor-wait"
                    >
                        {loading ? (
                            <>
                                <SpinnerIcon className="w-5 h-5" />
                                <span>Esportando...</span>
                            </>
                        ) : (
                            <>
                                <DocumentArrowDownIcon className="w-5 h-5"/>
                                <span>Esporta PDF</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportForm;