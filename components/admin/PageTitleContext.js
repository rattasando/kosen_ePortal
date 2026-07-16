"use client";

import { createContext, useContext, useState } from "react";

const PageTitleContext = createContext({ title: "", description: "", setPage: () => {} });

export function PageTitleProvider({ children }) {
  const [page, setPage] = useState({ title: "", description: "" });
  return (
    <PageTitleContext.Provider value={{ ...page, setPage }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  return useContext(PageTitleContext);
}
