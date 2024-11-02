import { useContext } from "react";
import { useTranslation } from "react-i18next";

import useTrackPageView from "@/analytics/useTrackPageView";
import { UserContext } from "@/context/user";
import {
  WhyWeAskForProfileInfoBox,
  UserProfileSectionContent,
} from "@/components/UserProfile";
import { useUserProfileData } from "@/components/UserProfile/data";

const UserProfilePage = () => {
  useTrackPageView("userProfile");
  const { t } = useTranslation();
  const {
    auth: { user },
  } = useContext(UserContext);
  const { data, isPending, refetch, mutation } = useUserProfileData();

  if (isPending) {
    return (
      <div className="flex min-h-screen-minus-topbar items-center justify-center">
        <div className="loading loading-infinity loading-lg" />
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-6xl p-4">
      <h1 className="my-4 text-xl">{t("orange_weird_warthog_nourish")}</h1>
      <label className="form-control w-full max-w-xs">
        <div className="label">
          <div className="label-text">{t("fancy_slow_niklas_advise")}</div>
          <div className="label-text">{user?.name}</div>
        </div>
        <div className="label">
          <div className="label-text">{t("game_this_bee_empower")}</div>
          <div className="label-text">{user?.email}</div>
        </div>
      </label>

      <h2 className="my-4 text-xl">{t("ok_neat_grizzly_hug")}</h2>

      <WhyWeAskForProfileInfoBox />

      <UserProfileSectionContent
        profileData={data}
        profileMutation={mutation}
        profileRefetch={refetch}
      />
    </div>
  );
};

export default UserProfilePage;
