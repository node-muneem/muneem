module.exports = {
    type : "other",
    compress : (asked,answer) => {
        answer.write("I'm fake compressor");
    }
}