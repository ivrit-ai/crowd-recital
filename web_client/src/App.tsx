import { Document } from "@crct/models";
import { UserContext } from "@crct/context/user";
import useLogin from "@crct/hooks/useLogin";
import RecitalBox from "@crct/components/RecitalBox";
import DocumentInput from "@crct/components/DocumentInput";
import GoogleLogin from "@crct/components/GoogleLogin";
import { useState } from "react";

function App() {
  const { activeUser, googleLoginProps, onLogout, loggingIn } = useLogin();
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);

  return (
    <UserContext.Provider value={{ user: activeUser, logout: onLogout }}>
      <div className="flex h-screen w-full flex-row justify-center bg-slate-400">
        <div className="m-5 flex w-full flex-col items-center justify-center border-2 border-black bg-slate-200">
          <div className="m-10 text-2xl">מערכת הקראת המונים</div>
          {activeUser ? (
            <div>
              <div className="border-1 border-w flex items-center gap-5 border border-solid border-black p-1">
                <img
                  src={activeUser.picture}
                  alt="user"
                  className="max-h-12 rounded-full object-contain"
                />
                <span>{activeUser.name}</span>
                <span>{activeUser.email}</span>
                <button onClick={() => onLogout()} className="underline">
                  התנתק
                </button>
              </div>

              {activeUser.group ? (
                <div>
                  <DocumentInput
                    setActiveDocument={setActiveDocument}
                    activeDocument={activeDocument}
                  />
                  {!!activeDocument && <RecitalBox document={activeDocument} />}
                </div>
              ) : (
                <div>
                  אינך רשום אצלנו... נשמח לעזרה - אנא פנה אלינו בכדי להרשם .
                </div>
              )}
            </div>
          ) : (
            <GoogleLogin {...googleLoginProps} />
          )}
          {loggingIn && "Sppiinneerr..."}
        </div>
      </div>
    </UserContext.Provider>
  );
}

export default App;
