import useTrackPageView from "@/analytics/useTrackPageView";
import CentredPage from "@/components/CenteredPage";

interface Props {
  userEmail: string;
}

const NotASpeaker = ({ userEmail }: Props) => {
  useTrackPageView("notASpeaker");
  return (
    <CentredPage>
      <div className="hero">
        <div className="hero-content">
          <div className="text-center">
            <div className="text-5xl">🤷🏾‍♀️🤷‍♂️</div>
            <h1 className="text-4xl">זה לא את/ה...</h1>
            <p className="pt-6">
              לא רשמנו אותך כמקליט במערכת עדיין אבל נשמח לעזרתך!
            </p>
            <p>פנה אלינו במייל כדי להרשם.</p>
            <p>(אנא ציין כי התחברת עם המייל {userEmail})</p>
          </div>
        </div>
      </div>
    </CentredPage>
  );
};

export default NotASpeaker;
