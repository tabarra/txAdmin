(function () {
    const hiddenClass = 'd-none'
    var isDarkMode = document.body.classList.contains("theme--dark");

    const toggle1 = document.getElementById('darkToggleDark');
    const toggle2 = document.getElementById('darkToggleLight');
    toggle1.classList.toggle(hiddenClass, isDarkMode);
    toggle2.classList.toggle(hiddenClass, !isDarkMode);

    const handlerFn = function () {
        document.body.classList.toggle('theme--dark')
        toggle1.classList.toggle(hiddenClass);
        toggle2.classList.toggle(hiddenClass);
        isDarkMode = !isDarkMode;
        document.cookie = `txAdmin-darkMode=${isDarkMode};path=/`;
    }

    toggle1.addEventListener('click', handlerFn);
    toggle2.addEventListener('click', handlerFn);
})();
