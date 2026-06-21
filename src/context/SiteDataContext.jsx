import { createContext, useContext, useEffect, useState } from "react";
import { defaultData } from "../data/defaultData.js";

const STORAGE_KEY = "masar_site_data_v1";
const SiteDataContext = createContext(null);

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read saved site data, using defaults.", e);
  }
  return defaultData;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function SiteDataProvider({ children }) {
  const [data, setData] = useState(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save site data (storage may be full).", e);
    }
  }, [data]);

  const updateField = (path, value) => {
    setData((prev) => {
      const next = structuredClone(prev);
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return next;
    });
  };

  const updateListItem = (listName, id, field, value) => {
    setData((prev) => ({
      ...prev,
      [listName]: prev[listName].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const addListItem = (listName, template) => {
    setData((prev) => ({ ...prev, [listName]: [...prev[listName], { id: uid(), ...template }] }));
  };

  const removeListItem = (listName, id) => {
    setData((prev) => ({ ...prev, [listName]: prev[listName].filter((item) => item.id !== id) }));
  };

  const resetToDefaults = () => setData(defaultData);

  return (
    <SiteDataContext.Provider value={{ data, updateField, updateListItem, addListItem, removeListItem, resetToDefaults }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error("useSiteData must be used inside SiteDataProvider");
  return ctx;
}
