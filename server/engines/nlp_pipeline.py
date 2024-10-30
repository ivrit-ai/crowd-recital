from stanza import DownloadMethod, Pipeline

class NlpPipeline:
    def __init__(self):
        self.langs = ["he"]
        self.nlp_lang_mapping = {"he": "he", "yi": "he"}
        self.nlp_per_lang = {
            lang: Pipeline(
                lang=lang,
                processors="tokenize,mwt",
                download_method=DownloadMethod.REUSE_RESOURCES,
            )
            for lang in self.langs
        }

    def get_pipeline_for_lang(self, lang: str) -> Pipeline:
        lang_to_load = self.nlp_lang_mapping.get(lang, lang)
        return self.nlp_per_lang.get(lang_to_load, None)
