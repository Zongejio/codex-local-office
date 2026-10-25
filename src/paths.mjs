import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const dataDir=path.resolve(process.env.CODEX_OFFICE_DATA_DIR||path.join(os.homedir(),'Library','Application Support','CodexLocalOffice'));
export const runtimeFile=path.join(dataDir,'runtime.json');
export const ports={docs:43228,http:43232,https:43233};
export const limaHome=path.resolve(process.env.CODEX_OFFICE_LIMA_HOME||path.join(os.homedir(),'.codex-office-vm'));
