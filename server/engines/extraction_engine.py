import re
from cgitb import text
from typing import BinaryIO, Optional

from bs4 import BeautifulSoup
import wikipediaapi
from pydantic import BaseModel

from models.text_document import PLAIN_TEXT_SOURCE_TYPE, WIKI_ARTICLE_SOURCE_TYPE

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

    def extract_text_document_from_file(
        self,
        source_file: BinaryIO,
        source_content_type: str,
    ) -> ExtractedText:
        if source_content_type == "text/plain":
            return self._extract_text_document_from_plain_text(source_file.read().decode("utf-8"), None)
        elif source_content_type == "text/html":
            return self._extract_text_document_from_html_file(source_file)
        else:
            raise ValueError(f"Unsupported source content type: {source_content_type}")

    def extract_text_document(self, source: str, source_type: str, title: Optional[str] = None) -> ExtractedText:
        if source_type == WIKI_ARTICLE_SOURCE_TYPE:
            return self._extract_text_document_from_wiki_article(source)
        elif source_type == PLAIN_TEXT_SOURCE_TYPE:
            return self._extract_text_document_from_plain_text(source, title)

    def _extract_text_document_from_plain_text(self, plain_text: str, title: Optional[str] = None) -> str:
        extracted = ExtractedText(
            text=self._normalize_and_segment_text(plain_text),
            metadata={
                "title": title,
            },
        )

        return extracted

    def _clear_structure_from_text(self, text_in: str) -> str:
        return re.sub(r"\s+", " ", text_in).strip()

    def _extract_text_document_from_html_file(self, source_file: BinaryIO) -> ExtractedText:
        # Read the HTML content from the binary file
        html_content = source_file.read()

        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(html_content, "html5lib")

        # Initialize the title variable
        title = ""

        # Priority 1: Extract the <title> from the <head>
        if soup.title and soup.title.string:
            title = soup.title.string.strip()
        else:
            # Priority 2: Extract the first <h1> found in the document
            h1 = soup.find("h1")
            if h1 and h1.get_text():
                title = h1.get_text(strip=True)
            else:
                # Priority 3: Extract from <meta name="title"> or <meta property="og:title">
                meta_title = soup.find("meta", attrs={"name": "title"}) or soup.find("meta", property="og:title")
                if meta_title and meta_title.get("content"):
                    title = meta_title.get("content").strip()

        # Extract paragraphs under <body>, excluding certain nested sections
        text = []
        if soup.body:
            # Tags to exclude when searching for paragraphs
            excluded_tags = [
                "header",
                "footer",
                "nav",
                "aside",
                "script",
                "style",
                "noscript",
                "form",
                "input",
                "p",
            ]

            # Find all <p> tags within the body
            paragraphs = soup.body.find_all("p")
            for p in paragraphs:
                # Skip paragraphs that are nested within excluded tags
                if p.find_parent(excluded_tags):
                    continue

                # Extract text including text from nested <p> tags
                paragraph_text = self._clear_structure_from_text(p.get_text(strip=True))
                if paragraph_text:
                    text.append(paragraph_text)

        all_text = "\n".join(text)

        extracted = ExtractedText(
            text=self._normalize_and_segment_text(all_text),
            metadata={
                "title": title,
            },
        )

        return extracted

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
        # replace \r\n with \n (windows line endings)
        text_in = text_in.replace("\r\n", "\n")

        # Chunkify the text by new lines
        paragraphs = text_in.split("\n")

        # At this point we have a list of chunks of text which we assume represent a paragraph.
        # Within those chunks we don't want any structure - since next step is to cut it up into sentences.

        # replace non word chars with a single space (including new lines)
        paragraphs = [self._clear_structure_from_text(p) for p in paragraphs]

        # Get rid of empty paragraphs
        paragraphs = [p for p in paragraphs if len(p) > 0]

        # Cut up to paragraphs - use semantic sentence tokenization
        return [[s.text for s in self.nlp(p).sentences] for p in paragraphs]
