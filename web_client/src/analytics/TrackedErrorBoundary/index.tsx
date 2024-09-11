import { useCopyToClipboard } from "@uidotdev/usehooks";

import Footer from "@/components/Footer";
import { ErrorComponentProps } from "@tanstack/react-router";

export const FallbackErrorPage = ({ error, reset }: ErrorComponentProps) => {
  const [copiedText, copyToClipboard] = useCopyToClipboard();

  const errorText = `${error?.message || "unknown error"}\n${error?.stack || "no stack"}`;

  return (
    <>
      <div className="flex min-h-screen w-full flex-col justify-center">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">אוֹי ווַיזְמִיר!</h1>
            <div className="py-4">
              <p className="py-6">
                משהו ממש לא צפוי קרה פה. נסה לרענן את העמוד (אל תבנה על זה)
                וכשזה לא עובד, נשמח אם{" "}
                <a type="email" href="mailto:yair@lifshitz.io">
                  תפנה אלינו
                </a>{" "}
                להביע את תסכולך.
              </p>
              <p className="text-sm">
                אם תחליט לצרף גם את הטקסט הקריפטי שמופיע למטה - זה יעזור
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => reset()}>
              רענן
            </button>
          </div>
        </div>

        <code
          dir="ltr"
          className="inset-2 m-4 max-h-28 overflow-auto border px-1 text-xs"
        >
          {errorText}
        </code>
        <button
          className="btn btn-outline mx-auto max-w-40"
          onClick={() => copyToClipboard(errorText)}
        >
          {copiedText ? "הועתק!" : "העתק"}
        </button>
      </div>
      <Footer />
    </>
  );
};
