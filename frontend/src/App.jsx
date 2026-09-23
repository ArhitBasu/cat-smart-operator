import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MachineProvider } from './context/MachineContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import MachineIntelligence from './pages/MachineIntelligence';
import Safety from './pages/Safety';
import Analytics from './pages/Analytics';
import Anomalies from './pages/Anomalies';
import TaskPrediction from './pages/TaskPrediction';
import Incidents from './pages/Incidents';
import Training from './pages/Training';
import Assistant from './pages/Assistant';

function App() {
  return (
    <MachineProvider>
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden bg-[#F4F5F7] font-sans text-gray-900">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <Navbar />
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 relative z-0">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/machine-intelligence" element={<MachineIntelligence />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/anomalies" element={<Anomalies />} />
                <Route path="/task-prediction" element={<TaskPrediction />} />
                <Route path="/incidents" element={<Incidents />} />
                <Route path="/training" element={<Training />} />
                <Route path="/assistant" element={<Assistant />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </MachineProvider>
  );
}

export default App;
