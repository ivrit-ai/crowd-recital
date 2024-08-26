from stanza import Pipeline


class NlpPipeline:
    def __init__(self):
        self.lang = "he"
        self.nlp = Pipeline(lang=self.lang, processors="tokenize,mwt")

    def get_pipeline(self) -> Pipeline:
        return self.nlp
