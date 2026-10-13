function createAccount() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let btn = document.getElementById("btn").value;
    let load = document.getElementById("loadingScreen")
    const alert = document.getElementById("customAlert");

    if (email.includes("@") && email.includes(".") && password.lenght >= 8) {

        load.style.display = "flex"

        setTimeout(function () {
            load.style.display = "none"
            location.href = "./src/home.html";

        }, 2000);
    } else {
        load.style.display = "flex"
        setTimeout(function () {
            alert.style.display = "flex"
        }, 2000);
    }



}

function closeAlert() {
    const alert = document.getElementById("customAlert");
    alert.style.display = "none"

}