async function uploadNote() {

    const title =
    document.getElementById("title").value;

    const subject =
    document.getElementById("subject").value;

    const pdf =
    document.getElementById("pdf").files[0];

    const formData =
    new FormData();

    formData.append("title", title);
    formData.append("subject", subject);
    formData.append("pdf", pdf);

    await fetch(
        "/api/notes/upload",
        {
            method: "POST",
            body: formData
        }
    );

    alert("PDF Uploaded Successfully");

    loadNotes();
}

async function loadNotes() {

    const response =
    await fetch("/api/notes/all");

    const notes =
    await response.json();

    const notesList =
    document.getElementById("notesList");

    notesList.innerHTML = "";

    notes.forEach(note => {

        notesList.innerHTML += `

        <div class="note-item">

            <h3>${note.title}</h3>

            <p>${note.subject}</p>

            <a href="/uploads/${note.pdf}"
               target="_blank">

                <button>
                    Open PDF
                </button>

            </a>

            <a href="/uploads/${note.pdf}"
               download>

                <button>
                    Download
                </button>

            </a>

        </div>

        `;

    });

}

loadNotes();