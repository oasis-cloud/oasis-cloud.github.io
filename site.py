# ------------------------- #
#  Site Configuration File  #
# ------------------------- #

# Variables set here will be available in template files under a `site` attribute,
# e.g. {{ site.title }}.

# Choose the theme to use when building your site. This variable should specify
# the name of a theme directory in your site's 'lib' folder.
theme = "graphite"

# Site title.
title = "Oasis's Cloud"

# Site tagline.
tagline = "☁️🌵️☁️🌵️☁️🌵☁️🌵️☁️🌵️☁️🌵☁️🌵"


markdown_settings = {
    "extensions": [
        "markdown.extensions.extra",
        "markdown.extensions.smarty",
        "pymdownx.superfences"
    ]
}