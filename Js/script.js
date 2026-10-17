
//comando que identifica quando o user entra no site//
document.addEventListener("DOMContentLoaded", function () {
    login();
});

function login() {
    const senhaSalva = localStorage.getItem("senhaSalva");
    const emailSalvo = localStorage.getItem("emailSalva");

    if (senhaSalva && emailSalvo) {
        showlOADING()
        setTimeout(() => {
            window.location.href = "./src/home.html"
        }, 1000)
    } else {
        showlOADING()

    }
}

function createAccount() {
    let senha = document.getElementById("password").value

    let email = document.getElementById("email").value

    if (!senha || !email) {
        btnCOLOR("bad")
        showlOADING()
        showAlert("AVISO", "Para entrar no site , é necessário que você preencha todas as informações.")

    } else if (senha.length < 8 || !email.includes("@gmail.com")) {
        btnCOLOR("bad")
        showlOADING()
        showAlert("AVISO", "Senha ou Email inválidos.")

    } else {
        btnCOLOR("good")
        showlOADING()
        setTimeout(() => {
            window.location.href = "./src/home.html"
        }, 1000)

        localStorage.setItem("emailSalva", email)
        localStorage.setItem("senhaSalva", senha)



    }

}
function showAlert(titulo, mensagem) {
    const alertHtml = document.getElementById("customAlert");
    const overlay = document.querySelector(".alert-overlay");
    const title = document.getElementById("alertTitle");
    const message = document.getElementById("alertMessage");

    setTimeout(() => {
        if (title) title.innerText = titulo;
        if (message) message.innerText = mensagem;

        if (alertHtml) alertHtml.classList.add("active");
        if (overlay) overlay.classList.add("active");

    }, 1200);

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

function btnCOLOR(typeERROR) {
    let btn = document.getElementById("btn");
    if (typeERROR === "bad") {
        setTimeout(() => {
            btn.style.backgroundColor = "red"
            setTimeout(() => {
                btn.style.backgroundColor = "black"
            }, 1000);
        }, 10);
    } else {
        setTimeout(() => {
            btn.style.backgroundColor = "green"
            setTimeout(() => {
                btn.style.backgroundColor = "black"
            }, 1000);
        }, 20);
    }

}
function closeAlert() {
    const alertHtml = document.getElementById("customAlert");
    const overlay = document.querySelector(".alert-overlay");
    if (overlay) overlay.classList.remove("active");
    if (alertHtml) alertHtml.classList.remove("active");
}