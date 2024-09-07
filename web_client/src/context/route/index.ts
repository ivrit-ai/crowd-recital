import { createContext } from "react";

export enum Routes {
  Recital = "recital",
  Sessions = "sessions",
  Admin = "admin",
}

type RouteContextType = {
  activeRoute: Routes;
  setActiveRoute: (route: Routes) => void;
};

const RouteContext = createContext<RouteContextType>({
  activeRoute: Routes.Recital,
  setActiveRoute: () => {},
});

export { RouteContext, type RouteContextType };
