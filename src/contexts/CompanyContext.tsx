"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Empresa } from '@/types/empresas';
import { Modulo } from '@/types/modulos';

interface CompanyContextType {
  selectedCompany: Empresa | null;
  setSelectedCompany: (company: Empresa | null) => void;
  selectedModule: Modulo | null;
  setSelectedModule: (module: Modulo | null) => void;
  hasCompletedCompanySelection: boolean;
  setHasCompletedCompanySelection: (completed: boolean) => void;
  hasCompletedModuleSelection: boolean;
  setHasCompletedModuleSelection: (completed: boolean) => void;
  resetFlow: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompanyState] = useState<Empresa | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasCompletedCompanySelection, setHasCompletedCompanySelection] = useState(false);
  const [hasCompletedModuleSelection, setHasCompletedModuleSelection] = useState(false);
  const [selectedModule, setSelectedModuleState] = useState<Modulo | null>(null);

  // Save selected company to localStorage when it changes
  const setSelectedCompany = (company: Empresa | null) => {
    if (company && company.idEmpresa) {
      // Solo marcar como completado si efectivamente se seleccionó una empresa válida
      localStorage.setItem('selectedCompany', JSON.stringify(company));
      setHasCompletedCompanySelection(true);
    } else {
      setHasCompletedCompanySelection(false);
    }
    setSelectedCompanyState(company);
  };

  // Load selected company from localStorage on initial load
  useEffect(() => {
    const savedCompany = localStorage.getItem('selectedCompany');
    if (savedCompany) {
      try {
        const companyParsed = JSON.parse(savedCompany);
        if (companyParsed && companyParsed.idEmpresa) {
          setSelectedCompanyState(companyParsed);
          setHasCompletedCompanySelection(true);
        }
      } catch (error) {
        console.error('Error parsing saved company:', error);
        localStorage.removeItem('selectedCompany');
      }
    }
  }, []);

  // Load both company and module from localStorage on initial load
  useEffect(() => {
    const savedCompany = localStorage.getItem('selectedCompany');
    const savedModule = localStorage.getItem('selectedModule');

    // Load company
    if (savedCompany) {
      try {
        const companyParsed = JSON.parse(savedCompany);
        if (companyParsed && companyParsed.idEmpresa) {
          setSelectedCompanyState(companyParsed);
          setHasCompletedCompanySelection(true);
        }
      } catch (error) {
        console.error('Error parsing saved company:', error);
        localStorage.removeItem('selectedCompany');
      }
    }

    // Load module
    if (savedModule) {
      try {
        const moduleParsed = JSON.parse(savedModule);
        if (moduleParsed && moduleParsed.modulos_id) {
          setSelectedModuleState(moduleParsed);
          setHasCompletedModuleSelection(true);
        }
      } catch (error) {
        console.error('Error parsing saved module:', error);
        localStorage.removeItem('selectedModule');
      }
    }

    // Mark as initialized after a short delay to ensure both loads complete
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 50); // Reducido de 100ms a 50ms para mejor responsividad

    return () => clearTimeout(timer);
  }, []);

  // Save selected module to localStorage when it changes
  const setSelectedModule = (module: Modulo | null) => {
    if (module && module.modulos_id) {
      localStorage.setItem('selectedModule', JSON.stringify(module));
      setHasCompletedModuleSelection(true);
    }
    setSelectedModuleState(module);
  };

  const resetFlow = () => {
    setSelectedCompanyState(null);
    setSelectedModuleState(null);
    setHasCompletedCompanySelection(false);
    setHasCompletedModuleSelection(false);
    localStorage.removeItem('selectedCompany');
    localStorage.removeItem('selectedModule');
  };

  if(!isInitialized){
    return (
      <CompanyContext.Provider value={{
        selectedCompany: null,
        setSelectedCompany: () => {},
        selectedModule: null,
        setSelectedModule: () => {},
        hasCompletedCompanySelection: false,
        setHasCompletedCompanySelection: () => {},
        hasCompletedModuleSelection: false,
        setHasCompletedModuleSelection: () => {},
        resetFlow: () => {}
      }}>
        {children}
      </CompanyContext.Provider>
    );
  }

  return (
    <CompanyContext.Provider value={{
      selectedCompany,
      setSelectedCompany,
      selectedModule,
      setSelectedModule,
      hasCompletedCompanySelection,
      setHasCompletedCompanySelection,
      hasCompletedModuleSelection,
      setHasCompletedModuleSelection,
      resetFlow
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
