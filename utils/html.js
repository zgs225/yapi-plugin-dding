const Markdown = require('./markdown');

const HTML_EOF = "\0";

const HTMLTokens = {
  OPEN_TAG: 1,
  CLOSED_TAG: 2,
  SELF_CLOSED_TAG: 3,
  TEXT: 4,
  COMMENT: 5,
  EOF: 255
};

class HTMLNode {
  constructor(parent, type, properties, children) {
    this.parent = parent;
    this.type = type;
    this.properties = properties;
    this.children = children;
  }

  static newRootNode(properties, children) {
    let n = new HTMLNode(null, '__root__', Object.assign({
      closed: true
    }, properties), children);
    children.forEach(function(c) {
      c.parent = n;
    });
    return n;
  }

  getAttribute(name) {
    if (!this.properties) {
      return null;
    }
    if (!this.properties.hasOwnProperty('attributes')) {
      return null;
    }
    if (!this.properties.attributes.hasOwnProperty(name)) {
      return null;
    }
    const attr = this.properties.attributes[name];
    if (!attr.hasOwnProperty('properties')) {
      return null;
    }
    const attrProp = attr['properties'];
    if (!attrProp.hasOwnProperty('literal')) {
      return null;
    }
    return attrProp['literal'];
  }

  setAttribute(name, value) {
    if (!this.properties) {
      this.properties = {};
    }
    if (!this.properties.hasOwnProperty('attributes')) {
      return this.properties.attributes = {};
    }
    if (!this.properties.attributes.hasOwnProperty(name)) {
      this.properties.attributes[name] = new HTMLToken(HTMLTokens.TEXT, -1, 0, {
        line: 0,
        column: 0,
        literal: value
      });
      return;
    }
    let attr = this.properties.attributes[name];
    if (!attr.hasOwnProperty('properties')) {
      attr.properties = {
        line: 0,
        column: 0,
        literal: value
      };
      return;
    }
    let attrProp = attr['properties'];
    attrProp['literal'] = value;
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
    this.skipWhitespace();
    const c = this.readChar();
    if (c == '<') {
      this.skipWhitespace(false);
      const nc = this.readChar(false);
      if (nc == '/') {
        this.backspace();
        return this.readClosedTag();
      }
      if (nc == '!') {
        const nnc = this.readChar(false);
        if (nnc == '-') {
          const nnnc = this.readChar(false);
          if (nnnc == '-') {
            this.backspace();
            return this.readComment();
          }
        }
      }
      this.backspace();
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

  readComment() {
    let buf = [];
    this.readChar(); // <
    this.readChar(false); // !
    this.readChar(false); // -
    this.readChar(false); // -

    while (true) {
      const c = this.readChar(false);
      if (c != '-') {
        buf.push(c);
        continue;
      } else if (c == HTML_EOF) {
        throw new SyntaxError(`语法错误: 注释未关闭。行: ${this.line}, 列: ${this.column}`);
      } else {
        const nc = this.readChar(false);
        if (nc == '-') {
          const nnc = this.readChar(false);
          if (nnc == '>') {
            break;
          }
          this.backspace(false);
        }
        this.backspace(false);
      }
      buf.push(c);
    }

    return new HTMLToken(HTMLTokens.COMMENT, this.cur, this.len, {
      line: this.line,
      column: this.column,
      literal: buf.join('')
    });
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
        return new HTMLToken(HTMLTokens.SELF_CLOSED_TAG, this.cur, this.len, {
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
        this.backspace(false);
        attr[attrName] = true;
        continue;
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
      if (this.isAlphabet(c) || this.isDigit(c) || c == '_' || c == '-' || c == ':') {
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
        this.backspace(newCur);
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
      return HTML_EOF;
    }
    if (oldPos < 0 || this.text[oldPos] == "\n") {
      this.line += 1;
      this.column = 1;
    }
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
  constructor(text) {
    this.text = text;
    this.lexer = new HTMLLexer(text);
  }

  /**
   * @return {HTMLNode}
   */
  __parse() {
    let nodes = this.parseNodes();
    let node = null;
    if (nodes.length == 1) {
      node = nodes[0];
    } else {
      node = HTMLNode.newRootNode(null, nodes);
    }
    this.checkClosedTagOfNode(node);
    return node;
  }

  parseNodes(parent = null) {
    let nodes = [];
    while (true) {
      const n = this.parseOneNode(parent);
      if (!n) {
        break;
      }
      nodes.push(n);
    }
    return nodes;
  }

  parseOneNode(parent) {
    let stack = [];
    let node = null;
    while (true) {
      const token = this.lexer.nextToken();
      switch (token.type) {
        case HTMLTokens.TEXT:
          node = new HTMLNode(parent, '__text__', Object.assign({
            closed: true
          }, token.properties), null);
          if (stack.length == 0) {
            return node;
          }
          stack = this.setNodeAsChildInStack(stack, node);
          break;
        case HTMLTokens.SELF_CLOSED_TAG:
          node = new HTMLNode(parent, token.properties.tagName, Object.assign({
            closed: true
          }, token.properties), null);
          if (stack.length == 0) {
            return node;
          }
          stack = this.setNodeAsChildInStack(stack, node);
          break;
        case HTMLTokens.EOF:
          if (stack.length == 0) {
            return null;
          }
          const root = stack[0];
          throw new SyntaxError(`语法错误: 标签<${root.type}>未关闭。行: ${node.properties.line}, 列: ${node.properties.column}`);
          break;
        case HTMLTokens.COMMENT:
          node = new HTMLNode(parent, '__comment__', Object.assign({
            closed: true
          }, token.properties), null);
          if (stack.length == 0) {
            return node;
          }
          stack = this.setNodeAsChildInStack(stack, node);
          break;
        case HTMLTokens.OPEN_TAG:
          node = new HTMLNode(parent, token.properties.tagName, Object.assign({
            closed: false
          }, token.properties), null);
          if (stack.length > 0) {
            stack = this.setNodeAsChildInStack(stack, node);
          }
          stack.push(node);
          break;
        case HTMLTokens.CLOSED_TAG:
          do {
            if (stack.length == 0) {
              throw new SyntaxError(`语法错误: 闭标签不匹配。闭标签是: ${token.properties.tagName}。行: ${token.properties.line}, 列: ${token.properties.column}`);
            }
            node = stack.pop();
          } while (node.type !== token.properties.tagName);
          node.properties.closed = true;
          if (stack.length == 0) {
            return node;
          }
          break;
        default:
          throw new SyntaxError(`语法错误: 未知的类型: ${token.type}。行: ${token.properties.line}, 列: ${token.properties.column}`);
      }
    }
  }

  setNodeAsChildInStack(stack, node) {
    if (stack.length == 0) {
      throw new Error('空栈');
    }
    let p = stack.pop();
    node.parent = p;
    if (p.children == null) {
      p.children = [];
    }
    p.children.push(node);
    stack.push(p);
    return stack;
  }

  checkClosedTagOfNode(node) {
    let children = node.children;
    if (children) {
      children.forEach((child) => {
        this.checkClosedTagOfNode(child);
      });
    }
    if (!node.properties.closed) {
      this.setChildrenAsSibling(node);
    }
  }

  setChildrenAsSibling(node) {
    let children = node.children;
    node.children = null;
    if (children) {
      children.forEach((child) => {
        child.parent = node.parent;
        this.insertNodeAsChildAfterNode(child, node.parent, node);
      });
    }
  }

  insertNodeAsChildAfterNode(child, parent, after) {
    if (!parent) {
      return;
    }
    let children = parent.children;
    if (!children) {
      parent.children = [child];
      return;
    }
    const idx = children.indexOf(after);
    let part = children.splice(idx + 1);
    part.push(child);
    parent.children = children.concat(part);
  }

  /**
   * @return {HTMLNode}
   */
  static parse(text) {
    let parser = new HTMLParser(text);
    return parser.__parse();
  }
}

class HTMLNodeToTextTranslater {
  /**
   * 将 HTML 节点转换成文本
   *
   * @param {HTMLNode} node
   * @return {String}
   */
  translate(node) {
    if (node == null) {
      return '';
    }
    switch (node.type) {
      case '__text__':
        return node.properties.literal;
        break;
      default:
        let children = node.children;
        if (children == null) {
          return '';
        }
        children = children.map((child) => {
          return this.translate(child);
        });
        return children.join('');
        break;
    }
  }
}

class HTMLNodeToMarkdownTranslater {
  /**
   * 将 HTML 节点转换成 Markdown 文本
   *
   * @param {HTMLNode} node
   * @return {String}
   */
  translate(node) {
    if (node == null) {
      return '';
    }
    let childrenText = '';
    if (node.children) {
      const buf = node.children.map((child) => {
        return this.translate(child);
      });
      childrenText = buf.join('');
    }
    switch (node.type) {
      case '__root__':
        return childrenText;
        break;
      case '__text__':
        return node.properties.literal;
        break;
      case '__comment__':
        return '';
        break;
      case 'a':
        const url = node.getAttribute('href');
        return Markdown.link(url, childrenText);
        break;
      case 'br':
        return Markdown.NewLine;
        break;
      case 'h1':
        return Markdown.head1(childrenText);
        break;
      case 'h2':
        return Markdown.head2(childrenText);
        break;
      case 'h3':
        return Markdown.head3(childrenText);
        break;
      case 'h4':
        return Markdown.head4(childrenText);
        break;
      case 'h5':
        return Markdown.head5(childrenText);
        break;
      case 'h6':
        return Markdown.head5(childrenText);
        break;
      case 'strong':
        return Markdown.bold(childrenText);
        break;
      case 'em':
        return Markdown.italic(childrenText);
        break;
      case 'blockquote':
        return Markdown.blockquote(childrenText);
        break;
      case 'li':
        let decorator = '*';
        if (node.parent.type == 'ol') {
          decorator = node.parent.children.indexOf(node) + 1;
          decorator = `${decorator}.`;
        }
        return `${decorator} ${childrenText}\n`;
        break;
      case 'ul':
        let indent = false;
        if (ul.parent && (ul.parent.type == 'ul' || ul.parent.type == 'ol')) {
          indent = true;
        }
        if (indent) {
          return childrenText.split('\n').map((str) => {
            return `    ${str}`;
          }).join('\n');
        }
        return childrenText;
        break;
      case 'img':
        let src = node.getAttribute('src');
        let alt = node.getAttribute('alt');
        alt = alt ? alt : '';
        return Markdown.image(src, alt);
        break;
      case 'code':
        return Markdown.code(childrenText);
        break;
      case 'p':
        return '\n' + childrenText + '\n';
        break;
      case 'div':
        return '\n' + childrenText + '\n';
        break;
      default:
        return `<${node.type}>${childrenText}</${node.type}>`;
        break;
    }
  }
}

class HTMLTranslater {
  static toText(html) {
    let node = HTMLParser.parse(html);
    return (new HTMLNodeToTextTranslater()).translate(node);
  }

  static toMarkdown(html) {
    let node = HTMLParser.parse(html);
    return (new HTMLNodeToMarkdownTranslater()).translate(node);
  }
}

module.exports = {
  HTMLParser,
  HTMLTranslater,
  HTMLNodeToTextTranslater,
  HTMLNodeToMarkdownTranslater
}
