import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMachines } from '../api/machines';

const MachineContext = createContext();

export const useMachine = () => useContext(MachineContext);

export const MachineProvider = ({ children }) => {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('EXC001');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const data = await getMachines();
        setMachines(data);
      } catch (error) {
        console.error("Failed to fetch machines", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, []);

  return (
    <MachineContext.Provider value={{ machines, selectedMachine, setSelectedMachine, loading }}>
      {children}
    </MachineContext.Provider>
  );
};
