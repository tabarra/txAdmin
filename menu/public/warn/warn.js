const warnMain = document.getElementById('warn-main');
const warnBackdrop = document.getElementById('warn-backdrop');
const warnTitleInner = document.getElementById('warn-title-inner');
const warnMessage = document.getElementById('warn-message');
const warnAuthor = document.getElementById('warn-author');
const warnInstruction = document.getElementById('warn-instruction');
const warnOpenSound = new Audio('assets/sounds/warning_open.mp3');
const warnPulseSound = new Audio('assets/sounds/warning_pulse.mp3');

const isDebug = false;

function openWarning(author, reason, tTitle, tWarnedBy, tInstructions) {
    warnTitleInner.innerText = tTitle;
    warnMessage.innerText = reason;
    warnAuthor.innerText = `${tWarnedBy} ${author}`;
    warnInstruction.innerText = tInstructions;
    warnBackdrop.style.backgroundColor = 'rgba(133, 3, 3, 0.95)';
    setTimeout(() => {
        warnOpenSound.play();
        warnMain.style.transform = 'rotateX(0deg)';
    }, 500);
}

function closeWarning() {
    warnPulseSound.play();
    warnMain.style.transform = 'perspective(200px) rotateX(-90deg)';
    warnBackdrop.style.backgroundColor = 'transparent';
}

function pulseWarning() {
    warnBackdrop.classList.add('miniBounce');
    warnPulseSound.play();
    setTimeout(() => {
        warnBackdrop.classList.remove('miniBounce');
    }, 500);
}

window.onload = function () {
    if (isDebug) openWarning({
        author: 'tabarra',
        reason: 'Stop doing bad stuff or I will get mad 😣',
        tTitle: 'WARNING',
        tWarnedBy: 'Warned by:',
        tInstructions: 'Hold [SPACE] for 10 seconds to dismiss this message.',
    }); //DEBUG
    window.addEventListener('message', (event) => {
        console.log(event);
        if (event.data.type === 'open_warning') {
            openWarning(event.data.author, event.data.reason, event.data.tTitle, event.data.tWarnedBy, event.data.tInstructions);
        } else if (event.data.type === 'close_warning') {
            closeWarning();
        } else if (event.data.type === 'pulse_warning') {
            pulseWarning();
        }
    });
};