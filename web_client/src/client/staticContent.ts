import eulaHtmlUrl from "/eula.html?url";

export async function loadEula() {
  const eulaHtml = await (await fetch(eulaHtmlUrl)).text();
  return eulaHtml;
}
