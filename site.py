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
tagline = "一个人的首要责任，就是要有雄心。雄心是一种高尚的激情，它可以采取多种合理的形式。<br />—— 《一个数学家的辩白》"


markdown_settings = {
    "extensions": [
        "markdown.extensions.extra",
        "markdown.extensions.smarty",
        "pymdownx.superfences"
    ]
}
