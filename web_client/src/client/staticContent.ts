import eulaHtmlUrl_en from "/eula.en.html?url";
import eulaHtmlUrl_he from "/eula.he.html?url";

export async function loadEula(lang: string) {
  const eulaHtmlUrl = lang === "he" ? eulaHtmlUrl_he : eulaHtmlUrl_en;
  const eulaHtml = await (await fetch(eulaHtmlUrl)).text();
  return eulaHtml;
}
