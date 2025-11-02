import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Lesson, Settings } from './types';
import Header from './components/Header';
import Summary from './components/Summary';
import LessonList from './components/LessonList';
import LessonForm from './components/LessonForm';
import SettingsForm from './components/SettingsForm';
import Login from './components/Login';
import { PlusIcon } from './components/icons';
import { DEFAULT_SETTINGS } from './constants';
import { auth, db, signOut, isConfigured } from './firebase';

const DemoModeBanner: React.FC = () => (
    <div className="bg-yellow-100 dark:bg-yellow-900/50 border-t border-b border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 text-center text-sm" role="alert">
        <p>
          <span className="font-bold">Modalità Demo:</span> I tuoi dati non verranno salvati. Per salvare online, configura le tue credenziali nel file <code className="font-mono bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5 rounded">firebase.ts</code>.
        </p>
    </div>
);


const AppContainer: React.FC = () => {
    return <App isDemoMode={!isConfigured} />;
}

const App: React.FC<{ isDemoMode: boolean }> = ({ isDemoMode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

    // Auth and initial data loading
    useEffect(() => {
        if (isDemoMode) {
            setUser({ email: 'demo@user.com' });
            setSettings(DEFAULT_SETTINGS);
            setLessons([]);
            setLoading(false);
            return;
        }

        const unsubscribe = auth.onAuthStateChanged((user: any) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [isDemoMode]);

    // Firestore data subscription
    useEffect(() => {
        if (isDemoMode) return;

        if (!user) {
            setLessons([]);
            setSettings(DEFAULT_SETTINGS);
            return;
        };

        const settingsRef = db.collection('users').doc(user.uid).collection('settings').doc('main');
        const lessonsRef = db.collection('users').doc(user.uid).collection('lessons');

        const unsubscribeSettings = settingsRef.onSnapshot(doc => {
            if (doc.exists) {
                setSettings(doc.data() as Settings);
            } else {
                settingsRef.set(DEFAULT_SETTINGS);
                setSettings(DEFAULT_SETTINGS);
            }
        });

        const unsubscribeLessons = lessonsRef.onSnapshot(snapshot => {
            const userLessons = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Lesson[];
            setLessons(userLessons);
        });

        return () => {
            unsubscribeSettings();
            unsubscribeLessons();
        };

    }, [user, isDemoMode]);

    const monthlyLessons = useMemo(() => {
        return lessons.filter(lesson => {
            const lessonDate = new Date(lesson.date + 'T00:00:00');
            return lessonDate.getFullYear() === currentDate.getFullYear() &&
                   lessonDate.getMonth() === currentDate.getMonth();
        });
    }, [lessons, currentDate]);

    const summaryData = useMemo(() => {
        if (!settings) return { totalLessons: 0, totalIncome: 0, lessonsBySport: {}, totalInvoicedIncome: 0, totalNotInvoicedIncome: 0, lessonsByLessonType: {}, lessonsByLocation: {} };
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
            const lessonType = sport?.lessonTypes.find(lt => lt.id === lesson.lessonTypeId);
            if (sport && lessonType) {
                 const key = `${sport.name} - ${lessonType.name}`;
                 acc[key] = (acc[key] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        
        const lessonsByLocation = monthlyLessons.reduce((acc, lesson) => {
            const sport = settings.sports.find(s => s.id === lesson.sportId);
            const location = sport?.locations.find(l => l.id === lesson.locationId);
            if (location) {
                 acc[location.name] = (acc[location.name] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        
        const totalInvoicedIncome = monthlyLessons.filter(l => l.invoiced).reduce((sum, lesson) => sum + (lesson.price - lesson.cost), 0);
        const totalNotInvoicedIncome = totalIncome - totalInvoicedIncome;

        return { totalLessons, totalIncome, lessonsBySport, totalInvoicedIncome, totalNotInvoicedIncome, lessonsByLessonType, lessonsByLocation };
    }, [monthlyLessons, settings]);
    
    // Data Handlers (Demo vs Firebase)
    const handleAddLesson = (newLessonData: Omit<Lesson, 'id'>) => {
        if (isDemoMode) {
            const newLesson = { ...newLessonData, id: crypto.randomUUID() };
            setLessons(prev => [...prev, newLesson]);
            return;
        }
        if (!user) return;
        db.collection('users').doc(user.uid).collection('lessons').add(newLessonData);
    };

    const handleUpdateLesson = (updatedLessonData: Lesson) => {
        if (isDemoMode) {
            setLessons(prev => prev.map(l => l.id === updatedLessonData.id ? updatedLessonData : l));
            return;
        }
        if (!user) return;
        const { id, ...data } = updatedLessonData;
        db.collection('users').doc(user.uid).collection('lessons').doc(id).update(data);
    };

    const handleDeleteLesson = (id: string) => {
        if (isDemoMode) {
            setLessons(prev => prev.filter(l => l.id !== id));
            return;
        }
        if (!user) return;
        db.collection('users').doc(user.uid).collection('lessons').doc(id).delete();
    };
    
    const handleToggleInvoiced = (id: string) => {
        if (isDemoMode) {
            setLessons(prev => prev.map(l => l.id === id ? { ...l, invoiced: !l.invoiced } : l));
            return;
        }
        if (!user) return;
         const lesson = lessons.find(l => l.id === id);
        if(lesson) {
            db.collection('users').doc(user.uid).collection('lessons').doc(id).update({ invoiced: !lesson.invoiced });
        }
    };

    const handleSaveSettings = (newSettings: Settings) => {
        if (isDemoMode) {
            setSettings(newSettings);
            return;
        }
        if (!user) return;
        db.collection('users').doc(user.uid).collection('settings').doc('main').set(newSettings);
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
        return <div className="min-h-screen flex items-center justify-center">Caricamento...</div>;
    }

    if (!isDemoMode && !user) {
        return <Login />;
    }

    return (
        <div className="min-h-screen">
            <Header
                currentDate={currentDate}
                onPrevMonth={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() - 1)))}
                onNextMonth={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() + 1)))}
                onOpenSettings={() => setIsSettingsOpen(true)}
                user={user}
                onSignOut={signOut}
                isDemoMode={isDemoMode}
            />
            {isDemoMode && <DemoModeBanner />}
            <main className="max-w-4xl mx-auto pb-24">
                <Summary
                    totalLessons={summaryData.totalLessons}
                    totalIncome={summaryData.totalIncome}
                    lessonsBySport={summaryData.lessonsBySport}
                    lessonsByLessonType={summaryData.lessonsByLessonType}
                    lessonsByLocation={summaryData.lessonsByLocation}
                    totalInvoicedIncome={summaryData.totalInvoicedIncome}
                    totalNotInvoicedIncome={summaryData.totalNotInvoicedIncome}
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
                    className="bg-gradient-to-br from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 text-white rounded-full p-4 shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800 transition-all transform hover:scale-110"
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
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <AppContainer />
    </React.StrictMode>
);