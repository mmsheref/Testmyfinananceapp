
import React, { useState, useEffect } from 'react';
import { DailyRecord, CustomExpenseStructure, BackupData } from './types';
import Dashboard from './components/Dashboard';
import RecordList from './components/RecordList';
import RecordForm from './components/RecordForm';
import RecordDetail from './components/RecordDetail';
import { PlusIcon, HomeIcon, ListIcon, BackIcon, SettingsIcon } from './components/Icons';
import { DEFAULT_EXPENSE_STRUCTURE } from './constants';
import Modal from './components/Modal';
import BackupRestore from './components/BackupRestore';


type View = 'dashboard' | 'records' | 'form' | 'detail';

const App: React.FC = () => {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [customStructure, setCustomStructure] = useState<CustomExpenseStructure>({});
  const [view, setView] = useState<View>('dashboard');
  const [currentRecord, setCurrentRecord] = useState<DailyRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      const storedRecords = localStorage.getItem('ayshas-records');
      if (storedRecords) {
        setRecords(JSON.parse(storedRecords));
      }
      
      const storedStructure = localStorage.getItem('ayshas-custom-structure');
      if (storedStructure) {
        setCustomStructure(JSON.parse(storedStructure));
      } else {
        const initialStructure: CustomExpenseStructure = {};
        DEFAULT_EXPENSE_STRUCTURE.forEach(cat => {
            initialStructure[cat.name] = cat.items.map(item => item.name);
        });
        setCustomStructure(initialStructure);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ayshas-records', JSON.stringify(records));
    } catch (error) {
      console.error("Failed to save records to localStorage", error);
    }
  }, [records]);

  useEffect(() => {
    try {
        localStorage.setItem('ayshas-custom-structure', JSON.stringify(customStructure));
    } catch (error) {
        console.error("Failed to save custom structure to localStorage", error);
    }
  }, [customStructure]);

  const sortedRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const navigate = (newView: View, record: DailyRecord | null = null) => {
    setCurrentRecord(record);
    setView(newView);
    window.scrollTo(0, 0); // Scroll to top on view change
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setRecords(records.filter(r => r.id !== id));
      navigate('records');
    }
  };

  const handleSave = (record: DailyRecord) => {
    const exists = records.some(r => r.id === record.id);
    if (exists) {
      setRecords(records.map(r => (r.id === record.id ? record : r)));
    } else {
      setRecords([...records, record]);
    }
    navigate('detail', record);
  };
  
  const handleSaveCustomItem = (categoryName: string, itemName: string) => {
    setCustomStructure(prev => {
        const newStructure = { ...prev };
        if (newStructure[categoryName] && !newStructure[categoryName].includes(itemName)) {
            newStructure[categoryName] = [...newStructure[categoryName], itemName];
        }
        return newStructure;
    });
  };
  
  const handleRestore = (data: BackupData) => {
    setRecords(data.records);
    setCustomStructure(data.customStructure);
    alert(`Successfully restored ${data.records.length} records.`);
    setIsSettingsOpen(false);
    navigate('dashboard');
  };

  const renderView = () => {
    switch (view) {
      case 'form':
        return <RecordForm 
                  record={currentRecord} 
                  onSave={handleSave} 
                  onCancel={() => navigate(currentRecord ? 'detail' : 'dashboard', currentRecord)} 
                  allRecords={sortedRecords} 
                  customStructure={customStructure}
                  onSaveCustomItem={handleSaveCustomItem}
                />;
      case 'detail':
        return currentRecord && <RecordDetail record={currentRecord} onDelete={handleDelete} onEdit={(r) => navigate('form', r)} />;
      case 'records':
        return <RecordList records={sortedRecords} onView={(r) => navigate('detail', r)} />;
      case 'dashboard':
      default:
        return <Dashboard records={sortedRecords} onViewRecord={(r) => navigate('detail', r)} />;
    }
  };

  const getHeaderText = () => {
    switch (view) {
      case 'dashboard': return 'Dashboard';
      case 'records': return 'All Records';
      case 'form': return currentRecord ? 'Edit Record' : 'New Record';
      case 'detail': return 'Record Details';
      default: return "Aysha's P&L";
    }
  };

  const showBackButton = ['form', 'detail'].includes(view);
  const handleBack = () => {
    if (view === 'detail') navigate('records');
    else if (view === 'form' && currentRecord) navigate('detail', currentRecord);
    else navigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center">
            {showBackButton ? (
              <button onClick={handleBack} className="p-2 -ml-2 mr-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Go back">
                <BackIcon className="w-6 h-6" />
              </button>
            ) : <div className="w-10"></div>}
          </div>
          <h1 className="text-xl font-bold tracking-tight absolute left-1/2 -translate-x-1/2">
            {getHeaderText()}
          </h1>
          <div className="flex items-center">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Settings">
                <SettingsIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto p-4 flex-grow pb-28">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-transparent z-30 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pointer-events-auto">
          <div className="flex justify-around items-center h-full">
            <button onClick={() => navigate('dashboard')} className={`flex flex-col items-center justify-center w-full transition-colors ${view === 'dashboard' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`} aria-label="Dashboard">
              <HomeIcon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Dashboard</span>
            </button>
            <div className="w-20"></div> {/* Spacer for FAB */}
            <button onClick={() => navigate('records')} className={`flex flex-col items-center justify-center w-full transition-colors ${view === 'records' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`} aria-label="Records">
              <ListIcon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Records</span>
            </button>
          </div>
        </div>
        {view !== 'form' && (
            <button
              onClick={() => navigate('form')}
              className="absolute left-1/2 -translate-x-1/2 top-0 w-16 h-16 bg-secondary hover:bg-primary text-white rounded-full p-4 shadow-lg transition-transform duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary pointer-events-auto"
              aria-label="Add New Record"
            >
              <PlusIcon className="h-8 w-8" />
            </button>
        )}
      </div>

      {isSettingsOpen && (
        <Modal onClose={() => setIsSettingsOpen(false)}>
            <div className="p-2">
                <h3 className="text-xl font-bold mb-4 text-slate-800">Settings</h3>
                <p className="text-slate-600 mb-4">Export all your data for backup, or import a previous backup file.</p>
                <BackupRestore 
                    onRestore={handleRestore} 
                    allRecords={records} 
                    customStructure={customStructure} 
                />
            </div>
        </Modal>
      )}
    </div>
  );
};

export default App;
