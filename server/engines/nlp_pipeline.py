from stanza import Pipeline, DownloadMethod


class NlpPipeline:
    def __init__(self):
        self.lang = "he"
        self.nlp = Pipeline(lang=self.lang, processors="tokenize,mwt", download_method=DownloadMethod.REUSE_RESOURCES)

    def get_pipeline(self) -> Pipeline:
        return self.nlp
