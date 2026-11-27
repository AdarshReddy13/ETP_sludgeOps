import React, { useState } from 'react';
import { ETPProvider, useETP } from './context/ETPContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { NotificationsDrawer } from './components/layout/NotificationsDrawer';
import { DashboardView } from './components/modules/DashboardView';
import { SludgeGenerationView } from './components/modules/SludgeGenerationView';
import { CharacterisationView } from './components/modules/CharacterisationView';
import { DewateringView } from './components/modules/DewateringView';
import { StorageDisposalView } from './components/modules/StorageDisposalView';
import { ComplianceCenterView } from './components/modules/ComplianceCenterView';
import { Plant3DDesignView } from './components/modules/Plant3DDesignView';
import { AddDailyEntryModal } from './components/modules/AddDailyEntryModal';

const AppContent: React.FC = () => {
  const { activePage } = useETP();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardView />;
      case 'generation':
        return <SludgeGenerationView />;
      case 'characterisation':
        return <CharacterisationView />;
      case 'dewatering':
        return <DewateringView />;
      case 'storage':
        return <StorageDisposalView />;
      case 'compliance':
        return <ComplianceCenterView />;
      case 'plant3d':
        return <Plant3DDesignView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <TopBar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <NotificationsDrawer />
      <AddDailyEntryModal />
    </div>
  );
};

export function App() {
  return (
    <ETPProvider>
      <AppContent />
    </ETPProvider>
  );
}

export default App;
