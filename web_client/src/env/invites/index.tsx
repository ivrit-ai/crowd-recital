const INVITE_QUERY_PARAM_NAME = "invite";
export const INVITE_STORAGE_KEY = "recital-invite";

function captureInvitesFromUrl() {
  // Retrieve the full URL from the browser’s `window.location`
  const queryParams = new URLSearchParams(window.location.search);

  // Safely get the invite parameter value
  const invite = queryParams.get(INVITE_QUERY_PARAM_NAME);

  if (invite) {
    // Store the invite in localStorage
    localStorage.setItem(INVITE_STORAGE_KEY, invite);
  }
}

captureInvitesFromUrl();
