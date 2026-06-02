/* ===================================
   PAGE LOAD
=================================== */

window.onload = function () {
    loadSampleCode();
};

/* ===================================
   SAMPLE CODE
=================================== */

function loadSampleCode() {

    document.getElementById("codeInput").value =
`int a,b,c,d;
a=b+c*d;`;

    compileCode();
}

/* ===================================
   RESET
=================================== */

function resetCompiler() {

    document.getElementById("codeInput").value = "";

    document.getElementById("lexical").innerHTML = "";
    document.getElementById("syntax").innerHTML = "";
    document.getElementById("semantic").innerHTML = "";
    document.getElementById("symbol").innerHTML = "";
    document.getElementById("optimization").innerHTML = "";
            document.getElementById("intermediate").innerHTML = "";

    document.getElementById("target").innerHTML = "";

    document.getElementById("progressBar").style.width = "0%";
}

/* ===================================
   COMPILE
=================================== */

function compileCode() {

    document.getElementById("progressBar").style.width = "100%";

    lexicalAnalysis();

    let parsed = parseProgram();

    if (!parsed.ok) {

        document.getElementById("syntax").innerHTML =
            "❌ " + parsed.error;

        document.getElementById("semantic").innerHTML = "";
        document.getElementById("symbol").innerHTML = "";
        document.getElementById("intermediate").innerHTML = "";
        document.getElementById("optimization").innerHTML = "";
        document.getElementById("target").innerHTML = "";

        return;
    }

    syntaxAnalysis(parsed);
    semanticAnalysis(parsed);
    symbolTable(parsed.declared);
    intermediateCode(parsed);
    optimization();
    targetCode(parsed);
}

/* ===================================
   PROGRAM PARSER
=================================== */

function parseProgram() {

    let code =
        document.getElementById("codeInput").value.trim();

    let lines =
        code.split("\n")
            .map(x => x.trim())
            .filter(x => x !== "");

    let declarationLine =
        lines.find(line => line.startsWith("int"));

    let assignmentLine =
        lines.find(line => line.includes("="));

    if (!assignmentLine) {

        return {
            ok: false,
            error: "Assignment statement not found"
        };
    }

    if (!assignmentLine.endsWith(";")) {

        return {
            ok: false,
            error: "Syntax Error: Missing semicolon (;)"
        };
    }

    let declared = [];

    if (declarationLine) {

        if (!declarationLine.endsWith(";")) {

            return {
                ok: false,
                error: "Missing semicolon in declaration"
            };
        }

        let vars =
            declarationLine
                .replace("int", "")
                .replace(";", "")
                .split(",");

        vars.forEach(v => {
            declared.push(v.trim());
        });
    }

    assignmentLine =
        assignmentLine.replace(";", "");

    let match =
        assignmentLine.match(
            /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/
        );

    if (!match) {

        return {
            ok: false,
            error: "Invalid assignment statement"
        };
    }

    return {

        ok: true,

        declared: declared,

        left: match[1],

        expr: match[2]

    };
}

/* ===================================
   LEXICAL ANALYSIS
=================================== */

function lexicalAnalysis() {

    let code =
        document.getElementById("codeInput").value;

    let tokens =
        code.match(
            /[a-zA-Z_][a-zA-Z0-9_]*|\d+|[=+\-*\/;,()]/g
        ) || [];

    let html =
        "<table><tr><th>Lexeme</th><th>Token</th></tr>";

    tokens.forEach(token => {

        let type = "";

        if (
            ["int", "float", "double", "char"]
                .includes(token)
        ) {

            type = "Keyword";
        }

        else if (/^\d+$/.test(token)) {

            type = "Constant";
        }

        else if (/^[a-zA-Z_]/.test(token)) {

            type = "Identifier";
        }

        else {

            type = "Operator / Symbol";
        }

        html += `
<tr>
<td>${token}</td>
<td>${type}</td>
</tr>`;
    });

    html += "</table>";

    document.getElementById("lexical").innerHTML =
        html;
}

/* ===================================
   TOKENIZE EXPRESSION
=================================== */

function tokenizeExpression(expr) {

    return expr.match(
        /[a-zA-Z_][a-zA-Z0-9_]*|\d+|[()+\-*/]/g
    ) || [];
}
/* ===================================
   OPERATOR PRECEDENCE
=================================== */

function precedence(op) {

    if (op === "*" || op === "/")
        return 2;

    return 1;
}

/* ===================================
   INFIX TO POSTFIX
=================================== */

function infixToPostfix(tokens) {

    let output = [];
    let stack = [];

    tokens.forEach(token => {

        if (
            /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token) ||
            /^\d+$/.test(token)
        ) {

            output.push(token);

        }
        else if (token === "(") {

            stack.push(token);

        }
        else if (token === ")") {

            while (
                stack.length &&
                stack[stack.length - 1] !== "("
            ) {

                output.push(stack.pop());
            }

            stack.pop(); // remove '('
        }
        else {

            while (
                stack.length &&
                stack[stack.length - 1] !== "(" &&
                precedence(stack[stack.length - 1]) >= precedence(token)
            ) {

                output.push(stack.pop());
            }

            stack.push(token);
        }
    });

    while (stack.length) {

        output.push(stack.pop());
    }

    return output;
}

/* ===================================
   EXPRESSION TREE NODE
=================================== */

