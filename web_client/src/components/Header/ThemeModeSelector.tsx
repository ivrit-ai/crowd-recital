import { useState, useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { MoonStar, Sun } from "lucide-react";

enum ThemeModes {
  Dark = "dark",
  Light = "light",
}

type ThemeMode = ThemeModes | null;
const isLight = (mode: ThemeMode) => mode === ThemeModes.Light;

const themeModeStorageKey = "theme-mode";
const systemPreferredThemeMode = window.matchMedia(
  "(prefers-color-scheme: dark)",
).matches
  ? ThemeModes.Dark
  : ThemeModes.Light;
const nonSystemPrefThemeMode = isLight(systemPreferredThemeMode)
  ? ThemeModes.Dark
  : ThemeModes.Light;

const initiallyStoredThemeMode = localStorage.getItem(
  themeModeStorageKey,
) as ThemeMode;

const ThemeModeSelector = () => {
  const posthog = usePostHog();
  const [overridingThemeMode, setOverridingThemeMode] = useState<ThemeMode>(
    initiallyStoredThemeMode,
  );
  useEffect(() => {
    if (overridingThemeMode) {
      localStorage.setItem(themeModeStorageKey, overridingThemeMode);
    } else {
      localStorage.removeItem(themeModeStorageKey);
    }
    posthog?.capture("Set Theme", {
      theme_mode: overridingThemeMode || "System Default",
    });
  }, [overridingThemeMode]);

  const [OffIcon, OnIcon] = isLight(systemPreferredThemeMode)
    ? [Sun, MoonStar]
    : [MoonStar, Sun];

  return (
    <div className="flex items-center">
      <label className="swap swap-rotate">
        {/* this hidden checkbox controls the state of the swap controle the theme */}
        <input
          type="checkbox"
          className="theme-controller"
          value={isLight(nonSystemPrefThemeMode) ? "light" : "dark"}
          checked={!!overridingThemeMode}
          onChange={(e) =>
            setOverridingThemeMode(
              e.target.checked ? nonSystemPrefThemeMode : null,
            )
          }
        />

        <OffIcon className="swap-off" />
        <OnIcon className="swap-on" />
      </label>
    </div>
  );
};

export default ThemeModeSelector;
