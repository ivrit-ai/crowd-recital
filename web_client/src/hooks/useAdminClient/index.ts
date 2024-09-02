import { useContext, useMemo } from "react";

import { UserContext } from "@/context/user";
import AdminClient from "@/client/admin";

export default function useAdminClient() {
  const { accessToken } = useContext(UserContext);
  const client = useMemo(() => {
    return accessToken ? new AdminClient(accessToken) : null;
  }, [accessToken]);

  return client;
}
