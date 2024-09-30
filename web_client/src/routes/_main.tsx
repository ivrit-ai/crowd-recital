import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import Header from "@/components/Header";
import NotASpeaker from "@/pages/NotASpeaker";
import SignAgreement from "@/pages/SignAgreement";

function MainLayout() {
  const { notASpeaker, didNotSignAgreement, userEmail } = Route.useLoaderData();

  let renderContent = <Outlet />;
  if (notASpeaker) {
    renderContent = <NotASpeaker userEmail={userEmail || ""} />;
  } else if (didNotSignAgreement) {
    renderContent = <SignAgreement />;
  }

  return (
    <div className="flex min-h-screen-minus-topbar w-full flex-col">
      <Header />
      {renderContent}
    </div>
  );
}

export const Route = createFileRoute("/_main")({
  beforeLoad: async ({ location, context }) => {
    const auth = context.auth;

    if (!auth.user) {
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
    const notASpeaker = !auth?.user?.isSpaker();
    const didNotSignAgreement = !auth?.user?.didSignAgreement();

    return { notASpeaker, didNotSignAgreement, userEmail: auth?.user?.email };
  },
  component: MainLayout,
});
