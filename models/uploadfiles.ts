// 文件上传，图片、ppt、zip、可供下载  未经测试 kaygb
import * as TypeORM from "typeorm";
import Model from "./common";

declare var syzoj, ErrorMessage: any;

import User from "./user";
import File from "./file";
import JudgeState from "./judge_state";
import Contest from "./contest";
import ProblemTag from "./problem_tag";
import ProblemTagMap from "./problem_tag_map";
import SubmissionStatistics, { StatisticsType } from "./submission_statistics";

import * as fs from "fs-extra";
import * as path from "path";
import * as util from "util";
import * as LRUCache from "lru-cache";
import * as DeepCopy from "deepcopy";


// async uploadSingleFile(filename, filepath, size, noLimit) {
    
//     await syzoj.utils.lock(['Promise::Testdata', this.id], async () => {
//       let dir = this.getTestdataPath();
//       await fs.ensureDir(dir);

//       let oldSize = 0, list = await this.listTestdata(), replace = false, oldCount = 0;
//       if (list) {
//         oldCount = list.files.length;
//         for (let file of list.files) {
//           if (file.filename !== filename) oldSize += file.size;
//           else replace = true;
//         }
//       }

//       if (!noLimit && oldSize + size > syzoj.config.limit.testdata) throw new ErrorMessage('数据包太大。');
//       if (!noLimit && oldCount + (!replace as any as number) > syzoj.config.limit.testdata_filecount) throw new ErrorMessage('数据包中的文件太多。');

//       await fs.move(filepath, path.join(dir, filename), { overwrite: true });

//       let execFileAsync = util.promisify(require('child_process').execFile);
//       try { await execFileAsync('dos2unix', [path.join(dir, filename)]); } catch (e) {}

//       await fs.remove(this.getTestdataArchivePath());
//     });
//   }