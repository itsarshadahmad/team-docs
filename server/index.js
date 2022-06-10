const mongoose = require("mongoose");
const Document = require("./Document");

mongoose.connect("mongodb://localhost/team_docs");

// Setting socket.io for server
const io = require("socket.io")(3001, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

const defaultValue = "";

// Establishing connection and listening changes
io.on("connection", (socket) => {
    // Creating work-space for document
    socket.on("get-document", async documentId => {
        const document = await findOrCreateDocument(documentId);
        socket.join(documentId);
        socket.emit("load-document", document.data);

        // Sending changes to client
        socket.on("send-changes", (delta) => {
            socket.broadcast.emit("receive-changes", delta);
        });
        // Saving changes
        socket.on("save-document", async data => {
            await Document.findByIdAndUpdate(documentId, { data })
        })
    });
});

// Creating or retrieving document data from DB
async function findOrCreateDocument(id) {
    if (id == null) return;
    const document = await Document.findById(id);
    if (document) return document;
    return await Document.create({
        _id: id,
        data: defaultValue,
    });
}
