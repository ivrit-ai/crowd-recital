import { QueryObserverResult, UseMutationResult } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { UserProfile } from "@/types/user";
import { useUserProfileData } from "./data";

const wakeupFromSnoozeAfterSeconds = 60 * 60 * 24;
const unspecifiedYearOfBirthValue = 0;

enum ProfileQuestions {
  YEAR_OF_BIRTH = "yearOfBirth",
  BIOLOGICAL_SEX = "biologicalSex",
}
const allQuestions = [
  ProfileQuestions.BIOLOGICAL_SEX,
  ProfileQuestions.YEAR_OF_BIRTH,
];

enum ProfileRequestState {
  INITIAL = "initial",
  SHOWN = "shown",
  SNOZZED = "snoozed",
  DISMISSED = "dismissed",
}

type ProfileInputProps = {
  profileData: UserProfile | undefined;
  profileMutation: UseMutationResult<void, Error, UserProfile, unknown>;
  profileRefetch: () => Promise<QueryObserverResult<UserProfile, Error>>;
};

type EntrySectionProps = {
  title: string;
  children: React.ReactNode;
  processing: boolean;
};

const EntrySection = ({
  title,
  children,
  processing = false,
}: EntrySectionProps) => {
  return (
    <div>
      <label dir="rtl" className="form-control my-4 w-full max-w-xs">
        <div className="label">
          <span className="text-md label-text font-bold">{title}</span>
          {processing && (
            <span className="loading loading-infinity loading-sm"></span>
          )}
        </div>
        {children}
      </label>
    </div>
  );
};

const YearOfBirthInput = ({
  profileData,
  profileMutation,
  profileRefetch,
}: ProfileInputProps) => {
  const { t } = useTranslation();
  const [activeError, setActiveError] = useState<string | undefined>(undefined);
  const [yearOfBirth, setYearOfBirth] = useState<number | undefined>(
    profileData?.yearOfBirth,
  );
  const currentYear = new Date().getUTCFullYear();
  const yearOfBirthOfASixteenYearOld = currentYear - 16;
  const yearOfBirthOfAThirtyYearOld = currentYear - 30;
  const mutateYearOfBirth = (yearOfBirth: number | undefined) => {
    setActiveError("");
    profileMutation
      .mutateAsync({
        yearOfBirth: yearOfBirth,
      })
      .then(() => {
        profileRefetch().finally(() => {
          setYearOfBirth(undefined);
        });
      })
      .catch(() => {
        setYearOfBirth(profileData?.yearOfBirth);
        setActiveError(t("lazy_lower_dachshund_jolt"));
      });
  };
  const toggleNotInterestedYearOfBirth = () => {
    if (profileData?.yearOfBirth === unspecifiedYearOfBirthValue) {
      mutateYearOfBirth(yearOfBirthOfAThirtyYearOld);
    } else {
      mutateYearOfBirth(unspecifiedYearOfBirthValue);
    }
  };
  const notInterestedToSpecifyYearOfBirth = profileData?.yearOfBirth === 0;

  return (
    <EntrySection
      title={t("actual_actual_puffin_zap")}
      processing={profileMutation.isPending}
    >
      <input
        className="input input-bordered"
        type="number"
        disabled={notInterestedToSpecifyYearOfBirth}
        value={
          notInterestedToSpecifyYearOfBirth
            ? ""
            : yearOfBirth || profileData?.yearOfBirth || ""
        }
        max={yearOfBirthOfASixteenYearOld}
        min={1920}
        onChange={(e) => setYearOfBirth(parseInt(e.target.value))}
        onBlur={() => mutateYearOfBirth(yearOfBirth)}
        onFocus={(e) => {
          if (e.target.value === "") {
            e.target.value = yearOfBirthOfAThirtyYearOld.toString();
          }
        }}
      ></input>

      <div className="label">
        <span className="label-text">{t("only_last_lizard_dazzle")}</span>
        <input
          type="checkbox"
          className="checkbox"
          checked={notInterestedToSpecifyYearOfBirth}
          onChange={toggleNotInterestedYearOfBirth}
        />
      </div>

      {activeError && <div className="text-xs text-error">{activeError}</div>}
    </EntrySection>
  );
};

