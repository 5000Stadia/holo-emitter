"""The replicator's test suite.

    python3 -m unittest discover -s replicator/tests -t . -v

`-t .` puts the repo root on sys.path so `replicator` imports as a package;
this file has to exist or discovery refuses the directory outright.
"""

try:
    import numpy  # noqa: F401
    import PIL  # noqa: F401
except ImportError as exc:  # pragma: no cover - environment guidance
    raise ImportError(
        "the replicator needs numpy and Pillow, and nothing else. On this machine pip is "
        "PEP-668 blocked, so install them from the distribution:\n"
        "    sudo apt-get install -y python3-numpy python3-pil\n"
        "(original error: %s)" % exc)
