from inspect import BoundArguments, signature
from posthog import Posthog

from version import __version__


class ConfiguredPosthog(Posthog):
    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, disabled=not api_key, **kwargs)
        self.capture_sig = signature(super().capture)

    def capture(self, *args, **kwargs):
        capture_args: BoundArguments = self.capture_sig.bind(*args, **kwargs)

        if not capture_args.arguments.get("properties"):
            capture_args.arguments["properties"] = {}

        capture_args.arguments["properties"]["source"] = "server"
        capture_args.arguments["properties"]["version"] = __version__
        if capture_args.arguments["distinct_id"] == "server":
            capture_args.arguments["properties"]["$process_person_profile"] = False

        # Call the parent class's capture method with modified kwargs
        return super().capture(**capture_args.arguments)