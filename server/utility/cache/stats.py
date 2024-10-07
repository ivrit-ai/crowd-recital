import inspect
from enum import StrEnum
from typing import Union

from dogpile.cache import make_region


class CacheKeys(StrEnum):
    user_stats = "user_stats"
    leaderboard = "leaderboard"
    totals = "totals"


user_stats_keys = set()


def stats_key_gen(namespace: Union[str, dict], fn, **kw):
    sig = inspect.signature(fn)
    is_method = sig.parameters.get("self") is not None
    fname = fn.__name__

    def generate_key(*arg):
        if isinstance(namespace, dict):
            if "fixed_key" in namespace:
                return namespace["fixed_key"]
            elif "key_range" in namespace and namespace["key_range"] == CacheKeys.user_stats:
                # generate a key template:
                # "fname_%d_arg1_arg2_arg3..."
                # Assume first (non self) args is the user_id
                args_for_template = arg[2:] if is_method else arg[1:]
                key_template = fname + "_" + "%s" + "_".join(str(s) for s in args_for_template)
                user_stats_keys.add(key_template)

                # Return the cache key with the provided user_id
                user_id = arg[1] if is_method else arg[0]
                return key_template % user_id

        ns_prefix = namespace + "_" if namespace else ""
        return ns_prefix + fname + "_".join(str(s) for s in arg)

    return generate_key


region = make_region(function_key_generator=stats_key_gen).configure(
    "dogpile.cache.memory",
)


def invalidate_stats_by_user_id(user_id):
    for key in user_stats_keys:
        region.delete(key % user_id)


def invalidate_cross_user_stats():
    region.delete(CacheKeys.leaderboard)
    region.delete(CacheKeys.totals)
