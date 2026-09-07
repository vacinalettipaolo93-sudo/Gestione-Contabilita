import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';

import { Lesson, Settings, SportSetting, Expense, ExpenseCategory } from './types';
import Header from './components/Header';
import Summary from './components/Summary';
import LessonList from './components/LessonList';
import LessonForm from './components/LessonForm';
import SettingsForm from './components/SettingsForm';
import ExportForm from './components/ExportForm';
import ExpensesModal from './components/ExpensesModal';
import Login from './components/Login';
import { PlusIcon } from './components/icons';
import { DEFAULT_SETTINGS } from './constants';
import { auth, db, signOut } from './firebase';
import { getLessonTypeDisplayName } from './lessonUtils';
import { sanitizePaitoneCompensationSettings } from './paitoneCompensation';

const App: React.FC = () => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportFormOpen, setIsExportFormOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);

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
      setExpenseCategories([]);
      setExpenses([]);
      return;
    }

    const settingsRef = doc(db, 'users', user.uid, 'settings', 'main');
    const lessonsCollectionRef = collection(db, 'users', user.uid, 'lessons');
    const expenseCategoriesRef = collection(db, 'users', user.uid, 'expense_categories');
    const expensesRef = collection(db, 'users', user.uid, 'expenses');

    const unsubscribeSettings = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const loadedData = docSnap.data();
          const sportsSource = Array.isArray(loadedData?.sports) ? loadedData.sports : DEFAULT_SETTINGS.sports;

          const newSettings: Settings = {
            ...DEFAULT_SETTINGS,
            ...loadedData,
            taxRate: typeof loadedData?.taxRate === 'number' ? loadedData.taxRate : 0,
            paitoneCompensation: sanitizePaitoneCompensationSettings(loadedData?.paitoneCompensation),
            sports: sportsSource
              .filter((sport: unknown): sport is Partial<SportSetting> => sport && typeof sport === 'object')
              .map((sport: Partial<SportSetting>): SportSetting => ({
                id: sport.id || `sport-${Date.now()}`,
                name: sport.name || 'Senza nome',
                lessonTypes: Array.isArray(sport.lessonTypes) ? sport.lessonTypes : [],
                locations: Array.isArray(sport.locations) ? sport.locations : [],
                prices: (() => {
                  const lessonTypes = Array.isArray(sport.lessonTypes) ? sport.lessonTypes : [];
                  const locations = Array.isArray(sport.locations) ? sport.locations : [];
                  const rawPrices = typeof sport.prices === 'object' && sport.prices !== null ? (sport.prices as any) : {};

                  return locations.reduce((pricesByLocation, location) => {
                    pricesByLocation[location.id] = lessonTypes.reduce((acc, lessonType) => {
                      const nestedPrice = rawPrices?.[location.id]?.[lessonType.id];
                      const legacyPrice = rawPrices?.[lessonType.id];
                      const resolvedPrice =
                        typeof nestedPrice === 'number'
                          ? nestedPrice
                          : typeof legacyPrice === 'number'
                            ? legacyPrice
                            : 0;
                      acc[lessonType.id] = resolvedPrice;
                      return acc;
                    }, {} as Record<string, number>);
                    return pricesByLocation;
                  }, {} as Record<string, Record<string, number>>);
                })(),
                costs: typeof sport.costs === 'object' && sport.costs !== null ? (sport.costs as any) : {},
              })),
          };

          setSettings(newSettings);
        } else {
          // IMPORTANT: non riscrivere DEFAULT su Firestore automaticamente
          console.warn(
            '[Firestore] Documento settings/main non trovato. Mostro DEFAULT_SETTINGS in UI, ma NON scrivo su Firestore.'
          );
          setSettings(DEFAULT_SETTINGS);
        }
      },
      (error) => {
        console.error('[Firestore] Errore listener settings/main:', error);
        setSettings(DEFAULT_SETTINGS);
      }
    );

    const unsubscribeLessons = onSnapshot(
      lessonsCollectionRef,
      (snapshot) => {
        const userLessons = snapshot.docs.map((docItem) => {
          const data = docItem.data();
          return {
            id: docItem.id,
            date: data.date || '',
            sportId: data.sportId || '',
            lessonTypeId: data.lessonTypeId || '',
            locationId: data.locationId || '',
            price: data.price || 0,
            cost: data.cost || 0,
            invoiced: data.invoiced || false,

            // custom (incasso al volo)
            customLessonTypeName: data.customLessonTypeName || '',
            customPrice: typeof data.customPrice === 'number' ? data.customPrice : Number(data.customPrice || 0),
          } as Lesson;
        });
        setLessons(userLessons);
      },
      (error) => {
        console.error('[Firestore] Errore listener lessons:', error);
        setLessons([]);
      }
    );

    const unsubscribeExpenseCategories = onSnapshot(
      query(expenseCategoriesRef, orderBy('name', 'asc')),
      (snapshot) => {
        const cats = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || 'Senza nome',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as ExpenseCategory;
        });
        setExpenseCategories(cats);
      },
      (error) => {
        console.error('[Firestore] Errore listener expense_categories:', error);
        setExpenseCategories([]);
      }
    );

    const unsubscribeExpenses = onSnapshot(
      query(expensesRef, orderBy('date', 'desc')),
      (snapshot) => {
        const exps = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            date: data.date || '',
            categoryId: data.categoryId || '',
            name: data.name || '',
            amount: typeof data.amount === 'number' ? data.amount : Number(data.amount || 0),
            notes: data.notes || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Expense;
        });
        setExpenses(exps);
      },
      (error) => {
        console.error('[Firestore] Errore listener expenses:', error);
        setExpenses([]);
      }
    );

    return () => {
      unsubscribeSettings();
      unsubscribeLessons();
      unsubscribeExpenseCategories();
      unsubscribeExpenses();
    };
  }, [user]);

  const monthlyLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const lessonDate = new Date(lesson.date + 'T00:00:00');
      return lessonDate.getFullYear() === currentDate.getFullYear() && lessonDate.getMonth() === currentDate.getMonth();
    });
  }, [lessons, currentDate]);

  const monthlyExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const dt = new Date(e.date + 'T00:00:00');
      return dt.getFullYear() === currentDate.getFullYear() && dt.getMonth() === currentDate.getMonth();
    });
  }, [expenses, currentDate]);

  const totalExpensesMonth = useMemo(() => {
    return monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [monthlyExpenses]);

  const summaryData = useMemo(() => {
    if (!settings)
      return {
        totalLessons: 0,
        totalIncome: 0,
        lessonsBySport: {},
        totalInvoicedGross: 0,
        totalInvoicedNet: 0,
        totalNotInvoicedIncome: 0,
        lessonsByLessonType: {},
        lessonsByLocation: {},
        taxRate: 0,
      };

    const totalLessons = monthlyLessons.length;
    const totalIncome = monthlyLessons.reduce((sum, lesson) => sum + (lesson.price - lesson.cost), 0);

    const lessonsBySport = monthlyLessons.reduce((acc, lesson) => {
      const sport = settings.sports.find((s) => s.id === lesson.sportId);
      if (sport) acc[sport.name] = (acc[sport.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const lessonsByLessonType = monthlyLessons.reduce((acc, lesson) => {
      const sport = settings.sports.find((s) => s.id === lesson.sportId);
      if (!sport) return acc;

      const lessonTypeName = getLessonTypeDisplayName(lesson, sport, 'Personalizzato');
      const key = `${sport.name} - ${lessonTypeName}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const lessonsByLocation = monthlyLessons.reduce((acc, lesson) => {
      const sport = settings.sports.find((s) => s.id === lesson.sportId);
      if (!sport) return acc;
      const location = sport.locations.find((l) => l.id === lesson.locationId);
      if (location) acc[location.name] = (acc[location.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalInvoicedGross = monthlyLessons
      .filter((l) => l.invoiced)
      .reduce((sum, lesson) => sum + (lesson.price - lesson.cost), 0);

    const taxRate = settings.taxRate || 0;
    const totalInvoicedNet = totalInvoicedGross * (1 - taxRate / 100);

    const totalNotInvoicedIncome = totalIncome - totalInvoicedGross;

    return {
      totalLessons,
      totalIncome,
      lessonsBySport,
      totalInvoicedGross,
      totalInvoicedNet,
      totalNotInvoicedIncome,
      lessonsByLessonType,
      lessonsByLocation,
      taxRate,
    };
  }, [monthlyLessons, settings]);

  // ✅ NETTO RICHIESTO:
  // (Fatturato Netto + Utile non fatturato) - Spese
  const netProfitMonth = useMemo(() => {
    return summaryData.totalInvoicedNet + summaryData.totalNotInvoicedIncome - totalExpensesMonth;
  }, [summaryData.totalInvoicedNet, summaryData.totalNotInvoicedIncome, totalExpensesMonth]);

  const handleAddLesson = (newLessonData: Omit<Lesson, 'id'>) => {
    if (!user) return;
    const lessonsCollectionRef = collection(db, 'users', user.uid, 'lessons');
    addDoc(lessonsCollectionRef, newLessonData);
  };

  const handleUpdateLesson = (updatedLessonData: Lesson) => {
    if (!user) return;
    const { id, ...data } = updatedLessonData;
    const lessonDocRef = doc(db, 'users', user.uid, 'lessons', id);
    updateDoc(lessonDocRef, data as any);
  };

  const handleDeleteLesson = (id: string) => {
    if (!user) return;
    const lessonDocRef = doc(db, 'users', user.uid, 'lessons', id);
    deleteDoc(lessonDocRef);
  };

  const handleToggleInvoiced = (id: string) => {
    if (!user) return;
    const lesson = lessons.find((l) => l.id === id);
    if (lesson) {
      const lessonDocRef = doc(db, 'users', user.uid, 'lessons', id);
      updateDoc(lessonDocRef, { invoiced: !lesson.invoiced });
    }
  };

  // ✅ Salva con BACKUP automatico
  const handleSaveSettings = async (newSettings: Settings) => {
    if (!user) return;

    const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'main');
    const backupsColRef = collection(db, 'users', user.uid, 'settings_backups');

    try {
      // 1) Backup PRIMA del salvataggio
      await addDoc(backupsColRef, {
        createdAt: serverTimestamp(),
        reason: 'manual_save',
        version: 1,
        settings: newSettings,
      });

      // 2) Salvataggio ufficiale
      await setDoc(settingsDocRef, newSettings);

      console.log('[Firestore] Settings salvate + backup creato.');
    } catch (e) {
      console.error('[Firestore] Errore salvataggio settings/backup:', e);
      alert('Errore durante il salvataggio su Firebase. Controlla la console.');
    }
  };

  // ✅ Ripristina l'ULTIMO backup (1 click)
  const handleRestoreLatestSettingsBackup = async () => {
    if (!user) return;

    const backupsColRef = collection(db, 'users', user.uid, 'settings_backups');
    const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'main');

    const confirm = window.confirm(
      "Vuoi ripristinare l'ULTIMO backup delle impostazioni? Questa operazione sovrascrive le impostazioni attuali."
    );
    if (!confirm) return;

    try {
      const q = query(backupsColRef, orderBy('createdAt', 'desc'), limit(1));
      const snap = await getDocs(q);

      if (snap.empty) {
        alert('Nessun backup trovato.');
        return;
      }

      const latest = snap.docs[0].data() as any;
      const backupSettings = latest?.settings;

      if (!backupSettings) {
        alert('Backup trovato ma senza campo "settings".');
        return;
      }

      // (Opzionale) prima di ripristinare, faccio un backup dello stato corrente
      await addDoc(backupsColRef, {
        createdAt: serverTimestamp(),
        reason: 'before_restore_latest',
        version: 1,
        settings,
      });

      await setDoc(settingsDocRef, backupSettings);

      alert('Ripristino completato: ho caricato l’ultimo backup su settings/main.');
    } catch (e) {
      console.error('[Firestore] Errore ripristino backup:', e);
      alert('Errore durante il ripristino. Controlla la console.');
    }
  };

  // Spese: categorie
  const handleAddExpenseCategory = async (name: string) => {
    if (!user) return;
    const colRef = collection(db, 'users', user.uid, 'expense_categories');
    await addDoc(colRef, { name, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  };

  const handleRenameExpenseCategory = async (categoryId: string, newName: string) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'expense_categories', categoryId);
    await updateDoc(ref, { name: newName, updatedAt: serverTimestamp() });
  };

  const handleDeleteExpenseCategory = async (categoryId: string) => {
    if (!user) return;
    const used = expenses.some((e) => e.categoryId === categoryId);
    if (used) {
      alert('Non puoi eliminare una categoria che è usata da una o più spese.');
      return;
    }
    const ref = doc(db, 'users', user.uid, 'expense_categories', categoryId);
    await deleteDoc(ref);
  };

  // Spese: CRUD
  const handleAddExpense = async (data: Omit<Expense, 'id'>) => {
    if (!user) return;
    const colRef = collection(db, 'users', user.uid, 'expenses');
    await addDoc(colRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  };

  const handleUpdateExpense = async (data: Expense) => {
    if (!user) return;
    const { id, ...rest } = data;
    const ref = doc(db, 'users', user.uid, 'expenses', id);
    await updateDoc(ref, { ...rest, updatedAt: serverTimestamp() });
  };

  const handleDeleteExpense = async (id: string) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'expenses', id);
    await deleteDoc(ref);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-indigo-500 font-bold animate-pulse">
        Caricamento...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen">
      <Header
        currentDate={currentDate}
        onPrevMonth={() => setCurrentDate((d) => new Date(d.setMonth(d.getMonth() - 1)))}
        onNextMonth={() => setCurrentDate((d) => new Date(d.setMonth(d.getMonth() + 1)))}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportFormOpen(true)}
        onOpenExpenses={() => setIsExpensesOpen(true)}
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
          totalExpenses={totalExpensesMonth}
          netProfit={netProfitMonth}
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
          className="bg-gradient-to-br from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white rounded-full p-4 shadow-xl shadow-indigo-500/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all"
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
        onRestoreLatestBackup={handleRestoreLatestSettingsBackup}
      />

      <ExpensesModal
        isOpen={isExpensesOpen}
        onClose={() => setIsExpensesOpen(false)}
        currentDate={currentDate}
        categories={expenseCategories}
        expenses={expenses}
        onAddCategory={handleAddExpenseCategory}
        onRenameCategory={handleRenameExpenseCategory}
        onDeleteCategory={handleDeleteExpenseCategory}
        onAddExpense={handleAddExpense}
        onUpdateExpense={handleUpdateExpense}
        onDeleteExpense={handleDeleteExpense}
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
