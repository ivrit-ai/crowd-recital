import { createFileRoute, redirect } from "@tanstack/react-router";

import LoginPage from "@/pages/Login";
import Footer from "@/components/Footer";

const Login = () => {
  return (
    <div className="flex min-h-screen-minus-topbar w-full flex-col">
      <LoginPage />
      <Footer />
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
const fallback = "/" as const;

export const Route = createFileRoute("/login")({
  validateSearch: (search) => {
    return {
      redirect: search.redirect as string,
    };
  },
  beforeLoad: ({ context, search }) => {
    if (context.auth.user) {
      throw redirect({ to: search.redirect || fallback });
    }

    return null;
  },
  component: Login,
});
