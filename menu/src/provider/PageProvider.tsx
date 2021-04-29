import React, { createContext, useContext, useState } from "react";

interface PageProviderContext {
  page: number;
  setPage: (tab: number) => void;
}

const PageContext = createContext(null);

export const PageProvider: React.FC = ({ children }) => {
  const [page, setPage] = useState(0);

  const handleSetPage = (newPage: number) => {
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

export const usePageContext = () => useContext<PageProviderContext>(PageContext);
