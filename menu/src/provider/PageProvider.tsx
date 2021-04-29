import React, { createContext, useContext, useState } from "react";

interface PageProviderContext {
  page: number;
  setPage: (page: txAdminMenuPage) => void;
}

export enum txAdminMenuPage {
  Main,
  Players,
  txAdmin,
}

const PageContext = createContext(null);

export const PageProvider: React.FC = ({ children }) => {
  const [page, setPage] = useState<txAdminMenuPage>(0);

  const handleSetPage = (newPage: txAdminMenuPage) => {
    setPage(newPage);
  };

  return (
    <PageContext.Provider
      value={{
        page,
        setPage: handleSetPage,
      }}
    >
      {children}
    </PageContext.Provider>
  );
};

export const usePageContext = () =>
  useContext<PageProviderContext>(PageContext);
