/**
 * Parses a unified diff patch into structured line objects.
 * Returns only ADDED lines (lines starting with +) with:
 *   - lineNumber: actual line number in the new file
 *   - diffPosition: position within the diff hunk (needed by GitHub API)
 *   - content: the line text (without the leading +)
 *   - filename: passed through for reference
 */

function parseDiff(patch){
    if(!patch) return [];

    const lines=patch.split('\n');
    const result=[];

    let diffPosition=0; //counts everly line from hunk header

    let newLineNumber=0;// tracks line number in new file

    for (const line of lines){
        //hunk header starts with @@ eg: @@ -10,7 +10,8 @@
        if(line.startsWith('@@')){
            diffPosition++;
            //extract the starting line number for the new file from the hunk header
            const match=line.match(/\+(\d+)/);

            if(match)  newLineNumber=parseInt(match[1])-1; // -1 because the first line in hunk is counted as line number
            continue;
        }

        //added line this is code the developer wrote
        if(line.startsWith('+')){
            diffPosition++;
            newLineNumber++;
            result.push({
                lineNumber:newLineNumber,
                diffPosition:diffPosition,
                content:line.trim().slice(1).trim(),  //remove leading +
                // filename passed through for reference (not used in this function but useful for rules)
                // filename:filename
            });
            continue;
        }

        //context line (unchanged) or removed line (starts with -) we just update the line numbers
        if(line.startsWith('-')){
            diffPosition++;
           continue;
        }


        if(line.startsWith(' ')){
            diffPosition++;
            newLineNumber++;
        }

    }
    return result;
}

module.exports={parseDiff};