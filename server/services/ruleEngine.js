const RULES = [
  {
    name: 'no-console',
    test: (line) => /console\.(log|warn|error|info)\s*\(/.test(line),
    message: (f) => `[Rule] \`console.${f}\` left in code — remove before merging.`,
    severity: 'warning'
  },
  {
    name: 'no-debugger',
    test: (line) => /\bdebugger\b/.test(line),
    message: () => '[Rule] `debugger` statement found — remove before merging.',
    severity: 'error'
  },
  {
    name: 'no-todo',
    test: (line) => /\/\/\s*(TODO|FIXME|HACK|XXX)/i.test(line),
    message: () => '[Rule] Unresolved TODO/FIXME comment detected.',
    severity: 'info'
  },{
    name: 'no-hardcoded-secret',
    test: (line) => /(password|secret|api_key|apikey)\s*=\s*['"`][^'"`]{4,}/i.test(line),
    message: () => '[Rule] Possible hardcoded secret detected — use environment variables.',
    severity: 'error'
  }
];


function runRules(parsedLines,filename){
    const findings=[];

    for(const line of parsedLines){
        for(const rule of RULES){
            if(rule.test(line.content)){
                //extract the matched function name for console rue
                const fnMatch=line.content.match(/console\.(\w+)/);
                findings.push({
                    path:filename,
                    lineNumber:line.lineNumber, //from parseDiff
                    position:line.diffPosition,
                    body:rule.message(fnMatch?fnMatch[1]:''),
                    severity:rule.severity  || 'warning'
                });
            }
        }
    }
    return findings;
}


module.exports={runRules};