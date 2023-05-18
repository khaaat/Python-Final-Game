var CustomJS = "../gamefuncs.js";
var SkulptJS = "skulpt/skulpt_mods.js";
var SkulptLib = "skulpt/skulpt_lib.js";
    
function regexCheck (el) {
    var found = el.match(/.*(var).*(prog).*(=)/g);
    if(found){
        return true;
    } else {
        return false;
    }
}

function readyCompiler(prog) {
    $.getScript(CustomJS).done(() => {
        $.getScript(SkulptJS).done(() => {
            $.getScript(SkulptLib).done(() => {
                function outf(text) { 
                    var mypre = document.getElementById("canvas"); 
                    mypre.innerHTML = mypre.innerHTML + text; 
                } 
                function builtinRead(x) { 
                    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
                     throw "File not found: '" + x + "'"; 
                    }
                     return Sk.builtinFiles["files"][x]; 
                }
                function runit() {
                    Sk.pre = "canvas";
                    Sk.configure({ output: outf, read: builtinRead });
                    var myPromise = Sk.misceval.asyncToPromise(function () {
                        return Sk.importMainWithBody("<stdin>", false, prog, true); 
                    }); 
                    myPromise.then(function (mod) { 
                        console.log('success'); 
                    }, function (err) {
                        var entireFile = document.querySelector('html').innerHTML;
                        
                        var fileArray = entireFile.split('\n');
                        var errorLine = err.traceback[0].lineno;
                        const varProgLine = fileArray.findIndex(regexCheck);
                        const correctErrorLine = varProgLine + errorLine + 1; 
                        const errorMessage = document.getElementById('errorMessage');

                        errorMessage.textContent = `Error: ${err.args.v[0].v} on line no ${correctErrorLine}`;
                        $('#errorMessage').css({
                            'backgroundColor': '#000000',
                            'color': 'white',
                            'padding': '24px',
                            'position': 'absolute',
                            'border': '2px solid red',
                            'borderRadius': '10px',
                            'fontSize': '18px',
                            'fontFamily': 'monospace',
                            'display': 'none',
                            'maxWidth': '500px',
                            'textAlign': 'left',
                            'zIndex': '10',
                            'lineHeight': '1.5',
                            'top': '100px'
                        });
                        $('#errorMessage::first-letter').css({
                            'textTransform': 'uppercase'
                        });
                        errorMessage.style.display = 'block'; 
                    });
                }
                $(document).ready(function () { runit(); });
            });
        });
    });
}