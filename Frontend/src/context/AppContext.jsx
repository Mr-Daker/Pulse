import { createContext, useContext, useMemo, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [datasetLoaded, setDatasetLoaded] = useState(false);
  const [datasetProfile, setDatasetProfile] = useState(null);
  const [selectedModel, setSelectedModel] = useState("biased");
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const value = useMemo(
    () => ({
      datasetLoaded,
      setDatasetLoaded,
      datasetProfile,
      setDatasetProfile,
      selectedModel,
      setSelectedModel,
      selectedLanguage,
      setSelectedLanguage,
    }),
    [datasetLoaded, datasetProfile, selectedLanguage, selectedModel]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }

  return context;
}
