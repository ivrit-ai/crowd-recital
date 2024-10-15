import { reportResponseError } from "@/analytics";
import { EnvConfig } from "@/config";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";

const faqLoadUrl = EnvConfig.get("help_faq_wp_api_url");

async function loadFaqData(): Promise<string> {
  if (!faqLoadUrl) return "";
  
  const response = await fetch(faqLoadUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await reportResponseError(
      response,
      "help",
      "getFaqData",
      "Failed to load FAQs",
    );
    throw new Error(errorMessage);
  }

  try {
    const wpPageResposne = await response.json();
    const faqHTMLContent = wpPageResposne.content.rendered;
    return faqHTMLContent;
  } catch (error) {
    throw new Error("Failed to parse FAQs data");
  }
}

export function getFaqDataOptions() {
  return queryOptions({
    queryKey: ["help", "faq"],
    queryFn: () => loadFaqData(),
    staleTime: 1000 * 60 * 60, // 60 minutes
    placeholderData: keepPreviousData,
  });
}
