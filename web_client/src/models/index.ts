const NON_WORD_UNICODE_MATCH_REGEXP = RegExp(/\P{L}+/, "u");
class Sentence {
  text: string;
  prev: SentencePointer;
  next: SentencePointer;
  constructor(text: string, prev: SentencePointer, next: SentencePointer) {
    this.text = text;
    this.prev = prev;
    this.next = next;
  }

  // Calculate number of words in the sentence as a get prop
  get wordCount(): number {
    if (!this.text) return 0;

    // Split words based on common characters - but unify consecutive chars
    // And trim empty splits
    return this.text
      .split(NON_WORD_UNICODE_MATCH_REGEXP)
      .filter((t) => t.trim()).length;
  }
}

type SentencePointer = Sentence | null;

class Paragraph {
  sentences: Sentence[];
  prev: ParagraphPointer;
  next: ParagraphPointer;

  constructor(
    sentences: Sentence[],
    prev: ParagraphPointer,
    next: ParagraphPointer,
  ) {
    this.sentences = sentences;
    this.prev = prev;
    this.next = next;
  }

  static fromText(
    text: string,
    prev: ParagraphPointer,
    next: ParagraphPointer,
  ): Paragraph {
    if (!text) {
      return new Paragraph([], null, null);
    }

    const ss = text.split(". ").filter((t) => t.trim());
    let prevSentence: SentencePointer = null;
    const sentences: Sentence[] = [];
    for (const s of ss) {
      const sentence: Sentence = new Sentence(s, prevSentence, null);
      sentences.push(sentence);
      if (prevSentence) {
        prevSentence.next = sentence;
      }
      prevSentence = sentence;
    }

    return new Paragraph(sentences, prev, next);
  }
}

type ParagraphPointer = Paragraph | null;

class Document {
  paragraphs: Paragraph[];
  constructor(paragraphs: Paragraph[]) {
    this.paragraphs = paragraphs;
  }

  static fromText(text: string): Document {
    if (!text) {
      return new Document([]);
    }
    const ps = text.split("\n").filter((t) => t.trim());
    let prevParagraph: ParagraphPointer = null;
    const paragraphs: Paragraph[] = [];
    for (const p of ps) {
      const paragraph: Paragraph = Paragraph.fromText(p, prevParagraph, null);
      paragraphs.push(paragraph);
      if (prevParagraph) {
        prevParagraph.next = paragraph;
      }
      prevParagraph = paragraph;
    }
    return new Document(paragraphs);
  }
}

export { Sentence, Paragraph, Document };
