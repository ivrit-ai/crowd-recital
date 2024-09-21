import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import he from "./locales/he/translation.json";
import heDocuments from "./locales/he/documents.json";
import heRecordings from "./locales/he/recordings.json";
import yi from "./locales/yi/translation.json";
import yiDocuments from "./locales/yi/documents.json";
import yiRecordings from "./locales/yi/recordings.json";

export const defaultNS = "translation";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TObj = any;

i18n.use(initReactI18next).init({
  debug: true,
  defaultNS,
  lng: "yi",
  fallbackLng: "he",
  resources: {
    he: {
      translation: he,
      documents: heDocuments,
      recordings: heRecordings,
    },
    yi: {
      translation: yi,
      documents: yiDocuments,
      recordings: yiRecordings,
    },
  },
});

export default i18n;
