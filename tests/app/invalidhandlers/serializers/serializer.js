module.exports = {
    /* type : "application/other", */
    serialize : (asked,answer) => {
        answer.write("I'm fake serializer");
    }
}