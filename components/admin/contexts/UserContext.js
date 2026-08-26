"use client";

import { useCallback } from "react";
import { createResourceContext } from "@/lib/utils/createResourceContext";

const { Provider: _UserProvider, useResource: _useUsers } =
  createResourceContext("/api/users");

export function UserProvider({ children }) {
  return <_UserProvider>{children}</_UserProvider>;
}

export function useUsers() {
  const { items: users, ready, add, update, remove, refresh } = _useUsers();

  const getUser = useCallback(
    (id) => users.find((u) => u.id === id) ?? null,
    [users]
  );

  return {
    users,
    ready,
    addUser: add,
    updateUser: update,
    deleteUser: remove,
    getUser,
    persist: refresh,
  };
}
