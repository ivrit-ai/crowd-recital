from posthog import Posthog


class ConfiguredPosthog(Posthog):
    def __init__(self, *args, api_key: str, **kwargs):
        super().__init__(*args, api_key=api_key, disabled=not api_key, **kwargs)
