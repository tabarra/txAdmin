/* eslint-disable no-unused-vars */
//================================================================
//============================================= Settings & Helpers
//================================================================
//Settings
const timeoutShort = 1500;
const timeoutMedium = 2500;
const timeoutLong = 4000; //FIXME: na setup era 5000
const bufferTrimSize = 128 * 1024; // 128kb
const statusRefreshInterval = (isWebInterface) ? 1000 : 5000;

//Helpers
const spinnerHTML = '<div class="txSpinner">Loading...</div>';
const xss = (x) => {
    let tmp = document.createElement('div');
    tmp.innerText = x;
    return tmp.innerHTML;
};


//================================================================
//================================================= Event Handlers
//================================================================
//Page load
document.addEventListener('DOMContentLoaded', function(event) {
    if (typeof $.notifyDefaults !== 'undefined') {
        $.notifyDefaults({
            z_index: 2000,
            mouse_over: 'pause',
            placement: {
                align: 'center',
            },
            offset: {
                y: 64,
            },
        });
    }
});

//Handle profile picture load error
const pfpList = document.getElementsByClassName('profile-pic');
for (let pfp of pfpList) {
    pfp.addEventListener('error', () => {
        if (pfp.src != 'img/default_avatar.png') {
            pfp.src = 'img/default_avatar.png';
        }
    });
}


//================================================================
//================================================= Event Handlers
//================================================================
//Must be as close to a JQuery $.ajax() as possible
const txAdminAPI = () => {
    return false;
};


//================================================================
//================================================= Darkmode Theme
//================================================================
(function () {
    if (!isWebInterface) return;
    const darkModeCookie = document.cookie.match(/(^| )txAdmin-darkMode=([^;]+)/);

    if (darkModeCookie === null) {
        console.log('no theme cookie found');
        //If the user has Dark Mode as their OS default
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            console.log('OS dark mode detected');
            document.body.classList.toggle('theme--dark');
            document.cookie = 'txAdmin-darkMode=true;path=/';

        //If the user is on desktop
        } else if (window.location.pathname == '/') {
            const darkModeSuggestionCookie = document.cookie.match(/(^| )txAdmin-darkModeSuggestion=([^;]+)/);
            const suggestionInterval = 24 * 60 * 60 * 1000; // every day
            if (darkModeSuggestionCookie === null) {
                const expDate = new Date();
                expDate.setTime(expDate.getTime() + suggestionInterval);

                const darkToggleArea = document.getElementById('darkToggleArea');
                const tooltip = new coreui.Tooltip(darkToggleArea, {
                    container: 'body',
                    boundary: 'window',
                    offset: function offset(_ref) {
                        return [0, _ref.popper.height / 3];
                    },
                });
                setTimeout(() => {
                    tooltip.show();
                    document.cookie = `txAdmin-darkModeSuggestion=true;expires=${expDate.toUTCString()};path=/`;
                }, 2000);
            }
        }
    }

    const hiddenClass = 'd-none';
    let isDarkMode = document.body.classList.contains('theme--dark');

    const toggle1 = document.getElementById('darkToggleDark');
    const toggle2 = document.getElementById('darkToggleLight');
    toggle1.classList.toggle(hiddenClass, isDarkMode);
    toggle2.classList.toggle(hiddenClass, !isDarkMode);

    const handlerFn = function () {
        document.body.classList.toggle('theme--dark');
        toggle1.classList.toggle(hiddenClass);
        toggle2.classList.toggle(hiddenClass);
        isDarkMode = !isDarkMode;
        document.cookie = `txAdmin-darkMode=${isDarkMode};path=/`;
    };

    toggle1.addEventListener('click', handlerFn);
    toggle2.addEventListener('click', handlerFn);
})();
