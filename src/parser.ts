// data structures
interface Stylesheet {
    rules: Array<Rule>
}

interface Rule {
    selectors: Array<Selector>
    declarations: Array<Declaration>
}

type Selector = {
    specificity: Function,
};

interface ISimpleSelector extends Selector{
    tag_name?: string,
    id?: string,
    class?: Array<string>,
}

interface Declaration {
    name: string,
    value: Value
}

type Value = Keyword | Length | ColorValue;

type Keyword = string;

interface Length {
    value: number,
    unit: Unit
};

enum Unit {
    Px,
}

type ColorValue = Color;

interface Color {
    r: number,
    g: number,
    b: number,
    a: number,
}

type Specificity = [number, number, number] 

class SimpleSelector implements ISimpleSelector {
    tag_name: string = '';
    id: string = '';
    class: Array<string> = [];

    constructor(tag_name: string, id: string, classNames: Array<string>) {
        this.tag_name = tag_name;
        this.id = id;
        this.class = classNames;
    }

    public specificity(): Specificity {
        let a = this.id !== '' ? 1 : 0;
        let b = this.class.length;
        let c = this.tag_name !== '' ? 1 : 0;
        return [a, b, c];
    }
}

export class Parser {
    pos: number = -1;
    input: string = "";

    constructor(source: string) {
        this.input = source;
    }

    public parse_rules(): Array<Rule> {
        let rules: Array<Rule> = [];
        while(true) {
            this.consume_whitespace();
            if (this.eof()) break;
            rules.push(this.parse_rule());
        }
        return rules;
    }

    parse_rule(): Rule {
        return {
            selectors: this.parse_selectors(),
            declarations: this.parse_declarations(),
        };
    }

    parse_selectors(): Array<Selector> {
        let selectors: Array<Selector> = [];

        while(true) {
            selectors.push(this.parse_simple_selector());
            this.consume_whitespace();
            let c = this.next_char();
            if (c === '{') {
                this.consume_char();
                break;
            } else if (c === ',') {
                this.consume_char();
                this.consume_whitespace();
            } else {
                throw new Error(`Unexpected character ${c} in selector`);
            }
        }
        selectors.sort((a, b) => {
            const [a1, b1, c1] = a.specificity();
            const [a2, b2, c2] = b.specificity();

            let spec1 = a1 * 1000 + b1 * 100 + c1 * 10;
            let spec2 = a2 * 1000 + b2 * 100 + c2 * 10;
            
            return spec2 - spec1;
        });

        return selectors;
    }

    parse_simple_selector(): SimpleSelector {
        let selector = new SimpleSelector('', '', []);
        while(!this.eof()) {
            let c = this.next_char();
            if (c === '#') {
                this.consume_char();
                selector.id = this.parse_identifier();
            } else if (c === '.') {
                this.consume_char();
                selector.class?.push(this.parse_identifier());
            } else if (c === '*') {
                // universal selector
                this.consume_char();
            } else if (valid_identifier_char(c)) {
                selector.tag_name = this.parse_identifier();
            } else {
                break;
            }
        }
        return selector;
    }

    parse_declarations(): Array<Declaration> {
        let declarations: Array<Declaration> = [];
        while(true) {
            this.consume_whitespace();
            if (this.next_char() === '}') {
                this.consume_char();
                break;
            }
            declarations.push(this.parse_declaration());
        }
        return declarations;
    }

    parse_declaration(): Declaration {
        let declaration: Declaration = { name: '', value: '' };
        let property_name = this.parse_identifier();
        this.consume_whitespace();
        assertIfNot(this.consume_char() === ':');
        this.consume_whitespace();
        let value = this.parse_value();
        this.consume_whitespace();
        assertIfNot(this.consume_char() === ';');

        declaration.name = property_name;
        declaration.value = value;
        return declaration;
    }

    parse_value(): Value {
        let c = this.next_char();
        if (/[0-9]/.test(c)) {
            return this.parse_length();
        } else if(c === '#') {
            return this.parse_color();
        } else {
            return this.parse_identifier();
        }
    }

    parse_length(): Value {
        return {
            value: this.parse_float(),
            unit: this.parse_unit(),
        };
    }

    parse_float(): number {
        let res = this.consume_while((c: string) => {
            return /[0-9.]/.test(c);
        });
        return Number(res);
    }

    parse_unit(): Unit {
        let unit = this.parse_identifier();
        if (unit === 'px') {
            return Unit.Px;
        } else {
            throw new Error('unrecognized unit');
        }
    }

    parse_color(): Color {
        assertIfNot(this.consume_char() === '#');
        return {
            r: this.parse_hex_pair(),
            g: this.parse_hex_pair(),
            b: this.parse_hex_pair(),
            a: 255, // TODO parse alpha
        };
    }

    parse_hex_pair(): number {
        let s = this.input.substring(this.pos + 1, this.pos + 2);
        this.pos += 2;
        return parseInt(s, 16);
    }

    parse_identifier(): string{
        return this.consume_while(valid_identifier_char);
    }

    consume_whitespace() {
        this.consume_while(this.isWhiteSpace);
    }

    public consume_while(test: Function): string {
        let result: string = '';
        while (!this.eof() && test(this.next_char()))
            result += this.consume_char();
        return result;
    }

    public eof(): boolean {
        return this.pos === this.input.length - 1;
    }

    public consume_char(): string {
        return this.input[++this.pos];
    }

    public next_char(): string {
        return this.input[this.pos + 1];
    }

    isWhiteSpace(char: string) {
        return /\s/.test(char);
    }
}

function valid_identifier_char(c: string): boolean {
    return /[a-zA-Z0-9-_]/.test(c);
}

function assertIfNot(condition: boolean) {
    if (condition === false) {
        throw new Error("assert error!!!");
    }
}

export function parse(source: string): Stylesheet {
    const parser = new Parser(source);
    return {
        rules: parser.parse_rules(),
    }
}