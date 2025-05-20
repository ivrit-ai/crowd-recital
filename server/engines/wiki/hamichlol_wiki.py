from typing import Any

from wikipediaapi import Wikipedia, WikipediaPage


class HamichlolWikipedia(Wikipedia):
    def _query(self, page: "WikipediaPage", params: dict[str, Any]):
        """Queries Wikimedia API to fetch content."""
        base_url = "https://" + page.language + ".hamichlol.org.il/w/api.php"
        params["format"] = "json"
        params["redirects"] = 1
        r = self._session.get(base_url, params=params, **self._request_kwargs)
        return r.json()
