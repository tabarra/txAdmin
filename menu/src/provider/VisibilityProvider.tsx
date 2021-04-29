import React, { createContext, useContext, useState } from "react";

interface VisibleProviderContext {
  visibility: boolean;
  setVisibility: (visible: boolean) => void;
}

export const VisibleContext = createContext(null);

export const VisibilityProvider: React.FC = ({ children }) => {
  const [visibility, setVisibility] = useState<boolean>(
    process.env.NODE_ENV === "development"
  );

  return (
    <VisibleContext.Provider
      value={{
        visibility,
        setVisibility,
      }}
    >
      {children}
    </VisibleContext.Provider>
  );
};

export const useVisibleContext = () =>
  useContext<VisibleProviderContext>(VisibleContext);
