import re

import wikipediaapi
from pydantic import BaseModel

from models.text_document import WIKI_ARTICLE_SOURCE_TYPE

from .nlp_pipeline import NlpPipeline

APP_USER_AGENT = "Ivrit.ai-Crowd-Recital/0.0.0 (https://www.ivrit.ai)"
WIKI_HE_ARTICLE_URL_PREFIX = r"^(https?://he.wikipedia.org/wiki/)(.+)$"


class ExtractedText(BaseModel):
    text: list[list[str]]
    metadata: dict


class ExtractionEngine:
    def __init__(self, nlp_pipeline: NlpPipeline):
        self.lang = "he"
        self.wiki_lang = self.lang
        self.wiki_wiki = wikipediaapi.Wikipedia(APP_USER_AGENT, self.wiki_lang)
        self.nlp = nlp_pipeline.get_pipeline()

    def extract_text_document(self, source: str, source_type: str) -> ExtractedText:
        if source_type == WIKI_ARTICLE_SOURCE_TYPE:
            return self._extract_text_document_from_wiki_article(source)

    def _extract_text_document_from_wiki_article(self, wiki_article_url: str) -> str:
        invalid_wiki_article_url_error = ValueError(f"Invalid wiki article URL: {wiki_article_url}")
        # Check if the input is a wiki article URL
        title_match = re.match(WIKI_HE_ARTICLE_URL_PREFIX, wiki_article_url)
        if not title_match:
            raise invalid_wiki_article_url_error

        # Extract the article title from the URL
        title = title_match.group(2)
        if not title.strip():
            raise invalid_wiki_article_url_error

        wiki_page = self.wiki_wiki.page(title)

        if not wiki_page.exists():
            raise ValueError(f"Wiki article not found: {wiki_article_url}")

        # Extract the article text
        article_text = wiki_page.text

        # Normalize and segment the text
        article_text_paragraphs_sentences = self._normalize_and_segment_text(article_text)

        extracted = ExtractedText(
            text=article_text_paragraphs_sentences,
            metadata={
                "title": wiki_page.title,
            },
        )

        return extracted

    def _normalize_and_segment_text(self, text_in: str) -> list[list[str]]:
        # Cut up to paragraphs - use new lines for that.
        paragraphs = text_in.split("\n")
        paragraphs = [p for p in paragraphs if len(p) > 0]

        return [[s.text for s in self.nlp(p).sentences] for p in paragraphs]
