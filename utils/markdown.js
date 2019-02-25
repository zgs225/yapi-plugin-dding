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

    static head6(text) {
        return '###### ' + text;
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

    static blockquote(text) {
      let buf = text.split('\n');
      buf = buf.map((str) => {
        const p = /^>+ /;
        if (p.test(str)) {
          return '>' + str;
        }
        return '> ' + str;
      });
      return buf.join('\n');
    }

    static image(src, alt = '') {
      return `![${alt}](${src})`;
    }

    static code(text) {
      return '`' + text + '`';
    }
}

module.exports = Markdown
