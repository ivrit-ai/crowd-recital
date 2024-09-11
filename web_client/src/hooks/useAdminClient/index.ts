import { useContext, useMemo } from "react";

import { UserContext } from "@/context/user";
import AdminClient from "@/client/admin";

export default function useAdminClient() {
  const { auth } = useContext(UserContext);
  const client = useMemo(() => {
    return auth?.accessToken ? new AdminClient(auth.accessToken) : null;
  }, [auth?.accessToken]);

  return client;
}
