document.getElementById("newNoteBtn").addEventListener("click", () => {
    document.getElementById("drawerBackdrop").classList.add("open");
    document.getElementById("editorDrawer").classList.add("open");
});
document.getElementById("closeEditorBtn").addEventListener("click", () => {
    document.getElementById("drawerBackdrop").classList.remove("open");
    document.getElementById("editorDrawer").classList.remove("open");
});
document.getElementById("noteForm").addEventListener("submit", (event) => {
    event.preventDefault();
    addnote();
});
let data = new Date();

let dia = String(data.getDate()).padStart(2, "0");
let mes = String(data.getMonth() + 1).padStart(2, "0");
let ano = data.getFullYear();

let dataAtual = `${dia}/${mes}/${ano}`;
//array de notes//
let notes = [{
    etiqueta: "Note 1",
    titulo: "primeira nota teste",
    nota: "essa é a primeiram anotação criada automaticamente junto com o sistema.",
    data: dataAtual,
    favorito: false
}]

function addnote() {
    let titulo = document.getElementById("noteTitleInput").value
    let etiqueta = document.getElementById("noteTagsInput").value
    let nota = document.getElementById("noteBodyInput").value
    let favoritos = false;

    const checklist = document.getElementById("meuChecklist");

    checklist.addEventListener("change", () => {
        if (checklist.checked) {
            return favoritos = true;
        } else {
            return favoritos = false;
        }
    });

    if (!etiqueta || !nota || !titulo) {
        showlOADING()
        setTimeout(() => {
            showAlert("Campos incompletos", "Preencha o título, as etiquetas e o texto da nota.");
        }, 1000)
    } else {
        notes.push({
            etiqueta: etiqueta,
            titulo: titulo,
            nota: nota,
            data: dataAtual,
            favorito: favoritos
        })
        document.getElementById("drawerBackdrop").classList.remove("open");
        document.getElementById("editorDrawer").classList.remove("open");
        console.log(notes)
    }
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
