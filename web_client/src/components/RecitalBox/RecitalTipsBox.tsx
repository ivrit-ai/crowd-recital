import { Link } from "@tanstack/react-router";
import { useLocalStorage } from "@uidotdev/usehooks";

type ShowButtonProps = {
  children: React.ReactNode;
};

enum RecitalGuideState {
  Initial = "initial",
  Reshow = "reshow",
  Hidden = "hidden",
}

const useGuideState = () =>
  useLocalStorage<RecitalGuideState>(
    "recital-guide-state",
    RecitalGuideState.Initial,
  );

export const RecitalTipxBoxShowButton = ({ children }: ShowButtonProps) => {
  const [, setRecitalGuideState] = useGuideState();

  return (
    <button onClick={setRecitalGuideState.bind(null, RecitalGuideState.Reshow)}>
      {children}
    </button>
  );
};

const RecitalTipsBox = () => {
  const [recitalGuideState, setRecitalGuideState] = useGuideState();

  const autoShowOn = recitalGuideState === RecitalGuideState.Initial;
  const reshow = recitalGuideState === RecitalGuideState.Reshow;
  if (!autoShowOn && !reshow) return null;
  const onDismiss = () => setRecitalGuideState(RecitalGuideState.Hidden);

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h1 className="mb-2 text-lg text-primary">
          {reshow
            ? "הסבר בסיסי וטיפים להקלטה"
            : "כמה טיפים בסיסיים לפני שמתחילים..."}
        </h1>
        <ul className="list-inside list-disc *:mb-2">
          <li>
            סדר הפעולות - התחלת הקלטה, הקראת המשפט המודגש, העברה למשפט הבא,
            הקראה וכך הלאה עד לסיום ההקלטה
          </li>
          <li>לעצירת ההקלטה, יש לסיים את הקראת המשפט המודגש ולעצור</li>
          <li>ההקלטה כוללת טעות גדולה? עצרו וסמנו אותה למחיקה</li>
          <li>
            כמה להקריא? התחילו במספר משפטים, כאשר תרגישו נוח כוונו להקלטות באורך
            של 4-8 דקות
          </li>
          <li>לפני ההקלטה אפשר לנווט לכל חלק במסמך ממנו רוצים להקריא</li>
          <li className="nokbd:hidden">
            בזמן הקלטה - קל יותר לעבור למשפט הבא על ידי חץ קדימה
          </li>
          <li className="hidden nokbd:list-item">
            בזמן הקלטה קל יותר לעבור למשפט הבא על ידי נגיעה במסך בכל חלק של
            הטקסט
          </li>
        </ul>
        {!reshow && (
          <p className="mt-4 text-lg">
            הכנו גם סרטון חביב וזריז שמסביר על תהליך ההקלטה והאתר{" "}
            <Link className="link" to="/help" onClick={onDismiss}>
              לחץ לצפייה
            </Link>
          </p>
        )}
        <div className="modal-action">
          <button className="btn btn-primary" onClick={onDismiss}>
            אפשר להמשיך
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecitalTipsBox;
