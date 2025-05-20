import re
from typing import BinaryIO, Optional

from bs4 import BeautifulSoup
import wikipediaapi
from pydantic import BaseModel

from models.text_document import PLAIN_TEXT_SOURCE_TYPE, WIKI_ARTICLE_SOURCE_TYPE
from .wiki.hamichlol_wiki import HamichlolWikipedia

from .nlp_pipeline import NlpPipeline

APP_USER_AGENT = "Ivrit.ai-Crowd-Recital/0.0.0 (https://www.ivrit.ai)"
WIKIPEDIA_SOURCE = "wikipedia.org"
HAMICHLOL_SOURCE = "hamichlol.org.il"
WIKI_SOURCE_TO_WIKI_CLASS = {WIKIPEDIA_SOURCE: wikipediaapi.Wikipedia, HAMICHLOL_SOURCE: HamichlolWikipedia}
WIKI_ALLOWED_LANGUAGE_SOURCES = [("he", WIKIPEDIA_SOURCE), ("yi", WIKIPEDIA_SOURCE), ("yi", HAMICHLOL_SOURCE)]
WIKI_ALLOWED_LANGUAGES = list(set([lang for lang, _ in WIKI_ALLOWED_LANGUAGE_SOURCES]))
WIKI_ALLOWED_ARTICLE_URL_PREFIX = (
    rf"^(https?://({'|'.join(WIKI_ALLOWED_LANGUAGES)}).(?:m\.)?({WIKIPEDIA_SOURCE}|{HAMICHLOL_SOURCE})(/wiki)?/)(.+)$"
)


class ExtractedText(BaseModel):
    text: list[list[str]]
    metadata: dict


class ExtractionEngine:
    def __init__(self, nlp_pipeline: NlpPipeline):
        self.langs = ["he", "yi"]
        self.wiki_langs = WIKI_ALLOWED_LANGUAGES
        self_wiki_lang_srcs = WIKI_ALLOWED_LANGUAGE_SOURCES
        self.wiki_wiki_per_lang_source = {
            (lang, src): WIKI_SOURCE_TO_WIKI_CLASS[src](APP_USER_AGENT, lang) for lang, src in self_wiki_lang_srcs
        }
        self.nlp_per_lang = {lang: nlp_pipeline.get_pipeline_for_lang(lang) for lang in self.langs}

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
        lang = "he"  # TODO: how to detect language of plain text
        extracted = ExtractedText(
            text=self._normalize_and_segment_text(lang, plain_text),
            metadata={
                "lang": lang,
                "title": title,
            },
        )

        return extracted

    def _extract_text_document_from_html_file(self, source_file: BinaryIO) -> ExtractedText:
        # Read the HTML content from the binary file
        html_content = source_file.read()

        lang = "he"  # TODO: how to detect language of HTML text?

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
            paragraphs = soup.body.find_all(["p", "h2", "h3", "h4"])
            for text_container_elem in paragraphs:
                # Skip paragraphs that are nested within excluded tags
                if text_container_elem.find_parent(excluded_tags):
                    continue

                # Extract text including text from nested <p> tags
                paragraph_text = self._clear_structure_from_text(text_container_elem.get_text(strip=True))
                if paragraph_text:
                    text.append(paragraph_text)

        all_text = "\n".join(text)

        extracted = ExtractedText(
            text=self._normalize_and_segment_text(lang, all_text),
            metadata={
                "lang": lang,
                "title": title,
            },
        )

        return extracted

    def _extract_text_document_from_wiki_article(self, wiki_article_url: str) -> ExtractedText:
        invalid_wiki_article_url_error = ValueError(f"Invalid wiki article URL: {wiki_article_url}")
        # Check if the input is a wiki article URL
        wiki_url_match = re.match(WIKI_ALLOWED_ARTICLE_URL_PREFIX, wiki_article_url)
        if not wiki_url_match:
            raise invalid_wiki_article_url_error

        lang = wiki_url_match.group(2)
        if lang not in self.wiki_langs:
            raise invalid_wiki_article_url_error

        wiki_source = wiki_url_match.group(3)
        if wiki_source not in WIKI_SOURCE_TO_WIKI_CLASS.keys():
            raise invalid_wiki_article_url_error

        # Extract the article title from the URL
        title = wiki_url_match.group(5)
        if not title.strip():
            raise invalid_wiki_article_url_error

        wiki_page = self.wiki_wiki_per_lang_source[(lang, wiki_source)].page(title)

        if not wiki_page.exists():
            raise ValueError(f"Wiki article not found: {wiki_article_url}")

        # Extract the article text
        article_text = wiki_page.text

        if not article_text:
            raise ValueError(f"Wiki article has no text: {wiki_article_url}")

        # Normalize and segment the text
        article_text_paragraphs_sentences = self._normalize_and_segment_text(lang, article_text)

        extracted = ExtractedText(
            text=article_text_paragraphs_sentences,
            metadata={
                "lang": lang,
                "title": wiki_page.title,
            },
        )

        return extracted

    def _normalize_and_segment_text(self, lang: str, text_in: str) -> list[list[str]]:
        # replace \r\n with \n (windows line endings)
        text_in = text_in.replace("\r\n", "\n")

        # Chunkify the text by new lines
        paragraphs = text_in.split("\n")

        # At this point we have a list of chunks of text which we assume represent a paragraph.
        # Within those chunks we don't want any structure - since next step is to cut it up into sentences.

        # Remove from each paragraph text between parentheses
        paragraphs = [self._clear_text_between_parentheses(p) for p in paragraphs]

        # replace non word chars with a single space (including new lines)
        paragraphs = [self._clear_structure_from_text(p) for p in paragraphs]

        # Get rid of empty paragraphs
        paragraphs = [p for p in paragraphs if len(p) > 0]

        nlp = self.nlp_per_lang[lang]

        if not nlp:
            raise ValueError(f"Language not supported: {lang}")

        # Cut up to paragraphs - use semantic sentence tokenization
        return [[s.text for s in nlp(p).sentences] for p in paragraphs]

    def _clear_structure_from_text(self, text_in: str) -> str:
        """
        Cleans up the input text by replacing multiple whitespace characters
        with a single space and trimming leading and trailing whitespace.

        Args:
            text_in (str): The input text to be cleaned.

        Returns:
            str: The cleaned text with normalized whitespace.
        """
        return re.sub(r"\s+", " ", text_in).strip()

    def _clear_text_between_parentheses(self, text_in: str) -> str:
        text_in = re.sub(r"\s*[<\[][^>\]]*[>\]]", "", text_in)  # remove words between brackets and any space before it.
        text_in = re.sub(r"\s*\(([^)]+?)\)", "", text_in)  # remove words between parenthesis and any space before it.
        return text_in