const BiologicalSexInput = ({
  profileData,
  profileMutation,
}: ProfileInputProps) => {
  const { t } = useTranslation();

  const value = profileMutation.isPending
    ? profileMutation.variables?.biologicalSex
    : profileData?.biologicalSex || "";

  return (
    <EntrySection
      title={t("orange_heavy_nuthatch_boil")}
      processing={profileMutation.isPending}
    >
      <select
        className="select select-bordered w-full max-w-xs"
        value={value}
        onChange={(e) => {
          profileMutation.mutateAsync({
            biologicalSex: e.target.value,
          });
        }}
      >
        <option value="" disabled>
          {t("dry_such_tiger_savor")}
        </option>
        <option value="female">{t("fit_weak_tapir_persist")}</option>
        <option value="male">{t("aqua_lofty_puma_dig")}</option>
        <option value="unspecified">{t("only_last_lizard_dazzle")}</option>
      </select>
    </EntrySection>
  );
};

export const WhyWeAskForProfileInfoBox = () => {
  const { t } = useTranslation();
  return (
    <div className="collapse collapse-arrow my-4 text-wrap border">
      <input type="checkbox" />
      <p className="collapse-title text-warning">
        {t("muddy_bright_turtle_play")}
      </p>
      <p className="collapse-content text-sm">
        {t("last_arable_halibut_express")}
      </p>
    </div>
  );
};

type UserProfileQuestionsProps = ProfileInputProps & {
  showQuestions?: ProfileQuestions[];
};

export const UserProfileSectionContent = ({
  showQuestions = allQuestions,
  ...inputProps
}: UserProfileQuestionsProps) => {
  return (
    <div>
      {showQuestions.map((q) => {
        switch (q) {
          case ProfileQuestions.BIOLOGICAL_SEX:
            return <BiologicalSexInput key={q} {...inputProps} />;
          case ProfileQuestions.YEAR_OF_BIRTH:
            return <YearOfBirthInput key={q} {...inputProps} />;
          default:
            return null;
        }
      })}
    </div>
  );
};

export const UserProfileRequestModal = () => {
  const { t } = useTranslation();

  const [profileRequestState, setProfileRequestState] =
    useLocalStorage<ProfileRequestState>(
      "profile-req-state",
      ProfileRequestState.INITIAL,
    );
  const [profileRequestLastShown, setProfileRequestLastShown] = useLocalStorage(
    "profile-req-last-shown",
    0,
  );

  const [shouldRequest, setShouldRequest] = useState(false);
  const { data, isPending, refetch, mutation } = useUserProfileData();

  const quesionsStillMissing = useRef<ProfileQuestions[]>([]);
  const questionStillMissingThisRender: ProfileQuestions[] = [];
  if (!data?.biologicalSex) {
    questionStillMissingThisRender.push(ProfileQuestions.BIOLOGICAL_SEX);
  }
  if (!data?.yearOfBirth && data?.yearOfBirth !== unspecifiedYearOfBirthValue) {
    questionStillMissingThisRender.push(ProfileQuestions.YEAR_OF_BIRTH);
  }
  const anyQuestionMissing = questionStillMissingThisRender.length > 0;
  const wakeupAfterSnooze =
    profileRequestState === ProfileRequestState.SNOZZED &&
    Date.now() - profileRequestLastShown > 1000 * wakeupFromSnoozeAfterSeconds;
  const shown = profileRequestState === ProfileRequestState.SHOWN;
  const shouldShow =
    shown ||
    (anyQuestionMissing &&
      (profileRequestState === ProfileRequestState.INITIAL ||
        wakeupAfterSnooze));
  useEffect(() => {
    setShouldRequest(shouldShow);
    if (shouldShow) {
      setProfileRequestState(ProfileRequestState.SHOWN);
      setProfileRequestLastShown(Date.now());
      // Capture and store which questions we needed to ask for as the screen is shown
      // So we will keep showing them even after fulfilling themƒ
      quesionsStillMissing.current = questionStillMissingThisRender;
    }
  }, [shouldShow]);

  const onDismiss = () => setProfileRequestState(ProfileRequestState.DISMISSED);
  const onSnooze = () => setProfileRequestState(ProfileRequestState.SNOZZED);

  if (isPending || !shouldRequest) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h1 className="text-lg font-bold">{t("tangy_low_horse_ascend")}</h1>
        <p className="prose">{t("orange_real_midge_enrich")}</p>
        <WhyWeAskForProfileInfoBox />
        <div>
          <UserProfileSectionContent
            profileData={data}
            profileMutation={mutation}
            profileRefetch={refetch}
            showQuestions={quesionsStillMissing.current}
          />
        </div>
        <div className="modal-action flex gap-2">
          {anyQuestionMissing && (
            <button className="btn btn-outline" onClick={onDismiss}>
              {t("east_crazy_ox_treasure")}
            </button>
          )}
          <button className="btn btn-primary" onClick={onSnooze}>
            {anyQuestionMissing
              ? t("best_misty_anaconda_soar")
              : t("merry_wacky_dolphin_forgive")}
          </button>
        </div>
      </div>
    </div>
  );
};
