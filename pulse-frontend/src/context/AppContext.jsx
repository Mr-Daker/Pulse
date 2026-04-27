import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [selectedModel, setSelectedModel] = useState('biased');
  const [language, setLanguage] = useState('en');
  const [builderTab, setBuilderTab] = useState('metrics');

  return (
    <AppContext.Provider
      value={{
        selectedModel, setSelectedModel,
        language, setLanguage,
        builderTab, setBuilderTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
