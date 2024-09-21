import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import he from "./locales/he/translation.json";
import heDocuments from "./locales/he/documents.json";
import heRecordings from "./locales/he/recordings.json";

export const defaultNS = "translation";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TObj = any;

i18n.use(initReactI18next).init({
  debug: true,
  defaultNS,
  lng: "he",
  fallbackLng: "he",
  resources: {
    he: {
      translation: he,
      documents: heDocuments,
      recordings: heRecordings,
    },
  },
});

export default i18n;
