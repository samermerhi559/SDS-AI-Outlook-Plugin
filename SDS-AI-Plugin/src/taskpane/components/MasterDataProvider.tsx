import React, { createContext, useContext, useState } from "react";
import { decrypt } from "../../crypto";
import { logoutAndReload } from "../../session";
import { refreshTokenAndPost } from "../../secureFetch";

export interface MasterDataItem {
  groupe: string;
  code: string;
  label: string;
  textValue: string;
  doubleValue: number;
  isDefault: boolean;
}

interface ModuleContext {
  entityid: number;
  moduleid: number;
  edmmoduleentityid: number;
  edmagency: string;
}

interface MasterDataContextType {
  masterData: MasterDataItem[] | null;
  moduleContext: ModuleContext | null;
  loadMasterData: (accessToken: string, financeUrl: string) => Promise<void>;
  loadModuleContext: (accessToken: string, authUrl: string) => Promise<void>;
  clearMasterData: () => void;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export const MasterDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [masterData, setMasterData] = useState<MasterDataItem[] | null>(null);
  const [moduleContext, setModuleContext] = useState<ModuleContext | null>(null);

  const loadMasterData = async (financeUrl: string) => {
    try {
      const headers = {
        "edmagency": localStorage.getItem("edmagency") || "",
        "edmmoduleentityid": localStorage.getItem("edmmoduleentityid") || "",
        "entityid": localStorage.getItem("entityid") || "",
        "moduleid": localStorage.getItem("moduleid") || "",
        "agencycode": localStorage.getItem("agencycode") || "",
      };

      const data = await refreshTokenAndPost(
        `${financeUrl}/Vouchers/ReadMasterDataForOCR`,
        {},
        localStorage.getItem("AuthenticationUrl") || "",
        headers
      );

      if (!data || !Array.isArray(data)) {
        logoutAndReload();
        return;
      }

      setMasterData(data);
      localStorage.setItem("masterData", JSON.stringify(data));
      console.log("✅ Master data loaded and stored:", data.length);
    } catch (error) {
      console.error("❌ Error loading master data:", error);
    }
  };

  const loadModuleContext = async (authUrl: string) => {
    const agencyCode = localStorage.getItem("agencycode") || "";

    try {
      const data = await refreshTokenAndPost(
        `${authUrl}/usermodules/GetUserModulesByModuleNameForAgency/Finance/${agencyCode}`,
        {},
        authUrl
      );

      if (!data || !data.moduleId) {
        logoutAndReload();
        return;
      }

      const contextData: ModuleContext = {
        entityid: data.id,
        moduleid: data.moduleId,
        edmmoduleentityid: data.edmModuleEntity,
        edmagency: data.edmAgencyCode,
      };

      setModuleContext(contextData);

      localStorage.setItem("entityid", String(data.id));
      localStorage.setItem("moduleid", String(data.moduleId));
      localStorage.setItem("edmmoduleentityid", String(data.edmModuleEntity));
      localStorage.setItem("edmagency", data.edmAgencyCode);

      console.log("✅ Module context loaded and stored:", contextData);
    } catch (error) {
      console.error("❌ Error loading module context:", error);
    }
  };

  const clearMasterData = () => {
    setMasterData(null);
    setModuleContext(null);
    localStorage.removeItem("masterData");
    localStorage.removeItem("entityid");
    localStorage.removeItem("moduleid");
    localStorage.removeItem("edmmoduleentityid");
    localStorage.removeItem("edmagency");
    localStorage.removeItem("agencycode");
  };

  return (
    <MasterDataContext.Provider
      value={{
        masterData,
        moduleContext,
        loadMasterData,
        loadModuleContext,
        clearMasterData,
      }}
    >
      {children}
    </MasterDataContext.Provider>
  );
};

export const useMasterData = () => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error("useMasterData must be used within a MasterDataProvider");
  }
  return context;
};
