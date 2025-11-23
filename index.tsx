import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Lesson, Settings, SportSetting } from './types';
import Header from './components/Header';
import Summary from './components/Summary';
import LessonList from './components/LessonList';
import LessonForm from './components/LessonForm';
import SettingsForm from './components/SettingsForm';
import ExportForm from './components/ExportForm';
import Login from './components/Login';
import { PlusIcon } from './components/icons';
import { DEFAULT_SETTINGS } from './constants';
import { auth, db, signOut } from './firebase';

const App: React.FC = () => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isExportFormOpen, setIsExportFormOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

    // Auth and initial data loading
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user: any) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Firestore data subscription
    useEffect(() => {
        if (!user) {
            setLessons([]);
            setSettings(DEFAULT_SETTINGS);
            return;
        };

        const settingsRef = doc(db, 'users', user.uid, 'settings', 'main');
        const lessonsCollectionRef = collection(db, 'users', user.uid, 'lessons');

        const unsubscribeSettings = onSnapshot(settingsRef, docSnap => {
            if (docSnap.exists()) {
                const loadedData = docSnap.data();
                const sportsSource = Array.isArray(loadedData?.sports) ? loadedData.sports : DEFAULT_SETTINGS.sports;
                
                // Deeply merge and sanitize settings to prevent crashes from malformed data.
                const newSettings: Settings = {
                    ...DEFAULT_SETTINGS,
                    ...loadedData,
                    taxRate: typeof loadedData?.taxRate === 'number' ? loadedData.taxRate : 0,
                    sports: sportsSource
                        .filter((sport: unknown): sport is Partial<SportSetting> => sport && typeof sport === 'object') // Filter out null/invalid entries
                        .map((sport: Partial<SportSetting>): SportSetting => ({
                            id: sport.id || `sport-${Date.now()}`,
                            name: sport.name || 'Senza nome',
                            lessonTypes: Array.isArray(sport.lessonTypes) ? sport.lessonTypes : [],
                            locations: Array.isArray(sport.locations) ? sport.locations : [],
                            prices: typeof sport.prices === 'object' && sport.prices !== null ? sport.prices : {},
                            costs: typeof sport.costs === 'object' && sport.costs !== null ? sport.costs : {},
                        })),
                };
                setSettings(newSettings);
            } else {
                setDoc(settingsRef, DEFAULT_SETTINGS);
                setSettings(DEFAULT_SETTINGS);
            }
        });

        const unsubscribeLessons = onSnapshot(lessonsCollectionRef, snapshot => {
            const userLessons = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    date: data.date || '',
                    sportId: data.sportId || '',
                    lessonTypeId: data.lessonTypeId || '',
                    locationId: data.locationId || '',
                    price: data.price || 0,
                    cost: data.cost || 0,
                    invoiced: data.invoiced || false,
                } as Lesson;
            });
            setLessons(userLessons);
        });

        return () => {
            unsubscribeSettings();
            unsubscribeLessons();
        };

    }, [user]);

    const monthlyLessons = useMemo(() => {
        return lessons.filter(lesson => {
            const lessonDate = new Date(lesson.date + 'T00:00:00');
            return lessonDate.getFullYear() === currentDate.getFullYear() &&
                   lessonDate.getMonth() === currentDate.getMonth();
        });
    }, [lessons, currentDate]);

    const summaryData = useMemo(() => {
        if (!settings) return { totalLessons: 0, totalIncome: 0, lessonsBySport: {}, totalInvoicedGross: 0, totalInvoicedNet: 0, totalNotInvoicedIncome: 0, lessonsByLessonType: {}, lessonsByLocation: {}, taxRate: 0 };
        const totalLessons = monthlyLessons.length;
        const totalIncome = monthlyLessons.reduce((sum, lesson) => sum + (lesson.price - lesson.cost), 0);
        
        const lessonsBySport = monthlyLessons.reduce((acc, lesson) => {
            const sport = settings.sports.find(s => s.id === lesson.sportId);
            if (sport) {
                 acc[sport.name] = (acc[sport.name] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        
        const lessonsByLessonType = monthlyLessons.reduce((acc, lesson) => {
            const sport = settings.sports.find(s => s.id === lesson.sportId);
            if (!sport) return acc;
            const lessonType = sport.lessonTypes.find(lt => lt.id === lesson.lessonTypeId);
            if (lessonType) {
                 const key = `${sport.name} - ${lessonType.name}`;
                 acc[key] = (acc[key] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        
        const lessonsByLocation = monthlyLessons.reduce((acc, lesson) => {
            const sport = settings.sports.find(s => s.id === lesson.sportId);
            if (!sport) return acc;
            const location = sport.locations.find(l => l.id === lesson.locationId);
            if (location) {
                 acc[location.name] = (acc[location.name] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        
        const totalInvoicedGross = monthlyLessons.filter(l => l.invoiced).reduce((sum, lesson) => sum + (lesson.price - lesson.cost), 0);
        
        const taxRate = settings.taxRate || 0;
        const totalInvoicedNet = totalInvoicedGross * (1 - (taxRate / 100));

        const totalNotInvoicedIncome = totalIncome - totalInvoicedGross;

        return { totalLessons, totalIncome, lessonsBySport, totalInvoicedGross, totalInvoicedNet, totalNotInvoicedIncome, lessonsByLessonType, lessonsByLocation, taxRate };
    }, [monthlyLessons, settings]);
    
    const handleAddLesson = (newLessonData: Omit<Lesson, 'id'>) => {
        if (!user) return;
        const lessonsCollectionRef = collection(db, 'users', user.uid, 'lessons');
        addDoc(lessonsCollectionRef, newLessonData);
    };

    const handleUpdateLesson = (updatedLessonData: Lesson) => {
        if (!user) return;
        const { id, ...data } = updatedLessonData;
        const lessonDocRef = doc(db, 'users', user.uid, 'lessons', id);
        updateDoc(lessonDocRef, data);
    };

    const handleDeleteLesson = (id: string) => {
        if (!user) return;
        const lessonDocRef = doc(db, 'users', user.uid, 'lessons', id);
        deleteDoc(lessonDocRef);
    };
    
    const handleToggleInvoiced = (id: string) => {
        if (!user) return;
        const lesson = lessons.find(l => l.id === id);
        if(lesson) {
            const lessonDocRef = doc(db, 'users', user.uid, 'lessons', id);
            updateDoc(lessonDocRef, { invoiced: !lesson.invoiced });
        }
    };

    const handleSaveSettings = (newSettings: Settings) => {
        if (!user) return;
        const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'main');
        setDoc(settingsDocRef, newSettings);
    };

    const handleStartEdit = (lesson: Lesson) => {
        setEditingLesson(lesson);
        setIsFormOpen(true);
    };

    const handleOpenFormForAdd = () => {
        setEditingLesson(null);
        setIsFormOpen(true);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-indigo-500 font-bold animate-pulse">Caricamento...</div>;
    }

    if (!user) {
        return <Login />;
    }

    return (
        <div className="min-h-screen">
            <Header
                currentDate={currentDate}
                onPrevMonth={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() - 1)))}
                onNextMonth={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() + 1)))}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenExport={() => setIsExportFormOpen(true)}
                user={user}
                onSignOut={signOut}
            />
            <main className="max-w-5xl mx-auto pb-24">
                <Summary
                    totalLessons={summaryData.totalLessons}
                    lessonsBySport={summaryData.lessonsBySport}
                    lessonsByLessonType={summaryData.lessonsByLessonType}
                    lessonsByLocation={summaryData.lessonsByLocation}
                    totalInvoicedGross={summaryData.totalInvoicedGross}
                    totalInvoicedNet={summaryData.totalInvoicedNet}
                    totalNotInvoicedIncome={summaryData.totalNotInvoicedIncome}
                    taxRate={summaryData.taxRate}
                />
                <LessonList
                    lessons={monthlyLessons}
                    settings={settings}
                    onDelete={handleDeleteLesson}
                    onToggleInvoiced={handleToggleInvoiced}
                    onEdit={handleStartEdit}
                />
            </main>
            <div className="fixed bottom-6 right-6 z-20">
                 <button
                    onClick={handleOpenFormForAdd}
                    className="bg-gradient-to-br from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white rounded-full p-4 shadow-xl shadow-indigo-500/30 focus:outline-none transition-all transform hover:scale-110 active:scale-95"
                    aria-label="Aggiungi nuova lezione"
                >
                    <PlusIcon className="w-8 h-8" />
                </button>
            </div>
            <LessonForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onAddLesson={handleAddLesson}
                onUpdateLesson={handleUpdateLesson}
                lessonToEdit={editingLesson}
                settings={settings}
            />
            <SettingsForm
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                lessons={lessons}
                onSave={handleSaveSettings}
            />
            <ExportForm
                isOpen={isExportFormOpen}
                onClose={() => setIsExportFormOpen(false)}
                lessons={lessons}
                settings={settings}
                currentDate={currentDate}
            />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);