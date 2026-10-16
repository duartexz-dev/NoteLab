function createAccount() {
    let senha = document.getElementById("password").value

    let email = document.getElementById("email").value

    if (!senha || !email) {
        showAlert("AVISO", "Senha ou Email inválidos.")
    } else if (senha.lenght < 8 || !email.includes("@gamil.com")) {
        showAlert("AVISO", "Senha ou Email inválidos.")
    } else {
        showAlert("AVISO", "Conta criada com sucesso.")
        localStorage.setItem("emailSalvo", "email")
        localStorage.setItem("senhaSalva", "senha")
    }

}
function showAlert(titulo, mensagem) {
    let alerthtml = document.getElementById("customAlert");
    let title = document.getElementById("alertTitle");
    let message = document.getElementById("alertMessage");

    title.innerText = titulo
    message.innerText = mensagem
    alerthtml.style.display = "flex"

}
function showlOADING() {
    const loading = document.getElementById("loadingScreen");
    setTimeout(() => {
        loading.style.display = "flex"
    }, 1500);
}

function btnCOLOR(typeERROR) {
    let btn = document.getElementById("btn");
    if (typeERROR === "bad") {
        setTimeout(() => {
            btn.style.backgroundColor = "red"
            setTimeout(() => {
                btn.style.backgroundColor = "black"
            }, 1000);
        }, 500);
    } else {
        setTimeout(() => {
            btn.style.backgroundColor = "green"
            setTimeout(() => {
                btn.style.backgroundColor = "black"
            }, 1000);
        }, 500);
    }

}