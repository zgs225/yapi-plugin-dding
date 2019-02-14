class Markdown {
    static get NewLine() {
        return "    \n";
    }

    static head1(text) {
        return '# ' + text;
    }

    static head2(text) {
        return '## ' + text;
    }

    static head3(text) {
        return '### ' + text;
    }

    static head4(text) {
        return '#### ' + text;
    }

    static head5(text) {
        return '##### ' + text;
    }

    static bold(text) {
        return '**' + text + '**';
    }

    static italic(text) {
        return '*' + text + '*';
    }

    static link(url, text = '') {
        return '[' + text + '](' + url + ')';
    }
}

module.exports = Markdown
