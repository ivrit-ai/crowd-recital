from enum import StrEnum
from typing import Union
from dogpile.cache import make_region


class CacheKeys(StrEnum):
    leaderboard = "leaderboard"


def stats_key_gen(namespace: Union[str, dict], fn, **kw):
    fname = fn.__name__

    def generate_key(*arg):
        if isinstance(namespace, dict) and "fixed_key" in namespace:
            return namespace["fixed_key"]
        else:
            ns_prefix = namespace + "_" if namespace else ""
            return ns_prefix + fname + "_".join(str(s) for s in arg)

    return generate_key


region = make_region(function_key_generator=stats_key_gen).configure(
    "dogpile.cache.memory",
)
