(function () {
    'use strict';

    function renderArithmatex() {
        if (typeof katex === 'undefined') {
            return;
        }

        var maths = document.querySelectorAll('.arithmatex');

        for (var i = 0; i < maths.length; i++) {
            var el = maths[i];
            var tex = el.textContent || el.innerText;

            if (tex.startsWith('\\(') && tex.endsWith('\\)')) {
                katex.render(tex.slice(2, -2), el, {
                    displayMode: false,
                    throwOnError: false
                });
            } else if (tex.startsWith('\\[') && tex.endsWith('\\]')) {
                katex.render(tex.slice(2, -2), el, {
                    displayMode: true,
                    throwOnError: false
                });
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderArithmatex);
    } else {
        renderArithmatex();
    }
})();
