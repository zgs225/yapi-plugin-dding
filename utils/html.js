const HTML_EOF = "\0";

const HTMLTokens = {
    LEFT_ARROW: 1,
    RIGHT_ARROW: 2,
    ID: 3,
    STRING: 4,
    SLASH: 5,
    BACKSLASH: 6,
    EQUALS: 7,
    EOF: 255
};

class HTMLNode {
    constructor(type, properties, children) {
        this.type = type;
        this.properties = properties;
        this.children = children;
    }
}

class HTMLToken {
    constructor(type, pos, length, properties = null) {
        this.type = type;
        this.pos = pos;
        this.length = length;
        this.properties = properties;
    }
}

class HTMLLexer {
    constructor(text) {
        this.text = text;
        this.pos = -1;
        this.cur = -1;
        this.len = 0;
        this.line = 0;
        this.column = 0;
    }

    /**
     * @return {HTMLToken}
     */
    nextToken() {
        this.skipWhitespace();
    }

    skipWhitespace() {
        while(true) {
            const c = this.readChar();
            if (!this.isBlank(c)) {
                this.backspace();
                return;
            }
        }
    }

    isBlank(c) {
        return c == ' ' || c == "\n" || c == "\t" || c == "\r" ;
    }

    backspace() {
        this.pos = this.cur - 1;
        this.cur = this.pos;
        this.len = 0;
    }

    readChar() {
        const oldPos = pos;
        this.pos += 1;
        this.cur  = this.pos;
        this.len  = 1;
        this.column += 1;
        if (this.pos >= this.text.length) {
            return HTML_EOF;
        }
        if (this.oldPos < 0 || this.text[this.oldPos] == "\n") {
            this.line += 1;
            this.column = 1;
        }
        return this.text[this.pos];
    }
}

class HTMLParser {
    /**
     * @return {HTMLNode}
     */
    static parse(text) {
    }
}
 

module.exports = {
    HTMLTokens,
    HTMLToken,
    HTMLLexer,
    HTMLParser
}
