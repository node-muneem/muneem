module.exports = {
    type : "application/other",
    serialize : (asked,answer) => {
        answer.replace("I'm fake serializer");
    }
}