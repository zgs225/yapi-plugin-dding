const HTML_EOF = "\0";

const HTMLTokens = {
  OPEN_TAG: 1,
  CLOSED_TAG: 2,
  SELF_CLOSED_TAG: 3,
  TEXT: 4,
  EOF: 255
};

class HTMLNode {
  constructor(parent, type, properties, children) {
    this.parent = parent;
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

    this.stateStack = [];
    this.newCurStateStack = [];
  }

  saveState(newCur = true) {
    const state = {
      pos: this.pos,
      cur: this.cur,
      len: this.len,
      line: this.line,
      column: this.column
    };
    if (newCur) {
      this.newCurStateStack.push(state);
    } else {
      this.stateStack.push(state);
    }
  }

  popState(newCur = true) {
    let state = null;
    if (newCur) {
      state = this.newCurStateStack.pop();
    } else {
      state = this.stateStack.pop();
    }
    if (state) {
      this.pos = state.pos;
      this.cur = state.cur;
      this.len = state.len;
      this.line = state.line;
      this.column = state.column;
    }
  }

  /**
   * @return {HTMLToken}
   */
  nextToken() {
    const c = this.readChar();
    if (c == '<') {
      this.skipWhitespace(false);
      const nc = this.readChar(false);
      this.backspace();
      if (nc == '/') {
        return this.readClosedTag();
      }
      return this.readOpenTag();
    }
    if (c == HTML_EOF) {
      return new HTMLToken(HTMLTokens.EOF, this.cur, this.len, {
        line: this.line,
        column: this.column
      });
    }
    this.backspace();
    return this.readText();
  }

  readOpenTag() {
    const leftArrow = this.readChar();
    this.skipWhitespace(false);
    const tagName = this.readIdentity();
    this.skipWhitespace(false);
    const attr = this.readAttributes();
    this.skipWhitespace(false);

    const nc = this.readChar(false);
    if (nc == '>') {
      return new HTMLToken(HTMLTokens.OPEN_TAG, this.cur, this.len, {
        line: this.line,
        column: this.column,
        tagName: tagName,
        attributes: attr
      });
    }
    if (nc == '/') {
      this.skipWhitespace(false);
      const nnc = this.readChar(false);
      if (nnc == '>') {
        return new HTMLTokens(HTMLTokens.SELF_CLOSED_TAG, this.cur, this.len, {
          line: this.line,
          column: this.column,
          tagName: tagName,
          attributes: attr
        });
      }
    }
    throw new SyntaxError(`语法错误: 标签不完整. 行: ${this.line}, 列: ${this.column}`);
  }

  readText() {
    let buf = [];
    let first = true;
    while (true) {
      const c = this.readChar(first);
      if (c == '<' || c == HTML_EOF) {
        this.backspace(first);
        break;
      }
      buf.push(c);
      first = false;
    }
    return new HTMLToken(HTMLTokens.TEXT, this.cur, this.len, {
      line: this.line,
      column: this.column,
      literal: buf.join('')
    });
  }

  readAttributes() {
    let attr = {};
    while (true) {
      this.skipWhitespace(false);
      const fc = this.readChar(false);
      if (!this.isAlphabet(fc) && fc != '_') {
        this.backspace(false);
        break;
      }
      this.backspace(false);
      const attrName = this.readIdentity();
      this.skipWhitespace(false);
      const nc = this.readChar(false);
      if (nc != '=') {
        throw new SyntaxError(`语法错误: 属性名称后必需是等号, 实际是: ${nc}. 行: ${this.line}, 列: ${this.column}`);
      }
      this.skipWhitespace(false);
      const nnc = this.readChar(false);
      if (nnc != '"' && nnc != "'") {
        throw new SyntaxError(`语法错误: 属性名值必需是字符串, 实际是: ${nnc}. 行: ${this.line}, 列: ${this.column}`);
      }
      const attrValue = this.readString(nnc);
      attr[attrName] = attrValue;
    }
    return attr;
  }

  readClosedTag() {
    const leftArrow = this.readChar();
    this.skipWhitespace(false);
    const slash = this.readChar(false);
    this.skipWhitespace(false);
    const tagName = this.readIdentity();
    this.skipWhitespace(false);
    const rightArrow = this.readChar(false);
    return new HTMLToken(HTMLTokens.CLOSED_TAG, this.cur, this.len, {
      line: this.line,
      column: this.column,
      tagName: tagName
    })
  }

  readIdentity() {
    let buf = [];
    const fc = this.readChar(false);
    if (!this.isAlphabet(fc) && fc != '_') {
      throw new SyntaxError(`语法错误: 标识符首字母必须是英文字母或者下划线, 实际是: ${fc}. 行: ${this.line}, 列: ${this.column}`);
    }
    buf.push(fc);
    while (true) {
      const c = this.readChar(false);
      if (this.isAlphabet(c) || this.isDigit(c) || c == '_') {
        buf.push(c);
        continue;
      } else {
        this.backspace(false);
        break;
      }
    }
    return buf.join('');
  }

  skipWhitespace(newCur = true) {
    while (true) {
      const c = this.readChar(newCur);
      if (!this.isBlank(c)) {
        this.backspace(false);
        return;
      }
    }
  }

  isBlank(c) {
    return c == ' ' || c == "\n" || c == "\t" || c == "\r";
  }

  isAlphabet(c) {
    return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
  }

  isDigit(c) {
    return c >= '0' && c <= '9';
  }

  backspace(newCur = true) {
    this.popState(newCur);
  }

  readString(end) {
    let buf = [];
    while (true) {
      let c = this.readChar(false);
      if (c == end) {
        break;
      }
      if (c == HTML_EOF) {
        throw new SyntaxError(`语法错误: 不完整的字符串。 行: ${this.line}, 列: ${this.column}`);
      }
      if (c == '\\') {
        c = this.escapeCharacter(this.readChar(false));
      }
      buf.push(c);
    }
    return new HTMLToken(HTMLTokens.TEXT, this.cur, this.len, {
      line: this.line,
      column: this.column,
      literal: buf.join('')
    })
  }

  readChar(newCur = true) {
    this.saveState(newCur);
    const oldPos = this.pos;
    this.pos += 1;
    if (newCur) {
      this.cur = this.pos;
      this.len = 1;
    } else {
      this.len += 1;
    }
    this.column += 1;
    if (this.pos >= this.text.length) {
      console.log('<EOF>');
      return HTML_EOF;
    }
    if (oldPos < 0 || this.text[oldPos] == "\n") {
      this.line += 1;
      this.column = 1;
    }
    console.log(`readChar: ${this.text[this.pos]}`);
    return this.text[this.pos];
  }

  escapeCharacter(c) {
    const table = {
      'n': "\n",
      'r': "\r",
      't': "\t",
      'b': "\b",
      '0': "\0",
      'v': "\v",
      "'": "'",
      '"': '"',
      '\\': '\\'
    };
    if (table.hasOwnProperty(c)) {
      return table[c];
    }
    throw new SyntaxError(`语法错误: 错误的转义字符 \\${c}。 行: ${this.line}, 列: ${this.column}`);
  }
}

class HTMLParser {
  /**
   * @return {HTMLNode}
   */
  static parse(text) {}
}


/**
module.exports = {
    HTMLTokens,
    HTMLToken,
    HTMLLexer,
    HTMLParser
}
*/
