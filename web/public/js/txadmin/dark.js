(function () {
    const darkModeCookie = document.cookie.match(/(^| )txAdmin-darkMode=([^;]+)/);
    
    if(darkModeCookie == null){
        console.log('no theme cookie found');
        //If the user has Dark Mode as their OS default
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            console.log('OS dark mode detected');
            document.body.classList.toggle('theme--dark');
            document.cookie = `txAdmin-darkMode=true;path=/`;
        
        //If the user is on desktop
        }else if(window.location.pathname == '/'){
            const darkModeSuggestionCookie = document.cookie.match(/(^| )txAdmin-darkModeSuggestion=([^;]+)/);
            const suggestionInterval = 2*24*60*60*1000; // every 2 days
            if(darkModeSuggestionCookie === null){
                const expDate = new Date();
                expDate.setTime(expDate.getTime() + suggestionInterval);
                
                const darkToggleArea = document.getElementById('darkToggleArea');
                const tooltip = new coreui.Tooltip(darkToggleArea, {
                    container: 'body',
                    boundary: 'window',
                    offset: function offset(_ref) {
                        return [0, _ref.popper.height / 3];
                    },
                })
                setTimeout(() => {
                    tooltip.show();
                    document.cookie = `txAdmin-darkModeSuggestion=true;expires=${expDate.toUTCString()};path=/`;
                }, 2000);
            }
        }
    }

    const hiddenClass = 'd-none'
    var isDarkMode = document.body.classList.contains("theme--dark");

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
    }

    toggle1.addEventListener('click', handlerFn);
    toggle2.addEventListener('click', handlerFn);
})();
