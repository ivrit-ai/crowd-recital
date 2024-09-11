import useTrackPageView from "@/analytics/useTrackPageView";
import CentredPage from "@/components/CenteredPage";

const NotASpeaker = () => {
  useTrackPageView("notFound");
  return (
    <CentredPage>
      <div className="hero">
        <div className="hero-content">
          <div className="text-center">
            <div className="text-5xl">🫣😳</div>
            <h1 className="text-4xl">לא, אין אותנו..</h1>
            <p className="pt-6">
              אנחנו לא מוצאים את זה, אולי זה מעולם לא היה קיים...
            </p>
            <p>בדוק שוב את הקישור או פנה אלינו לעזרה</p>
          </div>
        </div>
      </div>
    </CentredPage>
  );
};

export default NotASpeaker;
