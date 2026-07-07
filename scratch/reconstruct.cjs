const fs = require('fs');

const filePath = 'c:\\Users\\mmona\\OneDrive\\Documents\\Code\\CloudForge\\src\\components\\CloudForgeEditor.jsx';

let fileContent = fs.readFileSync(filePath, 'utf8');

// 2. Read transcript logs
const transcriptPath = 'C:\\Users\\mmona\\.gemini\\antigravity-ide\\brain\\33553fd6-0855-42ea-812b-4975b4786743\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

console.log('Parsing transcript lines and applying edits in chronological order...');

let count = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  try {
    const p = JSON.parse(line);
    if (!p.tool_calls) continue;
    
    for (const tc of p.tool_calls) {
      const isTarget = tc.args && tc.args.TargetFile && tc.args.TargetFile.endsWith('CloudForgeEditor.jsx');
      if (!isTarget) continue;

      if (tc.name === 'replace_file_content') {
        const { TargetContent, ReplacementContent, Description } = tc.args;
        if (!TargetContent || !ReplacementContent) continue;

        const fileNorm = fileContent.replace(/\r\n/g, '\n');
        const targetNorm = TargetContent.replace(/\r\n/g, '\n');
        const replNorm = ReplacementContent.replace(/\r\n/g, '\n');

        if (fileNorm.includes(targetNorm)) {
          fileContent = fileNorm.replace(targetNorm, replNorm);
          console.log(`[Step ${p.step_index}] Applied replace: ${Description || 'unnamed'}`);
          count++;
        } else {
          console.warn(`[Step ${p.step_index}] WARNING: TargetContent not matched!`);
        }
      } else if (tc.name === 'multi_replace_file_content') {
        const { ReplacementChunks, Description } = tc.args;
        if (!ReplacementChunks) continue;

        console.log(`[Step ${p.step_index}] Applying multi-replace: ${Description || 'unnamed'}`);
        let fileNorm = fileContent.replace(/\r\n/g, '\n');

        let allMatched = true;
        for (const chunk of ReplacementChunks) {
          const targetNorm = chunk.TargetContent.replace(/\r\n/g, '\n');
          const replNorm = chunk.ReplacementContent.replace(/\r\n/g, '\n');

          if (fileNorm.includes(targetNorm)) {
            fileNorm = fileNorm.replace(targetNorm, replNorm);
          } else {
            console.warn(`  Chunk not matched in step ${p.step_index}!`);
            allMatched = false;
          }
        }
        fileContent = fileNorm;
        if (allMatched) {
          count++;
        }
      }
    }
  } catch (e) {
    // line is not valid JSON
  }
}

// 3. Save final reconstructed file content
fs.writeFileSync(filePath, fileContent, 'utf8');
console.log(`\nReconstruction completed. Successfully applied ${count} edit actions.`);
