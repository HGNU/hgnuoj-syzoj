// 未经测试的代码 kaygb
let Problem = syzoj.model('problem');
let JudgeState = syzoj.model('judge_state');
let FormattedCode = syzoj.model('formatted_code');
let Contest = syzoj.model('contest');
let ProblemTag = syzoj.model('problem_tag');
let Article = syzoj.model('article');

const randomstring = require('randomstring');
const fs = require('fs-extra');
const jwt = require('jsonwebtoken');

let Judger = syzoj.lib('judger');
let CodeFormatter = syzoj.lib('code_formatter');


app.get('/uploadfiles', async (req, res) => {
  try {
    res.render('uploadfiles');
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/uploadfiles/upload', app.multer.array('file'), async (req, res) => {
  try {
    // let id = parseInt(req.params.id);
    // let problem = await Problem.findById(id);

    // if (!problem) throw new ErrorMessage('无此题目。');
    if (!await res.locals.user.hasPrivilege('manage_problem')) throw new ErrorMessage('您没有权限进行此操作。');

    if (req.files) {
      for (let file of req.files) {
        await problem.uploadSingleFile(file.originalname, file.path, file.size, await res.locals.user.hasPrivilege('manage_problem'));
      }
    }

    res.redirect(syzoj.utils.makeUrl(['uploadfiles']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/uploadfiles/download/:filename?', async (req, res) => {
  try {
    // let id = parseInt(req.params.id);
    // let problem = await Problem.findById(id);

    // if (!problem) throw new ErrorMessage('无此题目。');
    // if (!await problem.isAllowedUseBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
    // if (typeof req.params.filename === 'string' && (req.params.filename.includes('../'))) throw new ErrorMessage('您没有权限进行此操作。)');

    // if (!req.params.filename) {
    //   if (!await syzoj.utils.isFile(problem.getTestdataArchivePath())) {
    //     await problem.makeTestdataZip();
    //   }
    // }

    // let path = require('path');
    // let filename = req.params.filename ? path.join(problem.getTestdataPath(), req.params.filename) : (problem.getTestdataArchivePath());
    // if (!await syzoj.utils.isFile(filename)) throw new ErrorMessage('文件不存在。');

    // downloadOrRedirect(req, res, filename, path.basename(filename));
  } catch (e) {
    syzoj.log(e);
    res.status(404);
    res.render('error', {
      err: e
    });
  }
});