(function () {
    var isDarkMode = !!+localStorage.getItem('darkmode')
    console.dir({isDarkMode})
    document.body.classList.toggle('theme--dark', isDarkMode)

    // Dark theme toggle
    if (isDarkMode) {
        document.body.classList.add('theme--dark')
    }

    const toggle1 = document.getElementById('darkToggleDark');
    const toggle2 = document.getElementById('darkToggleLight')
    const hiddenClass = 'd-none'
    toggle1.classList.toggle(hiddenClass, isDarkMode)
    toggle2.classList.toggle(hiddenClass, !isDarkMode)

    const handlerFn = function () {
        document.body.classList.toggle('theme--dark')
        toggle1.classList.toggle(hiddenClass)
        toggle2.classList.toggle(hiddenClass)
        isDarkMode = !isDarkMode
        localStorage.setItem('darkmode', (+isDarkMode).toString())
    }

    toggle1.addEventListener('click', handlerFn)
    toggle2.addEventListener('click', handlerFn)
})();
