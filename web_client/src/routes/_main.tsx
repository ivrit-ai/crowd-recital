import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import Header from "@/components/Header";
import NotASpeaker from "@/pages/NotASpeaker";

function MainLayout() {
  const { notASpeaker, userEmail } = Route.useLoaderData();

  return (
    <div className="flex min-h-screen-minus-topbar w-full flex-col">
      <Header />
      {notASpeaker ? <NotASpeaker userEmail={userEmail || ""} /> : <Outlet />}
    </div>
  );
}

export const Route = createFileRoute("/_main")({
  beforeLoad: async ({ location, context }) => {
    const auth = context.auth;

    if (!auth.user) {
      console.log("Not logged in, redirecting to login");
      console.log(auth);
      throw redirect({
        from: "/",
        to: "/login",
        search: {
          // Use the current location to power a redirect after login
          // (Do not use `router.state.resolvedLocation` as it can
          // potentially lag behind the actual current location)
          redirect: location.href,
        },
      });
    }
  },
  loader: ({ context }) => {
    const auth = context.auth;
    let notASpeaker = false;
    if (!auth?.user?.isSpaker()) {
      notASpeaker = true;
    }

    return { notASpeaker, userEmail: auth?.user?.email };
  },
  component: MainLayout,
});