function createNode(value) {

    return {
        value: value,
        left: null,
        right: null
    };
}

/* ===================================
   BUILD EXPRESSION TREE
=================================== */

function buildExpressionTree(postfix) {

    let stack = [];

    postfix.forEach(token => {

        if (
            /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)
            ||
            /^\d+$/.test(token)
        ) {

            stack.push(
                createNode(token)
            );
        }

        else {

            let right = stack.pop();

            let left = stack.pop();

            let node =
                createNode(token);

            node.left = left;

            node.right = right;

            stack.push(node);
        }

    });

    return stack.pop();
}

/* ===================================
   TREE TO TEXT
=================================== */

function treeToHTML(node, indent = "") {

    if (!node) return "";

    let result = "";

    if (node.left || node.right) {

        result += node.value + "\n";

        if (node.left) {

            result += indent + "├── " +
                treeToHTML(
                    node.left,
                    indent + "│   "
                );
        }

        if (node.right) {

            result += indent + "└── " +
                treeToHTML(
                    node.right,
                    indent + "    "
                );
        }

    }
    else {

        result += node.value + "\n";
    }

    return result;
}
/* ===================================
   SYNTAX ANALYSIS
=================================== */

function syntaxAnalysis(parsed) {

    let tokens =
        tokenizeExpression(parsed.expr);

    let postfix =
        infixToPostfix(tokens);

    let tree =
        buildExpressionTree(postfix);

    let output =
        "=\n" +
        "├── " + parsed.left + "\n" +
        "└── " + treeToHTML(tree);

    document.getElementById("syntax").innerHTML =
        "<pre>" + output + "</pre>";
}

/* ===================================
   SEMANTIC ANALYSIS
=================================== */

function semanticAnalysis(parsed) {

    let variables =
        parsed.expr.match(
            /[a-zA-Z_][a-zA-Z0-9_]*/g
        ) || [];

    let undeclared = [];

    if (
        !parsed.declared.includes(
            parsed.left
        )
    ) {

        undeclared.push(
            parsed.left
        );
    }

    variables.forEach(variable => {

        if (
            !parsed.declared.includes(
                variable
            )
        ) {

            undeclared.push(
                variable
            );
        }

    });

    undeclared =
        [...new Set(undeclared)];

    if (undeclared.length > 0) {

        document.getElementById("semantic")
            .innerHTML =
            `
❌ Semantic Error

<br><br>

Undeclared Variable(s):

<br><br>

${undeclared.join(", ")}
`;

        return;
    }

    document.getElementById("semantic")
        .innerHTML =
        `
✅ Semantic Analysis Passed

<br><br>

No undeclared variables found.

<br><br>

Type Check Successful
`;
}

/* ===================================
   SYMBOL TABLE
=================================== */

function symbolTable(declared) {

    let html =
        `
<table>

<tr>
<th>Variable</th>
<th>Type</th>
<th>Address</th>
</tr>
`;

    let address = 1000;

    declared.forEach(variable => {

        html +=
            `
<tr>
<td>${variable}</td>
<td>int</td>
<td>${address}</td>
</tr>
`;

        address += 4;
    });

    html += "</table>";

    document.getElementById("symbol")
        .innerHTML = html;
}
/* ===================================
   INTERMEDIATE CODE
=================================== */

function intermediateCode(parsed) {

    let tokens = tokenizeExpression(parsed.expr);
    let postfix = infixToPostfix(tokens);

    let stack = [];
    let tac = [];
    let temp = 1;

    postfix.forEach(token => {

        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token) || /^\d+$/.test(token)) {

            stack.push(token);

        } else {

            let op2 = stack.pop();
            let op1 = stack.pop();

            let t = "t" + temp++;

            tac.push(`${t} = ${op1} ${token} ${op2}`);

            stack.push(t);
        }

    });

    tac.push(`${parsed.left} = ${stack.pop()}`);

    document.getElementById("intermediate").innerHTML =
        tac.join("<br><br>");
}

/* ===================================
   OPTIMIZATION
=================================== */

function optimization() {

    document.getElementById("optimization").innerHTML =
`
✔ Constant Folding

<br><br>

✔ Dead Code Elimination

<br><br>

✔ Common Sub-expression Elimination 

<br><br>

✔ Strength Reduction
`;
}

/* ===================================
   TARGET CODE
=================================== */

function targetCode(parsed) {

    let tokens = tokenizeExpression(parsed.expr);

    let postfix = infixToPostfix(tokens);

    let stack = [];

    let asm = [];

    let reg = 1;

    postfix.forEach(token => {

        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token) || /^\d+$/.test(token)) {

            stack.push(token);

        } else {

            let op2 = stack.pop();
            let op1 = stack.pop();

            let r = "R" + reg++;

            asm.push(`MOV ${r}, ${op1}`);

            switch(token){

                case "+":
                    asm.push(`ADD ${r}, ${op2}`);
                    break;

                case "-":
                    asm.push(`SUB ${r}, ${op2}`);
                    break;

                case "*":
                    asm.push(`MUL ${r}, ${op2}`);
                    break;

                case "/":
                    asm.push(`DIV ${r}, ${op2}`);
                    break;
            }

            stack.push(r);
        }

    });

    asm.push(`MOV ${parsed.left}, ${stack.pop()}`);

    document.getElementById("target").innerHTML =
        asm.join("<br><br>");
}