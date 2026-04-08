import React, { createContext, useContext, useState } from 'react';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation debe usarse dentro de un NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  const value = {
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isUploadPanelOpen,
    setIsUploadPanelOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    isTypeModalOpen,
    setIsTypeModalOpen,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
