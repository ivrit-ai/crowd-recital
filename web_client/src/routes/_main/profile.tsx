import { createFileRoute } from "@tanstack/react-router";

import AccountPage from "@/pages/Account";
import { getUserProfileOptions } from "@/client/queries/users";

export const Route = createFileRoute("/_main/profile")({
  loader: async ({ context: { queryClient } }) => {
    return await queryClient.ensureQueryData(getUserProfileOptions());
  },
  component: () => <AccountPage />,
});
