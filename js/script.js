function alterarParaCadastro() {
    let divLogin = document.getElementById("inicio")
    let divCadastro = document.getElementById("inicioCadastro")
    setTimeout(() => {
        divLogin.style.display = "none";
        divCadastro.style.display = "block";

        animarFormulario(divLogin);
    }, 1200)
}
function alterarParaLogin() {
    let divLogin = document.getElementById("inicio")
    let divCadastro = document.getElementById("inicioCadastro")
    setTimeout(() => {
        divLogin.style.display = "block";
        divCadastro.style.display = "none";

        animarFormulario(divCadastro);
    }, 1200)
}

function animarFormulario(div) {
    div.classList.remove("animar-formulario");

    // Reinicia a animação.
    void div.offsetWidth;

    div.classList.add("animar-formulario");
}

function showAlert(titulo, mensagem) {
    const alertHtml = document.getElementById("customAlert");
    const overlay = document.querySelector(".alert-overlay");
    const title = document.getElementById("alertTitle");
    const message = document.getElementById("alertMessage");

    if (title) title.innerText = titulo;
    if (message) message.innerText = mensagem;
    if (alertHtml) alertHtml.classList.add("active");
    if (overlay) overlay.classList.add("active");
}

function showlOADING() {
    const loading = document.getElementById("loadingScreen");
    setTimeout(() => {
        loading.style.display = "flex"
        setTimeout(() => {
            loading.style.display = "none"
        }, 1000);
    }, 200);
}

function closeAlert() {
    const alertHtml = document.getElementById("customAlert");
    const overlay = document.querySelector(".alert-overlay");
    if (overlay) overlay.classList.remove("active");
    if (alertHtml) alertHtml.classList.remove("active");
}
function acessarConta() {
    let email = document.getElementById("email").value
    let senha = document.getElementById("password").value
    let btn = document
}