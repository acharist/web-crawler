const form = document.querySelector('.app-container__form');
const formInput = document.querySelector('.form__input');

console.log(formInput)
function send(event) {
    if(chechForEmpty(formInput)) {
        event.preventDefault();
        markError(formInput);
    }
}

function chechForEmpty(element) {
    return element.value === '' ? true : false; 
}

function markError(element) {
    formInput.style.boxShadow = '0 0 0 2px #f13636'
}

form.addEventListener('submit', send);