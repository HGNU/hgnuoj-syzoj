let ProblemTag = syzoj.model('problem_tag');

app.get('/problems/tag/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user || !await res.locals.user.hasPrivilege('manage_problem_tag')) throw new ErrorMessage('您没有权限进行此操作。');
    
    let id = parseInt(req.params.id) || 0;
    let tag = await ProblemTag.findById(id);
    let isNewTag = false; // guke 0326 tagsearch

    if (!tag) {
      tag = await ProblemTag.create();
      tag.id = id;
      isNewTag = true; // guke 0326 tagsearch
    }

    res.render('problem_tag_edit', {
      tag: tag,
      isNewTag: isNewTag // guke 0326 tagsearch
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/problems/tag/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user || !await res.locals.user.hasPrivilege('manage_problem_tag')) throw new ErrorMessage('您没有权限进行此操作。');

    let id = parseInt(req.params.id) || 0;
    let tag = await ProblemTag.findById(id);

    if (!tag) {
      tag = await ProblemTag.create();
      tag.id = id;
    }

    req.body.name = req.body.name.trim();
    if (tag.name !== req.body.name) {
      if (await ProblemTag.findOne({ where: { name: req.body.name } })) {
        throw new ErrorMessage('标签名称已被使用。');
      }
    }

    tag.name = req.body.name;
    tag.color = req.body.color;

    await tag.save();

    res.redirect(syzoj.utils.makeUrl(['problems', 'tag', tag.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/problems/tag/bulk_create', async (req, res) => {
  try {
    if (!res.locals.user || !await res.locals.user.hasPrivilege('manage_problem_tag')) throw new ErrorMessage('您没有权限进行此操作。');
    res.render('problem_tag_bulk_create');
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/problems/tag/bulk_create', async (req, res) => {
  try {
    if (!res.locals.user || !await res.locals.user.hasPrivilege('manage_problem_tag')) throw new ErrorMessage('您没有权限进行此操作。');

    let names = req.body.names.split('\n').map(name => name.trim()).filter(name => !!name);
    if (!names.length) throw new ErrorMessage("至少要填写一个标签名");

    let color = req.body.color;

    await names.forEachAsync(async (name, index) => {
      if (names.indexOf(name) !== index) {
        throw new ErrorMessage('标签名称 ' + name + ' 重复。');
      }
      if (await ProblemTag.findOne({ where: { name: name } })) {
        throw new ErrorMessage('标签名称 ' + name + ' 已被使用。');
      }
    });

    for (let name of names) {
      let tag = await ProblemTag.create({
        name: name,
        color: color
      });
      await tag.save();
    }

    res.redirect(syzoj.utils.makeUrl(['problems', 'tag', 'bulk_create']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});
