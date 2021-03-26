let Homework = syzoj.model('homework');
let Problem = syzoj.model('problem');
let User = syzoj.model('user');

app.get ('/homeworks', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    let where;
    if (res.locals.user && res.locals.user.is_admin) where = {}
    else where = { is_public: true };

    let paginate = syzoj.utils.paginate(await Homework.countForPagination(where), req.query.page, syzoj.config.page.contest);
    let homeworks = await Homework.queryPage (paginate, where);

    await homeworks.forEachAsync(async x => x.subtitle = await syzoj.utils.markdown(x.subtitle));

    res.render('homeworks', {
      homeworks: homeworks,
      paginate: paginate
    })
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
})

app.get('/homework/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    let homework_id = parseInt(req.params.id);
    let homework = await Homework.findById(homework_id);
    if (!homework) {
      homework = await Homework.create();
      homework.id = 0;
    }

    let problems = [], users_id = [];
    if (homework.problems) problems = await homework.problems.split('|').mapAsync(async id => await Problem.findById(id));
    if (homework.users) users_id = await homework.users.split('|');

    let items = [];
    let user_count = await User.count ();
    for (let user_id = 1; user_id <= user_count; ++user_id) {
      items.push ([await User.findById (user_id), users_id.includes (user_id.toString ())]);
    }

    res.render('homework_edit', {
      homework: homework,
      problems: problems,
      items: items
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/homework/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    let homework_id = parseInt(req.params.id);
    let homework = await Homework.findById(homework_id);
    if (!homework) {
      homework = await Homework.create();
    }

    if (!req.body.title.trim()) throw new ErrorMessage('作业名不能为空。');
    homework.title = req.body.title;
    homework.subtitle = req.body.subtitle;
    if (!Array.isArray(req.body.problems)) req.body.problems = [req.body.problems];
    if (!Array.isArray(req.body.items)) req.body.items = [req.body.items];
    homework.problems = req.body.problems.join('|');
    homework.information = req.body.information;
    homework.is_public = req.body.is_public === 'on';
    homework.users = '';
    for (let user of req.body.items) {
      homework.users += user + '|';
    }
    homework.users = homework.users.substr (0, homework.users.length - 1);

    await homework.save();

    res.redirect(syzoj.utils.makeUrl(['homework', homework.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/homework/:id', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    const curUser = res.locals.user;
    let homework_id = parseInt(req.params.id);

    let homework = await Homework.findById(homework_id);
    if (!homework) throw new ErrorMessage('无此作业。');
    if (!homework.is_public && (!res.locals.user || !res.locals.user.is_admin)) throw new ErrorMessage('您无权查看此作业。');

    const isSupervisior = res.locals.user.is_admin;
    homework.subtitle = await syzoj.utils.markdown(homework.subtitle);
    homework.information = await syzoj.utils.markdown(homework.information);

    res.render('homework', {
      homework: homework,
      isSupervisior: isSupervisior
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/homework/:id/problem', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    const curUser = res.locals.user;
    let homework_id = parseInt(req.params.id);

    let homework = await Homework.findById(homework_id);
    if (!homework) throw new ErrorMessage('无此作业。');
    if (!homework.is_public && (!curUser || !curUser.is_admin)) throw new ErrorMessage('您无权查看此作业。');

    const isSupervisior = curUser.is_admin;
    homework.subtitle = await syzoj.utils.markdown(homework.subtitle);

    let problems_id = await homework.getProblems();
    let problems = await problems_id.mapAsync(async id => await Problem.findById(id));

    let state = [];
    let users_id = await homework.users.split ('|');
    if (users_id.includes (curUser.id.toString ())) {
      for (let problem of problems) {
        state.push (await curUser.getProblemScore (problem.id));
      }
    }

    res.render('homework_problem', {
      homework: homework,
      problems: problems,
      state: state,
      isSupervisior: isSupervisior
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/homework/:id/ranklist', async (req, res) => {
    try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    let homework_id = parseInt(req.params.id);
    let homework = await Homework.findById(homework_id);
    const curUser = res.locals.user;

    if (!homework) throw new ErrorMessage('无此作业。');
    if (!homework.is_public && (!res.locals.user || !res.locals.user.is_admin)) throw new ErrorMessage('您无权查看此作业。');

    const isSupervisior = res.locals.user.is_admin;

    let problems_id = await homework.getProblems();
    let problems = await problems_id.mapAsync(async id => await Problem.findById(id));

    let users = await homework.getUsers ();
    users = await users.mapAsync(async id => await User.findById(id));
    let ranklist = [];

    for (let user of users) {
      let state = [user];
      let sum = 0;
      for (let problem of problems) {
        let score = await user.getProblemScore (problem.id);
        state.push (score);
        sum += score;
      }
      state.push (sum);
      ranklist.push (state);
    }
    ranklist.sort (function (a, b) {
      if (a[a.length - 1] > b[b.length - 1]) {
        return -1;
      }
      if (a[a.length - 1] == b[b.length - 1]) {
        return 0;
      }
      return 1;
    })

    res.render('homework_ranklist', {
      homework: homework,
      problems: problems,
      ranklist: ranklist,
      isSupervisior: isSupervisior
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});