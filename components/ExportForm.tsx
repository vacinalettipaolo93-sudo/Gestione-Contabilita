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
    const [filter, setFilter] = useState('all'); 
    const [selectedSportId, setSelectedSportId] = useState('all');
    const [selectedLocationId, setSelectedLocationId] = useState('all');
    const [includeNetDetails, setIncludeNetDetails] = useState(true);
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
            setIncludeNetDetails(true);
            setLoading(false);
        }
    }, [isOpen, currentDate]);
    
    const availableLocations = useMemo(() => {
        if (selectedSportId === 'all') {
            const allLocations = settings.sports.flatMap(s => s.locations);
            return Array.from(new Map(allLocations.map(loc => [loc.id, loc])).values());
        }
        const sport = settings.sports.find(s => s.id === selectedSportId);
        return sport?.locations || [];
    }, [selectedSportId, settings.sports]);

    useEffect(() => {
        setSelectedLocationId('all');
    }, [selectedSportId]);


    const handleExport = () => {
        setLoading(true);
        setTimeout(() => {
            try {
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

                doc.setFontSize(18);
                doc.text('Resoconto Lezioni', 14, 22);
                doc.setFontSize(11);
                doc.setTextColor(100);
                const formattedStartDate = new Date(startDate + 'T00:00:00').toLocaleDateString('it-IT');
                const formattedEndDate = new Date(endDate + 'T00:00:00').toLocaleDateString('it-IT');
                doc.text(`Periodo: dal ${formattedStartDate} al ${formattedEndDate}`, 14, 30);

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

                autoTable(doc, {
                    startY: 40,
                    head: [['Data', 'Sport', 'Tipo Lezione', 'Sede', 'Stato', 'Utile']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [79, 70, 229] } // Indigo
                });
                
                let finalY = (doc as any).lastAutoTable.finalY;

                const checkPageBreak = (y: number, margin = 0) => {
                    if (y + margin > 270) {
                        doc.addPage();
                        return 20;
                    }
                    return y;
                };

                if (filteredLessons.length > 0) {
                    finalY = checkPageBreak(finalY, 20) + 15;
                    
                    const totalInvoicedGross = filteredLessons.filter(l => l.invoiced).reduce((sum, l) => sum + (l.price - l.cost), 0);
                    const totalNotInvoiced = filteredLessons.filter(l => !l.invoiced).reduce((sum, l) => sum + (l.price - l.cost), 0);
                    
                    const taxRate = settings.taxRate || 0;
                    const totalInvoicedNet = totalInvoicedGross * (1 - (taxRate / 100));

                    const totalOverall = includeNetDetails ? (totalInvoicedNet + totalNotInvoiced) : (totalInvoicedGross + totalNotInvoiced);

                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Riepilogo Finanziario', 14, finalY);
                    finalY += 8;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(11);

                    doc.text(`Fatturato Lordo (Fatturato):`, 14, finalY);
                    doc.text(`€ ${totalInvoicedGross.toFixed(2)}`, 200, finalY, { align: 'right' });
                    finalY += 7;
                    
                    if (includeNetDetails) {
                        doc.setTextColor(150);
                        doc.text(`Tasse / Ritenuta applicata (${taxRate}%):`, 14, finalY);
                        doc.text(`- € ${(totalInvoicedGross * (taxRate / 100)).toFixed(2)}`, 200, finalY, { align: 'right' });
                        doc.setTextColor(100);
                        finalY += 7;
                        
                        doc.setFont('helvetica', 'bold');
                        doc.text(`Fatturato Netto:`, 14, finalY);
                        doc.text(`€ ${totalInvoicedNet.toFixed(2)}`, 200, finalY, { align: 'right' });
                        doc.setFont('helvetica', 'normal');
                        finalY += 10;
                    } else {
                        finalY += 3;
                    }
                    
                    doc.text(`Utile Non Fatturato:`, 14, finalY);
                    doc.text(`€ ${totalNotInvoiced.toFixed(2)}`, 200, finalY, { align: 'right' });
                    finalY += 2;
                    
                    doc.line(14, finalY, 200, finalY); 
                    finalY += 7;
                    
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(0);
                    const totalLabel = includeNetDetails ? 'Totale Netto Complessivo:' : 'Totale Complessivo (Lordo):';
                    doc.text(totalLabel, 14, finalY);
                    doc.text(`€ ${totalOverall.toFixed(2)}`, 200, finalY, { align: 'right' });
                     doc.setTextColor(100);


                    finalY = checkPageBreak(finalY, 20) + 15;
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Riepiloghi Dettagliati', 14, finalY);

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
                                headStyles: { fillColor: [75, 85, 99] }, 
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
                                head: [[title, 'Utile (Lordo)']],
                                body: bodyData,
                                theme: 'grid',
                                headStyles: { fillColor: [22, 163, 74] },
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
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-white/10" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/5 pb-4">Esporta PDF</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">Da</label>
                            <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-100"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">A</label>
                            <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-100"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="sportFilter" className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">Filtra Sport</label>
                        <select
                            id="sportFilter"
                            value={selectedSportId}
                            onChange={(e) => setSelectedSportId(e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-100"
                        >
                            <option value="all">Tutti gli Sport</option>
                            {settings.sports.map(sport => (
                                <option key={sport.id} value={sport.id}>{sport.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="locationFilter" className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">Filtra Sede</label>
                        <select
                            id="locationFilter"
                            value={selectedLocationId}
                            onChange={(e) => setSelectedLocationId(e.target.value)}
                            disabled={loading || availableLocations.length === 0}
                            className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-100 disabled:opacity-50"
                        >
                            <option value="all">Tutte le Sedi</option>
                            {availableLocations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                         <label className="block text-xs font-bold uppercase text-zinc-400 mb-2 ml-1">Tipo Lezioni</label>
                         <div className={`flex bg-black/40 rounded-xl p-1 border border-white/5 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                             {['all', 'invoiced', 'not-invoiced'].map((f) => (
                                 <button 
                                    key={f}
                                    onClick={() => setFilter(f)} 
                                    className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${filter === f ? 'bg-zinc-800 shadow text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                                 >
                                     {f === 'all' ? 'Tutte' : f === 'invoiced' ? 'Fatt.' : 'Non Fatt.'}
                                 </button>
                             ))}
                         </div>
                    </div>
                    
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                         <label className="flex items-center space-x-3 cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={includeNetDetails}
                                onChange={(e) => setIncludeNetDetails(e.target.checked)}
                                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 bg-zinc-800"
                                disabled={loading}
                            />
                            <span className="text-sm font-medium text-zinc-300">Mostra dettagli Netto (Tasse) nel PDF</span>
                         </label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-white/5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 bg-white/5 text-zinc-300 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 text-sm font-semibold"
                    >
                        Chiudi
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={loading}
                        className="px-5 py-2.5 w-[160px] flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-xl hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/20 text-sm font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-wait"
                    >
                        {loading ? (
                            <>
                                <SpinnerIcon className="w-4 h-4" />
                                <span>Attendere...</span>
                            </>
                        ) : (
                            <>
                                <DocumentArrowDownIcon className="w-4 h-4"/>
                                <span>Scarica PDF</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportForm;